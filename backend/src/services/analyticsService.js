'use strict';
const prisma = require('../lib/prisma');
const { sumMacros } = require('../utils/macroUtils');
const { dateRange } = require('../utils/dateUtils');

/** All meals for a user in [startDate, endDate], with items — the single
 * query every other aggregate in this file is derived from, so a dashboard
 * total and a weekly average can never disagree about what "logged" means. */
async function getMealsInRange(userId, startDate, endDate) {
  return prisma.meal.findMany({
    where: {
      userId,
      deletedAt: null,
      date: { gte: new Date(startDate), lte: new Date(endDate) },
    },
    include: { items: true },
    orderBy: [{ date: 'asc' }, { time: 'asc' }],
  });
}

function mealTotals(meal) {
  return sumMacros(
    meal.items.map((i) => ({
      calories: i.calories,
      proteinG: i.proteinG,
      carbsG: i.carbsG,
      fatG: i.fatG,
      fibreG: i.fibreG,
      sugarG: i.sugarG,
      satFatG: i.satFatG,
      sodiumMg: i.sodiumMg,
    }))
  );
}

async function dayTotals(userId, dateStr) {
  const meals = await getMealsInRange(userId, dateStr, dateStr);
  return { totals: sumMacros(meals.map(mealTotals)), meals };
}

/** Weekly/monthly analytics: averages, logging consistency, top foods,
 * weekday vs weekend split, macro distribution — everything the Analytics
 * screen and the weekly email report both read from. */
async function rangeStats(userId, startDate, endDate) {
  const meals = await getMealsInRange(userId, startDate, endDate);
  const dates = dateRange(startDate, endDate);
  const byDate = {};
  for (const m of meals) {
    const key = m.date.toISOString().slice(0, 10);
    (byDate[key] = byDate[key] || []).push(m);
  }
  const dayTotalsArr = dates.map((d) => sumMacros((byDate[d] || []).map(mealTotals)));
  const loggedDays = dates.filter((d) => (byDate[d] || []).length > 0).length;
  const n = loggedDays || 1;
  const sums = sumMacros(dayTotalsArr);
  const avg = {
    calories: sums.calories / n,
    proteinG: sums.proteinG / n,
    carbsG: sums.carbsG / n,
    fatG: sums.fatG / n,
    fibreG: sums.fibreG / n,
    sugarG: sums.sugarG / n,
  };

  const foodFreq = {};
  for (const m of meals) for (const it of m.items) foodFreq[it.name] = (foodFreq[it.name] || 0) + 1;
  const topFoods = Object.entries(foodFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, count]) => ({ name, count }));

  let weekdaySum = 0,
    weekdayN = 0,
    weekendSum = 0,
    weekendN = 0;
  dates.forEach((d, i) => {
    const day = new Date(d + 'T00:00:00Z').getUTCDay();
    if (day === 0 || day === 6) {
      weekendSum += dayTotalsArr[i].calories;
      weekendN++;
    } else {
      weekdaySum += dayTotalsArr[i].calories;
      weekdayN++;
    }
  });

  return {
    dates,
    dayTotalsArr,
    loggedDays,
    totalDays: dates.length,
    avg,
    topFoods,
    avgWeekdayCalories: weekdayN ? weekdaySum / weekdayN : 0,
    avgWeekendCalories: weekendN ? weekendSum / weekendN : 0,
  };
}

module.exports = { getMealsInRange, mealTotals, dayTotals, rangeStats };
