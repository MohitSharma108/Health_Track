'use strict';
const express = require('express');
const { z } = require('zod');
const prisma = require('../lib/prisma');
const { hashPassword, verifyPassword } = require('../lib/password');
const { signAccessToken } = require('../lib/jwt');
const { validate } = require('../middleware/validate');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');
const { authLimiter } = require('../middleware/rateLimit');

const router = express.Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  name: z.string().min(1).max(120),
});

router.post(
  '/register',
  authLimiter,
  validate({ body: registerSchema }),
  asyncHandler(async (req, res) => {
    const { email, password, name } = req.body;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new ApiError(409, 'email_in_use', 'An account with this email already exists.');

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        profile: { create: { name } },
        goals: {
          create: {
            calories: 2000,
            proteinG: 120,
            carbsG: 220,
            fatG: 65,
            fibreG: 30,
          },
        },
        notifPrefs: {
          create: [
            { type: 'mealReminders', enabled: true },
            { type: 'hydration', enabled: true },
            { type: 'loggingReminder', enabled: true },
            { type: 'goalProgress', enabled: true },
            { type: 'dailyReport', enabled: true },
            { type: 'weeklyReport', enabled: true },
          ],
        },
      },
    });
    const token = signAccessToken(user);
    res.status(201).json({ token, user: { id: user.id, email: user.email } });
  })
);

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

router.post(
  '/login',
  authLimiter,
  validate({ body: loginSchema }),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    // Same error for "no such user" and "wrong password" — don't leak which one.
    if (!user || user.deletedAt) throw new ApiError(401, 'invalid_credentials', 'Incorrect email or password.');
    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) throw new ApiError(401, 'invalid_credentials', 'Incorrect email or password.');
    const token = signAccessToken(user);
    res.json({ token, user: { id: user.id, email: user.email } });
  })
);

router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({ id: req.userId, email: req.userEmail });
  })
);

router.post(
  '/logout',
  optionalAuth,
  asyncHandler(async (req, res) => {
    res.json({ ok: true, message: 'Logged out successfully.' });
  })
);

/** Permanently deletes the account and, via onDelete: Cascade on every
 * child relation in prisma/schema.prisma, every meal, recipe, weight/water
 * log, favorite, custom food, and notification that belongs to it. This is
 * the real implementation behind the frontend's "Delete all my data". */
router.delete(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    await prisma.user.delete({ where: { id: req.userId } });
    res.status(204).end();
  })
);

module.exports = router;
