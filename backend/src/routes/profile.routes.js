'use strict';
const express = require('express');
const { z } = require('zod');
const prisma = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');
const { calcTargets } = require('../utils/macroUtils');

const router = express.Router();
router.use(requireAuth);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    let [profile, goals] = await Promise.all([
      prisma.profile.findUnique({ where: { userId: req.userId } }),
      prisma.nutritionGoal.findUnique({ where: { userId: req.userId } }),
    ]);
    if (!profile) {
      profile = await prisma.profile.upsert({
        where: { userId: req.userId },
        update: {},
        create: {
          userId: req.userId,
          name: 'You',
          activityLevel: 'light',
          goal: 'maintain',
          diet: 'Non-vegetarian',
          allergies: [],
          mealsPerDay: 4,
          units: 'metric',
          reportTime: '20:00',
          appearance: 'system',
          aiEnabled: true,
          waterGoalMl: 2000,
        },
      });
    }
    if (!goals) {
      goals = await prisma.nutritionGoal.upsert({
        where: { userId: req.userId },
        update: {},
        create: {
          userId: req.userId,
          calories: 2000,
          proteinG: 120,
          carbsG: 220,
          fatG: 65,
          fibreG: 30,
        },
      });
    }
    res.json({ profile, goals });
  })
);

const profileSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  age: z.number().int().min(1).max(120).optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  heightCm: z.number().min(50).max(272).optional(),
  weightKg: z.number().min(20).max(400).optional(),
  startWeightKg: z.number().min(20).max(400).optional(),
  goalWeightKg: z.number().min(20).max(400).optional(),
  activityLevel: z.enum(['sedentary', 'light', 'moderate', 'active', 'athlete']).optional(),
  goal: z.enum(['maintain', 'lose', 'gain', 'muscle', 'general']).optional(),
  diet: z.string().optional(),
  allergies: z.array(z.string()).optional(),
  dislikes: z.string().optional(),
  restrictions: z.string().optional(),
  budget: z.enum(['budget', 'moderate', 'flexible']).optional(),
  cuisine: z.string().optional(),
  mealsPerDay: z.number().int().min(1).max(10).optional(),
  units: z.enum(['metric', 'imperial']).optional(),
  reportTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  appearance: z.enum(['system', 'light', 'dark']).optional(),
  aiEnabled: z.boolean().optional(),
  waterGoalMl: z.number().int().min(0).max(10000).optional(),
});

router.put(
  '/',
  validate({ body: profileSchema }),
  asyncHandler(async (req, res) => {
    const profile = await prisma.profile.upsert({
      where: { userId: req.userId },
      update: req.body,
      create: { userId: req.userId, name: req.body.name || 'You', ...req.body },
    });
    res.json({ profile });
  })
);

const goalsSchema = z.object({
  calories: z.number().int().min(800).max(6000),
  proteinG: z.number().min(0).max(500),
  carbsG: z.number().min(0).max(900),
  fatG: z.number().min(0).max(400),
  fibreG: z.number().min(0).max(150),
  micronutrients: z.record(z.any()).optional(),
});

router.put(
  '/goals',
  validate({ body: goalsSchema }),
  asyncHandler(async (req, res) => {
    const goals = await prisma.nutritionGoal.upsert({
      where: { userId: req.userId },
      update: req.body,
      create: { userId: req.userId, ...req.body },
    });
    res.json({ goals });
  })
);

/** Recompute targets from the profile using the same configurable,
 * always-overridable formula the onboarding flow uses — never presented as
 * medical advice; the client must still let the user edit every field. */
router.post(
  '/goals/recalculate',
  asyncHandler(async (req, res) => {
    const profile = await prisma.profile.findUnique({ where: { userId: req.userId } });
    if (!profile) throw new ApiError(404, 'profile_not_found', 'Complete onboarding first.');
    const t = calcTargets(profile);
    if (!t) throw new ApiError(400, 'insufficient_profile', 'Age, height and weight are needed to calculate targets.');
    const goals = await prisma.nutritionGoal.upsert({
      where: { userId: req.userId },
      update: t,
      create: { userId: req.userId, ...t },
    });
    res.json({ goals });
  })
);

module.exports = router;
