'use strict';
const { askJSON, MEDICAL_GUARDRAIL } = require('./anthropicClient');

async function parseRecipeText(text, referenceList) {
  const prompt = `${MEDICAL_GUARDRAIL}
Parse this recipe text into a structured ingredient list, estimating nutrition for each ingredient's stated quantity.
Recipe text: """${text}"""
Reply with ONLY a JSON object:
{"name":string (recipe title; infer a short one if not given),"servings":number (infer from the text, default 4 if unclear),
"ingredients":[{"name":string,"quantity":number,"unit":string (one of g,kg,ml,l,tsp,tbsp,cup,bowl,piece,slice,serving),"matchedFoodId":string|null,"calories":number,"protein":number,"carbs":number,"fat":number,"fibre":number}]}
Nutrition numbers are for the TOTAL stated quantity of that ingredient (not per 100g). Reference foods you may set as
matchedFoodId (id|name|category):
${referenceList}
Skip non-ingredient lines (instructions, headers).`;
  return askJSON({ prompt, maxTokens: 2000 });
}

module.exports = { parseRecipeText };
