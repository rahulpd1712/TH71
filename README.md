# AYUSH Case-Taking Software

Case-taking software for the Ministry of AYUSH (Government of India), covering all four systems: **Ayurveda, Unani, Siddha, and Homeopathy**. It lets doctors register patients, record detailed case histories per system, assign cases to hospitals/admins, track notifications, and export case records.

## Tech stack

- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS (with i18n support)
- **Backend:** Node.js + Express 5
- **Database:** SQLite (`better-sqlite3`), stored at `server/data/ayush.db`
- **Auth:** JWT + bcrypt

## Demo credentials

Seeded automatically on first start (only when the database is empty):

| Role | Email | Password |
| --- | --- | --- |
| CMO (super admin) | `rahulpd1712@gmail.com` | `RahulAdmin123!` |
| Hospital admin | `admin.neha@ayush.com` | `admin123` |
| Doctor | `dr.priya@ayush.com` | `doctor123` |
| Assistant | `asst.ravi@ayush.com` | `asst123` |

## Run locally

Requires Node.js 20+ (npm included).

```bash
npm install     # first time only
npm run dev     # starts backend (:3001) + frontend (:5173) together
```

Then open http://localhost:5173. On Windows, `start.bat` does the same. For a production-like run: `npm run build && npm start` (server serves the built frontend at http://localhost:3001).

## Deploy to Render (free)

The app is packaged as a single Docker service (frontend build + API + SQLite), so it deploys to any host that runs Docker/Node. **Why not Vercel?** Vercel is serverless — its filesystem is ephemeral and native modules like `better-sqlite3` don't run there, so the SQLite database (your data) would not persist.

### Option A — Blueprint (recommended)

1. Push this repo to GitHub.
2. In the [Render dashboard](https://dashboard.render.com), click **New → Blueprint** and select the repo.
3. Render reads `render.yaml`, builds the Dockerfile, and deploys.
4. Open the service URL — done.

### Option B — Manual

1. In the Render dashboard, click **New → Web Service** and connect the GitHub repo.
2. Choose **Docker** as the runtime (Render auto-detects the `Dockerfile`).
3. Add an environment variable: `JWT_SECRET` → any long random string.
4. Deploy. Render builds and runs it; every `git push` to the repo auto-redeploys.

> **Free plan caveats:** free instances sleep after 15 minutes of inactivity (the first visit takes ~30s to wake up), and the free plan has **no persistent disk** — the database resets to demo data whenever the instance is recycled or the service is redeployed. That's fine for testing/demos. To keep real data, upgrade to a paid plan and add a disk mounted at `/app/server/data` (the `render.yaml` has the block ready to uncomment).

## Going live checklist

- [ ] Set a strong, secret `JWT_SECRET` environment variable (production only — the code falls back to a local-dev secret otherwise).
- [ ] Enable a **persistent disk** for `server/data` (Render paid plan, Railway volume, or a VPS).
- [ ] Set up **backups** of the SQLite file (e.g., a daily scheduled `sqlite3 .backup` or copying `ayush.db` to storage) — patient records and ABHA IDs must not be lost.
- [ ] Change or remove the demo accounts, and never commit the database file (`server/data/` is gitignored).
- [ ] Serve over HTTPS (Render provides it automatically; on a VPS use Caddy/Nginx).

## Alternatives to Render

- **Railway.app** (~$5/mo): same one-service Docker deploy, with built-in volumes — best pick when you need persistence without running your own server.
- **Fly.io** (~$2–5/mo): good SQLite + volume support, a bit more manual config.
- **VPS** (DigitalOcean droplet / Hetzner, $4–12/mo): run the Docker image with `docker compose`, PM2, or systemd; full control over backups and HTTPS. Best long-term home for a clinic using real patient data.