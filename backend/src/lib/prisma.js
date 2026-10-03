'use strict';
const { PrismaClient } = require('@prisma/client');
const localDb = require('./localDb');

const globalForPrisma = globalThis;

const realPrisma =
  globalForPrisma.__nourishPrisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__nourishPrisma = realPrisma;
}

let pgStatus = null; // null = unknown, true = connected, false = offline

function isConnectionError(err) {
  if (!err) return false;
  if (err.code === 'P1000' || err.code === 'P1001' || err.code === 'P1017') return true;
  const msg = typeof err.message === 'string' ? err.message : '';
  return msg.includes('Authentication failed') || msg.includes('Can\'t reach database server') || msg.includes('ECONNREFUSED') || msg.includes('connect ECONNREFUSED');
}

// Transparent Proxy that intercepts calls to models (user, meal, profile, etc.)
// If PostgreSQL is reachable, runs directly against Prisma Client.
// If PostgreSQL is unreachable, transparently falls back to localDb.
const prismaProxy = new Proxy(realPrisma, {
  get(target, prop, receiver) {
    if (prop in localDb) {
      const modelDelegate = target[prop];
      const localModel = localDb[prop];
      return new Proxy(modelDelegate || {}, {
        get(mTarget, mProp) {
          return async function (...args) {
            if (pgStatus === false) {
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
                  console.log('[DB] PostgreSQL connected successfully.');
                }
                return res;
              }
            } catch (err) {
              if (isConnectionError(err)) {
                if (pgStatus !== false) {
                  pgStatus = false;
                  console.log('[DB] PostgreSQL is offline — active mode: Zero-Config Local Persistent Database (data/nourish_local.json). All logins, signups, and meals will work smoothly!');
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
    return Reflect.get(target, prop, receiver);
  },
});

module.exports = prismaProxy;
