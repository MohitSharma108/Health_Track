'use strict';
const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET;
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

if (!SECRET && process.env.NODE_ENV !== 'test') {
  // Fail loudly at startup rather than silently signing tokens with `undefined`.
  // eslint-disable-next-line no-console
  console.error('FATAL: JWT_SECRET is not set. Copy .env.example to .env and set it.');
  process.exit(1);
}

function signAccessToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, SECRET, { expiresIn: EXPIRES_IN });
}

function verifyAccessToken(token) {
  return jwt.verify(token, SECRET); // throws on invalid/expired — caller handles
}

module.exports = { signAccessToken, verifyAccessToken };
