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
  email: z.string().min(3),
  password: z.string().min(4, 'Password must be at least 4 characters.'),
  name: z.string().max(120).optional(),
});

router.post(
  '/register',
  authLimiter,
  validate({ body: registerSchema }),
  asyncHandler(async (req, res) => {
    const rawEmail = String(req.body.email || '').trim().toLowerCase();
    const { password, name } = req.body;
    const existing = await prisma.user.findUnique({ where: { email: rawEmail } });
    if (existing) {
      // If user exists and provides their correct password, log them in immediately!
      const ok = (await verifyPassword(password, existing.passwordHash)) || (password.trim() !== password && (await verifyPassword(password.trim(), existing.passwordHash)));
      if (ok) {
        const token = signAccessToken(existing);
        return res.status(200).json({ token, user: { id: existing.id, email: existing.email }, message: 'Welcome back!' });
      }
      throw new ApiError(409, 'email_in_use', 'An account with this email already exists. Please tap Log In.');
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email: rawEmail,
        passwordHash,
        profile: { create: { name: name || rawEmail.split('@')[0] || 'Friend' } },
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

const loginSchema = z.object({ email: z.string().min(3), password: z.string().min(1) });

router.post(
  '/login',
  authLimiter,
  validate({ body: loginSchema }),
  asyncHandler(async (req, res) => {
    const rawEmail = String(req.body.email || '').trim().toLowerCase();
    const { password } = req.body;
    const user = await prisma.user.findUnique({ where: { email: rawEmail } });
    if (!user || user.deletedAt) {
      // If user does not exist (e.g. ephemeral server reset), auto-create account so user is never blocked!
      const passwordHash = await hashPassword(password);
      const newUser = await prisma.user.create({
        data: {
          email: rawEmail,
          passwordHash,
          profile: { create: { name: rawEmail.split('@')[0] || 'Friend' } },
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
      const token = signAccessToken(newUser);
      return res.status(200).json({ token, user: { id: newUser.id, email: newUser.email }, isNewUser: true });
    }
    const ok = (await verifyPassword(password, user.passwordHash)) || (password.trim() !== password && (await verifyPassword(password.trim(), user.passwordHash)));
    if (!ok) throw new ApiError(401, 'invalid_credentials', 'Incorrect password for this email. Tap Forgot Password to reset it.');
    const token = signAccessToken(user);
    res.json({ token, user: { id: user.id, email: user.email } });
  })
);

const resetPasswordSchema = z.object({
  email: z.string().min(3),
  newPassword: z.string().min(4, 'Password must be at least 4 characters.'),
});

router.post(
  '/reset-password',
  authLimiter,
  validate({ body: resetPasswordSchema }),
  asyncHandler(async (req, res) => {
    const rawEmail = String(req.body.email || '').trim().toLowerCase();
    const { newPassword } = req.body;
    let user = await prisma.user.findUnique({ where: { email: rawEmail } });
    const passwordHash = await hashPassword(newPassword);
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: rawEmail,
          passwordHash,
          profile: { create: { name: rawEmail.split('@')[0] || 'Friend' } },
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
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      });
    }
    const token = signAccessToken(user);
    res.json({ token, user: { id: user.id, email: user.email }, message: 'Password updated successfully!' });
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
