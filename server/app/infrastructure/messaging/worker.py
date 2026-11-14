"""Background job worker: job registry, retry policy and SQS batch processing.

On AWS, the worker Lambda (``app.worker_app``) receives SQS batches and calls
``process_sqs_records``. EventBridge Scheduler sends the periodic jobs in
``LOCAL_SCHEDULES`` to the same queue (see ``infra/terraform/scheduler.tf``).

Locally (``JOB_QUEUE_URL`` unset), ``LocalJobQueue`` calls ``run_local_job`` and
``run_local_scheduler`` replaces EventBridge.

Retry policy: a job runs up to ``JOB_MAX_TRIES`` times with exponential
backoff. Its final failure is written to ``DeadJobStore`` and the message is
acknowledged; if that write fails the message is left to SQS, whose redrive
policy moves it to the dead-letter queue.
"""

import asyncio
import logging
from collections.abc import Awaitable, Callable
from datetime import UTC, datetime, timedelta

from redis.asyncio import Redis

from app.application.dto.queue_dto import DeadJobInfo
from app.application.interfaces.job_queue_interface import IJobQueue
from app.core.config import settings
from app.infrastructure.messaging.dead_jobs import DeadJobStore
from app.infrastructure.messaging.job_queue import JobMessage, LocalJobQueue, SqsJobQueue
from app.infrastructure.messaging.jobs.account_deletion_jobs import finalize_due_account_deletions_job
from app.infrastructure.messaging.jobs.audit_log_jobs import persist_audit_log
from app.infrastructure.messaging.jobs.email_jobs import send_email_job
from app.infrastructure.messaging.jobs.event_status_jobs import sync_event_session_statuses_job, sync_event_statuses_job
from app.infrastructure.messaging.jobs.session_reminder_jobs import send_session_reminders_job
from app.infrastructure.messaging.jobs.token_jobs import revoke_expired_tokens_job

logger = logging.getLogger(__name__)

JobFunc = Callable[..., Awaitable[None]]

JOBS: dict[str, JobFunc] = {
    "finalize_due_account_deletions_job": finalize_due_account_deletions_job,
    "persist_audit_log": persist_audit_log,
    "revoke_expired_tokens_job": revoke_expired_tokens_job,
    "send_email_job": send_email_job,
    "send_session_reminders_job": send_session_reminders_job,
    "sync_event_session_statuses_job": sync_event_session_statuses_job,
    "sync_event_statuses_job": sync_event_statuses_job,
}

# Periodic jobs, checked once per minute (UTC). Keep in sync with scheduler.tf.
LOCAL_SCHEDULES: list[tuple[str, Callable[[datetime], bool]]] = [
    ("sync_event_session_statuses_job", lambda now: True),
    ("sync_event_statuses_job", lambda now: True),
    ("finalize_due_account_deletions_job", lambda now: now.minute % 5 == 0),
    ("send_session_reminders_job", lambda now: now.minute % 15 == 0),
    ("revoke_expired_tokens_job", lambda now: now.hour == 0 and now.minute == 0),
]


class UnknownJobError(Exception):
    def __init__(self, function: str) -> None:
        super().__init__(f"No job registered as '{function}'")


def retry_delay_seconds(attempt: int) -> int:
    """Exponential backoff for the next attempt, capped at 15 minutes."""
    return min(settings.JOB_RETRY_BASE_SECONDS * 2 ** max(0, attempt - 1), 900)


async def execute_job(message: JobMessage, *, attempt: int, redis: Redis, jobs: IJobQueue | None = None) -> None:
    """Run one job. Raises whatever the job raises.

    ``jobs`` is exposed to jobs that enqueue follow-up work (e.g. reminder emails).
    """
    func = JOBS.get(message.function)
    if func is None:
        raise UnknownJobError(message.function)
    if message.is_expired():
        logger.warning("Skipping expired job %s (%s)", message.job_id, message.function)
        return
    ctx = {"job_id": message.job_id, "job_try": attempt, "redis": redis, "jobs": jobs}
    await func(ctx, *message.args, **message.kwargs)


