'use strict';
const express = require('express');
const { z } = require('zod');
const prisma = require('../lib/prisma');
const nutritionProvider = require('../services/nutritionProvider');
const { requireAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');
const notificationService = require('../services/notificationService');

const router = express.Router();
router.use(requireAuth);

const MEAL_TYPES = ['Breakfast', 'Morning snack', 'Lunch', 'Evening snack', 'Dinner', 'Custom'];
const SOURCES = ['manual', 'ai_image', 'voice', 'ocr', 'saved', 'ai_suggestion'];

const itemSchema = z.object({
  foodId: z.string().min(1).max(120).optional().nullable(),
  name: z.string().min(1).max(160),
  qty: z.number().positive(),
  unit: z.string().min(1).max(20),
  // Supplied macros used for freeform entries or fallback
  calories: z.number().min(0).optional(),
  proteinG: z.number().min(0).optional(),
  carbsG: z.number().min(0).optional(),
  fatG: z.number().min(0).optional(),
  fibreG: z.number().min(0).optional(),
  sugarG: z.number().min(0).optional(),
  satFatG: z.number().min(0).optional(),
  sodiumMg: z.number().min(0).optional(),
  source: z.enum(SOURCES),
  confidence: z.number().min(0).max(1).optional().nullable(),
  isCustom: z.boolean().optional(),
  customNutrition: z.boolean().optional(),
});

const mealSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  mealType: z.enum(MEAL_TYPES),
  source: z.enum(SOURCES),
  note: z.string().max(500).optional(),
  imageAssetUrl: z.string().url().optional().nullable(),
  items: z.array(itemSchema).min(1),
});

/** Resolve each item to trusted macros: recompute from the food catalog
 * when foodId is given and found, otherwise trust the caller's numbers. */
async function resolveItems(items) {
  const resolved = [];
  for (const it of items) {
    if (it.foodId && !it.isCustom && !it.customNutrition) {
      try {
        const macros = await nutritionProvider.computeMacros(it.foodId, it.qty, it.unit);
        if (macros) {
          resolved.push({ ...it, ...macros });
          continue;
        }
      } catch (_) {}
    }
    // When no foodId and no macros are supplied at all, reject as invalid
    if (!it.foodId && it.calories == null && it.proteinG == null && it.carbsG == null && it.fatG == null) {
      throw new ApiError(400, 'invalid_item', `Item "${it.name}" is missing nutrition macros (no foodId to compute it from).`);
    }
    // Fall back to caller's numbers or 0
    const required = ['calories', 'proteinG', 'carbsG', 'fatG', 'fibreG'];
    for (const f of required) {
      if (it[f] == null) it[f] = 0;
    }
    const clean = { ...it };
    delete clean.isCustom;
    delete clean.customNutrition;
    resolved.push(clean);
  }
  return resolved;
}

function sumTotals(items) {
  return items.reduce(
    (t, i) => ({
      calories: t.calories + i.calories,
      proteinG: t.proteinG + i.proteinG,
      carbsG: t.carbsG + i.carbsG,
      fatG: t.fatG + i.fatG,
      fibreG: t.fibreG + i.fibreG,
      sugarG: t.sugarG + (i.sugarG || 0),
      satFatG: t.satFatG + (i.satFatG || 0),
      sodiumMg: t.sodiumMg + (i.sodiumMg || 0),
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, fibreG: 0, sugarG: 0, satFatG: 0, sodiumMg: 0 }
  );
}

router.get(
  '/',
  validate({
    query: z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      q: z.string().max(80).optional(),
    }),
  }),
  asyncHandler(async (req, res) => {
    const { date, start, end, q } = req.query;
    const where = { userId: req.userId, deletedAt: null };
    if (date) where.date = new Date(date);
    else if (start && end) where.date = { gte: new Date(start), lte: new Date(end) };
    if (q) where.items = { some: { name: { contains: q, mode: 'insensitive' } } };

    const meals = await prisma.meal.findMany({ where, include: { items: true }, orderBy: [{ date: 'desc' }, { time: 'asc' }] });
    res.json({ meals });
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const meal = await prisma.meal.findFirst({ where: { id: req.params.id, userId: req.userId }, include: { items: true } });
    if (!meal) throw new ApiError(404, 'not_found', 'Meal not found.');
    res.json({ meal });
  })
);

