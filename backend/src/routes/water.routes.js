'use strict';
const express = require('express');
const { z } = require('zod');
const prisma = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();
router.use(requireAuth);

router.get(
  '/',
  validate({ query: z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }) }),
  asyncHandler(async (req, res) => {
    const logs = await prisma.waterLog.findMany({ where: { userId: req.userId, date: new Date(req.query.date) } });
    res.json({ totalMl: logs.reduce((s, l) => s + l.amountMl, 0), logs });
  })
);

router.post(
  '/',
  validate({ body: z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), amountMl: z.number().int().positive().max(5000) }) }),
  asyncHandler(async (req, res) => {
    const log = await prisma.waterLog.create({ data: { userId: req.userId, date: new Date(req.body.date), amountMl: req.body.amountMl } });
    res.status(201).json({ log });
  })
);

module.exports = router;
