# Nourish backend

Real Node.js/Express + PostgreSQL (via Prisma) API for the Nourish nutrition
tracker, implementing the architecture described in `ARCHITECTURE.md` from
the frontend project: auth, profiles/goals, foods, meal logging, recipes,
weight/water, favorites, AI (Claude-powered recognition/OCR/voice/recommendations/analysis/assistant),
analytics, notifications, and email/report generation.

This was written and syntax-checked (`node --check` on every file) but has
**not been run against a live database** — the environment that generated it
has no network access to `npm install` or connect to Postgres. Treat it as a
complete, careful first draft to run, debug, and iterate on — Claude Code is
a great place to do that (it can install packages, run Postgres, and hit
real endpoints).

## 1. Prerequisites

- Node.js 18+
- A PostgreSQL database (local install, Docker, or a hosted one like Neon/Supabase/RDS)
- An Anthropic API key (optional at first — the server runs without one; AI
  routes just return `503 ai_not_configured` until it's set)

## 2. Setup

### Option A — Docker (fastest, no local Postgres install needed)

```bash
cd nourish-backend
cp .env.example .env        # fill in ANTHROPIC_API_KEY if you want AI features
docker compose up           # starts Postgres + the API, runs migrations, seeds demo data
```

API is up at `http://localhost:4000` once you see `Nourish API listening on :4000`.

### Option B — Local Node + your own Postgres

```bash
cd nourish-backend
npm install
cp .env.example .env
# edit .env: set DATABASE_URL at minimum, ANTHROPIC_API_KEY to enable AI

npx prisma migrate dev --name init   # creates all tables from prisma/schema.prisma
npm run seed                          # loads ~100 reference foods + a demo user
npm run dev                           # starts on http://localhost:4000
```

Demo login after seeding: `demo@nourish.app` / `demo12345`.

Quick check:
```bash
curl http://localhost:4000/health
curl -X POST http://localhost:4000/api/auth/login -H "Content-Type: application/json" \
  -d '{"email":"demo@nourish.app","password":"demo12345"}'
```

## 3. Project layout

```
prisma/schema.prisma      full relational schema (see ARCHITECTURE.md for the ER-style version)
prisma/seed.js            reference foods + demo user
src/app.js                Express app: security middleware, route mounting
src/server.js             process entrypoint, starts the report scheduler
src/lib/                  prisma client, JWT, password hashing
src/middleware/           auth, validation (Zod), rate limiting, error handling
src/utils/                date + macro/unit-conversion math (pure functions, unit-tested)
src/services/
  nutritionProvider.js     the ONE place food nutrition is looked up — swap for a
                            licensed API by adding a second implementation here
  ai/                       one file per AI feature, all calling anthropicClient.js
  analyticsService.js       day/week aggregate queries (dashboard + analytics screens read from this)
  notificationService.js    in-app notifications + pluggable push provider
  emailService.js           pluggable email provider (console/dev vs SMTP)
  reportService.js          renders the daily/weekly report HTML used by both downloads and email
  storageProvider.js        pluggable image storage (local disk dev vs S3)
src/routes/                one file per resource, thin — validation + service calls
src/jobs/reportScheduler.js  node-cron job: fires reminders/reports on each user's configured time
tests/                     macroUtils.test.js needs nothing; the other two need a real test DB
```

## 4. API reference

`docs/openapi.yaml` documents every endpoint (request/response shapes, auth,
error responses). Drop it into [Swagger Editor](https://editor.swagger.io),
Postman ("Import" → file), or Insomnia to get an interactive, testable
reference instead of reading route files.

## 5. Running tests

```bash
npm test
```

`tests/macroUtils.test.js` is a pure unit test suite and always runs.
`tests/auth.test.js` and `tests/meals.authorization.test.js` are real
integration tests against Postgres via Prisma — point `TEST_DATABASE_URL` (or
just `DATABASE_URL`) at a **disposable** database before running them; they
create and delete real rows.

## 6. What's a genuine implementation vs. what to swap in for production

| Area | What's here | Production swap |
|---|---|---|
| Nutrition data | `~100` seeded reference foods | Add a second `NutritionProvider` implementation calling USDA/Edamam/Nutritionix |
| Images | Saved to `./uploads`, served statically | `storageProvider.js` → S3/CloudFront implementation (stub included) |
| Email | Logs to console | `emailService.js` → set `EMAIL_PROVIDER=smtp` + SMTP creds, or swap in SES |
| Push | Logs to console | `notificationService.js` → add an `FcmPushProvider` (stub included), register real device tokens via `POST /api/notifications/devices` |
| Reminders/reports | `node-cron`, checks every 5 min | Fine for a single instance; move to a real job queue (BullMQ, etc.) if you scale past one process |
| AI | Real `@anthropic-ai/sdk` calls, all six services | Nothing to swap — just set `ANTHROPIC_API_KEY` |

## 7. Security notes

- Every route (except `/health`, `/api/auth/register`, `/api/auth/login`) requires `Authorization: Bearer <JWT>`.
- Every query is scoped to `req.userId` from the verified token — never a client-supplied id.
- Passwords are bcrypt-hashed (`BCRYPT_SALT_ROUNDS`, default 12).
- `helmet`, CORS allowlist, and per-route Zod validation are applied globally.
- AI endpoints are rate-limited per user (`AI_RATE_LIMIT_PER_HOUR`); auth endpoints per IP (`AUTH_RATE_LIMIT_PER_15MIN`).
- Meal nutrition for catalog foods (`foodId` present) is **recomputed server-side**, never trusted from the client — only AI-estimated/freeform items accept client-supplied macros.

## 8. Deploying

Any Node host works (Fly.io, Render, Railway, ECS, etc.). Typical steps:
`npm ci --production` → `npx prisma migrate deploy` → `npm start`, with
`DATABASE_URL` pointing at managed Postgres and the rest of `.env` filled in
for real. Point the Nourish frontend's API base URL at this server's `/api`.
