export const round1 = (n) => Math.round((Number(n) || 0) * 10) / 10
export const round0 = (n) => Math.round(Number(n) || 0)

export function sumMacros(macros = []) {
  return macros.reduce(
    (acc, m) => ({
      cal: acc.cal + (Number(m?.cal) || 0),
      p:   acc.p   + (Number(m?.p)   || 0),
      c:   acc.c   + (Number(m?.c)   || 0),
      fat: acc.fat + (Number(m?.fat) || 0),
      fib: acc.fib + (Number(m?.fib) || 0),
      sug: acc.sug + (Number(m?.sug) || 0),
      sod: acc.sod + (Number(m?.sod) || 0),
    }),
    { cal: 0, p: 0, c: 0, fat: 0, fib: 0, sug: 0, sod: 0 }
  )
}

export function calcPct(value, goal) {
  if (!goal) return 0
  return Math.min(100, Math.round((value / goal) * 100))
}

export function calcTDEE(profile) {
  const { gender, weight, height, age, activity = 'moderate' } = profile || {}
  if (!weight || !height || !age) return 2000
  const bmr = gender === 'female'
    ? 447.6 + 9.2 * weight + 3.1 * height - 4.3 * age
    : 88.4 + 13.4 * weight + 4.8 * height - 5.7 * age
  const activityMap = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9 }
  return Math.round(bmr * (activityMap[activity] || 1.55))
}

export function macroGoalsFromCalories(calories, goal = 'maintain') {
  const splits = {
    lose_weight:   { p: 0.35, c: 0.35, fat: 0.30 },
    maintain:      { p: 0.25, c: 0.50, fat: 0.25 },
    gain_muscle:   { p: 0.30, c: 0.45, fat: 0.25 },
    high_protein:  { p: 0.40, c: 0.35, fat: 0.25 },
  }
  const s = splits[goal] || splits.maintain
  return {
    p:   round0((calories * s.p) / 4),
    c:   round0((calories * s.c) / 4),
    fat: round0((calories * s.fat) / 9),
  }
}

export const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snacks']
export const MEAL_ICONS  = { Breakfast: '🌅', Lunch: '🍱', Dinner: '🌙', Snacks: '🍎' }
