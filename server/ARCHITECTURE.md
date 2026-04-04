# Eventara — Architecture

This project follows **Clean Architecture** (Robert C. Martin), organizing code into concentric dependency layers where inner layers have zero knowledge of outer ones. Dependencies always point **inward**.

---

## Layer Breakdown

### 1. Domain — `app/domain/`

The innermost circle. Pure Python — no framework imports, no I/O.

- **`entities/user_entity.py`**: Pydantic models for `User`, `PublicUser`, `UserProfile`, `UserSecurity`, `UserActivity` plus enums (`UserStatus`, `AgeGroup`, `Gender`, `EducationLevel`)
- **`entities/authorization.py`**: `Feature`, `Role`, `RolePermission`, `UserRole`, `UserGrant` plus enums (`RoleAction`, `GrantEffect`)
- **`entities/token.py`**: `TokenPayload`, `LoginHistory`, `UserOneTimeCode`
- **`entities/audit_log.py`**: Audit log entity
- **`exceptions/user_exceptions.py`**: Domain exception types (`EmailAlreadyTakenError`, `UserNotFoundError`, `UserLockedError`, `UserInactiveError`)
- Has **no dependencies** on any other layer

**File naming**: `<resource>_entity.py` or `<resource>_entities.py` for entities, `<resource>_exceptions.py` for exceptions.

### 2. Application — `app/application/`

Orchestrates entities to fulfill a single business goal.

- **`use_cases/auth_usecase.py`**: `AuthUseCase` class with `register`, `login` methods
- **Input DTOs**: `RegisterUserInput`, `LoginUserInput` — plain dataclasses, no HTTP coupling
- **Output DTOs**: `RegisteredUserOutput` — wraps `PublicUser` with verification token
- **`interfaces/user_interface.py`**: `IUserRepository` protocol — abstract contract that infrastructure must fulfill
- Depends only on the **Domain** layer

**File naming**: `<resource>_usecase.py` for use cases, `<resource>_interface.py` for interfaces.

### 3. Controller (Interface Adapters) — `app/controller/`

Translates between HTTP and use cases.

- **`api/auth_route.py`**: FastAPI `APIRouter` — parses requests, calls use cases, serializes responses
- **`schemas/auth_schema.py`**: Pydantic request/response schemas (`RegisterRequest`, `RegisterResponse`, `ErrorResponse`, `ValidationErrorResponse`)
- **`schemas/responses.py`**: Reusable OpenAPI response definitions (`EMAIL_CONFLICT`, `VALIDATION_ERROR`)
- **`dependencies/__init__.py`**: FastAPI `Depends` factories (`get_auth_use_case`)
- Depends on the **Application** layer; never imports infrastructure directly

**File naming**: `<resource>_route.py` for routes, `<resource>_schema.py` for schemas.

### 4. Core — `app/core/`

Cross-cutting concerns shared across layers.

| Sub-package | Responsibility |
|---|---|
| `core/config/` | `Settings` loaded from `.env` via Pydantic `BaseSettings` |
| `core/security/hashing.py` | Password hashing and verification |
| `core/security/token_service.py` | JWT encode/decode, token issuance |

### 5. Infrastructure (Frameworks & Drivers) — `app/infrastructure/` + `main.py`

The outermost circle. All framework coupling lives here and is replaceable.

| Sub-package | Responsibility |
|---|---|
| `infrastructure/database/models/user.py` | SQLAlchemy ORM table definitions (`User`, `UserProfile`, `UserSecurity`, `UserActivity`, `Token`, `UserLoginHistory`, `UserOneTimeCode`, authorization models) |
| `infrastructure/database/session.py` | Async SQLAlchemy session factory and `get_db` dependency |
| `infrastructure/database/base.py` | Declarative base shared by all ORM models |
| `infrastructure/repositories/` | `UserRepository`, `OneTimeCodeRepository`, `RefreshTokenRepository` — concrete SQL implementations |
| `infrastructure/messaging/` | Email sending, Redis/ARQ worker, email templates |
| `main.py` | App entry point — wires FastAPI, registers routers, global exception handlers |

**File naming**: `<resource>_models.py` for ORM models (e.g., `user.py` → `user_models.py`), `<resource>_repository.py` for repositories.

---

## Error Handling

All error responses follow a consistent shape via global exception handlers in `main.py`:

- **`HTTPException`** → `{"success": false, "message": "..."}`
- **`RequestValidationError`** (422) → `{"success": false, "detail": [...]}`

Reusable OpenAPI response docs are defined in `app/controller/schemas/responses.py` and spread into route decorators.

---

