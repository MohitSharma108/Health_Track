'use strict';
const { PrismaClient } = require('@prisma/client');
const { REFERENCE_FOODS } = require('../src/data/referenceFoods');
const { hashPassword } = require('../src/lib/password');

const prisma = new PrismaClient();

async function main() {
  console.log(`Seeding ${REFERENCE_FOODS.length} reference foods...`); // eslint-disable-line no-console
  for (const f of REFERENCE_FOODS) {
    const existing = await prisma.food.findFirst({ where: { name: f.name, isCustom: false } });
    if (existing) continue;
    await prisma.food.create({
      data: {
        name: f.name,
        category: f.cat,
        isCustom: false,
        nutrients: {
          create: {
            calories: f.per100.cal,
            proteinG: f.per100.p,
            carbsG: f.per100.c,
            fatG: f.per100.f,
            fibreG: f.per100.fib,
            sugarG: f.per100.sug || 0,
            satFatG: f.per100.sat || 0,
            sodiumMg: f.per100.sod || 0,
          },
        },
        servings: { create: { qty: f.serving.qty, unit: f.serving.unit, grams: f.serving.grams, label: f.serving.label } },
      },
    });
  }

  const demoEmail = 'demo@nourish.app';
  const existingUser = await prisma.user.findUnique({ where: { email: demoEmail } });
  if (!existingUser) {
    console.log('Creating demo user (demo@nourish.app / password: demo12345)...'); // eslint-disable-line no-console
    const passwordHash = await hashPassword('demo12345');
    await prisma.user.create({
      data: {
        email: demoEmail,
        passwordHash,
        profile: {
          create: {
            name: 'Demo User',
            age: 29,
            gender: 'female',
            heightCm: 165,
            weightKg: 64,
            startWeightKg: 66,
            goalWeightKg: 60,
            activityLevel: 'light',
            goal: 'lose',
            diet: 'Vegetarian',
            allergies: ['Peanuts'],
            cuisine: 'Indian',
          },
        },
        goals: { create: { calories: 1700, proteinG: 90, carbsG: 190, fatG: 55, fibreG: 28 } },
        notifPrefs: {
          create: ['mealReminders', 'hydration', 'loggingReminder', 'goalProgress', 'dailyReport', 'weeklyReport'].map((type) => ({ type, enabled: true })),
        },
      },
    });
  }

  console.log('Seed complete.'); // eslint-disable-line no-console
}

main()
  .catch((e) => {
    console.error(e); // eslint-disable-line no-console
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
