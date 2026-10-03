'use strict';
const express = require('express');
const { z } = require('zod');
const prisma = require('../lib/prisma');
const reportService = require('../services/reportService');
const emailService = require('../services/emailService');
const { requireAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { asyncHandler } = require('../middleware/errorHandler');
const { addDays, toDateStr } = require('../utils/dateUtils');

const router = express.Router();
router.use(requireAuth);

router.get(
  '/daily',
  validate({ query: z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }) }),
  asyncHandler(async (req, res) => {
    const report = await reportService.buildDailyReport(req.userId, req.query.date);
    res.json(report);
  })
);

router.get(
  '/daily/download',
  validate({ query: z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }) }),
  asyncHandler(async (req, res) => {
    const { html } = await reportService.buildDailyReport(req.userId, req.query.date);
    res.set('Content-Type', 'text/html').set('Content-Disposition', `attachment; filename="nourish-report-${req.query.date}.html"`).send(html);
  })
);

router.get(
  '/weekly',
  validate({ query: z.object({ end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional() }) }),
  asyncHandler(async (req, res) => {
    const end = req.query.end || toDateStr();
    const start = addDays(end, -6);
    const report = await reportService.buildWeeklyReport(req.userId, end, start);
    res.json(report);
  })
);

router.get(
  '/weekly/download',
  validate({ query: z.object({ end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional() }) }),
  asyncHandler(async (req, res) => {
    const end = req.query.end || toDateStr();
    const start = addDays(end, -6);
    const { html } = await reportService.buildWeeklyReport(req.userId, end, start);
    res.set('Content-Type', 'text/html').set('Content-Disposition', `attachment; filename="nourish-weekly-${end}.html"`).send(html);
  })
);

/** Send today's (or a given date's) report by email right now, regardless
 * of the scheduled report_time — used by a "Send me this report" button. */
router.post(
  '/daily/send',
  validate({ body: z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }) }),
  asyncHandler(async (req, res) => {
    const { html } = await reportService.buildDailyReport(req.userId, req.body.date);
    const record = await emailService.sendReportEmail({
      userId: req.userId,
      email: req.userEmail,
      date: req.body.date,
      kind: 'daily',
      subject: `Your Daily Nutrition Report — ${req.body.date}`,
      html,
    });
    res.json({ emailReport: record });
  })
);

router.get(
  '/history',
  asyncHandler(async (req, res) => {
    const reports = await prisma.emailReport.findMany({ where: { userId: req.userId }, orderBy: { date: 'desc' }, take: 30 });
    res.json({ reports });
  })
);

module.exports = router;
