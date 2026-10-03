'use strict';
const { calcBMR, calcTargets, unitToGrams, macrosForGrams, sumMacros, round1 } = require('../src/utils/macroUtils');

describe('calcBMR', () => {
  it('returns null when required inputs are missing', () => {
    expect(calcBMR({ weightKg: null, heightCm: 165, age: 29, gender: 'female' })).toBeNull();
  });

  it('computes Mifflin-St Jeor BMR for a known input', () => {
    // 10*64 + 6.25*165 - 5*29 - 161 = 640 + 1031.25 - 145 - 161 = 1365.25
    const bmr = calcBMR({ weightKg: 64, heightCm: 165, age: 29, gender: 'female' });
    expect(bmr).toBeCloseTo(1365.25, 1);
  });
});

describe('calcTargets', () => {
  it('never returns calories below the 1200 floor', () => {
    const t = calcTargets({ weightKg: 40, heightCm: 150, age: 60, gender: 'female', activityLevel: 'sedentary', goal: 'lose' });
    expect(t.calories).toBeGreaterThanOrEqual(1200);
  });

  it('is always overridable — just returns numbers, never locks anything', () => {
    const t = calcTargets({ weightKg: 80, heightCm: 180, age: 30, gender: 'male', activityLevel: 'moderate', goal: 'muscle' });
    expect(typeof t.calories).toBe('number');
    expect(typeof t.proteinG).toBe('number');
  });

  it('returns null without enough profile data', () => {
    expect(calcTargets({ weightKg: null, heightCm: null, age: null })).toBeNull();
  });
});

describe('unitToGrams', () => {
  const rotiServing = { qty: 1, unit: 'piece', grams: 40 };

  it('scales a piece-based food proportionally', () => {
    expect(unitToGrams(rotiServing, 2, 'piece')).toBe(80);
    expect(unitToGrams(rotiServing, 0.5, 'piece')).toBe(20);
  });

  it('converts standard units via the fixed table', () => {
    expect(unitToGrams(rotiServing, 2, 'tbsp')).toBe(30); // 2 * 15
    expect(unitToGrams(rotiServing, 1, 'cup')).toBe(240);
  });
});

describe('macrosForGrams', () => {
  it('scales per-100g nutrients linearly', () => {
    const nutrient = { calories: 130, proteinG: 2.7, carbsG: 28, fatG: 0.3, fibreG: 0.4, sugarG: 0.1, satFatG: 0.1, sodiumMg: 1 };
    const m = macrosForGrams(nutrient, 180); // 1.8x
    expect(round1(m.calories)).toBeCloseTo(234, 0);
    expect(round1(m.proteinG)).toBeCloseTo(4.9, 1);
  });
});

describe('sumMacros', () => {
  it('sums a list of macro objects field by field', () => {
    const total = sumMacros([
      { calories: 100, proteinG: 5, carbsG: 10, fatG: 2, fibreG: 1 },
      { calories: 200, proteinG: 10, carbsG: 20, fatG: 4, fibreG: 2 },
    ]);
    expect(total.calories).toBe(300);
    expect(total.proteinG).toBe(15);
  });

  it('treats an empty list as all zeros', () => {
    expect(sumMacros([]).calories).toBe(0);
  });
});
