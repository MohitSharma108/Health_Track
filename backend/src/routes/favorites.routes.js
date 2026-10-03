'use strict';
const express = require('express');
const { z } = require('zod');
const prisma = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');

const router = express.Router();
router.use(requireAuth);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const favorites = await prisma.favorite.findMany({ where: { userId: req.userId }, orderBy: { createdAt: 'desc' } });
    res.json({ favorites });
  })
);

router.post(
  '/',
  validate({
    body: z.object({
      type: z.enum(['food', 'meal', 'recipe', 'product']),
      refId: z.string(),
      name: z.string().min(1).max(160),
      snapshot: z.record(z.any()).optional(),
    }),
  }),
  asyncHandler(async (req, res) => {
    const favorite = await prisma.favorite.create({ data: { userId: req.userId, ...req.body } });
    res.status(201).json({ favorite });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const existing = await prisma.favorite.findFirst({ where: { id: req.params.id, userId: req.userId } });
    if (!existing) throw new ApiError(404, 'not_found', 'Favorite not found.');
    await prisma.favorite.delete({ where: { id: existing.id } });
    res.status(204).end();
  })
);

module.exports = router;
