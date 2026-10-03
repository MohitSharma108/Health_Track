'use strict';

/** Thrown deliberately by route/service code for a specific HTTP outcome. */
class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/** Wrap an async route handler so rejected promises reach the error handler
 * instead of crashing the process or hanging the request. */
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

function notFoundHandler(req, res) {
  res.status(404).json({ error: { code: 'not_found', message: `No route for ${req.method} ${req.path}` } });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details } });
  }
  // Prisma "record not found" style errors
  if (err && err.code === 'P2025') {
    return res.status(404).json({ error: { code: 'not_found', message: 'Record not found.' } });
  }
  if (err && err.code === 'P2002') {
    return res.status(409).json({ error: { code: 'conflict', message: 'That value is already in use.', details: err.meta } });
  }
  // Prisma connection & authentication issues
  if ((err && (err.code === 'P1000' || err.code === 'P1001')) || (err && typeof err.message === 'string' && err.message.includes('Authentication failed against database server'))) {
    return res.status(503).json({
      error: {
        code: 'db_unavailable',
        message: 'Database server is unreachable or credentials need updating. Check DATABASE_URL in .env (or follow FREE-HOSTING-GUIDE.md to connect a free Neon PostgreSQL cloud database). You can continue tracking in 7-Day Guest Mode!',
      },
    });
  }
  // eslint-disable-next-line no-console
  console.error('Unhandled error:', err);
  const status = err.status || 500;
  res.status(status).json({
    error: {
      code: 'internal_error',
      message: process.env.NODE_ENV === 'production' ? 'Something went wrong.' : String(err.message || err),
    },
  });
}

module.exports = { ApiError, asyncHandler, notFoundHandler, errorHandler };
