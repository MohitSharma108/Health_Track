'use strict';
const express = require('express');
const { z } = require('zod');
const nutritionProvider = require('../services/nutritionProvider');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');

const router = express.Router();
router.use(optionalAuth);

router.get(
  '/search',
  validate({ query: z.object({ q: z.string().min(1).max(80) }) }),
  asyncHandler(async (req, res) => {
    const foods = await nutritionProvider.search(req.query.q, req.userId);
    res.json({ foods });
  })
);

/** Every custom food (manual entries + saved label-scan products) this user
 * owns — used by the frontend's Favorites/"My Products" screen, which needs
 * a full list rather than a search term. */
router.get(
  '/custom',
  asyncHandler(async (req, res) => {
    const foods = await nutritionProvider.listCustom(req.userId);
    res.json({ foods });
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const food = await nutritionProvider.getById(req.params.id);
    if (!food) throw new ApiError(404, 'not_found', 'Food not found.');
    res.json({ food });
  })
);

const nutrientSchema = z.object({
  calories: z.number().min(0),
  proteinG: z.number().min(0),
  carbsG: z.number().min(0),
  fatG: z.number().min(0),
  fibreG: z.number().min(0),
  sugarG: z.number().min(0).optional(),
  satFatG: z.number().min(0).optional(),
  sodiumMg: z.number().min(0).optional(),
});

const customFoodSchema = z.object({
  name: z.string().min(1).max(160),
  category: z.string().max(60).optional(),
  isProduct: z.boolean().optional(),
  serving: z.object({ qty: z.number().positive(), unit: z.string(), grams: z.number().positive(), label: z.string() }),
  nutrientsPer100: nutrientSchema,
});

router.post(
  '/custom',
  requireAuth,
  validate({ body: customFoodSchema }),
  asyncHandler(async (req, res) => {
    const food = await nutritionProvider.createCustomFood(req.userId, req.body);
    res.status(201).json({ food });
  })
);

module.exports = router;
