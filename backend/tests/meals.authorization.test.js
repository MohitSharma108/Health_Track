'use strict';
const request = require('supertest');
const { createApp } = require('../src/app');
const prisma = require('../src/lib/prisma');

const app = createApp();
const userAEmail = `user-a-${Date.now()}@example.com`;
const userBEmail = `user-b-${Date.now()}@example.com`;
let tokenA, tokenB, mealAId;

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { in: [userAEmail, userBEmail] } } });
  await prisma.$disconnect();
});

beforeAll(async () => {
  const a = await request(app).post('/api/auth/register').send({ email: userAEmail, password: 'longenough123', name: 'User A' });
  const b = await request(app).post('/api/auth/register').send({ email: userBEmail, password: 'longenough123', name: 'User B' });
  tokenA = a.body.token;
  tokenB = b.body.token;

  await request(app).put('/api/profile/goals').set('Authorization', `Bearer ${tokenA}`).send({ calories: 2000, proteinG: 100, carbsG: 220, fatG: 65, fibreG: 30 });

  const meal = await request(app)
    .post('/api/meals')
    .set('Authorization', `Bearer ${tokenA}`)
    .send({
      date: '2026-01-01',
      mealType: 'Breakfast',
      source: 'manual',
      items: [{ name: 'Test oats', qty: 40, unit: 'g', calories: 155, proteinG: 6.8, carbsG: 26.4, fatG: 2.8, fibreG: 4.2, source: 'manual' }],
    });
  mealAId = meal.body.meal.id;
});

describe('meal authorization', () => {
  it("user B cannot read user A's meal", async () => {
    const res = await request(app).get(`/api/meals/${mealAId}`).set('Authorization', `Bearer ${tokenB}`);
    expect(res.status).toBe(404); // not 403 — existence isn't leaked either
  });

  it("user B cannot delete user A's meal", async () => {
    const res = await request(app).delete(`/api/meals/${mealAId}`).set('Authorization', `Bearer ${tokenB}`);
    expect(res.status).toBe(404);
  });

  it('user A can read their own meal', async () => {
    const res = await request(app).get(`/api/meals/${mealAId}`).set('Authorization', `Bearer ${tokenA}`);
    expect(res.status).toBe(200);
    expect(res.body.meal.id).toBe(mealAId);
  });

  it('rejects a meal item with no foodId and no supplied macros', async () => {
    const res = await request(app)
      .post('/api/meals')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ date: '2026-01-01', mealType: 'Lunch', source: 'manual', items: [{ name: 'Mystery food', qty: 1, unit: 'serving', source: 'manual' }] });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('invalid_item');
  });
});
