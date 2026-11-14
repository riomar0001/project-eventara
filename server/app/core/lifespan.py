import asyncio
import logging
from contextlib import asynccontextmanager, suppress

from fastapi import FastAPI

from app.core.config import settings
from app.core.startup_checks import verify_connections
from app.infrastructure.messaging.dead_jobs import DeadJobStore
from app.infrastructure.messaging.job_queue import LocalJobQueue, SqsJobQueue
from app.infrastructure.messaging.redis import create_redis_client
from app.infrastructure.messaging.worker import run_local_job, run_local_scheduler

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.redis = await create_redis_client()
    await verify_connections(app.state.redis)

    scheduler_task: asyncio.Task | None = None
    if settings.JOB_QUEUE_URL:
        app.state.jobs = SqsJobQueue(settings.JOB_QUEUE_URL)
    else:
        logger.warning("JOB_QUEUE_URL is unset: running background jobs and schedules in-process (local development)")
        redis, dead_jobs = app.state.redis, DeadJobStore(app.state.redis)
        # The executor hands the queue itself to jobs that enqueue follow-up work.
        app.state.jobs = LocalJobQueue(lambda message: run_local_job(message, redis=redis, dead_jobs=dead_jobs, jobs=app.state.jobs))
        scheduler_task = asyncio.create_task(run_local_scheduler(app.state.jobs))

    try:
        yield
    finally:
        if scheduler_task is not None:
            scheduler_task.cancel()
            with suppress(asyncio.CancelledError):
                await scheduler_task
        await app.state.jobs.aclose()
        await app.state.redis.aclose()
