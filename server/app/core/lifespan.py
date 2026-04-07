import asyncio
from contextlib import asynccontextmanager, suppress

from fastapi import FastAPI

from app.core.startup_checks import verify_connections
from app.core.worker_runner import create_worker
from app.infrastructure.messaging.redis import create_arq_pool, create_redis_client


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.arq = await create_arq_pool()
    app.state.redis = await create_redis_client()

    await verify_connections(app.state.arq)

    worker = create_worker()
    worker_task = asyncio.create_task(worker.main())

    try:
        yield
    finally:
        worker_task.cancel()
        with suppress(asyncio.CancelledError):
            await worker_task
        await app.state.arq.aclose()
        await app.state.redis.aclose()
