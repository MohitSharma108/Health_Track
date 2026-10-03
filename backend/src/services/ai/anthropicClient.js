'use strict';
const https = require('https');
const Anthropic = require('@anthropic-ai/sdk');
const { ApiError } = require('../../middleware/errorHandler');

const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022';
let anthropicClient = null;

function getAnthropicClient() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new ApiError(503, 'ai_not_configured', 'AI features are not configured on this server (missing GROQ_API_KEY or ANTHROPIC_API_KEY).');
  }
  if (!anthropicClient) anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return anthropicClient;
}

const MEDICAL_GUARDRAIL =
  'You are a nutrition-tracking assistant, not a medical professional. Never diagnose conditions or ' +
  'deficiencies, never claim certainty from photos, never give extreme or dangerous diet advice, and ' +
  "encourage consulting a doctor or dietitian for medical concerns. Describe patterns in logged data " +
  "neutrally (e.g. 'relatively low in fibre versus your target') rather than as medical facts.";

/**
 * Call Groq chat completions using native https
 */
function callGroq({ messages, model, maxTokens = 1500, temperature = 0.2 }) {
  return new Promise((resolve, reject) => {
    const payloadObj = {
      model,
      messages,
      max_tokens: maxTokens,
      temperature,
    };
    // For OpenAI OSS reasoning models on Groq, prevent reasoning token exhaustion
    if (model && (model.includes('oss') || model.includes('120b') || model.includes('20b'))) {
      payloadObj.reasoning_effort = 'low';
    }
    const payload = JSON.stringify(payloadObj);

    const req = https.request('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
      timeout: 30000,
    }, (res) => {
      let body = '';
      res.on('data', (d) => { body += d; });
      res.on('end', () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          try {
            const errJson = JSON.parse(body);
            return reject(new ApiError(res.statusCode, 'groq_api_error', (errJson.error && errJson.error.message) || 'Groq API request failed.'));
          } catch (_) {
            return reject(new ApiError(res.statusCode, 'groq_api_error', `Groq returned status ${res.statusCode}: ${body.slice(0, 300)}`));
          }
        }
        try {
          const json = JSON.parse(body);
          const choice = json.choices && json.choices[0];
          let text = (choice && choice.message && choice.message.content) || '';
          if (!text.trim() && choice && choice.message && choice.message.reasoning) {
            text = choice.message.reasoning;
          }
          if (!text.trim()) {
            return reject(new ApiError(502, 'empty_completion', 'Groq AI returned no text.'));
          }
          resolve(text);
        } catch (e) {
          reject(new ApiError(502, 'invalid_response', 'Failed to parse Groq response as JSON.'));
        }
      });
    });

    req.on('error', (err) => reject(new ApiError(502, 'network_error', `Groq connection failed: ${err.message}`)));
    req.on('timeout', () => {
      req.destroy();
      reject(new ApiError(504, 'timeout', 'Groq request timed out.'));
    });
    req.write(payload);
    req.end();
  });
}

/**
 * Ask AI for plain text. `images` is an optional array of
 * { base64, mediaType } to attach to the turn (for vision calls).
 */
async function askText({ prompt, images, maxTokens = 1024 }) {
  if (process.env.GROQ_API_KEY) {
    if (images && images.length) {
      // Multi-modal Vision model on Groq
      const content = [{ type: 'text', text: prompt }];
      for (const img of images) {
        content.push({
          type: 'image_url',
          image_url: { url: `data:${img.mediaType || 'image/jpeg'};base64,${img.base64}` },
        });
      }
      return await callGroq({
        model: process.env.GROQ_VISION_MODEL || 'qwen/qwen3.8-27b',
        messages: [{ role: 'user', content }],
        maxTokens,
      });
    } else {
      // High-performance text & reasoning on Groq
      return await callGroq({
        model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
        messages: [{ role: 'user', content: prompt }],
        maxTokens,
      });
    }
  }

  // Fallback to Anthropic Claude SDK if ANTHROPIC_API_KEY is configured
  const anthropic = getAnthropicClient();
  const content = [];
  if (images && images.length) {
    for (const img of images) {
      content.push({ type: 'image', source: { type: 'base64', media_type: img.mediaType, data: img.base64 } });
    }
  }
  content.push({ type: 'text', text: prompt });

  const msg = await anthropic.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: maxTokens,
    messages: [{ role: 'user', content }],
  });
  const text = msg.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n');
  if (!text.trim()) throw new ApiError(502, 'empty_completion', 'The AI returned no text.');
  return text;
}

/** Ask AI for JSON. Tries the whole reply, then a fenced code block,
 * then the first {...}/[...] span. */
async function askJSON(args) {
  const text = await askText({ ...args, prompt: args.prompt + '\n\nReply with ONLY the JSON value — no prose, no conversational text, no markdown fences.' });
  return parseJsonLoose(text);
}

function parseJsonLoose(text) {
  const attempts = [text];
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) attempts.push(fence[1]);
  const first = text.search(/[[{]/);
  const lastBrace = text.lastIndexOf('}');
  const lastBracket = text.lastIndexOf(']');
  const last = Math.max(lastBrace, lastBracket);
  if (first !== -1 && last > first) attempts.push(text.slice(first, last + 1));
  for (const candidate of attempts) {
    try {
      return JSON.parse(candidate.trim());
    } catch (e) {
      /* try next */
    }
  }
  throw new ApiError(502, 'invalid_json', 'The AI reply could not be parsed as JSON.', { raw: text.slice(0, 2000) });
}

/** Ask AI with an explicit multi-turn messages array. */
async function askChat({ messages, maxTokens = 600 }) {
  if (process.env.GROQ_API_KEY) {
    return await callGroq({
      model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
      messages,
      maxTokens,
    });
  }

  const anthropic = getAnthropicClient();
  const msg = await anthropic.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: maxTokens,
    messages,
  });
  const text = msg.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n');
  if (!text.trim()) throw new ApiError(502, 'empty_completion', 'The AI returned no text.');
  return text;
}

module.exports = { askText, askJSON, askChat, MEDICAL_GUARDRAIL };
