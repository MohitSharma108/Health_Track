'use strict';
const express = require('express');
const multer = require('multer');
const { z } = require('zod');
const prisma = require('../lib/prisma');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');
const { aiLimiter } = require('../middleware/rateLimit');
const storageProvider = require('../services/storageProvider').getStorageProvider();

const foodRecognitionService = require('../services/ai/foodRecognitionService');
const ocrService = require('../services/ai/ocrService');
const voiceParsingService = require('../services/ai/voiceParsingService');
const recommendationService = require('../services/ai/recommendationService');
const analysisService = require('../services/ai/analysisService');
const assistantService = require('../services/ai/assistantService');
const recipeImportService = require('../services/ai/recipeImportService');
const analytics = require('../services/analyticsService');

const router = express.Router();
router.use(optionalAuth);
router.use(aiLimiter);

const ACCEPTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif']);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB - allows raw mobile camera captures
  fileFilter(req, file, cb) {
    if (!ACCEPTED_IMAGE_TYPES.has(file.mimetype) && !file.mimetype.startsWith('image/')) {
      return cb(new ApiError(400, 'unsupported_file_type', 'Please upload a valid image (JPEG, PNG, WebP, GIF, HEIC).'));
    }
    cb(null, true);
  },
});

/** Every AI route shares this guard: the account can turn AI off entirely
 * (Settings > AI preferences), and the server can be run with no
 * Anthropic key at all — both fail with a clear, expected error rather than
 * a stack trace, and manual logging never depends on this passing. */
async function assertAiEnabled(userId) {
  if (!userId) return; // Guest mode during trial
  try {
    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (profile && profile.aiEnabled === false) {
      throw new ApiError(403, 'ai_disabled', 'AI features are turned off in Settings.');
    }
  } catch (err) {
    if (err instanceof ApiError) throw err;
  }
}

function singleImage(fieldName) {
  return (req, res, next) => {
    upload.single(fieldName)(req, res, (err) => {
      if (err instanceof multer.MulterError) return next(new ApiError(400, 'upload_error', err.message));
      if (err) return next(err);
      if (!req.file) return next(new ApiError(400, 'missing_file', `No "${fieldName}" file uploaded.`));
      next();
    });
  };
}

// ---- Food photo recognition -------------------------------------------------

router.post(
  '/scan',
  singleImage('image'),
  asyncHandler(async (req, res) => {
    await assertAiEnabled(req.userId);
    const base64 = req.file.buffer.toString('base64');
    const result = await foodRecognitionService.analyzeFoodPhoto({ imageBase64: base64, mediaType: req.file.mimetype, note: req.body.note });

    // Store the photo (for the eventual meal record) regardless of how the
    // AI call goes — a failed recognition shouldn't force a re-upload.
    const { url } = await storageProvider.save(req.file.buffer, req.file.mimetype);
    res.json({ ...result, imageUrl: url });
  })
);

// ---- Nutrition label OCR ----------------------------------------------------

router.post(
  '/ocr',
  singleImage('image'),
  asyncHandler(async (req, res) => {
    await assertAiEnabled(req.userId);
    const base64 = req.file.buffer.toString('base64');
    const result = await ocrService.extractLabel({ imageBase64: base64, mediaType: req.file.mimetype });
    res.json(result);
  })
);

// ---- Voice log parsing -------------------------------------------------------

router.post(
  '/voice',
  validate({ body: z.object({ transcript: z.string().min(1).max(2000) }) }),
  asyncHandler(async (req, res) => {
    await assertAiEnabled(req.userId);
    const result = await voiceParsingService.parseTranscript(req.body.transcript, req.userId);
    res.json(result);
  })
);

// ---- What should I eat now? / meal planner ----------------------------------

router.post(
  '/eat-now',
  asyncHandler(async (req, res) => {
    await assertAiEnabled(req.userId);
    const ctx = await buildEatContext(req.userId, req.body || {});
    const result = await recommendationService.whatToEatNow(ctx);
    await logAiRecommendation(req.userId, 'eat_now', ctx, result);
    res.json(result);
  })
);

