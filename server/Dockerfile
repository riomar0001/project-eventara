# One image, two Lambda functions (see infra/terraform/lambda.tf):
#   API    — default CMD: uvicorn main:app
#   Worker — command override: uvicorn app.worker_app:app (SQS events on /events)
# AWS Lambda Web Adapter (an extension in /opt/extensions) turns Lambda
# invocations into HTTP requests, so the app runs unchanged under uvicorn.
# Outside Lambda the extension is inert: `docker run -p 8000:8000` works locally.

FROM python:3.14-slim AS builder

COPY --from=ghcr.io/astral-sh/uv:0.12.1 /uv /usr/local/bin/uv

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy

WORKDIR /app

# Dependencies first so this layer is cached until pyproject.toml/uv.lock change.
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project

COPY . .
RUN uv sync --frozen --no-dev


FROM python:3.14-slim AS final

COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:0.9.1 /lambda-adapter /opt/extensions/lambda-adapter

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/app/.venv/bin:$PATH" \
    PORT=8000 \
    AWS_LWA_PORT=8000 \
    AWS_LWA_READINESS_CHECK_PATH=/health

COPY --from=builder /app/.venv /app/.venv
COPY --from=builder /app/main.py /app/alembic.ini /app/migrate.sh ./
COPY --from=builder /app/app ./app
COPY --from=builder /app/migrations ./migrations
COPY --from=builder /app/seeds ./seeds

# Lambda runs containers as a non-root user; match that locally.
RUN useradd --system --uid 10001 eventara
USER eventara

EXPOSE 8000

# --proxy-headers resolves the client IP from X-Forwarded-For, trusting only the
# adapter on loopback, so rate limits and audit logs see the caller's address.
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers", "--forwarded-allow-ips", "127.0.0.1"]
