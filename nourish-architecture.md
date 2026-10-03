# Nourish — Architecture & Implementation Notes

Nourish is built and running (open the app artifact above). This note explains how it's put together, what's genuinely functional right now versus what would need a deployed backend, and the schema/service design behind it — so it can be extended or rebuilt in Claude Code with the full production stack.

## What's real in the running app

Everything below is live, backed by your own data, not mocked or hard-coded:

- **Persistence** — a real per-account document store (`db`). Profile, goals, every meal, weight log, recipe, favourite, custom food, and notification is written and read from it, and survives reloads.
- **AI food photo recognition, nutrition-label OCR, voice-log parsing, "what should I eat now," the AI meal planner, daily analysis, weekly insights, and the chat assistant** all make genuine Claude calls (the `sample` capability) — nothing is scripted or pre-written. The assistant is instructed to answer only from the app-data JSON it's given, never inventing meals.
- **Photos** you scan are uploaded to real per-artifact storage (`assets`) and attached to the meal record.
- **Reports and CSV/JSON export** are generated from your actual stored meals/weights and offered as real downloadable files (`downloads`).
- **Nutrition math** (unit conversion, macro roll-ups, targets via Mifflin-St Jeor) runs from a `NutritionProvider`-style embedded reference database of ~100 common foods (`FOOD_DB` in the code) — swappable later for a licensed API (USDA FoodData Central, Edamam, Nutritionix) behind the same interface.

## What needs a deployed backend to be fully real

Two things in the original spec can't be done from a browser-only artifact, and the app is honest about this in Settings rather than faking them:

1. **Push notifications that arrive when the app is closed.** The in-app Notification Center is real and db-backed; a best-effort browser `Notification` also fires while the tab is open. True background push needs a server + FCM/APNs registration.
2. **Automatic outbound email reports.** There's no SMTP/email-provider access from a client page. The same report your dashboard would email is instead generated on demand and offered as a downloadable HTML file (Reports → Download), which you can forward yourself. Email preferences are still saved so a backend can pick them up later.

## Recommended production architecture (if taken further, e.g. in Claude Code)

```
Frontend (React/Next.js, mobile-first)
   ↓
API layer (REST, versioned, input-validated)
   ↓
Business logic (per-domain services)
   ↓
AI services (behind interfaces, provider-swappable)
   ↓
Nutrition services (NutritionProvider: internal DB ⟂ external API ⟂ custom foods)
   ↓
PostgreSQL  +  Object storage (S3) for images
   ↓
Notification service (FCM/APNs) · Email service (SES/SendGrid) · Job scheduler (cron/queue)
```

### Database schema (relational — maps directly onto the current db-document model)

```
users(id, email, password_hash, created_at, deleted_at)
user_profiles(user_id, name, age, gender, height_cm, weight_kg, activity_level, goal,
              diet, allergies[], dislikes, restrictions, budget, cuisine, meals_per_day, units)
nutrition_goals(user_id, calories, protein_g, carbs_g, fat_g, fibre_g, micronutrients jsonb, updated_at)
foods(id, name, category, is_custom, is_product, owner_user_id)
food_nutrients(food_id, per_100g jsonb)         -- calories/protein/carbs/fat/fibre/sugar/sat_fat/sodium
food_servings(food_id, qty, unit, grams, label)
meals(id, user_id, date, time, meal_type, source, note, image_asset_id, created_at, deleted_at)
meal_items(id, meal_id, food_id nullable, name, qty, unit, macros jsonb, source, confidence)
ai_food_predictions(id, meal_id, raw_model_output jsonb, confidence, created_at)
recipes(id, user_id, name, servings, created_at)
recipe_ingredients(recipe_id, food_id, qty, unit)
custom_foods(id, user_id, name, per_100g jsonb, serving jsonb, is_product)
saved_meals / favorites(id, user_id, type[food|meal|recipe|product], ref_id, snapshot jsonb)
weight_logs(id, user_id, date, weight_kg, note)
water_logs(id, user_id, date, amount_ml)
daily_summaries(user_id, date, totals jsonb)      -- materialized cache; source of truth is meal_items
weekly_summaries(user_id, week_start, totals jsonb, insights jsonb)
notifications(id, user_id, type, title, body, read, created_at)
notification_preferences(user_id, type, enabled, time)
email_reports(id, user_id, date, sent_at, status)
user_devices(id, user_id, push_token, platform)
ai_recommendations(id, user_id, kind, request_ctx jsonb, response jsonb, created_at)
```

Indexes on `(user_id, date)` for meals/weight/water; foreign keys with `ON DELETE CASCADE` scoped to `user_id`; soft-delete (`deleted_at`) on meals and accounts; audit timestamps everywhere.

### AI service layer (already modular in the current code, same shape production-side)

`FoodRecognitionService` · `OCRService` · `VoiceParsingService` · `RecommendationService` · `AnalysisService` · `AssistantService` — each takes structured context and returns structured JSON, is called only on an explicit user action, and never invents data outside what it's given. Every prompt carries the same non-diagnostic, estimate-not-fact medical guardrail. Swapping the underlying model or adding a second vision provider means changing one function per service, not the UI.

### Notification/report/email architecture

A scheduler (cron or a queue worker) reads `notification_preferences` per user, computes `daily_summaries` at each user's configured `report_time`, writes a `notifications` row, pushes via FCM/APNs to `user_devices`, and — if `email_reports` is on — renders the same report template used for on-demand download and sends it via SES/SendGrid, logging to `email_reports`. This is a direct extension of `ReportService`/`NotificationService` already in the app; the download-based report in Settings uses the exact same template so the two stay in sync.

### Security & privacy (production checklist)

Hashed passwords + JWT/session auth · per-request authorization scoped to `user_id` · input validation on every endpoint · rate limiting on AI/image endpoints · signed, expiring URLs for stored images · file-type and size validation on upload · secrets in environment variables only · account/data deletion endpoints wired to cascade deletes (mirrors the "Delete all my data" control already in Settings).

---
*Nourish estimates nutrition from photos, labels, and a reference database. It is not a medical device and does not diagnose conditions.*
