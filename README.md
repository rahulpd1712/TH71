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

## Backing up the database

Backups use SQLite's online backup API, so they are safe to run **while the server is running** (WAL mode is handled correctly) and always produce a consistent snapshot.

**Run one manually:**

```bash
npm run backup            # or: ./backup.sh on Linux/macOS, backup.bat on Windows
```

A timestamped copy is written to `server/data/backups/ayush-YYYYMMDDHHmmss.db` (overridable with `BACKUP_DIR`), keeping the newest 7 by default (`BACKUP_KEEP`).

**Schedule it:**

- **Linux/macOS (cron)** — run daily at 3 AM (edit with `crontab -e`):
  ```
  0 3 * * * cd /path/to/your/app && /usr/bin/node scripts/backup.js >> backups.log 2>&1
  ```
- **Windows (Task Scheduler)** — create a task that runs daily, action = run `backup.bat`, start in the project folder. (Or a systemd timer instead of cron if you prefer.)

**Important — off-site copies:** a backup on the same disk does not protect against disk failure or (on Render's free plan) instance recycling. Copy backups somewhere separate — download them from the Render dashboard Shell, or add a small job that uploads `server/data/backups/` to Google Drive, S3, etc. The database contains patient records and ABHA IDs, so protect backups accordingly.

**Restore:** stop the server, replace `server/data/ayush.db` with the backup file, delete any `ayush.db-wal` / `ayush.db-shm` files left next to it, then start the server again.

## Going live checklist

- [ ] Set a strong, secret `JWT_SECRET` environment variable — the server **refuses to start** without it when `NODE_ENV=production` (the local-dev fallback only applies in development). Generate one with `openssl rand -hex 32`.
- [ ] Enable a **persistent disk** for `server/data` (Render paid plan, Railway volume, or a VPS).
- [ ] Schedule **backups** (see [Backing up the database](#backing-up-the-database)) and copy them off the server — patient records and ABHA IDs must not be lost.
- [ ] Change or remove the demo accounts, and never commit the database file (`server/data/` is gitignored).
- [ ] Serve over HTTPS (Render provides it automatically; on a VPS use Caddy/Nginx).

## Alternatives to Render

- **Railway.app** (~$5/mo): same one-service Docker deploy, with built-in volumes — best pick when you need persistence without running your own server.
- **Fly.io** (~$2–5/mo): good SQLite + volume support, a bit more manual config.
- **VPS** (DigitalOcean droplet / Hetzner, $4–12/mo): run the Docker image with `docker compose`, PM2, or systemd; full control over backups and HTTPS. Best long-term home for a clinic using real patient data.