router.post(
  '/plan-day',
  asyncHandler(async (req, res) => {
    await assertAiEnabled(req.userId);
    let profile = null;
    let goals = null;
    if (req.userId) {
      try {
        [profile, goals] = await Promise.all([
          prisma.profile.findUnique({ where: { userId: req.userId } }),
          prisma.nutritionGoal.findUnique({ where: { userId: req.userId } }),
        ]);
      } catch (err) {
        console.warn('Prisma error in plan-day:', err.message);
      }
    }
    const body = req.body || {};
    const ctx = {
      targets: body.targets || goals || { calories: 2000, proteinG: 120, carbsG: 220, fatG: 65, fibreG: 30 },
      diet: body.diet || (profile && profile.diet) || 'balanced',
      allergies: body.allergies || (profile && profile.allergies) || [],
      dislikes: body.dislikes || (profile && profile.dislikes) || [],
      budget: body.budget || (profile && profile.budget) || 'medium',
      cuisine: body.cuisine || (profile && profile.cuisine) || [],
      goal: body.goal || (profile && profile.goal) || 'maintain',
      mealsPerDay: body.mealsPerDay || (profile && profile.mealsPerDay) || 3,
    };
    const result = await recommendationService.planDay(ctx);
    await logAiRecommendation(req.userId, 'plan_day', ctx, result);
    res.json(result);
  })
);

router.post(
  '/regenerate-meal',
  validate({ body: z.object({ mealType: z.string(), avoid: z.string().optional(), targets: z.any().optional(), diet: z.string().optional() }) }),
  asyncHandler(async (req, res) => {
    await assertAiEnabled(req.userId);
    let profile = null;
    let goals = null;
    if (req.userId) {
      try {
        [profile, goals] = await Promise.all([
          prisma.profile.findUnique({ where: { userId: req.userId } }),
          prisma.nutritionGoal.findUnique({ where: { userId: req.userId } }),
        ]);
      } catch (err) {
        console.warn('Prisma error in regenerate-meal:', err.message);
      }
    }
    const body = req.body || {};
    const ctx = {
      targets: body.targets || goals || { calories: 2000, proteinG: 120, carbsG: 220, fatG: 65, fibreG: 30 },
      diet: body.diet || (profile && profile.diet) || 'balanced',
      allergies: (profile && profile.allergies) || [],
      dislikes: (profile && profile.dislikes) || [],
      budget: (profile && profile.budget) || 'medium',
      cuisine: (profile && profile.cuisine) || [],
      goal: (profile && profile.goal) || 'maintain',
      avoid: req.body.avoid,
    };
    const result = await recommendationService.regenerateMeal(ctx, req.body.mealType);
    res.json(result);
  })
);

async function buildEatContext(userId, clientCtx = {}) {
  let totals = { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, fibreG: 0 };
  let meals = [];
  let g = { calories: 2000, proteinG: 120, carbsG: 220, fatG: 65, fibreG: 30 };
  let p = { diet: 'balanced', allergies: [], dislikes: [], budget: 'medium', cuisine: [], goal: 'maintain' };

  if (userId) {
    try {
      const [profile, goals, dayData] = await Promise.all([
        prisma.profile.findUnique({ where: { userId } }),
        prisma.nutritionGoal.findUnique({ where: { userId } }),
        analytics.dayTotals(userId, new Date().toISOString().slice(0, 10)),
      ]);
      if (profile) p = profile;
      if (goals) g = goals;
      if (dayData) {
        totals = dayData.totals || totals;
        meals = dayData.meals || meals;
      }
    } catch (err) {
      console.warn('Prisma error in buildEatContext:', err.message);
    }
  }

  if (clientCtx && clientCtx.targets) g = { ...g, ...clientCtx.targets };
  if (clientCtx && clientCtx.consumed) totals = { ...totals, ...clientCtx.consumed };
  if (clientCtx && clientCtx.mealsAlreadyToday) {
    meals = clientCtx.mealsAlreadyToday.map((m) => (typeof m === 'string' ? { mealType: m } : m));
  }
  if (clientCtx && clientCtx.diet) p.diet = clientCtx.diet;
  if (clientCtx && clientCtx.goal) p.goal = clientCtx.goal;

  const remaining = (clientCtx && clientCtx.remaining) || {
    calories: Math.max(0, Math.round(g.calories - totals.calories)),
    protein: Math.max(0, Math.round(g.proteinG - totals.proteinG)),
    carbs: Math.max(0, Math.round(g.carbsG - totals.carbsG)),
    fat: Math.max(0, Math.round(g.fatG - totals.fatG)),
    fibre: Math.max(0, Math.round(g.fibreG - totals.fibreG)),
  };

  return {
    remaining,
    timeOfDay: (clientCtx && clientCtx.timeOfDay) || new Date().toTimeString().slice(0, 5),
    mealsAlreadyToday: (clientCtx && clientCtx.mealsAlreadyToday) || meals.map((m) => m.mealType),
    diet: p.diet || 'balanced',
    allergies: p.allergies || [],
    dislikes: p.dislikes || [],
    budget: p.budget || 'medium',
    cuisine: p.cuisine || [],
    goal: p.goal || 'maintain',
  };
}

