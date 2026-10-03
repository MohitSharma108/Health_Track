'use strict';
const express = require('express');
const { z } = require('zod');
const analytics = require('../services/analyticsService');
const { requireAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();
router.use(requireAuth);

router.get(
  '/range',
  validate({ query: z.object({ start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }) }),
  asyncHandler(async (req, res) => {
    const stats = await analytics.rangeStats(req.userId, req.query.start, req.query.end);
    res.json(stats);
  })
);

router.get(
  '/day',
  validate({ query: z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }) }),
  asyncHandler(async (req, res) => {
    const { totals, meals } = await analytics.dayTotals(req.userId, req.query.date);
    res.json({ totals, meals });
  })
);

module.exports = router;
