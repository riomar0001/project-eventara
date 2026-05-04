# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Eventara is an event management platform — monorepo with a FastAPI backend (`server/`) and a Next.js frontend (`client/`). Both sides follow Clean Architecture (dependency rule: outer layers depend inward, never the reverse).

## Development Commands

### Server (FastAPI)

```bash
cd server
uv sync                                          # install dependencies (Python 3.14+)
uv run uvicorn main:app --reload                 # dev server → :8000
uv run arq app.infrastructure.messaging.worker.WorkerSettings  # job worker
docker compose -f docker-compose.db.yml up -d    # start postgres + redis
uv run alembic upgrade head                      # apply migrations
uv run alembic revision --autogenerate -m "..."  # create migration
uv run ruff check .                              # lint
uv run ruff format --check .                     # format check
uv run pytest tests/unit/ -v                     # run unit tests
uv run pytest tests/functional/ -v               # run functional tests
python tests.py unit                             # test runner wrapper
```

### Client (Next.js 16)

```bash
cd client
npm install                 # install dependencies
npm run dev                 # dev server → :3000
npm run build               # production build
npm run lint                # eslint
npm run lint:fix            # eslint --fix
npm run format:check        # prettier check
npm run format              # prettier write
npm run type-check          # tsc --noEmit
npm run openapi-ts          # regenerate HeyAPI client from server OpenAPI spec
```

## Architecture

Both server and client follow Clean Architecture with concentric dependency layers. See `server/ARCHITECTURE.md` and `client/ARCHITECTURE.md` for full breakdowns.

### Server layer stack (outer → inner)

```
main.py + controller/api/  →  application/use_cases/  →  domain/entities/
infrastructure/             →  application/interfaces/   (implements contracts)
```

- **`app/domain/entities/`** — Pydantic models, enums, exceptions. No framework imports.
- **`app/application/use_cases/`** — Business logic classes. Depend on domain + interfaces (Protocols).
- **`app/application/interfaces/`** — Abstract contracts (Protocols) that infrastructure implements.
- **`app/controller/api/`** — FastAPI APIRouters. Parse HTTP, call use cases, return responses.
- **`app/controller/schemas/`** — Pydantic request/response models (separate from domain entities).
- **`app/controller/dependencies/`** — FastAPI `Depends` factories for auth/RBAC/use-case injection.
- **`app/core/`** — Cross-cutting: config (`Settings`), security (JWT, hashing), lifespan, startup checks.
- **`app/infrastructure/database/models/`** — SQLAlchemy ORM tables.
- **`app/infrastructure/database/repositories/`** — Concrete SQL implementations of interfaces.
- **`app/infrastructure/messaging/`** — Email sending, ARQ worker/jobs, Redis client.

### Client layer stack (outer → inner)

```
app/ + components/  →  hooks/ + store/  →  api/  →  types/ + interfaces/
                                                        lib/ (cross-cutting)
```

- **`types/` + `interfaces/`** — Pure TypeScript types and abstract contracts. No framework imports.
- **`store/`** — Zustand state (auth, UI, theme slices).
- **`hooks/`** — Custom React hooks for data access and UI logic. Components never call `api/` directly.
- **`api/`** — Axios-based service calls per resource.
- **`api/generated/`** — HeyAPI auto-generated client (from server OpenAPI spec). Never edit manually.
- **`lib/`** — Axios instance, client config, cross-cutting utilities.
- **`app/`** — Next.js App Router pages (client-rendered only, no API route handlers).

### File naming convention (server)

All files follow `<resource>_<type>.py`:
- Entities: `*_entity.py` or `*_entities.py`
- Exceptions: `*_exceptions.py`
- Interfaces: `*_interface.py`
- Use cases: `*_usecase.py`
- Routes: `*_route.py`
- Schemas: `*_schema.py`
- ORM models: `*_models.py`
- Repositories: `*_repository.py`
- DTOs: `*_dto.py`
- API docs: `*_docs.py`

### Response format

All server responses follow: `{"success": bool, "message": str, "data": ...}`. Use the key `"message"` (not `"detail"`) for error descriptions. All error responses go through global exception handlers in `main.py`.

### Server conventions (from SERVER_REVIEW.md)

- Every response schema must include `success: bool`.
- Never use bare `except Exception` — include `settings.DEBUG` conditional for error detail.
- DELETE endpoints return 200 with body (not 204).
- Avoid duplicating `_get_client_ip()` — use the shared utility.
- Dependency order in route handlers: standard deps first, then resource-specific.

## Adding a new resource (server)

Follow the 8-step pattern documented in `server/DEVELOPMENT.md` (Section "Adding a New Feature"):

1. Domain entity + exceptions
2. Application interface (Protocol)
3. Application use case + DTOs
4. ORM model (import in `models/__init__.py` so Alembic detects it)
5. Repository implementation
6. Controller schema (request/response)
7. Controller route + API docs
8. Run `alembic revision --autogenerate` for migration
