# Eventara — Architecture

This project follows **Clean Architecture** (Robert C. Martin), organizing code into concentric dependency layers where inner layers have zero knowledge of outer ones. Dependencies always point **inward**.

![Clean Architecture](https://cdn-images-1.medium.com/max/1600/1*B7LkQDyDqLN3rRSrNYkETA.jpeg)

---

## Layer Breakdown

### 1. Domain — `app/core/entities/`

The innermost circle. Pure Python — no framework imports, no I/O.

- **Entities**: Pydantic models or dataclasses representing core business objects (events, attendees, tickets, etc.)
- **Rules**: Invariants and business logic that live on the entity itself
- Has **no dependencies** on any other layer

### 2. Application — `app/core/use_cases/` & `app/core/interfaces/`

Orchestrates entities to fulfill a single business goal (e.g. `CreateEvent`, `RegisterAttendee`).

- **Use Cases**: One class / function per use case; coordinates entities and calls repository/service interfaces
- **Interfaces** (`app/core/interfaces/`): Abstract base classes defining contracts that the infrastructure must fulfill (repository protocols, messaging ports, cache ports)
- Depends only on the **Domain** layer

### 3. Interface Adapters — `app/api/routes/`

Translates between the outside world and use cases.

- **Route handlers**: FastAPI `APIRouter` endpoints that parse HTTP requests, call the appropriate use case, and serialize the response
- **Request/Response schemas**: Pydantic schemas for HTTP payloads (kept separate from domain entities)
- Depends on the **Application** layer; never imports infrastructure directly

### 4. Frameworks & Drivers — `app/infrastructure/` + `main.py`

The outermost circle. All framework coupling lives here and is replaceable.

| Sub-package | Responsibility |
|---|---|
| `app/infrastructure/database/models/` | SQLAlchemy ORM table definitions |
| `app/infrastructure/database/repositories/` | Concrete repository implementations (SQL) |
| `app/infrastructure/cache/repositories/` | Concrete repository implementations (Redis / in-memory) |
| `app/infrastructure/messaging/publishers/` | RabbitMQ event publishers (aio-pika) |
| `app/infrastructure/messaging/consumers/` | RabbitMQ event consumers |
| `app/config/` | Settings loaded from environment variables (Pydantic `BaseSettings`) |
| `main.py` | Application entry point — wires FastAPI, routers, and DI together |

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
| Message broker | RabbitMQ via aio-pika |
| ASGI server | Uvicorn |

---

## Project Structure

```plaintext
eventara/
├── main.py                          # App entry point, router registration
├── requirements.txt
├── app/
│   ├── config/                      # Environment-based settings
│   ├── core/
│   │   ├── entities/                # Domain models (pure Python)
│   │   ├── interfaces/              # Abstract contracts (repository, messaging)
│   │   └── use_cases/               # Business operations
│   ├── api/
│   │   └── routes/                  # FastAPI routers (HTTP interface adapters)
│   └── infrastructure/
│       ├── database/
│       │   ├── models/              # SQLAlchemy ORM models
│       │   └── repositories/        # Concrete DB repository implementations
│       ├── cache/
│       │   └── repositories/        # Concrete cache implementations
│       └── messaging/
│           ├── publishers/          # RabbitMQ event publishers
│           └── consumers/           # RabbitMQ event consumers
└── tests/
    ├── unit/                        # Tests for entities & use cases (no I/O)
    └── integration/                 # Tests against real DB / broker
```

---

## Key Design Principles

- **Dependency Inversion**: Use cases depend on abstractions (`core/interfaces/`), not concrete infrastructure classes.
- **Single Responsibility**: One use case per file; one router per resource.
- **Testability**: The domain and use-case layers are fully testable without standing up a database or broker — mock the interface, not the implementation.
- **Replaceability**: Swap PostgreSQL for a different DB, or RabbitMQ for Kafka, by writing a new `infrastructure/` class that satisfies the existing interface — zero changes to business logic.
