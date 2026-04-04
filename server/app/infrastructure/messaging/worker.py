from arq.connections import RedisSettings

from app.core.config import settings
from app.infrastructure.messaging.redis import get_redis_settings

# Import job functions to register them with the worker
# from app.infrastructure.messaging.jobs.example import my_job


async def startup(ctx: dict) -> None:
    """Runs once when the worker starts. Use to initialise shared resources."""
    pass


async def shutdown(ctx: dict) -> None:
    """Runs once when the worker stops. Use to clean up shared resources."""
    pass


class WorkerSettings:
    """
    ARQ worker configuration.

    Run the worker with:
        uv run arq app.infrastructure.messaging.worker.WorkerSettings
    """

    redis_settings: RedisSettings = get_redis_settings()
    on_startup = startup
    on_shutdown = shutdown
    functions: list = [
        # Register job functions here, e.g.:
        # my_job,
    ]
