import asyncio
from contextlib import asynccontextmanager, suppress

from fastapi import FastAPI

from app.core.config import settings
from app.core.startup_checks import verify_connections
from app.core.worker_runner import create_worker
from app.infrastructure.messaging.redis import create_arq_pool, create_redis_client


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.arq = await create_arq_pool()
    app.state.redis = await create_redis_client()

    await verify_connections(app.state.arq)

    worker_task = asyncio.create_task(create_worker().main()) if settings.RUN_EMBEDDED_WORKER else None

    try:
        yield
    finally:
        if worker_task is not None:
            worker_task.cancel()
            with suppress(asyncio.CancelledError):
                await worker_task
        await app.state.arq.aclose()
        await app.state.redis.aclose()
