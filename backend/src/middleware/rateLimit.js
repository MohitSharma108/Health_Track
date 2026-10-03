'use strict';
const rateLimit = require('express-rate-limit');

// Login/register: slow down credential-stuffing and account-enumeration attempts.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.AUTH_RATE_LIMIT_PER_15MIN || 20),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'rate_limited', message: 'Too many attempts. Please wait and try again.' } },
});

// AI endpoints (image recognition, OCR, voice parsing, recommendations, chat)
// are the most expensive calls in the app — cap per-user, per-hour usage.
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: Number(process.env.AI_RATE_LIMIT_PER_HOUR || 60),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.userId || req.ip,
  message: { error: { code: 'rate_limited', message: 'AI request limit reached for this hour. Please try again later.' } },
});

module.exports = { authLimiter, aiLimiter };
