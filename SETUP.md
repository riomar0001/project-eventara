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
APP_NAME=Eventara
APP_VERSION=0.1.0
DEBUG=false

DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/eventara_db

REDIS_URL=redis://localhost:6379

JWT_ACCESS_TOKEN_SECRET=your-access-secret
JWT_REFRESH_TOKEN_SECRET=your-refresh-secret
JWT_VERIFICATION_TOKEN_SECRET=your-verification-secret

ACCESS_TOKEN_EXPIRATION=30m
REFRESH_TOKEN_EXPIRATION=7d
VERIFICATION_TOKEN_EXPIRATION=24h
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

2. Register it in `WorkerSettings.functions` inside `worker.py`:

```python
from app.infrastructure.messaging.jobs.email import send_welcome_email

class WorkerSettings:
    functions = [send_welcome_email]
```

3. Enqueue it from a route via `request.app.state.arq`:

```python
await request.app.state.arq.enqueue_job("send_welcome_email", user_id)
```
