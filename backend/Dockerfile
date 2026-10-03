# Nourish backend — production image. docker-compose.yml uses this and runs
# migrate + seed + start; `npm run dev` (nodemon) is for running directly on
# the host against docker-compose's `postgres` service during development.
FROM node:20-slim AS base
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --omit=dev

COPY prisma ./prisma
RUN npx prisma generate

COPY src ./src

ENV NODE_ENV=production
EXPOSE 4000

# Apply migrations then start — safe to run on every boot (no-op if already applied).
CMD ["sh", "-c", "npx prisma migrate deploy && node src/server.js"]