## Dependency Rule

> Source code dependencies must point **inward only**.

```plaintext
controller/api  →  application/use_cases  →  domain/entities
infrastructure  →  application/interfaces  (implements the contract)
```

Infrastructure **implements** the interfaces defined in `application/interfaces/`. Use cases receive implementations via dependency injection — they never import from `infrastructure/` directly.

---

## Tech Stack

| Concern | Library |
|---------|---------|
| Web framework | FastAPI |
| Validation / serialization | Pydantic v2 |
| ORM | SQLAlchemy 2.0 (async) |
| Database driver | asyncpg |
| Migrations | Alembic |
| Auth | PyJWT + passlib (bcrypt) |
| Task queue | ARQ (Redis) |
| ASGI server | Uvicorn |
| Runtime | Python 3.11 |

---

## Project Structure

```plaintext
eventara/server/
├── main.py                                  # App entry point, router registration, exception handlers
├── app/
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── user_entity.py               # User, PublicUser, UserProfile, UserSecurity, UserActivity
│   │   │   ├── authorization.py             # Feature, Role, RolePermission, UserRole, UserGrant
│   │   │   ├── token.py                     # TokenPayload, LoginHistory, UserOneTimeCode
│   │   │   └── audit_log.py                 # Audit log entity
│   │   └── exceptions/
│   │       └── user_exceptions.py           # EmailAlreadyTakenError, etc.
│   ├── application/
│   │   ├── interfaces/
│   │   │   └── user_interface.py            # IUserRepository protocol
│   │   └── use_cases/
│   │       └── auth_usecase.py              # AuthUseCase (register, login)
│   ├── controller/
│   │   ├── api/
│   │   │   └── auth_route.py               # POST /auth/register, etc.
│   │   ├── schemas/
│   │   │   ├── auth_schema.py              # HTTP request/response schemas
│   │   │   └── responses.py                # Reusable OpenAPI response docs
│   │   ├── dependencies/                   # FastAPI Depends factories
│   │   └── router.py                       # Top-level router aggregation
│   ├── core/
│   │   ├── config/                         # Pydantic BaseSettings (env-based)
│   │   └── security/                       # Hashing, JWT token service
│   └── infrastructure/
│       ├── database/
│       │   ├── base.py                     # SQLAlchemy declarative base
│       │   ├── session.py                  # Async session factory
│       │   └── models/
│       │       └── user.py                 # ORM: User, UserProfile, UserSecurity, Token, etc.
│       ├── repositories/
│       │   ├── user_repository.py          # UserRepository
│       │   ├── one_time_code_repository.py # OneTimeCodeRepository
│       │   └── refresh_token_repository.py # RefreshTokenRepository
│       ├── messaging/
│       │   ├── email.py                    # SMTP email sending
│       │   ├── auth_email_templates.py     # Verification & OTP HTML templates
│       │   ├── redis.py                    # ARQ Redis pool
│       │   └── worker.py                   # ARQ worker settings
│       └── cache/                          # Cache repositories (placeholder)
├── migrations/                             # Alembic migrations
├── .env.example
└── requirements.txt
```

### File Naming Convention

All files follow the `<resource>_<type>.py` pattern:

| Layer | Pattern | Examples |
|-------|---------|----------|
| Domain entities | `<resource>_entities.py` | `event_entities.py`, `user_entity.py` |
| Domain exceptions | `<resource>_exceptions.py` | `user_exceptions.py`, `event_exceptions.py` |
| Application interfaces | `<resource>_interface.py` | `user_interface.py`, `event_interface.py` |
| Application use cases | `<resource>_usecase.py` | `auth_usecase.py`, `event_usecase.py` |
| Controller routes | `<resource>_route.py` | `auth_route.py`, `event_route.py` |
| Controller schemas | `<resource>_schema.py` | `auth_schema.py`, `event_schema.py` |
| Infrastructure models | `<resource>_models.py` | `user_models.py`, `event_models.py` |
| Infrastructure repos | `<resource>_repository.py` | `user_repository.py`, `refresh_token_repository.py` |

---

## Key Design Principles

- **Dependency Inversion**: Use cases depend on abstractions (`application/interfaces/`), not concrete infrastructure classes.
- **Single Responsibility**: One use case class per concern; one router per resource.
- **Consistent Error Responses**: All errors return `{success, message/detail}` via global exception handlers.
- **Testability**: Domain and use-case layers are fully testable without a database — mock the interface, not the implementation.
- **Replaceability**: Swap PostgreSQL for another DB by writing a new `infrastructure/` class that satisfies the existing interface — zero changes to business logic.
