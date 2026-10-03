'use strict';
const express = require('express');
const { z } = require('zod');
const prisma = require('../lib/prisma');
const nutritionProvider = require('../services/nutritionProvider');
const { requireAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');

const router = express.Router();
router.use(requireAuth);

async function computeRecipeTotals(ingredients) {
  const macrosList = await Promise.all(ingredients.map((i) => nutritionProvider.computeMacros(i.foodId, i.qty, i.unit)));
  return macrosList.reduce(
    (t, m, idx) => {
      if (!m) throw new ApiError(400, 'invalid_food', `Food ${ingredients[idx].foodId} not found.`);
      return {
        calories: t.calories + m.calories,
        proteinG: t.proteinG + m.proteinG,
        carbsG: t.carbsG + m.carbsG,
        fatG: t.fatG + m.fatG,
        fibreG: t.fibreG + m.fibreG,
      };
    },
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, fibreG: 0 }
  );
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const recipes = await prisma.recipe.findMany({ where: { userId: req.userId }, include: { ingredients: true }, orderBy: { createdAt: 'desc' } });
    const withTotals = await Promise.all(
      recipes.map(async (r) => ({ ...r, totals: await computeRecipeTotals(r.ingredients) }))
    );
    res.json({ recipes: withTotals });
  })
);

const recipeSchema = z.object({
  name: z.string().min(1).max(160),
  servings: z.number().int().min(1).max(50),
  ingredients: z.array(z.object({ foodId: z.string().uuid(), qty: z.number().positive(), unit: z.string() })).min(1),
});

router.post(
  '/',
  validate({ body: recipeSchema }),
  asyncHandler(async (req, res) => {
    const totals = await computeRecipeTotals(req.body.ingredients); // validates every foodId up front
    const recipe = await prisma.recipe.create({
      data: {
        userId: req.userId,
        name: req.body.name,
        servings: req.body.servings,
        ingredients: { create: req.body.ingredients },
      },
      include: { ingredients: true },
    });
    res.status(201).json({ recipe, totals, perServing: divide(totals, req.body.servings) });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const existing = await prisma.recipe.findFirst({ where: { id: req.params.id, userId: req.userId } });
    if (!existing) throw new ApiError(404, 'not_found', 'Recipe not found.');
    await prisma.recipe.delete({ where: { id: existing.id } });
    res.status(204).end();
  })
);

/** Logs N servings of a saved recipe as a new meal — the one place recipes
 * and meal-logging intersect. */
router.post(
  '/:id/log',
  validate({ body: z.object({ servingsConsumed: z.number().positive().default(1), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), mealType: z.string(), time: z.string().optional() }) }),
  asyncHandler(async (req, res) => {
    const recipe = await prisma.recipe.findFirst({ where: { id: req.params.id, userId: req.userId }, include: { ingredients: true } });
    if (!recipe) throw new ApiError(404, 'not_found', 'Recipe not found.');
    const totals = await computeRecipeTotals(recipe.ingredients);
    const perServing = divide(totals, recipe.servings);
    const consumed = divide(perServing, 1 / req.body.servingsConsumed);

    const meal = await prisma.meal.create({
      data: {
        userId: req.userId,
        date: new Date(req.body.date),
        time: req.body.time,
        mealType: req.body.mealType,
        source: 'manual',
        note: `From recipe: ${recipe.name}`,
        items: {
          create: [{ name: `${recipe.name} (${req.body.servingsConsumed} serving${req.body.servingsConsumed === 1 ? '' : 's'})`, qty: req.body.servingsConsumed, unit: 'serving', source: 'manual', ...consumed }],
        },
      },
      include: { items: true },
    });
    res.status(201).json({ meal });
  })
);

function divide(totals, n) {
  return Object.fromEntries(Object.entries(totals).map(([k, v]) => [k, v / n]));
}

module.exports = router;
