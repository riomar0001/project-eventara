from arq.connections import RedisSettings

from app.infrastructure.messaging.jobs.email_jobs import send_email_job
from app.infrastructure.messaging.redis import get_redis_settings


async def startup(ctx: dict) -> None:
    """Runs once when the worker starts. Use to initialise shared resources."""
    pass


async def shutdown(ctx: dict) -> None:
    """Runs once when the worker stops. Use to clean up shared resources."""
    pass


class WorkerSettings:
    """ARQ worker configuration.

    Run the worker with:
        uv run arq app.infrastructure.messaging.worker.WorkerSettings

    Retry policy:
        Failed jobs are retried up to ``max_tries`` times.  Email jobs benefit
        from retries because transient SMTP errors (e.g. connection timeouts,
        temporary service unavailability) are common and self-resolving.
    """

    redis_settings: RedisSettings = get_redis_settings()
    on_startup = startup
    on_shutdown = shutdown
    max_tries: int = 3
    functions: list = [
        send_email_job,
    ]
