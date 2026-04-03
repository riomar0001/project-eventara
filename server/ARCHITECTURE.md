# Eventara — Architecture

This project follows **Clean Architecture** (Robert C. Martin), organizing code into concentric dependency layers where inner layers have zero knowledge of outer ones. Dependencies always point **inward**.

---

## Layer Breakdown

### 1. Domain — `app/core/entities/`

The innermost circle. Pure Python — no framework imports, no I/O.

- **`user_entities.py`**: Pydantic models for `User`, `UserProfile`, `UserSecurity`, `UserActivity`, `UserRole` plus enums (`UserStatus`, `AgeGroup`, `Gender`, `EducationLevel`)
- **`jwt_entities.py`**: Token payload models
- Has **no dependencies** on any other layer

### 2. Application — `app/core/use_cases/` & `app/core/interfaces/`

Orchestrates entities to fulfill a single business goal.

- **`use_cases/user.py`**: `register_user`, `login_user` — coordinate repos and domain logic
- **Input DTOs**: `RegisterUserInput`, `LoginUserInput` — plain Python classes, no HTTP coupling
- **`interfaces/`**: Abstract contracts (repository protocols) that infrastructure must fulfill
- **`hash_utils.py`**: Password hashing utility (no I/O, no framework)
- **`jwt_utils.py`**: JWT encode/decode helpers
- **`exceptions/`**: Domain exception types (`EmailAlreadyTakenError`, etc.)
- Depends only on the **Domain** layer

### 3. Interface Adapters — `app/api/`

Translates between HTTP and use cases.

- **`routes/auth.py`**: FastAPI `APIRouter` — parses requests, calls use cases, serializes responses
- **`schemas/auth.py`**: Pydantic request/response schemas (`RegisterRequest`, `RegisterResponse`, `LoginRequest`, `LoginResponse`) — separate from domain entities
- **`dependencies/`**: FastAPI `Depends` factories (e.g. `get_db`)
- Depends on the **Application** layer; never imports infrastructure directly

### 4. Frameworks & Drivers — `app/infrastructure/` + `app/main.py`

The outermost circle. All framework coupling lives here and is replaceable.

| Sub-package | Responsibility |
|---|---|
| `infrastructure/database/models/` | SQLAlchemy ORM table definitions (`User`, `UserProfile`, `UserSecurity`, `UserActivity`, `Token`) |
| `infrastructure/database/repositories/` | `UserRepository`, `RefreshTokenRepository` — concrete SQL implementations |
| `infrastructure/database/session.py` | Async SQLAlchemy session factory and `get_db` dependency |
| `infrastructure/database/base.py` | Declarative base shared by all ORM models |
| `infrastructure/cache/repositories/` | Concrete cache implementations (Redis / in-memory) |
| `infrastructure/messaging/publishers/` | RabbitMQ event publishers (aio-pika) |
| `infrastructure/messaging/consumers/` | RabbitMQ event consumers |
| `app/config/` | `Settings` loaded from `.env` via Pydantic `BaseSettings` |
| `app/main.py` | App entry point — wires FastAPI, registers routers |

---

## Dependency Rule

> Source code dependencies must point **inward only**.

```plaintext
api/routes  →  core/use_cases  →  core/entities
infrastructure  →  core/interfaces  (implements the contract)
```

Infrastructure **implements** the interfaces defined in `core/interfaces/`. Use cases receive implementations via dependency injection — they never import from `infrastructure/` directly.

---

## Tech Stack

| Concern | Library |
|---------|---------|
| Web framework | FastAPI 0.135 |
| Validation / serialization | Pydantic v2 |
| ORM | SQLAlchemy 2.0 (async) |
| Database driver | asyncpg |
| Migrations | Alembic |
| Auth | PyJWT + passlib (bcrypt) |
| Message broker | RabbitMQ via aio-pika |
| ASGI server | Uvicorn |
| Runtime | Python 3.11 |

---

## Project Structure

```plaintext
eventara/
├── app/
│   ├── main.py                          # App entry point, router registration
│   ├── config/                          # Pydantic BaseSettings (env-based)
│   ├── core/
│   │   ├── entities/
│   │   │   ├── user_entities.py         # User, UserProfile, UserSecurity, UserActivity
│   │   │   └── jwt_entities.py          # Token payload models
│   │   ├── exceptions/
│   │   │   └── user_exceptions.py       # EmailAlreadyTakenError, etc.
│   │   ├── interfaces/                  # Abstract repository / service contracts
│   │   ├── use_cases/
│   │   │   └── user.py                  # register_user, login_user
│   │   ├── hash_utils.py                # Password hashing
│   │   └── jwt_utils.py                 # JWT encode / decode
│   ├── api/
│   │   ├── routes/
│   │   │   └── auth.py                  # POST /auth/register, POST /auth/login
│   │   ├── schemas/
│   │   │   └── auth.py                  # HTTP request / response schemas
│   │   └── dependencies/                # FastAPI Depends factories
│   └── infrastructure/
│       ├── database/
│       │   ├── base.py                  # SQLAlchemy declarative base
│       │   ├── session.py               # Async session factory
│       │   ├── models/                  # ORM table definitions
│       │   └── repositories/            # UserRepository, RefreshTokenRepository
│       ├── cache/
│       │   └── repositories/            # Cache implementations
│       └── messaging/
│           ├── publishers/              # RabbitMQ event publishers
│           └── consumers/               # RabbitMQ event consumers
├── tests/
│   ├── unit/                            # Entity & use-case tests (no I/O)
│   └── integration/                     # Tests against real DB / broker
├── .env.example
└── requirements.txt
```

---

## Key Design Principles

- **Dependency Inversion**: Use cases depend on abstractions (`core/interfaces/`), not concrete infrastructure classes.
- **Single Responsibility**: One use case per file; one router per resource.
- **Testability**: Domain and use-case layers are fully testable without a database or broker — mock the interface, not the implementation.
- **Replaceability**: Swap PostgreSQL for another DB, or RabbitMQ for Kafka, by writing a new `infrastructure/` class that satisfies the existing interface — zero changes to business logic.
