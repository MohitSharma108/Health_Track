'use strict';
const express = require('express');
const { z } = require('zod');
const prisma = require('../lib/prisma');
const notificationService = require('../services/notificationService');
const { requireAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();
router.use(requireAuth);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const notifications = await notificationService.listForUser(req.userId);
    res.json({ notifications });
  })
);

router.post(
  '/:id/read',
  asyncHandler(async (req, res) => {
    await notificationService.markRead(req.userId, req.params.id);
    res.status(204).end();
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await prisma.notification.deleteMany({ where: { id: req.params.id, userId: req.userId } });
    res.status(204).end();
  })
);

router.post(
  '/read-all',
  asyncHandler(async (req, res) => {
    await notificationService.markAllRead(req.userId);
    res.status(204).end();
  })
);

const NOTIF_TYPES = ['mealReminders', 'hydration', 'loggingReminder', 'goalProgress', 'dailyReport', 'weeklyReport'];

router.get(
  '/preferences',
  asyncHandler(async (req, res) => {
    const prefs = await prisma.notificationPreference.findMany({ where: { userId: req.userId } });
    res.json({ preferences: prefs });
  })
);

router.put(
  '/preferences',
  validate({ body: z.object({ type: z.enum(NOTIF_TYPES), enabled: z.boolean().optional(), time: z.string().regex(/^\d{2}:\d{2}$/).optional() }) }),
  asyncHandler(async (req, res) => {
    const { type, ...data } = req.body;
    const pref = await prisma.notificationPreference.upsert({
      where: { userId_type: { userId: req.userId, type } },
      update: data,
      create: { userId: req.userId, type, ...data },
    });
    res.json({ preference: pref });
  })
);

/** Register a device for push notifications (FCM/APNs token from the client). */
router.post(
  '/devices',
  validate({ body: z.object({ pushToken: z.string().min(10), platform: z.enum(['ios', 'android', 'web']) }) }),
  asyncHandler(async (req, res) => {
    const device = await prisma.userDevice.upsert({
      where: { userId_pushToken: { userId: req.userId, pushToken: req.body.pushToken } },
      update: { platform: req.body.platform },
      create: { userId: req.userId, pushToken: req.body.pushToken, platform: req.body.platform },
    });
    res.status(201).json({ device });
  })
);

module.exports = router;
