'use strict';

const ACTIVITY_FACTORS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  athlete: 1.9,
};

const GOAL_CALORIE_ADJUSTMENT = { maintain: 0, lose: -450, gain: 400, muscle: 250, general: 0 };
const GOAL_PROTEIN_PER_KG = { lose: 1.8, muscle: 1.9, gain: 1.7, maintain: 1.4, general: 1.3 };

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

/** Mifflin-St Jeor BMR. Returns null if required inputs are missing —
 * callers must not silently substitute defaults for a health calculation. */
function calcBMR({ weightKg, heightCm, age, gender }) {
  if (!weightKg || !heightCm || !age) return null;
  let bmr = 10 * weightKg + 6.25 * heightCm - 5 * age;
  bmr += gender === 'male' ? 5 : gender === 'female' ? -161 : -78;
  return bmr;
}

/**
 * Configurable, ALWAYS-OVERRIDABLE target calculation. This is a standard
 * estimation formula, not medical advice — callers (routes) must let the
 * user edit every field this returns, and must never present it as a
 * clinical recommendation.
 */
function calcTargets(profile) {
  const bmr = calcBMR(profile);
  if (!bmr) return null;
  const factor = ACTIVITY_FACTORS[profile.activityLevel] || ACTIVITY_FACTORS.light;
  const tdee = bmr * factor;
  const goalAdj = GOAL_CALORIE_ADJUSTMENT[profile.goal] ?? 0;
  const calories = clamp(Math.round(tdee + goalAdj), 1200, 4500);
  const proteinPerKg = GOAL_PROTEIN_PER_KG[profile.goal] ?? 1.4;
  const proteinG = Math.round(proteinPerKg * (profile.weightKg || 70));
  const fatG = Math.round((calories * 0.27) / 9);
  const carbsG = Math.max(50, Math.round((calories - proteinG * 4 - fatG * 9) / 4));
  const fibreG = Math.round((calories / 1000) * 14);
  return { calories, proteinG, carbsG, fatG, fibreG };
}

const UNIT_GRAMS = { g: 1, kg: 1000, ml: 1, l: 1000, tsp: 5, tbsp: 15, cup: 240, bowl: 200, slice: 30 };

/** Convert a (qty, unit) for a given food+serving into grams. `serving` is
 * the food's FoodServing row: { qty, unit, grams }. */
function unitToGrams(serving, qty, unit) {
  if (unit === 'piece' || unit === 'serving' || (serving && unit === serving.unit)) {
    const baseQty = serving ? serving.qty : 1;
    const baseGrams = serving ? serving.grams : 100;
    return (qty / (baseQty || 1)) * baseGrams;
  }
  const g = UNIT_GRAMS[unit];
  if (g != null) return qty * g;
  return serving ? (qty / (serving.qty || 1)) * serving.grams : qty * 100;
}

/** nutrient is a FoodNutrient row (per 100g/ml values). Returns absolute
 * macros for the given grams. */
function macrosForGrams(nutrient, grams) {
  const f = grams / 100;
  return {
    calories: nutrient.calories * f,
    proteinG: nutrient.proteinG * f,
    carbsG: nutrient.carbsG * f,
    fatG: nutrient.fatG * f,
    fibreG: nutrient.fibreG * f,
    sugarG: (nutrient.sugarG || 0) * f,
    satFatG: (nutrient.satFatG || 0) * f,
    sodiumMg: (nutrient.sodiumMg || 0) * f,
  };
}

function sumMacros(list) {
  const t = { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, fibreG: 0, sugarG: 0, satFatG: 0, sodiumMg: 0 };
  for (const m of list) {
    t.calories += m.calories || 0;
    t.proteinG += m.proteinG || 0;
    t.carbsG += m.carbsG || 0;
    t.fatG += m.fatG || 0;
    t.fibreG += m.fibreG || 0;
    t.sugarG += m.sugarG || 0;
    t.satFatG += m.satFatG || 0;
    t.sodiumMg += m.sodiumMg || 0;
  }
  return t;
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

module.exports = { calcBMR, calcTargets, unitToGrams, macrosForGrams, sumMacros, round1, clamp, ACTIVITY_FACTORS };
