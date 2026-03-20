# Wiser Traffic Analyzer v2

A full-stack GA4 traffic analytics dashboard with OAuth2 "Sign in with Google".
**No service accounts. No JSON keys. Just click and sign in.**

---

## Deploy in 10 minutes — 3 options

### Option A: Railway (Recommended — easiest)

1. Push this folder to a GitHub repo
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub repo
3. Select your repo → Railway auto-detects the config
4. Go to Variables tab, add:
   ```
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   SESSION_SECRET=<random 32+ char string>
   APP_URL=https://your-app.railway.app
   ```
5. Deploy. Done. Visit your URL.

**Railway gives you a free URL like `https://wiser-traffic-abc123.railway.app`**

---

### Option B: Render (Also free)

1. Push to GitHub
2. Go to [render.com](https://render.com) → New → Web Service → Connect repo
3. Build Command: `npm run setup`
4. Start Command: `npm start`
5. Add environment variables (same as above)
6. Deploy

---

### Option C: Local development

```bash
git clone <your-repo>
cd wiser-traffic-v2
cp .env.example .env
# Edit .env with your credentials
npm run setup   # installs everything + builds React
npm start       # runs on http://localhost:3001
```

---

## Google OAuth2 Setup (one-time, 5 minutes)

### Step 1 — Create OAuth credentials

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Select/create a project (use your "wiser admin Amit" project)
3. Go to **APIs & Services → Library**
4. Enable: **Google Analytics Data API** (used for dashboard reports)
5. Enable: **Google Analytics Admin API** (used to list GA4 properties after sign-in)
6. Enable: **Google Search Console API** (for SEO tab)

### Step 2 — Create OAuth 2.0 Client ID

1. Go to **APIs & Services → Credentials**
2. Click **+ Create Credentials → OAuth 2.0 Client ID**
3. Application type: **Web application**
4. Name: `Wiser Traffic Analyzer`
5. Authorized JavaScript origins: `https://your-deployed-url.com`
6. Authorized redirect URIs: `https://your-deployed-url.com/api/auth/callback`
   - For local: also add `http://localhost:3001/api/auth/callback`
7. Click **Create** → copy the **Client ID** and **Client Secret**

### Step 3 — Configure OAuth consent screen

1. Go to **APIs & Services → OAuth consent screen**
2. User type: **Internal** (fastest — only your Google Workspace users)
   - OR External → add your email as test user
3. App name: `Wiser Traffic`
4. Add scopes: analytics.readonly, webmasters.readonly, userinfo.email, userinfo.profile

### Step 4 — Add env vars to your deploy

```env
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...
SESSION_SECRET=generate_with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
APP_URL=https://your-deployed-url.com
```

---

## How it works

1. User visits the app → clicks "Sign in with Google"
2. Google OAuth2 flow → user grants Analytics + Search Console read access
3. App lists their GA4 properties through the Analytics Admin API, or the user enters a GA4 property ID manually
4. Dashboard loads real data via GA4 Data API + Search Console API
5. Session stored server-side (12h expiry)

---

## Features

| Section | Data |
|---|---|
| Overview | Sessions, users, bounce rate, engagement, trend chart, channel breakdown |
| AI Traffic | ChatGPT, Perplexity, Claude, Gemini, Copilot sessions + quality comparison |
| Social Media | Platform breakdown with share %, bounce, duration, conversions |
| Referrals | All referring domains, searchable, with conversion rates |
| Return Visitors | New vs returning split, engagement comparison |
| Shopify App Store | Traffic from apps.shopify.com, landing pages |
| Conversions | Goal completions by channel, conversion rate bars |
| SEO Rankings | Keywords, pages, countries from Search Console |

---

## Project structure

```
wiser-traffic-v2/
├── server/
│   ├── index.js              ← Express server
│   ├── routes/api.js         ← All API endpoints
│   └── services/ga4.js       ← GA4 + Search Console queries
├── client/
│   └── src/
│       ├── App.js            ← Router + auth + layout
│       ├── api.js            ← Axios client
│       ├── components/Shared.js  ← Reusable components + hooks
│       └── pages/
│           ├── Connect.js    ← OAuth2 login + property selector
│           └── Pages.js      ← All 8 dashboard pages
├── .env.example
├── railway.toml              ← Railway deploy config
├── render.yaml               ← Render deploy config
└── Procfile                  ← Heroku deploy config
```
