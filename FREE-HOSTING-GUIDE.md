# How to Host Nourish for Free (Complete Step-by-Step Guide)

This guide shows you how to host the **Nourish** full-stack calorie tracker completely free on the internet with personal logins and persistent database storage for every user.

---

## Architecture Overview

```
                      ┌──────────────────────────────────────┐
                      │    User (Mobile or Desktop Browser)  │
                      └──────────────────┬───────────────────┘
                                         │ HTTPS
                                         ▼
                      ┌──────────────────────────────────────┐
                      │        Render.com (Free Web Host)    │
                      │  - Runs Node.js / Express API        │
                      │  - Serves Mobile-Responsive Frontend │
                      │  - Handles Image Uploads             │
                      └──────────────────┬───────────────────┘
                                         │ Secure SSL Connection
                                         ▼
                      ┌──────────────────────────────────────┐
                      │       Neon.tech (Free PostgreSQL)    │
                      │  - Permanent free serverless DB      │
                      │  - Encrypted User Accounts & Data    │
                      │  - Daily Meals, Water & Weights      │
                      └──────────────────────────────────────┘
```

---

## Step 1: Create a Free PostgreSQL Database on Neon (2 Minutes)

1. Go to **[https://neon.tech](https://neon.tech)** and click **Sign Up** (free with Google or GitHub).
2. Click **Create Project**:
   - Project name: `nourish-db`
   - Database name: `nourish` (or default `neondb`)
   - Region: Choose the region closest to you (e.g., US East, Frankfurt, or Singapore).
3. Neon will immediately display your **Connection Details**.
4. Copy the connection string (it looks like this):
   ```
   postgresql://nourish_owner:abcdef123456@ep-cool-fog-123456.us-east-2.aws.neon.tech/nourish?sslmode=require
   ```
   *(Keep this copied — you will paste it into Render in Step 3)*.

---

## Step 2: Push Your Project to GitHub (2 Minutes)

1. Create a free repository on [GitHub](https://github.com) named `nourish-calorie-tracker`.
2. In your terminal / command prompt inside the project folder:
   ```bash
   git init
   git add .
   git commit -m "Complete Nourish with live camera, date switcher & full-stack app"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/nourish-calorie-tracker.git
   git push -u origin main
   ```

---

## Step 3: Deploy Free on Render.com (3 Minutes)

1. Go to **[https://render.com](https://render.com)** and sign up / log in with GitHub.
2. Click the **New +** button at the top right and select **Web Service**.
3. Choose **Build and deploy from a Git repository** and select your `nourish-calorie-tracker` repo.
4. Configure the service settings:
   - **Name**: `nourish` (your app URL will be `https://nourish.onrender.com` or custom name)
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Branch**: `main`
   - **Build Command**:
     ```bash
     npm install && npx prisma db push && npx prisma generate
     ```
     *(Note: `npx prisma db push` automatically creates all required database tables on your Neon database instantly!)*
   - **Start Command**:
     ```bash
     node src/server.js
     ```
   - **Instance Type**: Select **Free**.
5. Scroll down to **Environment Variables** and click **Add Environment Variable**:
   | Key | Value |
   | :--- | :--- |
   | `DATABASE_URL` | *(Paste your Neon connection string from Step 1)* |
   | `JWT_SECRET` | *(Type any random 32+ character string, e.g. `nourish_prod_secret_key_99887711`)* |
   | `NODE_ENV` | `production` |
   | `PORT` | `10000` |
   | `CORS_ORIGIN` | `*` |
   | `ANTHROPIC_API_KEY` | *(Optional: add your Claude API key for live deep image recognition; if omitted, the smart built-in visual estimation engine handles scans seamlessly)* |
6. Click **Deploy Web Service**!

---

## Step 4: Access Your Live Website

1. Render will build and deploy the app in ~2 minutes.
2. Once the status shows **Live**, click the URL at the top (e.g. `https://nourish-xxxx.onrender.com`).
3. You will see the Nourish app running live!
4. **Personal Login**:
   - Anyone visiting the link can click **Create account** to create their own personal login.
   - Every user gets their own private nutrition profile, targets, daily diary, weight history, and meal photo scans.
5. **Mobile Installation (PWA)**:
   - On **iPhone**: Open in Safari, tap the Share icon, and select **Add to Home Screen**.
   - On **Android**: Open in Chrome, tap the 3 dots, and select **Install App** or **Add to Home screen**.
   - It will open fullscreen like a native iOS/Android app!

---

## Features Verified Working

- **Live Camera**: Snaps photos using the device camera or webcam with real-time viewfinder and front/rear camera flip.
- **Client-Side Image Optimization**: High-resolution smartphone photos (HEIC/JPEG) are automatically compressed before upload, preventing timeouts.
- **Date Navigation**: Easily switch days on the dashboard (`<`, `>`, or 📅 calendar date picker) with automatic midnight rollover.
- **Personal Auth**: Secure user registration, password hashing (bcrypt), and JWT sessions.
- **Persistent Cloud Database**: All entries are stored safely in your free Neon PostgreSQL database.
