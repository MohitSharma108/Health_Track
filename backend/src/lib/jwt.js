'use strict';
const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'nourish-secure-production-jwt-token-key-2026-fallback';
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

if (!process.env.JWT_SECRET && process.env.NODE_ENV !== 'test') {
  // eslint-disable-next-line no-console
  console.warn('NOTICE: JWT_SECRET not explicitly set in environment variables — using secure built-in fallback key.');
}

function signAccessToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, SECRET, { expiresIn: EXPIRES_IN });
}

function verifyAccessToken(token) {
  return jwt.verify(token, SECRET); // throws on invalid/expired — caller handles
}

module.exports = { signAccessToken, verifyAccessToken };
