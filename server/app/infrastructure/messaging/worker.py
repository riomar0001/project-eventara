from datetime import timedelta

from arq import cron, func
from arq.connections import RedisSettings

from app.infrastructure.messaging.jobs.account_deletion_jobs import finalize_account_deletion_job
from app.infrastructure.messaging.jobs.audit_log_jobs import persist_audit_log
from app.infrastructure.messaging.jobs.email_jobs import send_email_job
from app.infrastructure.messaging.jobs.event_status_jobs import sync_event_session_statuses_job, sync_event_statuses_job
from app.infrastructure.messaging.jobs.token_jobs import revoke_expired_tokens_job
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

    Cron jobs:
        ``revoke_expired_tokens_job`` fires daily at 00:00:00 UTC (midnight).
        ARQ schedules against the worker process's system clock, so the
        worker must run with ``TZ=UTC`` (or an equivalent UTC-pinned
        environment) for the trigger time to match wall-clock UTC midnight.
        ARQ's ``unique=True`` default ensures only one instance of the job
        is enqueued at a time, so a slow run cannot stack with the next
        scheduled invocation.

        ``sync_event_session_statuses_job`` and ``sync_event_statuses_job``
        fire every minute at second 0.  They advance session and event
        statuses (POSTED → STARTED, STARTED → ENDED) using atomic bulk
        UPDATE statements, so concurrent worker instances produce no
        duplicate transitions.
    """

    redis_settings: RedisSettings = get_redis_settings()
    on_startup = startup
    on_shutdown = shutdown
    max_tries: int = 3
    functions: list = [
        func(finalize_account_deletion_job, keep_result=timedelta(days=2)),
        func(send_email_job, keep_result=timedelta(hours=12)),
        persist_audit_log,
    ]
    cron_jobs: list = [
        cron(revoke_expired_tokens_job, hour={0}, minute={0}),
        cron(sync_event_session_statuses_job, second={0}),
        cron(sync_event_statuses_job, second={0}),
    ]
