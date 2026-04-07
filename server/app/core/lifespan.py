import asyncio
from contextlib import asynccontextmanager, suppress

from arq import Worker
from fastapi import FastAPI

from app.infrastructure.messaging.redis import create_arq_pool, create_redis_client
from app.infrastructure.messaging.worker import WorkerSettings, shutdown, startup


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.arq = await create_arq_pool()
    app.state.redis = await create_redis_client()

    worker = Worker(
        functions=WorkerSettings.functions,
        cron_jobs=WorkerSettings.cron_jobs,
        redis_settings=WorkerSettings.redis_settings,
        on_startup=startup,
        on_shutdown=shutdown,
        max_tries=WorkerSettings.max_tries,
        handle_signals=False,
    )
    worker_task = asyncio.create_task(worker.main())

    yield

    worker_task.cancel()
    with suppress(asyncio.CancelledError):
        await worker_task
    await app.state.arq.aclose()
    await app.state.redis.aclose()
