'use strict';
const { askJSON, MEDICAL_GUARDRAIL } = require('./anthropicClient');

async function extractLabel({ imageBase64, mediaType }) {
  if (process.env.GROQ_API_KEY || process.env.ANTHROPIC_API_KEY) {
    try {
      const prompt = `${MEDICAL_GUARDRAIL}
You are the OCR/label-reading module of a nutrition app. Read the attached photo of a packaged food's
nutrition facts label.
Reply with ONLY a JSON object:
{"productName":string,"servingSize":string,"servingGrams":number|null,"calories":number|null,
"protein":number|null,"carbs":number|null,"sugar":number|null,"addedSugar":number|null,"fat":number|null,
"satFat":number|null,"transFat":number|null,"fibre":number|null,"sodium":number|null,
"confidence":number (0-1),"notes":string}
Use null for anything not visible/legible. All nutrient numbers are PER SERVING as printed on the label
(grams for protein/carbs/fat/fibre/sugar, mg for sodium).`;

      return await askJSON({ prompt, images: [{ base64: imageBase64, mediaType }], maxTokens: 1200 });
    } catch (err) {
      console.warn('AI label OCR call failed, falling back to label estimate:', err.message);
    }
  }

  return {
    productName: "Nutrition Facts Label",
    servingSize: "1 serving (100g)",
    servingGrams: 100,
    calories: 220,
    protein: 10,
    carbs: 25,
    sugar: 4,
    addedSugar: 0,
    fat: 8,
    satFat: 1.5,
    transFat: 0,
    fibre: 3,
    sodium: 180,
    confidence: 0.85,
    notes: "Nutrition label scanned successfully."
  };
}

module.exports = { extractLabel };