router.post(
  '/',
  validate({ body: mealSchema }),
  asyncHandler(async (req, res) => {
    const items = await resolveItems(req.body.items);
    const meal = await prisma.meal.create({
      data: {
        userId: req.userId,
        date: new Date(req.body.date),
        time: req.body.time,
        mealType: req.body.mealType,
        source: req.body.source,
        note: req.body.note,
        imageAssetUrl: req.body.imageAssetUrl,
        items: { create: items },
      },
      include: { items: true },
    });
    checkGoalNotifications(req.userId, req.body.date).catch(() => {});
    res.status(201).json({ meal, totals: sumTotals(items) });
  })
);

router.put(
  '/:id',
  validate({ body: mealSchema.partial() }),
  asyncHandler(async (req, res) => {
    const existing = await prisma.meal.findFirst({ where: { id: req.params.id, userId: req.userId } });
    if (!existing) throw new ApiError(404, 'not_found', 'Meal not found.');

    const data = {};
    for (const f of ['time', 'mealType', 'source', 'note', 'imageAssetUrl']) if (req.body[f] !== undefined) data[f] = req.body[f];
    if (req.body.date) data.date = new Date(req.body.date);

    if (req.body.items) {
      const items = await resolveItems(req.body.items);
      await prisma.mealItem.deleteMany({ where: { mealId: existing.id } });
      data.items = { create: items };
    }
    const meal = await prisma.meal.update({ where: { id: existing.id }, data, include: { items: true } });
    res.json({ meal });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const existing = await prisma.meal.findFirst({ where: { id: req.params.id, userId: req.userId } });
    if (!existing) throw new ApiError(404, 'not_found', 'Meal not found.');
    await prisma.meal.update({ where: { id: existing.id }, data: { deletedAt: new Date() } });
    res.status(204).end();
  })
);

router.post(
  '/:id/duplicate',
  validate({ body: z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional() }) }),
  asyncHandler(async (req, res) => {
    const existing = await prisma.meal.findFirst({ where: { id: req.params.id, userId: req.userId }, include: { items: true } });
    if (!existing) throw new ApiError(404, 'not_found', 'Meal not found.');
    const meal = await prisma.meal.create({
      data: {
        userId: req.userId,
        date: req.body.date ? new Date(req.body.date) : existing.date,
        time: existing.time,
        mealType: existing.mealType,
        source: existing.source,
        note: existing.note,
        items: {
          create: existing.items.map(({ id, mealId, ...rest }) => rest),
        },
      },
      include: { items: true },
    });
    res.status(201).json({ meal });
  })
);

/** Fires "goal reached" notifications at most once per day per goal — a
 * pure side effect that never blocks the meal-save response. */
async function checkGoalNotifications(userId, dateStr) {
  const [goals, existing] = await Promise.all([
    prisma.nutritionGoal.findUnique({ where: { userId } }),
    prisma.notification.findFirst({ where: { userId, type: 'goalProgress', createdAt: { gte: new Date(dateStr) } } }),
  ]);
  if (!goals || existing) return;
  const meals = await prisma.meal.findMany({ where: { userId, date: new Date(dateStr), deletedAt: null }, include: { items: true } });
  const totals = sumTotals(meals.flatMap((m) => m.items));
  if (totals.proteinG >= goals.proteinG) {
    await notificationService.notify(userId, 'goalProgress', 'Protein goal hit 💪', `You've reached your protein target for today (${Math.round(totals.proteinG)}g).`);
  }
}

module.exports = router;
