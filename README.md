# QR Code Tracker

Generate QR codes that redirect to your Instagram profile, with scan analytics
(count, device, browser, OS, timestamp) per QR code and combined across all of them.

Every QR code encodes a link to this app (`/r/:code`), not Instagram directly. When
scanned, the app logs the visit and then redirects the visitor to your Instagram URL.

## Stack

- Node.js + Express, server-rendered EJS views, Chart.js via CDN (no build step)
- Postgres (designed for [Neon](https://neon.tech)'s free tier)
- Deploy target: [Render](https://render.com) free Web Service

## Local development

1. Install dependencies:
   ```
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in:
   - `DATABASE_URL` — your Postgres connection string (e.g. from Neon)
   - `ADMIN_PASSWORD` — the password you'll use to log into the dashboard
   - `SESSION_SECRET` — any long random string
   - `BASE_URL` — `http://localhost:3000` for local dev
3. Create the database tables (safe to re-run, it's idempotent):
   ```
   npm run migrate
   ```
4. Start the app:
   ```
   npm start
   ```
5. Open `http://localhost:3000/login` and log in with `ADMIN_PASSWORD`.

## Using it

- **Create a QR code:** Dashboard → "New QR Code" → give it a label and your
  Instagram URL. You'll get a QR image you can download/print and a redirect link.
- **View analytics:** the "Dashboard" page shows combined stats across all QR
  codes (scans over time, device/OS/browser breakdown, per-code leaderboard).
  Click into any QR code from the "QR Codes" list to see its own isolated stats.
- **Retire a QR code:** open its detail page and click "Deactivate" — this stops
  it from redirecting (visitors get a not-found page) but keeps its scan history.

## Deploying for free (Render + Neon)

1. **Database:** create a free project at neon.tech, copy its connection string.
2. **Code:** push this project to a GitHub repo.
3. **Render:** create a new free "Web Service" from that repo.
   - Build command: `npm install`
   - Start command: `npm start`
   - Environment variables: `DATABASE_URL` (from Neon), `ADMIN_PASSWORD`,
     `SESSION_SECRET`, and `BASE_URL` set to the `https://<your-app>.onrender.com`
     URL Render gives you (needed so QR codes encode the right public link).
4. Once deployed, run the migration once against the production database
   (from your machine, with `DATABASE_URL` in `.env` pointed at Neon):
   ```
   npm run migrate
   ```
5. Visit `https://<your-app>.onrender.com/login` and create your first QR code.

### Keeping it fast (optional but recommended)

Render's free tier spins the app down after 15 minutes without traffic, so the
first scan after a quiet period can take up to ~60 seconds to redirect. To avoid
that, register `https://<your-app>.onrender.com/healthz` with a free pinger like
[cron-job.org](https://cron-job.org) to hit it every ~10 minutes.

## Project layout

```
src/
  app.js, server.js        Express app setup + entry point
  db/                       schema.sql, connection pool, migration runner
  routes/                   redirect (/r/:code), auth, admin, analytics API
  middleware/requireAuth.js
  services/                 QR generation, user-agent parsing, stats queries
  views/                    EJS templates for the dashboard
public/                     CSS + client-side chart rendering
```
