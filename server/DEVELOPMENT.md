# Eventara — Development Guide

This guide explains how to add features, follow conventions, and work within the Clean Architecture of this project.

---

## Table of Contents

1. [Prerequisites & Setup](#prerequisites--setup)
2. [Running the Project](#running-the-project)
3. [Architecture Overview](#architecture-overview)
4. [Adding a New Feature (End-to-End Walkthrough)](#adding-a-new-feature-end-to-end-walkthrough)
5. [Layer-by-Layer Conventions](#layer-by-layer-conventions)
6. [Database & Migrations](#database--migrations)
7. [Authentication & Security](#authentication--security)
8. [Background Jobs (ARQ)](#background-jobs-arq)
9. [Email](#email)
10. [Error Handling](#error-handling)
11. [Environment Variables](#environment-variables)
12. [API Documentation](#api-documentation)
13. [Testing](#testing)
14. [Common Commands](#common-commands)

---

## Prerequisites & Setup

### Requirements

- Python 3.11+
- PostgreSQL 16+
- Redis 7+
- [uv](https://docs.astral.sh/uv/) (package manager)

### Initial Setup

```bash
cd server

# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate          # Linux/macOS
.venv\Scripts\Activate.ps1         # Windows PowerShell

# Install dependencies
uv sync

# Copy and configure environment
cp .env.example .env
# Edit .env with your database, Redis, mail, and JWT credentials

# Start infrastructure (PostgreSQL + Redis)
docker compose -f docker-compose.database.yml up -d

# Run database migrations
alembic upgrade head

# Start the development server
uvicorn main:app --reload
```

---

## Running the Project

| What | Command |
|------|---------|
| Dev server | `uvicorn main:app --reload` |
| ARQ worker | `uv run arq app.infrastructure.messaging.worker.WorkerSettings` |
| Database services | `docker compose -f docker-compose.database.yml up -d` |
| Stop database services | `docker compose -f docker-compose.database.yml down` |

The API is available at `http://localhost:8000` and interactive docs at `http://localhost:8000/docs` (Scalar UI).

---

## Architecture Overview

The project follows **Clean Architecture** with four layers. Dependencies always point **inward** — outer layers know about inner layers, never the reverse.

```
┌──────────────────────────────────────────────────┐
│  controller/   (HTTP routes, schemas, depends)   │  ← Presentation
├──────────────────────────────────────────────────┤
│  infrastructure/   (DB, repos, email, Redis)     │  ← Frameworks & Drivers
├──────────────────────────────────────────────────┤
│  application/   (use cases, interfaces)          │  ← Application Logic
├──────────────────────────────────────────────────┤
│  domain/   (entities, exceptions)                │  ← Domain Core
└──────────────────────────────────────────────────┘
```

**Key rules:**
- `domain/` imports nothing from other layers
- `application/` imports only from `domain/`
- `controller/` imports from `application/` (and `domain/` for exceptions)
- `infrastructure/` implements interfaces defined in `application/interfaces/`
- `core/` (config, security) is cross-cutting and used by multiple layers

---

## Adding a New Feature (End-to-End Walkthrough)

Example: adding an "Event" resource with CRUD operations.

### Step 1 — Domain Entity (`app/domain/entities/event_entities.py`)

Define the pure data model. No framework imports, no I/O.

```python
import uuid
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field


class EventStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    CANCELLED = "cancelled"


class Event(BaseModel):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    title: str
    description: str | None = None
    organizer_id: uuid.UUID
    status: EventStatus = EventStatus.DRAFT
    starts_at: datetime
    ends_at: datetime

    model_config = {"from_attributes": True}


class PublicEvent(BaseModel):
    id: uuid.UUID
    title: str
    description: str | None
    status: EventStatus
    starts_at: datetime
    ends_at: datetime

    model_config = {"from_attributes": True}
```

### Step 2 — Domain Exceptions (`app/domain/exceptions/event_exceptions.py`)

```python
class EventNotFoundError(Exception):
    def __init__(self, event_id: str = "") -> None:
        super().__init__(f"Event not found: {event_id}" if event_id else "Event not found")
```

Export from `app/domain/exceptions/__init__.py`:

```python
from app.domain.exceptions.event_exceptions import EventNotFoundError
```

### Step 3 — Application Interface (`app/application/interfaces/event_interface.py`)

Define the repository contract as a `Protocol`.

```python
import uuid
from typing import Protocol
from app.domain.entities.event_entities import Event, PublicEvent


class IEventRepository(Protocol):
    async def create(self, event: Event) -> PublicEvent: ...
    async def get_by_id(self, event_id: uuid.UUID) -> Event | None: ...
```

### Step 4 — Use Case (`app/application/use_cases/event_usecase.py`)

Orchestrate domain logic. Use dataclasses for input/output DTOs.

```python
import uuid
from dataclasses import dataclass
from datetime import datetime

from app.domain.entities.event_entities import Event, PublicEvent, EventStatus
from app.domain.exceptions import EventNotFoundError
from app.application.interfaces.event_interface import IEventRepository


@dataclass
class CreateEventInput:
    title: str
    description: str | None
    organizer_id: uuid.UUID
    starts_at: datetime
    ends_at: datetime


@dataclass
class CreatedEventOutput:
    event: PublicEvent


class EventUseCase:
    def __init__(self, repo: IEventRepository) -> None:
        self.repo = repo

    async def create(self, data: CreateEventInput) -> CreatedEventOutput:
        event = Event(
            title=data.title,
            description=data.description,
            organizer_id=data.organizer_id,
            starts_at=data.starts_at,
            ends_at=data.ends_at,
        )
        created = await self.repo.create(event)
        return CreatedEventOutput(event=created)
```

### Step 5 — ORM Model (`app/infrastructure/database/models/event_models.py`)

```python
from datetime import datetime
from sqlalchemy import DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.domain.entities.event_entities import EventStatus
from app.infrastructure.database.base import Base


class Event(Base):
    __tablename__ = "events"

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    organizer_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    status: Mapped[str] = mapped_column(
        Enum(EventStatus, name="event_status"), nullable=False, default="draft"
    )
    starts_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    ends_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
```

Import it in `app/infrastructure/database/models/__init__.py` so Alembic detects it.

### Step 6 — Repository (`app/infrastructure/repositories/event_repository.py`)

Implement the interface with SQLAlchemy.

```python
import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.event_entities import Event as DomainEvent, PublicEvent, EventStatus
from app.infrastructure.database.models.event_models import Event


class EventRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create(self, event: DomainEvent) -> PublicEvent:
        orm_event = Event(
            id=event.id,
            title=event.title,
            description=event.description,
            organizer_id=event.organizer_id,
            status=event.status,
            starts_at=event.starts_at,
            ends_at=event.ends_at,
        )
        self.db.add(orm_event)
        await self.db.commit()
        await self.db.refresh(orm_event)
        return PublicEvent.model_validate(orm_event)

    async def get_by_id(self, event_id: uuid.UUID) -> DomainEvent | None:
        result = await self.db.execute(select(Event).where(Event.id == event_id))
        orm_event = result.scalar_one_or_none()
        if not orm_event:
            return None
        return DomainEvent.model_validate(orm_event)
```

### Step 7 — Controller Schema (`app/controller/schemas/event_schema.py`)

```python
import uuid
from datetime import datetime
from pydantic import BaseModel, Field


class CreateEventRequest(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = None
    starts_at: datetime
    ends_at: datetime


class CreateEventResponse(BaseModel):
    success: bool = True
    event_id: uuid.UUID
    title: str
    message: str = "Event created successfully."
```

### Step 8 — Dependency Factory (`app/controller/dependencies/__init__.py`)

Add a factory function for the new use case:

```python
def get_event_use_case(db: AsyncSession = Depends(get_db)) -> EventUseCase:
    return EventUseCase(EventRepository(db))
```

### Step 9 — Route (`app/controller/api/event_route.py`)

```python
from fastapi import APIRouter, Depends, status

from app.controller.dependencies import get_event_use_case
from app.controller.schemas.event_schema import CreateEventRequest, CreateEventResponse
from app.application.use_cases.event_usecase import EventUseCase, CreateEventInput

router = APIRouter(prefix="/events", tags=["Events"])


@router.post(
    "/",
    response_model=CreateEventResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_event(
    body: CreateEventRequest,
    use_case: EventUseCase = Depends(get_event_use_case),
) -> CreateEventResponse:
    result = await use_case.create(
        CreateEventInput(
            title=body.title,
            description=body.description,
            organizer_id=...,  # from auth token
            starts_at=body.starts_at,
            ends_at=body.ends_at,
        )
    )
    return CreateEventResponse(event_id=result.event.id, title=result.event.title)
```

### Step 10 — Register the Router (`app/controller/router.py`)

```python
from app.controller.api.event_route import router as event_router

router.include_router(event_router)
```

### Step 11 — Generate Migration

```bash
alembic revision --autogenerate -m "add events table"
alembic upgrade head
```

---

## Layer-by-Layer Conventions

### Domain (`app/domain/`)

| Rule | Details |
|------|---------|
| File naming | `<resource>_entities.py` (e.g., `event_entities.py`, `user_entity.py`) |
| Models | Pydantic `BaseModel` with `model_config = {"from_attributes": True}` |
| IDs | `uuid.UUID` with `Field(default_factory=uuid.uuid4)` |
| Enums | `str, Enum` subclasses (e.g., `class Status(str, Enum)`) |
| Exceptions | `<resource>_exceptions.py` in `domain/exceptions/`, exported via `__init__.py` |
| No imports from | `application/`, `controller/`, `infrastructure/`, `core/` |

### Application (`app/application/`)

| Rule | Details |
|------|---------|
| File naming | `<resource>_interface.py` for interfaces, `<resource>_usecase.py` for use cases |
| Interfaces | `typing.Protocol` classes in `interfaces/` — one per repository |
| Use cases | One class per resource in `use_cases/`, methods for each operation |
| DTOs | `@dataclass` input/output types co-located with the use case |
| Imports from | `domain/` only |

### Controller (`app/controller/`)

| Rule | Details |
|------|---------|
| File naming | `<resource>_route.py` for routes, `<resource>_schema.py` for schemas |
| Routes | One file per resource in `api/`, using `APIRouter` with `prefix` and `tags` |
| Schemas | Pydantic models in `schemas/` — separate request and response classes |
| Dependencies | Factory functions in `dependencies/__init__.py` using `Depends` |
| Error mapping | Catch domain exceptions → raise `HTTPException` with appropriate status code |
| Response shape | All responses include `success: bool` and `message: str` |
| Registration | Include new routers in `router.py` |

### Infrastructure (`app/infrastructure/`)

| Rule | Details |
|------|---------|
| File naming | `<resource>_models.py` for ORM models, `<resource>_repository.py` for repos |
| ORM models | SQLAlchemy 2.0 `Mapped` style in `database/models/` |
| Base class | All models extend `Base` (provides `id`, `created_at`, `updated_at`) |
| Repositories | Receive `AsyncSession` via constructor, return domain entities |
| Class naming | ORM model: `Event`, domain alias: `DomainEvent` (or `Event as DomainEvent`) |

### Core (`app/core/`)

| Rule | Details |
|------|---------|
| Config | `pydantic_settings.BaseSettings` in `core/config/__init__.py` |
| Security | Hashing in `security/hashing.py`, JWT in `security/token_service.py` |
| Shared across | All layers may import from `core/` |

---

## Database & Migrations

### ORM Base Class

All models inherit from `app.infrastructure.database.base.Base`, which provides:

```python
id: uuid.UUID          # UUID primary key, auto-generated
created_at: datetime   # Server-side NOW(), timezone-aware
updated_at: datetime   # Server-side NOW(), auto-updates
```

### Session Management

Sessions are created via `get_db()` async generator and injected through FastAPI's `Depends`:

```python
from app.infrastructure.database.session import get_db
```

### Migration Commands

```bash
# Generate a migration from model changes
alembic revision --autogenerate -m "description"

# Apply all pending migrations
alembic upgrade head

# Apply next migration only
alembic upgrade +1

# Roll back one step
alembic downgrade -1

# Show current revision
alembic current

# Show migration history
alembic history --verbose
```

### Adding a New Table

1. Create the ORM model in `app/infrastructure/database/models/`
2. Import it in `app/infrastructure/database/models/__init__.py`
3. Run `alembic revision --autogenerate -m "add <table> table"`
4. Review the generated migration in `migrations/versions/`
5. Run `alembic upgrade head`

---

## Authentication & Security

### Password Hashing

Uses bcrypt via `app/core/security/hashing.py`:

```python
from app.core.security.hashing import hash_string, verify_hash

hashed = hash_string("plain_password")
is_valid = verify_hash("plain_password", hashed)
```

### JWT Tokens

Three token types, each with its own secret:

| Token | Secret Setting | Expiration Setting | Purpose |
|-------|----------------|-------------------|---------|
| Access | `JWT_ACCESS_TOKEN_SECRET` | `ACCESS_TOKEN_EXPIRATION` | API authentication |
| Refresh | `JWT_REFRESH_TOKEN_SECRET` | `REFRESH_TOKEN_EXPIRATION` | Token renewal |
| Verification | `JWT_VERIFICATION_TOKEN_SECRET` | `VERIFICATION_TOKEN_EXPIRATION` | Email verification / OTP flow |

All tokens use HS256 by default. Refresh tokens are also hashed and stored in the `refresh_tokens` database table.

### OTP Flow

1. User logs in with email/password
2. Server generates a 6-digit OTP (`generate_otp()`) and sends it via email
3. User submits OTP + verification token
4. Server verifies both and issues access + refresh tokens

---

## Background Jobs (ARQ)

The project uses [ARQ](https://arq-docs.helpmanual.io/) with Redis for async background jobs.

### Defining a Job

Create a job function in `app/infrastructure/messaging/jobs/`:

```python
# app/infrastructure/messaging/jobs/example.py
async def send_welcome_email(ctx: dict, user_email: str) -> None:
    # job logic here
    pass
```

### Registering a Job

Add it to `app/infrastructure/messaging/worker.py`:

```python
from app.infrastructure.messaging.jobs.example import send_welcome_email

class WorkerSettings:
    functions: list = [send_welcome_email]
```

### Enqueuing a Job

Use the ARQ pool attached to the app state:

```python
from fastapi import Request

async def some_route(request: Request):
    await request.app.state.arq.enqueue_job("send_welcome_email", "user@example.com")
```

### Running the Worker

```bash
uv run arq app.infrastructure.messaging.worker.WorkerSettings
```

---

## Email

Emails are sent via SMTP using `app/infrastructure/messaging/email.py`. The `send_email` function runs SMTP in a thread to avoid blocking the async event loop.

```python
from app.infrastructure.messaging.email import send_email

await send_email(
    to="user@example.com",
    subject="Your Subject",
    html="<h1>Hello</h1>",
)
```

HTML templates are defined in `app/infrastructure/messaging/auth_email_templates.py`. When adding new templates, create a function that returns an HTML string.

---

## Error Handling

### Global Exception Handlers (in `main.py`)

| Exception | Status | Response Shape |
|-----------|--------|----------------|
| `HTTPException` | Varies | `{"success": false, "message": "..."}` |
| `RequestValidationError` | 422 | `{"success": false, "detail": [...]}` |

### Pattern for Routes

Catch domain exceptions in the route handler and convert them to `HTTPException`:

```python
from app.domain.exceptions import EventNotFoundError

try:
    result = await use_case.get(event_id)
except EventNotFoundError as error:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error))
```

### Reusable OpenAPI Response Docs

Define reusable response examples in `app/controller/schemas/responses.py` and spread them into route decorators:

```python
@router.post("/", responses={**EMAIL_CONFLICT, **VALIDATION_ERROR})
async def create(...):
```

---

## Environment Variables

All settings are loaded from `.env` via Pydantic `BaseSettings` in `app/core/config/__init__.py`.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string (`postgresql+asyncpg://...`) |
| `REDIS_HOST` | No | `localhost` | Redis host |
| `REDIS_PORT` | No | `6379` | Redis port |
| `REDIS_USERNAME` | No | `""` | Redis username |
| `REDIS_PASSWORD` | No | `""` | Redis password |
| `JWT_ACCESS_TOKEN_SECRET` | Yes | — | Secret for access tokens |
| `JWT_REFRESH_TOKEN_SECRET` | Yes | — | Secret for refresh tokens |
| `JWT_VERIFICATION_TOKEN_SECRET` | Yes | — | Secret for verification tokens |
| `ACCESS_TOKEN_EXPIRATION` | No | `30m` | Duration string (e.g., `30m`, `1h`, `7d`) |
| `REFRESH_TOKEN_EXPIRATION` | No | `7d` | Duration string |
| `VERIFICATION_TOKEN_EXPIRATION` | No | `24h` | Duration string |
| `MAIL_HOST` | Yes | — | SMTP host |
| `MAIL_PORT` | Yes | — | SMTP port |
| `MAIL_SECURE` | Yes | — | Use SSL (`true`) or STARTTLS (`false`) |
| `MAIL_USER` | Yes | — | SMTP username / sender address |
| `MAIL_PASS` | Yes | — | SMTP password |
| `CORS_ORIGIN` | Yes | — | Allowed CORS origin |
| `DEBUG` | No | `true` | Enable debug mode |
| `ADMIN_EMAIL` | Yes | — | Email address for the seeded system administrator account |
| `ADMIN_PASSWORD` | Yes | — | Password for the seeded system administrator account |

Duration strings support suffixes: `s` (seconds), `m` (minutes), `h` (hours), `d` (days).

---

## API Documentation

The project uses [Scalar](https://github.com/scalar/scalar) instead of the default Swagger UI. Docs are available at:

- `http://localhost:8000/docs` — Interactive Scalar UI
- `http://localhost:8000/openapi.json` — Raw OpenAPI spec

---

## Seeds

Seed scripts live in `seeds/` and are idempotent — safe to run multiple times. Run them from the `server/` directory after applying all migrations.

| Script | Purpose |
|--------|---------|
| `seeds.rbac_user_management` | Populates features, roles, and role permissions for the user management domain |
| `seeds.system_admin` | Creates the system administrator account and assigns the `system_administrator` role |

```bash
# 1. Seed roles and permissions first
python -m seeds.rbac_user_management

# 2. Seed the system admin user (requires ADMIN_EMAIL and ADMIN_PASSWORD in .env)
python -m seeds.system_admin
```

The admin credentials are read from `.env`:

```env
ADMIN_EMAIL="you@example.com"
ADMIN_PASSWORD="your-secure-password"
```

---

## Testing

Tests live in the `tests/` directory. Run them with:

```bash
pytest
```

When writing tests, use the architecture to your advantage:
- **Domain/Application tests**: Mock the repository interface (`IUserRepository`, etc.) — no database needed
- **Integration tests**: Use the real database session

---

## Common Commands

```bash
# Development
uvicorn main:app --reload                                          # Start dev server
uv run arq app.infrastructure.messaging.worker.WorkerSettings      # Start ARQ worker

# Database
docker compose -f docker-compose.database.yml up -d                # Start PostgreSQL + Redis
docker compose -f docker-compose.database.yml down                 # Stop services
alembic revision --autogenerate -m "description"                   # Generate migration
alembic upgrade head                                               # Apply migrations
alembic downgrade -1                                               # Rollback one migration

# Dependencies
uv sync                                                            # Install/sync dependencies
uv add <package>                                                   # Add a new dependency

# Seeds
python -m seeds.rbac_user_management                               # Seed roles and permissions
python -m seeds.system_admin                                       # Seed system admin user

# Health check
curl http://localhost:8000/health                                   # Verify server is running
```
