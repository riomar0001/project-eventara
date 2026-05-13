# Eventara — VPS Deployment Guide

## Architecture

```
Internet
    │
    ▼
 Nginx (host, port 80/443)
    ├── admineventara.riomar.dev  ──▶  localhost:3000  (admin Next.js)
    └── eventara.riomar.dev       ──▶  localhost:4000  (participant Next.js)

Docker (internal network: eventara)
    ├── api              :8000   FastAPI + ARQ worker
    ├── client           :3000   Admin Next.js
    ├── client-participant :4000  Participant Next.js
    ├── postgres         :5432   PostgreSQL (no public port)
    └── redis            :6379   Redis (no public port)
```

---

## 1. Server prerequisites

```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# Install nginx
sudo apt install -y nginx

# Verify
docker --version
nginx -v
```

---

## 2. Clone the repository

```bash
git clone https://github.com/riomar0001/project-eventara.git /opt/eventara
cd /opt/eventara
```

---

## 3. Configure environment variables

```bash
cp .env.example .env
nano .env
```

Fill in every `TODO` value. Key fields to change:

| Variable | Value |
|---|---|
| `POSTGRES_PASSWORD` | Strong random password |
| `REDIS_PASSWORD` | Strong random password |
| `DATABASE_URL` | Use `postgres` as host: `postgresql+asyncpg://eventara:<pw>@postgres:5432/eventara_db` |
| `REDIS_HOST` | `redis` |
| `JWT_ACCESS_TOKEN_SECRET` | Run: `python3 -c "import secrets; print(secrets.token_hex(32))"` |
| `JWT_REFRESH_TOKEN_SECRET` | Same command as above |
| `JWT_VERIFICATION_TOKEN_SECRET` | Same command as above |
| `ADMISSION_TOKEN_SECRET` | Same command as above |
| `MAIL_USER` | Your Gmail address |
| `MAIL_PASS` | Your Gmail app password |
| `CORS_ORIGIN` | `https://admineventara.riomar.dev` |
| `ALLOWED_ORIGINS` | `https://admineventara.riomar.dev,https://eventara.riomar.dev` |
| `ADMIN_EMAIL` | Your admin email |
| `ADMIN_PASSWORD` | Strong admin password |
| `NEXT_PUBLIC_STORAGE_PUBLIC_URL` | Your R2/S3 public URL (optional) |

---

## 4. Build and start Docker containers

```bash
cd /opt/eventara

# Build all images
docker compose build

# Start everything
docker compose up -d

# Check all containers are running
docker compose ps

# Watch startup logs (migrations + seeder run automatically)
docker compose logs -f api
```

Expected output in api logs:
```
Running database migrations...
Seeding RBAC features, roles, and permissions...
Seeding system administrator...
Starting Eventara API...
```

---

## 5. Configure nginx

Copy the config files to nginx's sites directory:

```bash
sudo cp /opt/eventara/nginx/admineventara.riomar.dev.conf \
        /etc/nginx/sites-available/admineventara.riomar.dev

sudo cp /opt/eventara/nginx/eventara.riomar.dev.conf \
        /etc/nginx/sites-available/eventara.riomar.dev

# Enable both sites
sudo ln -s /etc/nginx/sites-available/admineventara.riomar.dev \
           /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/eventara.riomar.dev \
           /etc/nginx/sites-enabled/

# Remove default site if present
sudo rm -f /etc/nginx/sites-enabled/default
```

Test the config syntax:

```bash
sudo nginx -t
```

---

## 6. Configure Cloudflare

SSL is handled entirely by Cloudflare — no certificates needed on the server.

1. In your Cloudflare dashboard, add two **A records** pointing to your VPS IP:

   | Type | Name | Content | Proxy |
   |---|---|---|---|
   | A | `eventara` | `<VPS IP>` | Proxied (orange cloud) |
   | A | `admineventara` | `<VPS IP>` | Proxied (orange cloud) |

2. Set the SSL/TLS mode to **Full** (not Flexible, not Full Strict):
   - Cloudflare Dashboard → SSL/TLS → Overview → **Full**

3. Nginx only needs to listen on port 80 — Cloudflare terminates HTTPS at the edge and forwards HTTP to your server. The configs in this repo are already set up for this.

---

## 7. Reload nginx

```bash
sudo nginx -t && sudo systemctl reload nginx
```

---

## 8. Verify everything is running

```bash
# All containers healthy
docker compose ps

# API health check
curl https://admineventara.riomar.dev/api/health

# Admin site
curl -I https://admineventara.riomar.dev

# Participant site
curl -I https://eventara.riomar.dev
```

---

## Useful commands

### View logs

```bash
docker compose logs -f api             # API + seeder output
docker compose logs -f client          # Admin client
docker compose logs -f client-participant  # Participant client
```

### Restart a service

```bash
docker compose restart api
docker compose restart client
docker compose restart client-participant
```

### Deploy an update

```bash
cd /opt/eventara
git pull

# Rebuild changed services and restart
docker compose build
docker compose up -d

# Or rebuild a single service
docker compose build api && docker compose up -d --force-recreate api
```

### Database access (DataGrip / psql)

The postgres port `5432` is exposed to the host. Connect with:

| Field | Value |
|---|---|
| Host | `<VPS IP>` or `localhost` (if on server) |
| Port | `5432` |
| Database | `eventara_db` |
| User | `eventara` |
| Password | Value of `POSTGRES_PASSWORD` in `.env` |

### Reset everything (destructive)

```bash
docker compose down -v   # Stops containers AND deletes all volumes (data lost)
docker compose up -d
```

---

## Local development (without Docker)

### Server

```bash
cd server
uv sync
cp ../.\env.local.example .env   # pre-filled local defaults
docker compose -f docker-compose.db.yml up -d   # postgres + redis only
uv run alembic upgrade head
uv run python -m seeds.rbac_user_management
uv run python -m seeds.system_admin
uv run uvicorn main:app --reload
```

### Admin client

```bash
cd client
npm install
# create client/.env with: API_URL=http://127.0.0.1:8000
npm run dev   # http://localhost:3000
```

### Participant client

```bash
cd client-participant
npm install
# create client-participant/.env with: API_URL=http://127.0.0.1:8000
npm run dev   # http://localhost:3001
```
