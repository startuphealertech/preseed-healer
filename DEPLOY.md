# Deploying preseedhealer.com

Two processes run in production:

| Process | Port | What it does |
|---|---|---|
| `apps/web` (Next.js) | 3100 | Public site + `/admin`. Proxies `/api/v1/*` to the API. |
| `apps/api` (Express) | 4000 | REST API, MongoDB, uploads, emails. Keep it **private** (localhost or private network). |

Browsers only talk to the web app, so admin cookies stay first-party and no CORS setup is needed.

## 1. Prerequisites

- Node.js 22.9+ (`node -v`)
- MongoDB 7+: MongoDB Atlas (recommended) or self-hosted
- A server (VPS) with Nginx, **or** any Node host for the two processes
- SMTP credentials for transactional email (Zoho, SES, Brevo, Gmail Workspace, …)

## 2. Environment variables

### `apps/api/.env`

| Variable | Production value |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | `4000` |
| `MONGODB_URI` | your Atlas connection string, database `preseedhealer` |
| `TRUST_PROXY` | `1`. Next forwards `X-Forwarded-For` unchanged, so the API sees the value Nginx set. Nginx must **overwrite** it (`$remote_addr`, as in `deploy/nginx.conf`), or clients could spoof IPs to dodge rate limits. On Vercel, the platform sets it correctly. |
| `WEB_URL` | `http://127.0.0.1:3100` (where the API can reach Next for cache refresh) |
| `REVALIDATE_SECRET` | long random string (**same** as the web app's) |
| `JWT_SECRET` | 48+ random chars: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `UPLOAD_DIR` | absolute path on a persistent disk, e.g. `/var/lib/preseedhealer/uploads` |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | your mail provider |
| `MAIL_FROM` | `PreSeedHealer <no-reply@preseedhealer.com>` (verify the domain with your provider: SPF/DKIM) |
| `NOTIFY_EMAILS` | team inboxes for new submissions, comma-separated |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | first admin login (change the password after first sign-in) |

### `apps/web/.env.local` (or `.env.production`)

| Variable | Production value |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://preseedhealer.com` |
| `API_URL` | `http://127.0.0.1:4000/api/v1` |
| `REVALIDATE_SECRET` | same as the API |
| `NEXT_PUBLIC_GA_ID` | optional GA4 ID (`G-XXXX`); loads only after cookie consent |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | optional Search Console token |

> `NEXT_PUBLIC_*` and `API_URL` are read at **build time**. Rebuild the web app after changing them.

## 3. Build & first run (VPS)

```bash
git clone <your repo> /var/www/preseedhealer && cd /var/www/preseedhealer
npm ci
# create apps/api/.env and apps/web/.env.local as above
npm run build -w @preseedhealer/api
npm run seed:prod -w @preseedhealer/api    # admin, starter content, legal templates, indexes
# Start the API before building the web app so pages prerender with real content:
pm2 start ecosystem.config.cjs --only preseedhealer-api
npm run build -w @preseedhealer/web
pm2 start ecosystem.config.cjs --only preseedhealer-web
pm2 save && pm2 startup
```

Nginx: copy `deploy/nginx.conf` to `/etc/nginx/sites-available/preseedhealer`, enable it, run certbot, then `sudo nginx -t && sudo systemctl reload nginx`.

### Updating

```bash
git pull && npm ci
npm run build -w @preseedhealer/api && pm2 restart preseedhealer-api
npm run build -w @preseedhealer/web && pm2 restart preseedhealer-web
```

## 4. Alternative: managed hosting

- **Web on Vercel**: root `apps/web`, set the web env vars. `API_URL` must then be the API's public HTTPS URL.
- **API on Render (Docker, recommended)**: `render.yaml` at the repo root is a Blueprint that builds `apps/api/Dockerfile` (context = repo root), mounts a persistent disk at `/var/data` for uploads and health-checks `/api/v1/health`. Render → New → Blueprint → this repo, then fill in the `sync: false` env vars. After the first deploy, run `node dist/seed.js` once from the Render Shell. Local build: `docker build -f apps/api/Dockerfile -t preseedhealer-api .`
- **API on Render/Railway (native Node)**: root `apps/api`, build `npm install --include=dev && npm run build` (`--include=dev` is required when `NODE_ENV=production`, or `tsup` is missing), build `npm run build`, start `npm start`, add a **persistent disk** for `UPLOAD_DIR` (or uploads are lost on redeploy), and set `WEB_URL` to the public site URL.

## 5. Go-live checklist

- [ ] Replace the **sample partners** (admin → Partners) with real, consented entries
- [ ] Review all **legal pages** with counsel and fill in the Grievance Officer details
- [ ] Admin → Settings: contact email/phone, social links, phase labels
- [ ] Change the seeded admin password (admin → Account)
- [ ] Send a test application and confirm both emails arrive (not in spam)
- [ ] Submit `https://preseedhealer.com/sitemap.xml` in Google Search Console
- [ ] Back up MongoDB (Atlas backups or `mongodump` cron) and the uploads directory
