'use strict';
const { askJSON, MEDICAL_GUARDRAIL } = require('./anthropicClient');

async function whatToEatNow(ctx) {
  const cuisinePref = (ctx && ctx.cuisine) || 'Indian';
  const isIndian = !ctx || !ctx.cuisine || /indian/i.test(String(ctx.cuisine));
  const cuisineGuidance = isIndian
    ? `Cuisine preference: ${cuisinePref}. Prioritize authentic, wholesome, high-protein Indian meals and snacks (such as Paneer Bhurji with multigrain roti, Dal Tadka with steamed rice, Moong dal chilla with green chutney, Egg bhurji with whole wheat toast, Soya chunks pulao, Chana masala, Grilled chicken tikka, Sprouted moong chaat, Rajma chawal, Besan chilla, Roasted makhana / chana snack).`
    : `Cuisine preference: ${cuisinePref}.`;

  const prompt = `${MEDICAL_GUARDRAIL}
Suggest 3 realistic meal/snack options for a user right now, based on their remaining daily nutrition
budget and preferences.
${cuisineGuidance}
Be practical and specific (real dishes/foods with portion sizes), not vague.
Context (JSON): ${JSON.stringify(ctx)}
Reply with ONLY a JSON object:
{"options":[{"name":string,"description":string,"calories":number,"protein":number,"carbs":number,
"fat":number,"fibre":number,"estimatedCost":string|null,"whyItFits":string}]}`;
  return askJSON({ prompt, maxTokens: 2000 });
}

async function planDay(ctx) {
  const cuisinePref = (ctx && ctx.cuisine) || 'Indian';
  const isIndian = !ctx || !ctx.cuisine || /indian/i.test(String(ctx.cuisine));
  const cuisineGuidance = isIndian
    ? `Cuisine preference: ${cuisinePref}. Prioritize flavorful, authentic high-protein Indian meals across the day (Moong dal / Besan chilla, Paneer or Egg bhurji, Dal, Rajma, Soya chunks, Roti/Rice, Sprouts chaat) fitting their targets.`
    : `Cuisine preference: ${cuisinePref}.`;

  const prompt = `${MEDICAL_GUARDRAIL}
Create a one-day meal plan (breakfast, lunch, evening snack, dinner) that fits the user's daily targets
and preferences.
${cuisineGuidance}
Be specific and realistic with portion sizes and calculated macros.
Context (JSON): ${JSON.stringify(ctx)}
Reply with ONLY a JSON object:
{"meals":[{"mealType":string,"name":string,"description":string,"calories":number,"protein":number,
"carbs":number,"fat":number,"fibre":number}],"dayTotals":{"calories":number,"protein":number,"carbs":number,
"fat":number,"fibre":number}}`;
  return askJSON({ prompt, maxTokens: 3000 });
}

async function regenerateMeal(ctx, mealType) {
  const cuisinePref = (ctx && ctx.cuisine) || 'Indian';
  const isIndian = !ctx || !ctx.cuisine || /indian/i.test(String(ctx.cuisine));
  const cuisineGuidance = isIndian
    ? `Cuisine preference: ${cuisinePref}. Prioritize wholesome, high-protein Indian options fitting ${mealType}.`
    : `Cuisine preference: ${cuisinePref}.`;

  const prompt = `${MEDICAL_GUARDRAIL}
Suggest ONE replacement ${mealType} option fitting this user's targets and preferences.
${cuisineGuidance}
Context (JSON): ${JSON.stringify(ctx)}
Reply with ONLY: {"mealType":${JSON.stringify(mealType)},"name":string,"description":string,"calories":number,
"protein":number,"carbs":number,"fat":number,"fibre":number}`;
  return askJSON({ prompt, maxTokens: 1200 });
}

module.exports = { whatToEatNow, planDay, regenerateMeal };
