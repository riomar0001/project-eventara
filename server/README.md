# Eventara

A backend API for an event management platform, built with FastAPI and Clean Architecture.

## Tech Stack

- **FastAPI** 0.135 — async web framework
- **SQLAlchemy** 2.0 (async) + **asyncpg** — PostgreSQL ORM
- **Alembic** — database migrations
- **Pydantic v2** — validation and settings
- **PyJWT** + **passlib (bcrypt)** — authentication
- **arq** + **redis** — async job queue (Redis-backed)
- **Uvicorn** — ASGI server
- **Python** 3.11

## Getting Started

### Prerequisites

- Python 3.11
- PostgreSQL
- Redis (for ARQ job queue)

### Setup

1. **Clone and create a virtual environment**

   ```bash
   git clone <repo-url>
   cd eventara
   python -m venv .venv
   source .venv/bin/activate  # Windows: .venv\Scripts\activate
   ```

2. **Install dependencies**

   ```bash
   uv sync
   ```

3. **Configure environment**

   ```bash
   cp .env.example .env
   ```

   Edit `.env`:

   ```env
   APP_NAME
   DEBUG=
   HOST=
   PORT=
   ```

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

CORS_ORIGIN="_"
ALLOWED_ORIGINS="_"

````

4. **Run migrations**

Generate a migration from your current model changes, then apply it:

```bash
alembic revision --autogenerate -m "your description here"
alembic upgrade head
````

Other useful migration commands:

```bash
alembic current            # show current revision
alembic history --verbose  # list all revisions
alembic upgrade +1         # apply only the next migration
alembic downgrade -1       # roll back one step
alembic downgrade <id>     # roll back to a specific revision
```

5. **Start the server**

   ```bash
   uvicorn main:app --reload
   ```

   API available at `http://localhost:8000`
   Interactive docs at `http://localhost:8000/docs`

## API Endpoints

### Authentication — `/api/v1/auth`

| Method | Path                        | Description                          |
| ------ | --------------------------- | ------------------------------------ |
| `POST` | `/api/v1/auth/register`     | Register a new user                  |
| `POST` | `/api/v1/auth/email/verify` | Verify email address                 |
| `POST` | `/api/v1/auth/login`        | Login with email + password → tokens |
| `POST` | `/api/v1/auth/login/verify` | Verify OTP code → tokens             |
| `POST` | `/api/v1/auth/logout`       | Revoke refresh token                 |

## Project Structure

See [ARCHITECTURE.md](./ARCHITECTURE.md) for a full breakdown of the layer design, dependency rules, and file naming conventions.

```plaintext
server/
├── main.py
├── app/
│   ├── domain/
│   │   ├── entities/
│   │   └── exceptions/
│   ├── application/
│   │   ├── dto/
│   │   ├── interfaces/
│   │   └── use_cases/
│   ├── controller/
│   │   ├── api/
│   │   ├── docs/
│   │   ├── schemas/
│   │   ├── dependencies/
│   │   └── router.py
│   ├── core/
│   │   ├── config/
│   │   └── security/
│   └── infrastructure/
│       ├── cache/
│       │   └── repositories/
│       ├── database/
│       │   └── models/
│       ├── messaging/
│       │   └── jobs/
│       └── repositories/
├── migrations/
├── seeds/
├── tests/
│   ├── integration/
│   └── unit/
├── .env.example
└── requirements.txt
```
