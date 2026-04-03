# Eventara

An event management platform. Monorepo with a FastAPI backend and a Next.js frontend.

## Structure

```
eventara/
├── server/    # FastAPI backend — Python 3.11, Clean Architecture
└── client/    # Next.js 16 frontend — TypeScript, Tailwind CSS, shadcn/ui
```

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI 0.135, SQLAlchemy 2.0 (async), asyncpg, Alembic |
| Auth | PyJWT, passlib (bcrypt) |
| Job queue | ARQ (Redis-backed) |
| Frontend | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS v4, shadcn/ui, Radix UI |
| Runtime | Python 3.11 (uv), Node.js |
| Database | PostgreSQL |

## Quick Start

See [SETUP.md](./SETUP.md) for full setup instructions.

```bash
# Server
cd server && uv sync && uvicorn main:app --reload

# Client
cd client && npm install && npm run dev
```

## Documentation

- [Server README](./server/README.md) — API endpoints and backend overview
- [Architecture](./server/ARCHITECTURE.md) — Clean Architecture layer breakdown
- [Setup Guide](./SETUP.md) — Step-by-step environment setup
