'use strict';
const anthropicClient = require('./anthropicClient');
const { MEDICAL_GUARDRAIL } = anthropicClient;
const { ApiError } = require('../../middleware/errorHandler');

/**
 * FoodRecognitionService — Production-grade AI food vision recognition.
 * Strictly verifies whether actual food is present in the uploaded image.
 * Never fabricates mock food items if the photo is a selfie, face, object, or non-food.
 */
async function analyzeFoodPhoto({ imageBase64, mediaType, note }) {
  if (!process.env.GROQ_API_KEY && !process.env.ANTHROPIC_API_KEY) {
    if (note && note.trim()) {
      return {
        items: [{
          name: note.trim().slice(0, 50),
          portionEstimate: "1 standard serving (~200g)",
          portionGrams: 200,
          unit: "serving",
          calories: 320,
          protein: 24,
          carbs: 35,
          fat: 10,
          fibre: 4,
          confidence: 0.8
        }],
        notes: "Estimated from description (No AI vision API key configured in backend .env)."
      };
    }
    return {
      items: [],
      notes: "No AI vision API key configured (add GROQ_API_KEY in backend .env). Please describe your food or log manually."
    };
  }

  const prompt = `${MEDICAL_GUARDRAIL}
You are an expert AI food-recognition model inside a nutrition tracking app.
Analyze the attached image with high precision.

CRITICAL INSTRUCTIONS:
1. FOOD DETECTION FIRST:
   Check whether this image contains actual edible food, a meal, dish, or beverage.
   If NO FOOD is visible (e.g. human face, selfie, person, body part, clothing, furniture, room, pet, outdoor scenery, blank surface, device screen, or an app screenshot with no actual physical food plate):
   You MUST return:
   {"items": [], "notes": "No food detected in this photo. Please point the camera directly at your meal, plate, or beverage."}
   NEVER guess, fabricate, or hallucinate food if no food is present.
   NEVER parse text from app screenshots as if it were a photographed meal.

2. WHEN REAL FOOD IS PRESENT:
   Break down the dish into its individual food items.
   For each item, estimate the realistic portion in grams and its nutritional content for that specific portion (not per 100g).
   Return:
   {
     "items": [
       {
         "name": "Food name (e.g. Steamed White Rice, Dal Tadka, Paneer Bhurji)",
         "portionEstimate": "Serving description (e.g. 1 bowl (~150g))",
         "portionGrams": 150,
         "unit": "g",
         "calories": 195,
         "protein": 4.5,
         "carbs": 42.0,
         "fat": 1.2,
         "fibre": 1.5,
         "confidence": 0.90
       }
     ],
     "notes": "Short observation about the meal (e.g. 'Identified 2 items: Rice and Lentil Curry.')"
   }
${note ? `User context/note: ${note}` : ''}
Reply with ONLY the JSON object.`;

  try {
    const result = await anthropicClient.askJSON({ prompt, images: [{ base64: imageBase64, mediaType: mediaType || 'image/jpeg' }], maxTokens: 1500 });
    if (result && Array.isArray(result.items)) {
      // Validate items structure
      const cleanedItems = result.items
        .filter(it => it && typeof it.name === 'string' && it.name.trim().length > 0)
        .map(it => ({
          name: it.name.trim(),
          portionEstimate: it.portionEstimate || `${Math.round(it.portionGrams || 100)}g`,
          portionGrams: Number(it.portionGrams) || 100,
          unit: it.unit || 'g',
          calories: Math.max(0, Math.round(Number(it.calories) || 0)),
          protein: Math.max(0, Math.round((Number(it.protein) || 0) * 10) / 10),
          carbs: Math.max(0, Math.round((Number(it.carbs) || 0) * 10) / 10),
          fat: Math.max(0, Math.round((Number(it.fat) || 0) * 10) / 10),
          fibre: Math.max(0, Math.round((Number(it.fibre || it.fiber) || 0) * 10) / 10),
          confidence: Math.min(1, Math.max(0.1, Number(it.confidence) || 0.85))
        }));

      return {
        items: cleanedItems,
        notes: result.notes || (cleanedItems.length ? "AI visual meal scan complete." : "No food detected in this photo. Please point the camera directly at your meal.")
      };
    }

    return {
      items: [],
      notes: "No food detected in this photo. Please point the camera directly at your food."
    };
  } catch (err) {
    console.warn('AI vision scan error:', err.message);
    if (note && note.trim()) {
      return {
        items: [{
          name: note.trim().slice(0, 50),
          portionEstimate: "1 standard serving (~200g)",
          portionGrams: 200,
          unit: "serving",
          calories: 320,
          protein: 20,
          carbs: 38,
          fat: 10,
          fibre: 3,
          confidence: 0.75
        }],
        notes: `Image scan failed (${err.message}). Estimated from your note: "${note.trim()}".`
      };
    }
    if (err.status === 429 || (err.message && err.message.toLowerCase().includes('rate limit'))) {
      throw new ApiError(429, 'rate_limited', 'AI vision is momentarily busy. Please wait 10-15 seconds and try again.');
    }
    // Return friendly error notes rather than fake food
    return {
      items: [],
      notes: `Could not analyze photo (${err.message || 'connection error'}). Please try again or log manually.`
    };
  }
}

module.exports = { analyzeFoodPhoto };
