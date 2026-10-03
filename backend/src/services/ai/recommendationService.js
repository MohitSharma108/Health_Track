'use strict';
const { askJSON, MEDICAL_GUARDRAIL } = require('./anthropicClient');

async function whatToEatNow(ctx) {
  const prompt = `${MEDICAL_GUARDRAIL}
Suggest 3 realistic meal/snack options for a user right now, based on their remaining daily nutrition
budget and preferences. Be practical and specific (real dishes/foods), not vague.
Context (JSON): ${JSON.stringify(ctx)}
Reply with ONLY a JSON object:
{"options":[{"name":string,"description":string,"calories":number,"protein":number,"carbs":number,
"fat":number,"fibre":number,"estimatedCost":string|null,"whyItFits":string}]}`;
  return askJSON({ prompt, maxTokens: 2000 });
}

async function planDay(ctx) {
  const prompt = `${MEDICAL_GUARDRAIL}
Create a one-day meal plan (breakfast, lunch, evening snack, dinner) that fits the user's daily targets
and preferences. Be specific and realistic.
Context (JSON): ${JSON.stringify(ctx)}
Reply with ONLY a JSON object:
{"meals":[{"mealType":string,"name":string,"description":string,"calories":number,"protein":number,
"carbs":number,"fat":number,"fibre":number}],"dayTotals":{"calories":number,"protein":number,"carbs":number,
"fat":number,"fibre":number}}`;
  return askJSON({ prompt, maxTokens: 3000 });
}

async function regenerateMeal(ctx, mealType) {
  const prompt = `${MEDICAL_GUARDRAIL}
Suggest ONE replacement ${mealType} option fitting this user's targets and preferences.
Context (JSON): ${JSON.stringify(ctx)}
Reply with ONLY: {"mealType":${JSON.stringify(mealType)},"name":string,"description":string,"calories":number,
"protein":number,"carbs":number,"fat":number,"fibre":number}`;
  return askJSON({ prompt, maxTokens: 1200 });
}

module.exports = { whatToEatNow, planDay, regenerateMeal };
