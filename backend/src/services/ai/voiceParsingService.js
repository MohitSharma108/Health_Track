'use strict';
const { askJSON, MEDICAL_GUARDRAIL } = require('./anthropicClient');
const nutritionProvider = require('../nutritionProvider');

/**
 * Parses a speech-to-text transcript (produced client-side, e.g. the Web
 * Speech API) into structured items with nutrition estimates. We give the
 * model a short list of candidate matches from the internal food DB so it
 * can flag a confident match for later re-linking to a canonical Food row,
 * without requiring it to invent our internal ids from scratch.
 */
async function parseTranscript(transcript, userId) {
  const candidates = await nutritionProvider.search('', userId).catch(() => []);
  const referenceList = candidates.length
    ? candidates.map((f) => `${f.id}|${f.name}|${f.category}`).join('\n')
    : '(no reference list available — estimate nutrition directly)';

  const prompt = `${MEDICAL_GUARDRAIL}
Parse this spoken food log into structured items, and estimate nutrition for the stated quantity of each.
Transcript: "${transcript}"
Reply with ONLY a JSON object:
{"items":[{"name":string,"quantity":number,"unit":string (one of g,kg,ml,l,tsp,tbsp,cup,bowl,piece,slice,serving),
"matchedFoodId":string|null,"calories":number,"protein":number,"carbs":number,"fat":number,"fibre":number,
"confidence":number (0-1)}]}
Nutrition numbers are for the TOTAL stated quantity (not per 100g). Reference foods you may set as
matchedFoodId (id|name|category):
${referenceList}
If nothing food-related is said, return {"items":[]}.`;

  return askJSON({ prompt, maxTokens: 1000 });
}

module.exports = { parseTranscript };