// ---- Daily analysis / weekly insights ---------------------------------------

router.post(
  '/daily-analysis',
  validate({
    body: z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      targets: z.any().optional(),
      consumed: z.any().optional(),
      mealsLogged: z.any().optional(),
      goal: z.string().optional(),
    }),
  }),
  asyncHandler(async (req, res) => {
    await assertAiEnabled(req.userId);
    let goals = req.body.targets;
    let totals = req.body.consumed;
    let meals = req.body.mealsLogged;

    if (req.userId && (!totals || !meals || !meals.length)) {
      try {
        const [dbGoals, dayData] = await Promise.all([
          prisma.nutritionGoal.findUnique({ where: { userId: req.userId } }),
          analytics.dayTotals(req.userId, req.body.date),
        ]);
        if (!goals) goals = dbGoals;
        if (!totals) totals = dayData.totals;
        if (!meals || !meals.length) {
          meals = (dayData.meals || []).map((m) => ({
            type: m.mealType,
            time: m.time,
            items: (m.items || []).map((i) => i.name),
          }));
        }
      } catch (err) {
        console.warn('Prisma error in daily-analysis:', err.message);
      }
    }

    if (!meals || !meals.length) {
      throw new ApiError(400, 'no_data', 'No meals logged on this date yet. Log a meal first to generate an analysis.');
    }
    const ctx = {
      date: req.body.date,
      targets: goals || { calories: 2000, proteinG: 120, carbsG: 220, fatG: 65, fibreG: 30 },
      consumed: totals || { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, fibreG: 0 },
      mealsLogged: meals,
    };
    const result = await analysisService.dailyAnalysis(ctx);
    await logAiRecommendation(req.userId, 'daily_analysis', ctx, result);
    res.json(result);
  })
);

router.post(
  '/weekly-insights',
  validate({
    body: z.object({
      start: z.string(),
      end: z.string(),
      stats: z.any().optional(),
      targets: z.any().optional(),
    }),
  }),
  asyncHandler(async (req, res) => {
    await assertAiEnabled(req.userId);
    let goals = req.body.targets;
    let stats = req.body.stats;

    if (req.userId && (!stats || stats.loggedDays === undefined)) {
      try {
        const [dbGoals, dbStats] = await Promise.all([
          prisma.nutritionGoal.findUnique({ where: { userId: req.userId } }),
          analytics.rangeStats(req.userId, req.body.start, req.body.end),
        ]);
        if (!goals) goals = dbGoals;
        stats = dbStats;
      } catch (err) {
        console.warn('Prisma error in weekly-insights:', err.message);
      }
    }

    if (!stats || !stats.loggedDays || stats.loggedDays < 2) {
      throw new ApiError(400, 'insufficient_data', 'Log a few more days (at least 2 days) to unlock trend insights.');
    }

    const ctx = {
      loggedDays: stats.loggedDays,
      totalDays: stats.totalDays || 7,
      avg: stats.avg,
      weekday: stats.avgWeekdayCalories,
      weekend: stats.avgWeekendCalories,
      topFoods: (stats.topFoods || []).map((f) => (typeof f === 'string' ? f : f.name)),
      targets: goals || { calories: 2000, proteinG: 120, carbsG: 220, fatG: 65, fibreG: 30 },
    };
    const result = await analysisService.weeklyInsights(ctx);
    await logAiRecommendation(req.userId, 'weekly_insights', ctx, result);
    res.json(result);
  })
);

