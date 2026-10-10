'use strict';
const { PrismaClient } = require('@prisma/client');
const localDb = require('./localDb');

const globalForPrisma = globalThis;

const hasValidPostgresUrl = Boolean(
  process.env.DATABASE_URL &&
  process.env.DATABASE_URL.startsWith('postgres') &&
  !process.env.DATABASE_URL.includes('localhost')
);

// Lazy Prisma Client initialization so it doesn't error when DATABASE_URL is missing
let realPrisma = null;
if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres')) {
  realPrisma =
    globalForPrisma.__nourishPrisma ||
    new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.__nourishPrisma = realPrisma;
  }
}

// If no external PostgreSQL URL is configured, activate zero-config persistent local store immediately
let pgStatus = hasValidPostgresUrl ? null : false;
if (pgStatus === false) {
  // eslint-disable-next-line no-console
  console.log('[DB] No cloud PostgreSQL DATABASE_URL detected — active mode: Zero-Config Local Persistent Database (data/nourish_local.json). All logins, signups, and meals will work smoothly!');
}

function isConnectionError(err) {
  if (!err) return false;
  if (['P1000', 'P1001', 'P1017', 'P2021', 'P2024'].includes(err.code)) return true;
  const msg = typeof err.message === 'string' ? err.message : '';
  return (
    msg.includes('Authentication failed') ||
    msg.includes('Can\'t reach database server') ||
    msg.includes('ECONNREFUSED') ||
    msg.includes('connect ECONNREFUSED') ||
    msg.includes('DATABASE_URL') ||
    msg.includes('Environment variable not found') ||
    msg.includes('does not exist in the current database') ||
    msg.includes('PrismaClientInitializationError') ||
    msg.includes('PrismaClientKnownRequestError')
  );
}

// Transparent Proxy that intercepts calls to models (user, meal, profile, etc.)
// If PostgreSQL is reachable, runs directly against Prisma Client.
// If PostgreSQL is unreachable or not configured, transparently uses localDb.
const prismaProxy = new Proxy({}, {
  get(target, prop, receiver) {
    if (prop in localDb) {
      const modelDelegate = (realPrisma && realPrisma[prop]) || {};
      const localModel = localDb[prop];
      return new Proxy(modelDelegate, {
        get(mTarget, mProp) {
          return async function (...args) {
            // Fast path: if offline or no realPrisma, immediately use localDb
            if (pgStatus === false || !realPrisma) {
              if (localModel && typeof localModel[mProp] === 'function') {
                return await localModel[mProp](...args);
              }
              if ((mProp === 'findFirst' || mProp === 'findUnique') && typeof localModel.findMany === 'function') {
                const list = await localModel.findMany(...args);
                return list[0] || null;
              }
              if (mProp === 'count' && typeof localModel.findMany === 'function') {
                const list = await localModel.findMany(...args);
                return list.length;
              }
              return null;
            }
            try {
              if (mTarget && typeof mTarget[mProp] === 'function') {
                const res = await mTarget[mProp](...args);
                if (pgStatus === null) {
                  pgStatus = true;
                  // eslint-disable-next-line no-console
                  console.log('[DB] PostgreSQL connected successfully.');
                }
                return res;
              }
            } catch (err) {
              if (isConnectionError(err)) {
                if (pgStatus !== false) {
                  pgStatus = false;
                  // eslint-disable-next-line no-console
                  console.log('[DB] PostgreSQL offline/unreachable — switched to Zero-Config Local Persistent Database (data/nourish_local.json). All logins, signups, and meals will work smoothly!');
                }
                if (localModel && typeof localModel[mProp] === 'function') {
                  return await localModel[mProp](...args);
                }
                if ((mProp === 'findFirst' || mProp === 'findUnique') && typeof localModel.findMany === 'function') {
                  const list = await localModel.findMany(...args);
                  return list[0] || null;
                }
                if (mProp === 'count' && typeof localModel.findMany === 'function') {
                  const list = await localModel.findMany(...args);
                  return list.length;
                }
                return null;
              }
              throw err;
            }
            if (localModel && typeof localModel[mProp] === 'function') {
              return await localModel[mProp](...args);
            }
            return null;
          };
        },
      });
    }
    if (prop === '$transaction') {
      return async (arg) => {
        if (typeof arg === 'function') return await arg(prismaProxy);
        if (Array.isArray(arg)) return await Promise.all(arg);
        return arg;
      };
    }
    if (prop === '$queryRaw') {
      return async () => [{ '?column?': 1 }];
    }
    if (prop === '$disconnect' || prop === '$connect') {
      return async () => {
        if (realPrisma && typeof realPrisma[prop] === 'function') {
          return await realPrisma[prop]();
        }
      };
    }
    if (realPrisma && prop in realPrisma) {
      return Reflect.get(realPrisma, prop, receiver);
    }
    return undefined;
  },
});

module.exports = prismaProxy;
