# Eventara

Event management platform for the Davao DeFi community: event and session
registration with QR check-in, a community venue hub, volunteer management,
feedback and analytics.

| Part | Path | Stack |
| --- | --- | --- |
| API + worker | [`server/`](server/README.md) | Python 3.14, FastAPI, SQLAlchemy (async), Alembic, uv |
| Admin dashboard | [`client/`](client/README.md) | Next.js 16, React 19, Tailwind, shadcn/ui |
| Participant site | [`client-participant/`](client-participant/README.md) | Next.js 16, React 19, Tailwind |
| AWS infrastructure | [`infra/`](#deploying-to-aws) | Terraform |

## Architecture

```text
                 Browser
                    │
        ┌───────────┴────────────┐
        ▼                        ▼
  Amplify Hosting          Amplify Hosting           CloudFront ──▶ S3 (uploads)
  admin (Next.js)          participant (Next.js)          ▲
        │  /api/* rewrite          │                      │ presigned PUT
        └───────────┬──────────────┘                      │ from browser
                    ▼                                     │
          API Gateway (HTTP API)                          │
                    ▼                                     │
          Lambda: API (FastAPI) ──────────────────────────┘
            │        │        │
            │        │        └──▶ SQS "jobs" ◀── EventBridge Scheduler
            │        │                 │            (status sync, deletion sweep,
            ▼        ▼                 ▼             reminders, token cleanup)
          RDS     ElastiCache    Lambda: worker ──▶ SES (email)
       PostgreSQL   Redis           │    │
            ▲         ▲             │    └──▶ SQS DLQ (crash backstop, alarmed)
            └─────────┴─────────────┘
```

- **One container image** runs both Lambdas through the
  [AWS Lambda Web Adapter](https://github.com/awslabs/aws-lambda-web-adapter):
  uvicorn serves the API, or `app.worker_app` for SQS batches.
- **Background jobs** (emails, audit-log writes, scheduled maintenance) go
  through SQS. A job is tried `JOB_MAX_TRIES` times with backoff; its final
  failure is stored in Redis so admins can inspect, retry or purge it from the
  dashboard's *Queues* page.
- **Redis** holds rate limits, OTPs, password-reset tokens and the dead-job store.
- **Locally** nothing AWS-specific is required. With `JOB_QUEUE_URL` unset, jobs
  and schedules run inside the API process.

## Local development

Prerequisites: [uv](https://docs.astral.sh/uv/), Node.js 20+, PostgreSQL 16 and
Redis 7 running locally.

```bash
cp server/.env.example server/.env    # then fill in secrets and SMTP details
```

```bash
cd server && uv sync && uv run sh migrate.sh && uv run uvicorn main:app --reload
```

API: <http://localhost:8000> (docs at `/docs`). In another terminal:

```bash
cd client && npm ci && npm run dev -- -p 3000
```

```bash
cd client-participant && npm ci && npm run dev -- -p 3001
```

Both frontends proxy `/api/*` to `API_URL` (default `http://127.0.0.1:8000`).

### Checks

```bash
cd server && uv run ruff check . && uv run ruff format --check . && uv run pytest
```

```bash
cd client && npm run lint && npm run format:check && npm run type-check
```

## Deploying to AWS

Everything lives in [`infra/terraform`](infra/terraform). You need Terraform
1.6+, the AWS CLI with credentials, and Docker.

1. **Configure.** `cp infra/terraform/terraform.tfvars.example infra/terraform/terraform.tfvars`
   and fill it in: region, mail domain and sender, admin account, and the GitHub
   repository plus token Amplify builds from.
2. **Initialise.** `terraform -chdir=infra/terraform init`
3. **Deploy the server.** This builds and pushes the image, applies Terraform
   and runs migrations and seeds:

   ```bash
   infra/scripts/deploy-server.sh
   ```

   On the first run the script creates the ECR repository before pushing.
   Use `ARCH=arm64` if you set `lambda_architecture = "arm64"`.
4. **Email.** Add the `ses_dkim_records` output as CNAMEs in your DNS, then
   request SES production access (new accounts can only email verified
   addresses).
5. **Frontends.** Amplify builds both apps from `amplify_branch` on every push.
   Trigger the first build from the Amplify console or by pushing.

Useful outputs: `terraform -chdir=infra/terraform output` shows `api_url`,
`participant_url`, `admin_url`, `storage_public_url` and `migrate_command`.
Run `migrate_command` (or rerun the deploy script) whenever a release adds
migrations.

### Cost and operational notes

- The defaults are sized for a small production: `db.t4g.micro`,
  `cache.t4g.micro` and one NAT gateway (the main fixed cost). Add a NAT gateway
  per AZ and Multi-AZ RDS for higher availability.
- Generated secrets (database, Redis, JWT) are passed to Lambda as encrypted
  environment variables and also live in Terraform state, so keep state in a
  private, encrypted S3 backend (see `versions.tf`).
- The `jobs-dlq-not-empty` CloudWatch alarm fires when jobs reach the SQS
  dead-letter queue. Attach an SNS topic to be notified.

## Repository layout

```text
server/                FastAPI app (clean architecture: domain → application → controller/infrastructure)
  app/worker_app.py    Worker Lambda entrypoint (SQS batches, migrations)
  migrations/          Alembic migrations
  seeds/               RBAC and system-admin seeds (idempotent)
  docs/                Data-flow diagrams (open data_flow_diagram.html)
client/                Admin dashboard
client-participant/    Public participant site
infra/terraform/       AWS infrastructure
infra/scripts/         Deployment helpers
```
