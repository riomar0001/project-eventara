# Eventara API

FastAPI backend for Eventara, organised as clean architecture
(domain → application → controller / infrastructure). The same code runs as the
HTTP API and as the background-job worker.

## Stack

- **Python 3.14**, managed with **[uv](https://docs.astral.sh/uv/)** (`pyproject.toml` + `uv.lock`)
- **FastAPI** + **uvicorn**; OpenAPI docs served with Scalar at `/docs`
- **SQLAlchemy 2 (async)** + **asyncpg** on PostgreSQL 16, migrations with **Alembic**
- **Redis**: rate limits, OTPs, password-reset tokens, failed-job store
- **Background jobs**: Amazon SQS on AWS, in-process locally (see below)
- **Email**: SMTP locally, Amazon SES on AWS (`MAIL_PROVIDER`)
- **Storage**: S3 (IAM role) or any S3-compatible store via presigned uploads
- **Auth**: PyJWT access/refresh tokens, bcrypt hashing, email OTP login, RBAC

## Getting started

Prerequisites: uv, PostgreSQL 16 and Redis 7 running locally.

```bash
uv sync                         # creates .venv with runtime + dev dependencies
cp .env.example .env            # fill in secrets, SMTP and admin credentials
uv run sh migrate.sh            # alembic upgrade head + RBAC and admin seeds
uv run uvicorn main:app --reload
```

The API runs at <http://localhost:8000>, with docs at <http://localhost:8000/docs>.

Every setting is documented in [`.env.example`](.env.example). The ones that
differ between local and AWS:

| Setting | Local | AWS (set by Terraform) |
| --- | --- | --- |
| `JOB_QUEUE_URL` | empty: jobs run in-process | SQS queue URL |
| `MAIL_PROVIDER` | `smtp` | `ses` |
| `STORAGE_ENDPOINT` / keys | set for R2/MinIO | empty: uses the IAM role |
| `REDIS_SSL` | `False` | `True` (ElastiCache TLS) |
| `DB_POOL_SIZE` / `DB_MAX_OVERFLOW` | `5` / `10` | `1` / `0` (one request per Lambda) |

## Background jobs

Use cases enqueue work through `IJobQueue.enqueue_job(name, *args, **kwargs)`;
jobs are registered in `app/infrastructure/messaging/worker.py` (`JOBS`).

| Job | Trigger |
| --- | --- |
| `send_email_job` | enqueued by auth, registration, check-in and reminder flows |
| `persist_audit_log` | enqueued by every audited action (sync fallback if enqueue fails) |
| `sync_event_session_statuses_job`, `sync_event_statuses_job` | every minute |
| `finalize_due_account_deletions_job` | every 5 minutes |
| `send_session_reminders_job` | every 15 minutes: emails registrants ~24 h before their session |
| `revoke_expired_tokens_job` | daily at 00:00 UTC |

- **On AWS**, the API sends jobs to SQS and EventBridge Scheduler sends the
  periodic ones (`infra/terraform/scheduler.tf`). The worker Lambda
  (`app/worker_app.py`) processes batches and reports partial failures.
- **Locally**, `LocalJobQueue` runs jobs as asyncio tasks and
  `run_local_scheduler` replaces EventBridge (`LOCAL_SCHEDULES`). A test keeps
  the two schedule lists in sync.
- **Retries:** each job gets `JOB_MAX_TRIES` attempts with exponential backoff
  (`JOB_RETRY_BASE_SECONDS`). After the last one, the failure is written to
  Redis (`jobs:dead:*`, kept 14 days), where the admin *Queues* page and
  `/queues/*` endpoints list, retry, delete or purge it.

## Running on AWS

[`Dockerfile`](Dockerfile) builds one image for both Lambda functions through
the AWS Lambda Web Adapter. The default command serves the API; the worker
overrides it with `uvicorn app.worker_app:app`. Locally the image behaves like a
normal container:

```bash
docker build -t eventara-server . && docker run --env-file .env -p 8000:8000 eventara-server
```

Migrations run by invoking the worker with `{"task": "migrate"}`. See the root
[README](../README.md#deploying-to-aws) for the full deployment flow.

## Tests and checks

```bash
uv run pytest                   # unit + functional suites (no database needed)
uv run ruff check . && uv run ruff format --check .
```

Tests mock repositories and external services; `tests/fake_redis.py` provides
an in-memory Redis for the job and queue tests. `tests/integration` and
`tests/e2e` are placeholders.

## Project structure

```text
server/
├── main.py                     # FastAPI app (API Lambda / uvicorn)
├── migrate.sh                  # migrations + seeds
├── app/
│   ├── worker_app.py           # worker Lambda: SQS batches, {"task": "migrate"}
│   ├── domain/                 # entities, domain exceptions
│   ├── application/            # DTOs, interfaces (Protocols), use cases
│   ├── controller/             # routes, schemas, dependencies, OpenAPI docs
│   ├── core/                   # config, security, email templates, lifespan
│   └── infrastructure/
│       ├── database/           # models, repositories, session
│       ├── cache/              # Redis repositories (OTP, rate limits, resets)
│       ├── messaging/          # job queue, worker, dead-job store, email, jobs/
│       └── storage/            # S3 presigned uploads
├── migrations/                 # Alembic
├── seeds/                      # idempotent RBAC + system-admin seeds
├── tests/                      # unit/, functional/
└── docs/                       # data-flow diagrams
```
