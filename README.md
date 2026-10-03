# Nourish — complete source (backend + frontend)

## Contents
- `backend/` — Node.js/Express + PostgreSQL (Prisma) API. See `backend/README.md`.
- `frontend/nourish-hosted.html` — runs inside claude.ai only (uses Claude's built-in db/AI/storage). Open via the published artifact link, not as a raw file.
- `frontend/nourish-selfhosted.html` — runs standalone against the backend above. Open this file directly in any browser once the backend is running.
- `nourish-architecture.md` — schema and service-layer design notes.

## Fastest path to running it yourself

```bash
cd backend
cp .env.example .env      # add ANTHROPIC_API_KEY to enable AI features
docker compose up         # starts Postgres + API, runs migrations, seeds demo data
```

Then open `frontend/nourish-selfhosted.html` in a browser. It defaults to
`http://localhost:4000/api` — edit the `API_BASE` constant near the top of
its `<script>` block if your backend is elsewhere.

Demo login after seeding: `demo@nourish.app` / `demo12345`.

## Status
Both frontend builds and the backend were written and syntax-checked
(`node --check` on every backend file; template-literal-aware JS extraction
+ syntax check on both HTML files) but not executed — this environment has
no network access to install packages or run a live server. First real run
belongs in an environment that can (e.g. Claude Code, or your own machine).
