'use strict';
const { askJSON, MEDICAL_GUARDRAIL } = require('./anthropicClient');

async function dailyAnalysis(ctx) {
  const prompt = `${MEDICAL_GUARDRAIL}
Analyze this user's logged nutrition for one day versus their daily targets in rich, actionable, deeply useful detail.
Identify real patterns strictly grounded in the numbers provided:
1. Daily Nutrition & Habit Score (a number from 1.0 to 10.0, e.g. 8.2) and a short verdict title.
2. Macro Analysis: For each of Calories, Protein, Carbs, Fat, Fiber, compare consumed vs target with exact surplus/deficit (+/- grams) and a tactical note.
3. Meal Pacing & Protein Timing: Observe how protein and calories were spread across meals (e.g. was breakfast low protein and dinner heavy?).
4. Exact Indian & Universal Food Swaps/Additions: 2-3 specific real food items with EXACT GRAM quantities (e.g. +150g curd, +40g paneer, +15g chia seeds or sprouted moong) that bridge today's specific nutrient gaps.
5. 2-3 concrete high-impact tactical actions for tomorrow.
6. Backward compatibility fields: "observations" (2-4 clear sentences), "encouragement" (1 sentence), "recommendations" (2-3 short bullet strings).

Data (JSON): ${JSON.stringify(ctx)}

Reply with ONLY a JSON object in this exact shape:
{
  "score": number,
  "verdict": string,
  "summary": string,
  "strengths": [string, ...],
  "gaps": [string, ...],
  "macroAnalysis": {
    "calories": { "consumed": number, "target": number, "delta": number, "status": string, "note": string },
    "protein": { "consumed": number, "target": number, "delta": number, "status": string, "note": string },
    "carbs": { "consumed": number, "target": number, "delta": number, "status": string, "note": string },
    "fat": { "consumed": number, "target": number, "delta": number, "status": string, "note": string },
    "fiber": { "consumed": number, "target": number, "delta": number, "status": string, "note": string }
  },
  "mealPacingInsight": string,
  "actionableSwaps": [
    { "food": string, "when": string, "benefit": string, "impact": string },
    ...
  ],
  "tomorrowTactics": [string, ...],
  "observations": [string, ...],
  "encouragement": string,
  "recommendations": [string, ...]
}`;
  return askJSON({ prompt, maxTokens: 2500 });
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