def _dead_job(message: JobMessage, attempt: int, exc: BaseException) -> DeadJobInfo:
    return DeadJobInfo(
        job_id=message.job_id,
        function=message.function,
        args=message.args,
        kwargs=message.kwargs,
        job_try=attempt,
        enqueue_time=message.enqueued_at,
        finish_time=datetime.now(UTC),
        error=repr(exc),
    )


async def _mark_completed(dead_jobs: DeadJobStore) -> None:
    try:
        await dead_jobs.incr_completed()
    except Exception:
        # Only feeds the dashboard counter; never fail a finished job over it.
        logger.warning("Could not increment completed-jobs counter", exc_info=True)


def _receive_count(record: dict) -> int:
    raw = str(record.get("attributes", {}).get("ApproximateReceiveCount", "1"))
    return int(raw) if raw.isdigit() and int(raw) > 0 else 1


async def process_sqs_records(
    records: list[dict],
    *,
    redis: Redis,
    dead_jobs: DeadJobStore,
    queue: SqsJobQueue | None = None,
) -> list[str]:
    """Run each SQS record's job and return the message ids SQS should redeliver."""
    failures: list[str] = []
    for record in records:
        message_id = record.get("messageId")
        if not message_id:
            logger.error("Dropping SQS record without messageId")
            continue

        try:
            message = JobMessage.from_json(record.get("body", ""))
        except ValueError as exc:
            # A malformed body will never succeed; park it for an admin to inspect.
            message = JobMessage(function="<invalid message>", job_id=message_id)
            if not await _try_record_dead(dead_jobs, message, 1, exc):
                failures.append(message_id)
            continue

        attempt = _receive_count(record)
        try:
            await execute_job(message, attempt=attempt, redis=redis, jobs=queue)
        except Exception as exc:
            logger.exception("Job %s (%s) failed on attempt %d", message.job_id, message.function, attempt)
            final = attempt >= settings.JOB_MAX_TRIES or isinstance(exc, UnknownJobError)
            if final and await _try_record_dead(dead_jobs, message, attempt, exc):
                continue
            failures.append(message_id)
            if not final and queue is not None and record.get("receiptHandle"):
                try:
                    await queue.delay_retry(record["receiptHandle"], retry_delay_seconds(attempt))
                except Exception:
                    # Backoff is an optimisation; SQS's visibility timeout still retries it.
                    logger.warning("Could not set retry backoff for %s", message.job_id, exc_info=True)
            continue

        await _mark_completed(dead_jobs)
    return failures


async def _try_record_dead(dead_jobs: DeadJobStore, message: JobMessage, attempt: int, exc: BaseException) -> bool:
    try:
        await dead_jobs.record(_dead_job(message, attempt, exc))
        return True
    except Exception:
        logger.exception("Could not record dead job %s; leaving it to the SQS DLQ", message.job_id)
        return False


async def run_local_job(message: JobMessage, *, redis: Redis, dead_jobs: DeadJobStore, jobs: IJobQueue | None = None) -> None:
    """Local-dev executor with the same retry and dead-letter behaviour as SQS."""
    for attempt in range(1, settings.JOB_MAX_TRIES + 1):
        try:
            await execute_job(message, attempt=attempt, redis=redis, jobs=jobs)
        except asyncio.CancelledError:
            raise
        except Exception as exc:
            logger.exception("Job %s (%s) failed on attempt %d", message.job_id, message.function, attempt)
            if attempt >= settings.JOB_MAX_TRIES or isinstance(exc, UnknownJobError):
                await _try_record_dead(dead_jobs, message, attempt, exc)
                return
            # Short local backoff; production uses retry_delay_seconds via SQS.
            await asyncio.sleep(min(2**attempt, 30))
            continue
        await _mark_completed(dead_jobs)
        return


async def run_local_scheduler(queue: LocalJobQueue) -> None:
    """Enqueue ``LOCAL_SCHEDULES`` at the top of every UTC minute until cancelled."""
    while True:
        now = datetime.now(UTC)
        next_minute = (now + timedelta(minutes=1)).replace(second=0, microsecond=0)
        await asyncio.sleep((next_minute - now).total_seconds())
        for function, is_due in LOCAL_SCHEDULES:
            if not is_due(next_minute):
                continue
            try:
                await queue.enqueue_job(function)
            except Exception:
                logger.exception("Could not enqueue scheduled job %s", function)
