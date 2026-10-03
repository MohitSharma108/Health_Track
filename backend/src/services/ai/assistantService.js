'use strict';
const { askChat, MEDICAL_GUARDRAIL } = require('./anthropicClient');

/**
 * The assistant is stateless server-side: the client sends its own short
 * chat history each turn, and we prepend the real app-data context as a
 * leading user/assistant pair every call so answers can never drift from
 * what's actually in the database. `history` is [{role, content}, ...]
 * ending on the newest user message.
 */
async function ask({ history, appData }) {
  const today = (appData && appData.today) || {};
  const consumed = today.consumed || { calories: 0, protein: 0, carbs: 0, fat: 0, fibre: 0 };
  const targets = today.targets || { calories: 2000, protein: 120, carbs: 220, fat: 65 };
  const remaining = today.remaining || {
    calories: Math.max(0, Math.round(targets.calories - (consumed.calories || 0))),
    protein: Math.max(0, Math.round((targets.protein || targets.proteinG || 120) - (consumed.protein || consumed.proteinG || 0))),
    carbs: Math.max(0, Math.round((targets.carbs || targets.carbsG || 220) - (consumed.carbs || consumed.carbsG || 0))),
    fat: Math.max(0, Math.round((targets.fat || targets.fatG || 65) - (consumed.fat || consumed.fatG || 0))),
  };
  const meals = today.meals || [];
  const profile = (appData && appData.profile) || {};

  const contextTurn = `${MEDICAL_GUARDRAIL}
You are Nourish's expert AI Nutritionist, Dietary Coach, and Health Advisor.
Your personality is encouraging, scientifically grounded, empathetic, and highly actionable.

USER REAL-TIME NUTRITION PROFILE & LOGGED DATA FOR TODAY (${today.date || new Date().toISOString().slice(0, 10)}):
- Daily Target: ${targets.calories} kcal (Protein: ${targets.protein || targets.proteinG || 120}g, Carbs: ${targets.carbs || targets.carbsG || 220}g, Fat: ${targets.fat || targets.fatG || 65}g)
- Consumed So Far: ${consumed.calories} kcal (Protein: ${consumed.protein || consumed.proteinG || 0}g, Carbs: ${consumed.carbs || consumed.carbsG || 0}g, Fat: ${consumed.fat || consumed.fatG || 0}g)
- Remaining Budget: ${remaining.calories} kcal (Protein: ${remaining.protein}g, Carbs: ${remaining.carbs}g, Fat: ${remaining.fat}g)
- Logged Meals Today (${meals.length}): ${meals.length ? JSON.stringify(meals) : 'No meals logged yet today'}
- User Goal: ${profile.goal || 'maintain'} | Diet Preference: ${profile.diet || 'balanced'} | Allergies: ${(profile.allergies && profile.allergies.join(', ')) || 'None'}

RESPONSE FORMATTING & STYLE:
1. When asked about their day, logged meals, or remaining budget:
   - Provide a clear, clean summary using bold labels (e.g. **🥗 Today's Intake**, **🥩 Remaining Protein**, **💡 Coach's Recommendation**).
   - Tell them directly if they are on track with calories and protein.
   - If they have calories or protein remaining, suggest 2-3 specific, delicious foods or snacks with estimated macros that fit their exact remaining budget.
2. When asked general nutrition questions (e.g. calories in a food, recipes, high protein snacks, weight loss tips):
   - Provide accurate calories and macronutrients for standard portion sizes (e.g. 1 medium banana ~118g, 1 cup cooked oats, 100g chicken breast).
   - Include 1-2 practical tips (e.g. timing, satiety, cooking suggestions).
3. Tone:
   - Concise, warm, and motivating. Avoid dry robotic answers.
   - Use clean Markdown with bullet points and bold highlights for numbers so it reads effortlessly.`;

  const messages = [
    { role: 'user', content: contextTurn },
    { role: 'assistant', content: "Understood! I'm ready to provide clear, motivating, and highly practical nutrition coaching tailored to your day and goals." },
    ...(history || []).map((h) => ({ role: h.role === 'assistant' ? 'assistant' : 'user', content: h.content })),
  ];
  return askChat({ messages, maxTokens: 1200 });
}

module.exports = { ask };
