'use strict';
const request = require('supertest');
const { createApp } = require('../src/app');
const prisma = require('../src/lib/prisma');

const app = createApp();
const testEmail = `test-${Date.now()}@example.com`;

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: testEmail } });
  await prisma.$disconnect();
});

describe('POST /api/auth/register', () => {
  it('rejects a password shorter than 8 characters', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: testEmail, password: 'short', name: 'Test' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('invalid_request');
  });

  it('creates an account and returns a usable token', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: testEmail, password: 'longenough123', name: 'Test User' });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeTruthy();

    const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${res.body.token}`);
    expect(me.status).toBe(200);
    expect(me.body.email).toBe(testEmail);
  });

  it('rejects a duplicate email', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: testEmail, password: 'longenough123', name: 'Test User' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('email_in_use');
  });
});

describe('POST /api/auth/login', () => {
  it('rejects a wrong password with a generic message (no user enumeration)', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: testEmail, password: 'wrong-password' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('invalid_credentials');
  });

  it('logs in with the correct password', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: testEmail, password: 'longenough123' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
  });
});

describe('protected routes without a token', () => {
  it('returns 401 for /api/profile', async () => {
    const res = await request(app).get('/api/profile');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('unauthenticated');
  });
});
