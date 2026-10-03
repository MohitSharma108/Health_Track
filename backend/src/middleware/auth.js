'use strict';
const { verifyAccessToken } = require('../lib/jwt');
const prisma = require('../lib/prisma');

/**
 * Requires a valid `Authorization: Bearer <token>` header. On success sets
 * `req.userId`. Every route below this middleware trusts req.userId as the
 * ONLY source of "whose data is this" — never trust a userId in the body
 * or query string.
 */
async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ error: { code: 'unauthenticated', message: 'Missing or malformed Authorization header.' } });
    }
    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.deletedAt) {
      return res.status(401).json({ error: { code: 'unauthenticated', message: 'Account no longer exists.' } });
    }
    req.userId = user.id;
    req.userEmail = user.email;
    next();
  } catch (err) {
    return res.status(401).json({ error: { code: 'invalid_token', message: 'Invalid or expired token.' } });
  }
}

async function optionalAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');
    if (scheme === 'Bearer' && token) {
      const payload = verifyAccessToken(token);
      const user = await prisma.user.findUnique({ where: { id: payload.sub } });
      if (user && !user.deletedAt) {
        req.userId = user.id;
        req.userEmail = user.email;
      }
    }
  } catch (err) {
    // guest mode, proceed without req.userId
  }
  next();
}

module.exports = { requireAuth, optionalAuth };
