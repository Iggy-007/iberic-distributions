# Deploy Iberic Distributions on Coolify (Hostinger VPS)

Staging guide for **Coolify self-hosted** on Hostinger VPS.

| Item | Your value |
|------|------------|
| VPS IP | `187.77.169.161` |
| Coolify panel | `http://187.77.169.161:8000` |
| GitHub repo | `https://github.com/Iggy-007/iberic-distributions` |
| App port | `3000` |

---

## Phase A — Push deploy code to GitHub

On your PC:

```powershell
cd c:\src\Iberic_distribution
git remote add origin https://github.com/Iggy-007/iberic-distributions.git
git add -A
git commit -m "Add Coolify Docker deploy and PostgreSQL support"
git push -u origin main
```

If `origin` already exists:

```powershell
git remote set-url origin https://github.com/Iggy-007/iberic-distributions.git
git push -u origin main
```

---

## Phase B — Create PostgreSQL in Coolify

1. Coolify → **+ New Resource** → **Database** → **PostgreSQL**
2. Name: `iberic-db-staging`
3. Server: **localhost**
4. Deploy / Start
5. Wait until **Running**
6. Open the database → copy **Postgres URL (internal)**  
   - Use the **internal** URL for the app (not public)
   - Save in your password manager — do not share in chat

---

## Phase C — Create the application

1. Coolify → **Projects** → **My first project** → **+ New Resource** → **Application**
2. Source: **GitHub** → repo `iberic-distributions` → branch `main`
3. Build pack: **Dockerfile**
4. Name: `iberic-staging`
5. **Port**: `3000`
6. Server: **localhost**

### Persistent volume (catalog uploads)

1. App → **Configuration** → **Persistent Storage**
2. **+ Add** → **Volume Mount**
3. **Destination path**: `/app/public/uploads`
4. Save → **Redeploy**

Acepta PDF, JPG y PNG (ficha/etiqueta) y PDF (folleto). Sin este volumen, los archivos subidos desaparecen al redeployar.

### Domain + HTTPS (when DNS is ready)

1. App → **Domains**
2. Add: `demo.yourdomain.com` (your real subdomain)
3. Enable **HTTPS** / Let's Encrypt
4. If DNS is not ready yet, Coolify may also give a `*.sslip.io` test URL

---

## Phase D — Environment variables

App → **Environment Variables**:

| Key | Value |
|-----|--------|
| `NODE_ENV` | `production` |
| `NEXTAUTH_URL` | `https://demo.yourdomain.com` (exact public URL, no trailing slash) |
| `APP_URL` | Same as public URL (optional; use if `NEXTAUTH_URL` still points at a Coolify `sslip.io` test URL) |
| `NEXTAUTH_SECRET` | Long random string (generate on PC, paste only here) |
| `DATABASE_URL` | Internal Postgres URL from Phase B |
| `RESEND_API_KEY` | Optional — leave empty to skip emails |
| `EMAIL_FROM` | `Iberic Distributions <noreply@yourdomain.com>` |

Generate secret (PowerShell):

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])
```

Save → **Redeploy** the application.

---

## Phase E — First deploy

1. Click **Deploy**
2. Open **Logs** and wait until build finishes (5–10 min first time)
3. If build fails, copy the last 30 lines and share with support

---

## Phase F — Database schema + seed (once only)

After the first successful deploy, tables are created automatically on container start.
To load demo users once, open the app container **Terminal** and run:

```bash
npm run db:seed:prod
```

To run schema sync manually:

```bash
npm run db:push:prod
```

Expected: demo users and products created (see README test accounts).

**Warning:** `db:seed` deletes existing orders. Run only on a fresh database.

---

## Phase G — Smoke tests

Open your public URL:

- [ ] `/login` loads with styles
- [ ] Admin: `admin@ibericdistributions.com` / `Admin123!`
- [ ] Client: `manolo@saketeamfood.com` / `Manolo123!`
- [ ] Provider: `josejuan@galvan.es` / `Galvan123!`
- [ ] Client → new order → summary → confirm
- [ ] Provider → Kanban visible

Change demo passwords before sharing with real clients.

---

## Ongoing updates

```text
Code change → git push main → Coolify auto-deploy (if webhook enabled)
```

New env var → Coolify UI → Save → Redeploy

Schema change → Terminal:

```bash
# Si cambia la tabla ShippingRate (servicios de envío), ejecutar antes del push:
npx prisma db execute --file prisma/migrate-shipping-services.sql
npx prisma db push
```

Do **not** run `db:seed` on live staging unless you want to wipe data.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Login redirects fail | `NEXTAUTH_URL` must match browser URL exactly (https) |
| Sign out goes to `sslip.io` / 404 | Set `NEXTAUTH_URL` and `APP_URL` to `https://ibericos.enviaclientes.com` (not the Coolify test URL). Save → Redeploy |
| Admin login fails | In Coolify terminal: `npm run db:reset-admin:prod`. Or set `RESET_ADMIN_ON_START=true`, Redeploy, test login, then remove that variable |
| Database connection error | Use **internal** Postgres URL; app and DB on same server |
| Uploads disappear | Check volume mounted at `/app/public/uploads` |
| Build fails on Prisma | Ensure latest code with `postgresql` in `schema.prisma` is pushed |
| 502 / app not starting | Check deploy logs; port must be `3000` |

---

## Local development (PostgreSQL)

```bash
docker compose up -d
cp .env.example .env
npm install
npx prisma db push
npm run db:seed
npm run dev
```
