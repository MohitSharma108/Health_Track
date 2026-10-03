'use strict';
// Loaded by Jest before any test file. Real integration tests (auth.test.js,
// meals.authorization.test.js) need a real Postgres reachable at
// TEST_DATABASE_URL (a disposable database — they create and delete rows).
// Pure unit tests (macroUtils.test.js) need none of this and always run.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-do-not-use-in-production';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
process.env.BCRYPT_SALT_ROUNDS = '4'; // faster hashing in tests