// ---- Recipe import from pasted text ------------------------------------------

router.post(
  '/recipe-import',
  validate({ body: z.object({ text: z.string().min(1).max(4000) }) }),
  asyncHandler(async (req, res) => {
    await assertAiEnabled(req.userId);
    let referenceList = '';
    if (req.userId) {
      try {
        const referenceFoods = await prisma.food.findMany({ where: { isCustom: false }, select: { id: true, name: true, category: true }, take: 200 });
        if (referenceFoods && referenceFoods.length) {
          referenceList = referenceFoods.map((f) => `${f.id}|${f.name}|${f.category}`).join('\n');
        }
      } catch (_) {}
    }
    if (!referenceList) {
      referenceList = '1|Chicken Breast|poultry\n2|White Rice|grains\n3|Olive Oil|fats\n4|Broccoli|vegetables\n5|Egg|dairy\n6|Salmon|fish\n7|Oats|grains';
    }
    const result = await recipeImportService.parseRecipeText(req.body.text, referenceList);
    res.json(result);
  })
);

// ---- Chat assistant ----------------------------------------------------------

router.post(
  '/assistant',
  validate({
    body: z.object({
      history: z.array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().min(1).max(2000) })).min(1).max(20),
      appData: z.any().optional(),
    }),
  }),
  asyncHandler(async (req, res) => {
    await assertAiEnabled(req.userId);
    const dateStr = new Date().toISOString().slice(0, 10);
    let appData = req.body.appData;

    if (!appData && req.userId) {
      try {
        const [profile, goals, dayData, last7] = await Promise.all([
          prisma.profile.findUnique({ where: { userId: req.userId } }),
          prisma.nutritionGoal.findUnique({ where: { userId: req.userId } }),
          analytics.dayTotals(req.userId, dateStr),
          analytics.rangeStats(req.userId, addDaysStr(dateStr, -6), dateStr),
        ]);
        const totals = (dayData && dayData.totals) || { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, fibreG: 0 };
        const meals = (dayData && dayData.meals) || [];
        appData = {
          today: { date: dateStr, targets: goals, consumed: totals, meals: meals.map((m) => ({ type: m.mealType, time: m.time, items: m.items.map((i) => i.name) })) },
          last7Days: { avgCalories: Math.round((last7 && last7.avg && last7.avg.calories) || 0), avgProtein: Math.round((last7 && last7.avg && last7.avg.proteinG) || 0), loggedDays: (last7 && last7.loggedDays) || 0 },
          profile: { goal: (profile && profile.goal) || 'maintain', diet: (profile && profile.diet) || 'balanced', allergies: (profile && profile.allergies) || [], weightKg: (profile && profile.weightKg) || 70, goalWeightKg: (profile && profile.goalWeightKg) || 70 },
        };
      } catch (err) {
        console.warn('Prisma error in assistant route:', err.message);
      }
    }

    if (!appData) {
      appData = {
        today: { date: dateStr, targets: { calories: 2000, proteinG: 120, carbsG: 220, fatG: 65, fibreG: 30 }, consumed: { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, fibreG: 0 }, meals: [] },
        last7Days: { avgCalories: 0, avgProtein: 0, loggedDays: 0 },
        profile: { goal: 'maintain', diet: 'balanced', allergies: [], weightKg: 70, goalWeightKg: 70 },
      };
    }
    const text = await assistantService.ask({ history: req.body.history, appData });
    await logAiRecommendation(req.userId, 'assistant', { lastMessage: req.body.history[req.body.history.length - 1] }, { text });
    res.json({ text });
  })
);

function addDaysStr(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

async function logAiRecommendation(userId, kind, requestCtx, response) {
  if (!userId) return;
  try {
    await prisma.aiRecommendation.create({ data: { userId, kind, requestCtx, response } });
  } catch (err) {
    // Never let logging failures break the user-facing AI response.
    // eslint-disable-next-line no-console
    console.warn('failed to log AI recommendation', kind, err.message);
  }
}

module.exports = router;
