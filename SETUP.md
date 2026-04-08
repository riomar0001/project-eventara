# Eventara — Setup Guide

## Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Python | 3.11+ | |
| uv | latest | Python package manager |
| Node.js | 20+ | |
| PostgreSQL | 14+ | via Docker (see below) |
| Redis | 7+ | via Docker (see below) |
| Docker | latest | for running PostgreSQL and Redis |

## Server Setup

### 1. Install dependencies

```bash
cd server
uv sync
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
APP_NAME
DEBUG=
HOST=
PORT=

DATABASE_URL=

SECRET_KEY=

# JWT Settings
JWT_ACCESS_TOKEN_SECRET=
ACCESS_TOKEN_EXPIRATION=
JWT_REFRESH_TOKEN_SECRET=
REFRESH_TOKEN_EXPIRATION=
JWT_VERIFICATION_TOKEN_SECRET=
VERIFICATION_TOKEN_EXPIRATION=

# Redis Settings
REDIS_HOST=
REDIS_PORT=
REDIS_USERNAME=
REDIS_PASSWORD=

# Email Settings
MAIL_HOST=
MAIL_PORT=
MAIL_SECURE=
MAIL_USER=
MAIL_PASS=

# CORS Configuration
CORS_ORIGIN="*"
ALLOWED_ORIGINS="*"
```

### 3. Run database migrations

```bash
uv run alembic upgrade head
```

### 4. Start the server

```bash
uv run uvicorn main:app --reload
```

| URL | Description |
|---|---|
| `http://localhost:8000` | API root |
| `http://localhost:8000/docs` | Interactive API docs (Scalar) |

### 5. Start the ARQ worker (optional)

The worker processes background jobs. Run it alongside the server when job processing is needed:

```bash
uv run arq app.infrastructure.messaging.worker.WorkerSettings
```

---

## Client Setup

### 1. Install dependencies

```bash
cd client
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. Start the dev server

```bash
npm run dev
```

App available at `http://localhost:3000`.

---

## Running Everything Together

Open three terminals:

```bash
# Terminal 1 — backend
cd server && uv run uvicorn main:app --reload

# Terminal 2 — ARQ worker
cd server && uv run arq app.infrastructure.messaging.worker.WorkerSettings

# Terminal 3 — frontend
cd client && npm run dev
```

---

## Database Setup (PostgreSQL + Redis)

Start both services via Docker:

```bash
cd server
docker compose -f docker-compose.database.yml up -d
```

To stop:

```bash
docker compose -f docker-compose.database.yml down
```

To stop and delete all data:

```bash
docker compose -f docker-compose.database.yml down -v
```

### PostgreSQL

| Field | Value |
|---|---|
| Host | `localhost` |
| Port | `5432` |
| User | `postgres` |
| Password | `password` |
| Database | `eventara_db` |
| Connection string | `postgresql+asyncpg://postgres:password@localhost:5432/eventara_db` |

### Redis

| Field | Value |
|---|---|
| Host | `localhost` |
| Port | `6379` |
| Connection string | `redis://localhost:6379` |

Then run migrations:

```bash
cd server && uv run alembic upgrade head
```

To create a new migration after model changes:

```bash
uv run alembic revision --autogenerate -m "describe your change"
```

---

## Adding a Background Job

1. Create a job function in `server/app/infrastructure/messaging/jobs/`:

```python
# server/app/infrastructure/messaging/jobs/email.py
async def send_welcome_email(ctx: dict, user_id: str) -> None:
    # ctx holds shared resources set up in worker.py startup()
    ...
```

1. Register it in `WorkerSettings.functions` inside `worker.py`:

```python
from app.infrastructure.messaging.jobs.email import send_welcome_email

class WorkerSettings:
    functions = [send_welcome_email]
```

1. Enqueue it from a route via `request.app.state.arq`:

```python
await request.app.state.arq.enqueue_job("send_welcome_email", user_id)
```
