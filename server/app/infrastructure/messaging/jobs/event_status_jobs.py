"""ARQ background jobs for automatic event and event session status transitions.

These cron jobs run every minute and advance statuses based on wall-clock time,
eliminating the need for any application-side polling.  Each job opens its own
database session so it is fully self-contained and independent of the request
lifecycle.

Concurrency note:
    Both jobs issue bulk UPDATE statements with time-bounded WHERE clauses.
    If two worker instances execute simultaneously (e.g. during a rolling
    deployment), the second will find zero matching rows and commit a no-op —
    no duplicate transitions or data corruption can occur.  No per-row locking
    is needed because the atomic WHERE filter acts as a natural guard: only rows
    that genuinely meet the transition condition are updated.
"""

from datetime import UTC, datetime

from app.domain.entities.audit_log import ActionType, AuditLog, AuditLogStatus
from app.infrastructure.database.repositories.audit_log_repository import AuditLogRepository
from app.infrastructure.database.repositories.event_repository import EventRepository
from app.infrastructure.database.session import AsyncSessionLocal


async def sync_event_session_statuses_job(ctx: dict) -> None:
    """ARQ cron job that advances event session statuses based on their scheduled windows.

    Transitions in order:
      - ``POSTED`` → ``STARTED`` for sessions whose start window has arrived.
      - ``STARTED`` → ``ENDED`` for sessions whose end window has passed.

    Runs every minute (``second={0}`` in ``WorkerSettings.cron_jobs``).  Both
    passes execute within a single database transaction so a failure in the
    second pass rolls back the first, preserving consistency.

    Args:
        ctx: ARQ worker context injected by the framework; not used directly.
    """
    async with AsyncSessionLocal() as db:
        repo = EventRepository(db)
        audit_repo = AuditLogRepository(db)
        now = datetime.now(UTC)

        started_count, ended_count = await repo.bulk_update_session_statuses(now)

        if started_count > 0 or ended_count > 0:
            await audit_repo.create(
                AuditLog(
                    user_id=None,
                    ip_address=None,
                    user_agent=None,
                    action_type=ActionType.UPDATE,
                    resource_type="event_sessions",
                    resource_id=None,
                    status=AuditLogStatus.SUCCESS,
                    old_values=None,
                    new_values=None,
                    additional_context={
                        "trigger": "cron",
                        "job": "sync_event_session_statuses",
                        "sessions_started": started_count,
                        "sessions_ended": ended_count,
                        "evaluated_at": now.isoformat(),
                    },
                )
            )

        await db.commit()


async def sync_event_statuses_job(ctx: dict) -> None:
    """ARQ cron job that advances event statuses based on their scheduled date windows.

    Transitions in order:
      - ``POSTED`` → ``STARTED`` for events whose start date has arrived.
      - ``STARTED`` → ``ENDED`` for events whose end date has passed.

    Runs every minute (``second={0}`` in ``WorkerSettings.cron_jobs``).  Both
    passes execute within a single database transaction so a failure in the
    second pass rolls back the first, preserving consistency.

    Args:
        ctx: ARQ worker context injected by the framework; not used directly.
    """
    async with AsyncSessionLocal() as db:
        repo = EventRepository(db)
        audit_repo = AuditLogRepository(db)
        now = datetime.now(UTC)

        started_count, ended_count = await repo.bulk_update_event_statuses(now)

        if started_count > 0 or ended_count > 0:
            await audit_repo.create(
                AuditLog(
                    user_id=None,
                    ip_address=None,
                    user_agent=None,
                    action_type=ActionType.UPDATE,
                    resource_type="events",
                    resource_id=None,
                    status=AuditLogStatus.SUCCESS,
                    old_values=None,
                    new_values=None,
                    additional_context={
                        "trigger": "cron",
                        "job": "sync_event_statuses",
                        "events_started": started_count,
                        "events_ended": ended_count,
                        "evaluated_at": now.isoformat(),
                    },
                )
            )

        await db.commit()
