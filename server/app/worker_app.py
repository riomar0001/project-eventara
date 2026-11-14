"""Worker Lambda entrypoint.

The image runs ``uvicorn app.worker_app:app`` on loopback. AWS Lambda Web
Adapter POSTs every Lambda event to ``/events`` (``AWS_LWA_PASS_THROUGH_PATH``)
and returns this app's JSON response as the function result. That keeps one
long-lived event loop per container, so the database and Redis pools survive
between invocations.

Supported events:
  - SQS batches: runs each job and reports partial batch failures.
  - ``{"task": "migrate"}``: runs Alembic migrations and the idempotent seeds.
    Only IAM principals allowed to invoke the function can trigger it.
"""

import asyncio
import logging
import subprocess
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request

from app.core.config import settings
from app.infrastructure.messaging.dead_jobs import DeadJobStore
from app.infrastructure.messaging.job_queue import SqsJobQueue
from app.infrastructure.messaging.redis import create_redis_client
from app.infrastructure.messaging.worker import process_sqs_records

logger = logging.getLogger(__name__)

_SERVER_ROOT = Path(__file__).resolve().parent.parent
_MIGRATE_SCRIPT = _SERVER_ROOT / "migrate.sh"
# Must stay below the worker Lambda timeout (see infra/terraform/lambda.tf).
_MIGRATE_TIMEOUT_SECONDS = 240


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.redis = await create_redis_client()
    app.state.dead_jobs = DeadJobStore(app.state.redis)
    app.state.queue = SqsJobQueue(settings.JOB_QUEUE_URL) if settings.JOB_QUEUE_URL else None
    try:
        yield
    finally:
        await app.state.redis.aclose()


app = FastAPI(title="Eventara worker", docs_url=None, redoc_url=None, openapi_url=None, lifespan=lifespan)


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}


def _run_migrations() -> dict:
    result = subprocess.run(
        ["sh", str(_MIGRATE_SCRIPT)],
        cwd=_SERVER_ROOT,
        capture_output=True,
        text=True,
        timeout=_MIGRATE_TIMEOUT_SECONDS,
        check=False,
    )
    output = (result.stdout + result.stderr)[-4000:]
    if result.returncode != 0:
        logger.error("Migration failed (exit %d): %s", result.returncode, output)
        raise HTTPException(status_code=500, detail={"task": "migrate", "exit_code": result.returncode, "output": output})
    logger.info("Migration finished: %s", output)
    return {"task": "migrate", "exit_code": 0, "output": output}


@app.post("/events")
async def handle_event(request: Request) -> dict:
    try:
        event = await request.json()
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Event body is not JSON") from exc
    if not isinstance(event, dict):
        raise HTTPException(status_code=400, detail="Event must be a JSON object")

    records = event.get("Records")
    if isinstance(records, list):
        sqs_records = [r for r in records if isinstance(r, dict) and r.get("eventSource") == "aws:sqs"]
        failures = await process_sqs_records(
            sqs_records,
            redis=request.app.state.redis,
            dead_jobs=request.app.state.dead_jobs,
            queue=request.app.state.queue,
        )
        return {"batchItemFailures": [{"itemIdentifier": message_id} for message_id in failures]}

    match event.get("task"):
        case "migrate":
            return await asyncio.to_thread(_run_migrations)
        case None:
            raise HTTPException(status_code=400, detail="Unrecognised event: expected SQS Records or a 'task'")
        case unknown:
            raise HTTPException(status_code=400, detail=f"Unknown task {unknown!r}")
