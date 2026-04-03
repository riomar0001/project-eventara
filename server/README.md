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
   DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/eventara_db

   JWT_ACCESS_TOKEN_SECRET=your-access-secret
   JWT_REFRESH_TOKEN_SECRET=your-refresh-secret
   JWT_VERIFICATION_TOKEN_SECRET=your-verification-secret

   ACCESS_TOKEN_EXPIRATION=30m
   REFRESH_TOKEN_EXPIRATION=7d
   VERIFICATION_TOKEN_EXPIRATION=24h
   ```

4. **Run migrations**

   Generate a migration from your current model changes, then apply it:

   ```bash
   alembic revision --autogenerate -m "your description here"
   alembic upgrade head
   ```

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
   uvicorn app.main:app --reload
   ```

   API available at `http://localhost:8000`
   Interactive docs at `http://localhost:8000/docs`

## API Endpoints

### Authentication — `/api/v1/auth`

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/auth/register` | Register a new user |
| `POST` | `/api/v1/auth/email/verify` | Verify email address |
| `POST` | `/api/v1/auth/login` | Login with email + password → tokens |
| `POST` | `/api/v1/auth/login/verify` | Verify OTP code → tokens |
| `POST` | `/api/v1/auth/logout` | Revoke refresh token |

## Project Structure

See [ARCHITECTURE.md](./ARCHITECTURE.md) for a full breakdown of the layer design and dependency rules.

```plaintext
app/
├── main.py               # Entry point
├── config/               # Environment settings
├── core/                 # Business logic (framework-free)
│   ├── entities/         # Domain models
│   ├── use_cases/        # Application operations
│   ├── interfaces/       # Abstract contracts
│   └── exceptions/       # Domain exceptions
├── api/                  # HTTP layer
│   ├── routes/           # FastAPI routers
│   ├── schemas/          # Request/response schemas
│   └── dependencies/     # FastAPI Depends factories
└── infrastructure/       # DB, cache, messaging
```
