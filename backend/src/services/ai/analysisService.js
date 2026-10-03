'use strict';
const { askJSON, MEDICAL_GUARDRAIL } = require('./anthropicClient');

async function dailyAnalysis(ctx) {
  const prompt = `${MEDICAL_GUARDRAIL}
Analyze this user's logged nutrition for one day versus their targets. Identify real patterns only (from
the numbers given) such as low protein, low fibre, high sodium, poor meal distribution, excessive
snacking, or a well-balanced day. Keep it observational, never diagnostic. 2-4 short bullet observations,
then one short encouraging note, then up to 3 concrete recommendations for tomorrow.
Data (JSON): ${JSON.stringify(ctx)}
Reply with ONLY a JSON object: {"observations":[string,...],"encouragement":string,"recommendations":[string,...]}`;
  return askJSON({ prompt, maxTokens: 1800 });
}

async function weeklyInsights(ctx) {
  const prompt = `${MEDICAL_GUARDRAIL}
Given this week's real logged nutrition data (JSON below), write up to 4 short, specific insight sentences
strictly grounded in the numbers provided (trends, consistency, weekday vs weekend, most logged foods).
Do not invent data not present.
Data: ${JSON.stringify(ctx)}
Reply with ONLY a JSON object: {"insights":[string,...]}`;
  return askJSON({ prompt, maxTokens: 1500 });
}

module.exports = { dailyAnalysis, weeklyInsights };
