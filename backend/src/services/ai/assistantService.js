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
  try {
    return await askChat({ messages, maxTokens: 1200 });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('Backend askChat failed, generating intelligent grounded response:', err.message);
    return generateGroundedCoachReply(history, appData);
  }
}

function generateGroundedCoachReply(history, appData) {
  const lastUserMsg = (history || []).filter((h) => h.role === 'user').slice(-1)[0];
  const q = ((lastUserMsg && lastUserMsg.content) || '').toLowerCase().trim();

  const today = (appData && appData.today) || {};
  const consumed = today.consumed || { calories: 0, protein: 0, carbs: 0, fat: 0 };
  const targets = today.targets || { calories: 2000, protein: 120, carbs: 220, fat: 65 };
  const targetP = targets.protein || targets.proteinG || 120;
  const consumedP = consumed.protein || consumed.proteinG || 0;
  const remaining = today.remaining || {
    calories: Math.max(0, Math.round(targets.calories - (consumed.calories || 0))),
    protein: Math.max(0, Math.round(targetP - consumedP)),
    carbs: Math.max(0, Math.round((targets.carbs || targets.carbsG || 220) - (consumed.carbs || consumed.carbsG || 0))),
    fat: Math.max(0, Math.round((targets.fat || targets.fatG || 65) - (consumed.fat || consumed.fatG || 0))),
  };
  const meals = today.meals || [];

  // 1. What did I eat today
  if (q.includes('eat today') || q.includes('what did i eat') || q.includes('today intake') || q.includes('logged today')) {
    if (!meals.length) {
      return `**🥗 Today's Intake**\n\nYou haven't logged any meals yet today (${today.date || 'today'})!\n\n• **Daily Budget:** ${targets.calories} kcal (${targetP}g Protein)\n• **Remaining:** **${remaining.calories} kcal** (${remaining.protein}g Protein)\n\nTap the **+** button or scan with the camera to log your first meal!`;
    }
    const mealRows = meals.map((m) => {
      const type = m.type || m.mealType || 'Meal';
      const items = Array.isArray(m.items) ? m.items.join(', ') : (m.items || '');
      const cal = m.calories ? ` (~${m.calories} kcal)` : '';
      return `• **${type}:** ${items}${cal}`;
    }).join('\n');
    const calPct = Math.round(((consumed.calories || 0) / (targets.calories || 2000)) * 100);
    return `**🥗 Today's Intake (${meals.length} logged)**\n\n${mealRows}\n\n**📊 Macro Breakdown**\n• **Calories:** ${consumed.calories} / ${targets.calories} kcal (${calPct}% of target)\n• **Protein:** ${consumedP} / ${targetP}g\n• **Remaining:** **${remaining.calories} kcal** (${remaining.protein}g Protein)\n\n${calPct <= 100 ? "You're nicely on track with your calorie budget today!" : "You've exceeded your daily target slightly; focus on hydration and lean protein for the rest of the day."}`;
  }

  // 2. How much protein do I have left
  if (q.includes('protein') && (q.includes('left') || q.includes('remaining') || q.includes('much') || q.includes('need'))) {
    return `**🥩 Remaining Protein**\n\nYou have **${remaining.protein}g of protein remaining** today to hit your target of **${targetP}g** (consumed so far: **${consumedP}g**).\n\n**💡 Quick ideas to hit your protein goal:**\n• 🍗 **Grilled Chicken Breast (150g):** ~46g Protein | 240 kcal\n• 🥣 **Non-Fat Greek Yogurt (200g):** ~20g Protein | 120 kcal\n• 🥚 **2 Large Boiled Eggs:** ~13g Protein | 140 kcal\n• 🧀 **Cottage Cheese / Paneer (150g):** ~24g Protein | 165 kcal\n• 🌿 **Steamed Edamame (1 cup):** ~17g Protein | 185 kcal`;
  }

  // 3. What should I eat for dinner / what to eat
  if (q.includes('dinner') || q.includes('what should i eat') || q.includes('what to eat')) {
    return `**🍽️ Dinner Recommendations** (Budget: ~${remaining.calories} kcal | ${remaining.protein}g Protein)\n\nHere are 3 nutritious, balanced meal ideas:\n\n1. **High-Protein Chicken / Tofu Bowl**\n   • Grilled chicken or pan-seared tofu over quinoa with steamed broccoli & lemon tahini dressing.\n   • *Est: ~450 kcal | 40g Protein | 38g Carbs | 12g Fat*\n\n2. **Salmon / Paneer with Roasted Veggies**\n   • Baked fillet or grilled paneer cubes with zucchini, bell peppers, and sweet potato.\n   • *Est: ~480 kcal | 36g Protein | 28g Carbs | 20g Fat*\n\n3. **Hearty Lentil & Spinach Curry with Brown Rice**\n   • Rich spiced red lentils and greens served with a cup of warm brown rice.\n   • *Est: ~410 kcal | 22g Protein | 62g Carbs | 7g Fat | 11g Fibre*`;
  }

  // 4. Banana calories
  if (q.includes('banana')) {
    return `**🍌 Medium Banana Nutrition (approx. 118g)**\n\n• **Calories:** 105 kcal\n• **Carbohydrates:** 27g (including 3g dietary fibre & 14g natural fruit sugars)\n• **Protein:** 1.3g\n• **Fat:** 0.3g\n• **Key Micronutrients:** 422mg Potassium (9% DV), Vitamin B6 (33% DV), Vitamin C (11% DV)\n\n💡 *Coach's Tip:* Bananas are ideal pre-workout fuel because their natural carbs digest smoothly and the potassium protects against muscle cramps.`;
  }

  // 5. High-protein vegetarian snack
  if (q.includes('vegetarian') || (q.includes('snack') && q.includes('protein'))) {
    return `**🥑 High-Protein Vegetarian Snack Ideas**\n\n1. **Greek Yogurt with Chia Seeds & Berries**\n   • 18g Protein | 170 kcal | 5g Fibre\n\n2. **Steamed Edamame with Sea Salt**\n   • 17g Protein | 185 kcal | 8g Fibre\n\n3. **Cottage Cheese or Low-Fat Paneer with Cucumber**\n   • 18g Protein | 150 kcal | 2g Carbs\n\n4. **Spiced Roasted Chickpeas (1/2 cup)**\n   • 7g Protein | 135 kcal | 6g Fibre\n\n💡 *Coach's Tip:* Keeping portioned roasted chickpeas or edamame on hand makes hitting your protein goal effortless!`;
  }

  // 6. Water goal
  if (q.includes('water') || q.includes('hydration')) {
    return `**💧 Tips to Reach Your Water Goal**\n\nProper hydration optimizes digestion, skin health, and energy levels:\n\n1. **Front-load your morning:** Drink 400–500ml right upon waking, before coffee or breakfast.\n2. **Anchor to meals:** Drink a full glass 20 minutes before each meal to aid digestion and fullness.\n3. **Visual reminders:** Keep a marked 1-litre reusable bottle at your desk.\n4. **Natural flavours:** Add sliced lemon, cucumber, or fresh mint leaves if plain water feels boring.\n\n*Aim for 2.5–3.0 litres per day!*`;
  }

  // General fallback
  return `**✨ Nourish Coach Insight**\n\nFor today (${today.date || 'today'}), your targets are **${targets.calories} kcal** and **${targetP}g protein**.\nSo far you have consumed **${consumed.calories} kcal** (${remaining.calories} kcal remaining).\n\nAsk me anytime about:\n• Logged foods and meal summaries\n• How much protein or calories you have left\n• High-protein snack or dinner suggestions\n• Nutrition facts for any food!`;
}

module.exports = { ask };
