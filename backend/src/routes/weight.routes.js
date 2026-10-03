'use strict';
const express = require('express');
const { z } = require('zod');
const prisma = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { asyncHandler } = require('../middleware/errorHandler');
const notificationService = require('../services/notificationService');

const router = express.Router();
router.use(requireAuth);

router.get(
  '/',
  validate({ query: z.object({ start: z.string().optional(), end: z.string().optional() }) }),
  asyncHandler(async (req, res) => {
    const where = { userId: req.userId };
    if (req.query.start && req.query.end) where.date = { gte: new Date(req.query.start), lte: new Date(req.query.end) };
    const logs = await prisma.weightLog.findMany({ where, orderBy: { date: 'asc' } });
    res.json({ logs });
  })
);

const upsertSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  weightKg: z.number().positive().max(500),
  note: z.string().max(300).optional(),
});

router.post(
  '/',
  validate({ body: upsertSchema }),
  asyncHandler(async (req, res) => {
    const log = await prisma.weightLog.upsert({
      where: { userId_date: { userId: req.userId, date: new Date(req.body.date) } },
      update: { weightKg: req.body.weightKg, note: req.body.note },
      create: { userId: req.userId, date: new Date(req.body.date), weightKg: req.body.weightKg, note: req.body.note },
    });
    const profile = await prisma.profile.findUnique({ where: { userId: req.userId } });
    if (profile && profile.goalWeightKg && Math.abs(req.body.weightKg - profile.goalWeightKg) < 0.5) {
      await notificationService.notify(req.userId, 'goalProgress', 'Goal weight reached! 🎉', "You're right at your goal weight — nice work.");
    }
    res.status(201).json({ log });
  })
);

module.exports = router;
