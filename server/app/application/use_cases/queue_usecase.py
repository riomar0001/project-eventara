"""Use cases for ARQ queue inspection and dead-letter queue management.

ARQ stores job data in Redis under well-known key prefixes:
  - ``arq:queue``              — pending jobs (sorted set, score = enqueue timestamp)
  - ``arq:in-progress:{id}``   — currently executing jobs (string keys with TTL)
  - ``arq:result:{id}``        — finished job results, serialised with pickle
  - ``arq:queue:health-check`` — worker heartbeat entries (sorted set)

A job is considered *dead* when its result exists (``arq:result:{id}``) and
``JobResult.success is False``.  ARQ does not retry a job beyond ``max_tries``
— the final failure is written to the result key and the job is effectively
dropped from the active queue, forming a natural dead-letter store.

Concurrency strategy — distributed Redis lock for retry:
  ``RetryDeadJobUseCase`` issues a ``SET NX EX`` lock on
  ``arq:dlq:retry-lock:{job_id}`` before touching the result key.
  This prevents two concurrent HTTP requests from double-enqueuing the same
  failed job.  The lock TTL (30 s) acts as a deadlock safeguard should the
  handler crash after acquiring it.  The lock is always released in a
  ``finally`` block so it never outlives the request.  All other operations
  (list, delete, purge) are either read-only or use atomic Redis ``DEL``,
  which is inherently safe under concurrency.
"""

import re

from arq.connections import ArqRedis
from arq.jobs import Job

from app.application.dto.queue_dto import (
    DeadJobInfo,
    DeleteJobOutput,
    ListDeadJobsOutput,
    PurgeDeadJobsOutput,
    QueueStatsOutput,
    RetryJobOutput,
    WorkerHealthEntry,
)
from app.domain.exceptions.queue_exceptions import (
    JobNotDeadError,
    JobNotFoundError,
    JobRetryConflictError,
    QueueInspectionError,
)

_RESULT_KEY_PREFIX = "arq:result:"
_IN_PROGRESS_KEY_PREFIX = "arq:in-progress:"
_DEFAULT_QUEUE_NAME = "arq:queue"
_HEALTH_CHECK_KEY = "arq:queue:health-check"
_DLQ_RETRY_LOCK_PREFIX = "arq:dlq:retry-lock:"
_RETRY_LOCK_TTL = 30

_HEALTH_RE = re.compile(
    r"(\S+\s+\S+)\s+j_complete=(\d+)\s+j_failed=(\d+)\s+j_retried=(\d+)\s+j_ongoing=(\d+)\s+queued=(\d+)"
)


def _decode(value: bytes | str) -> str:
    return value.decode() if isinstance(value, bytes) else value


def _parse_health_entry(raw: str) -> WorkerHealthEntry:
    m = _HEALTH_RE.match(raw)
    if m:
        return WorkerHealthEntry(
            raw=raw,
            timestamp=m.group(1),
            j_complete=int(m.group(2)),
            j_failed=int(m.group(3)),
            j_retried=int(m.group(4)),
            j_ongoing=int(m.group(5)),
            queued=int(m.group(6)),
        )
    return WorkerHealthEntry(
        raw=raw, timestamp=None, j_complete=0, j_failed=0, j_retried=0, j_ongoing=0, queued=0
    )


def _safe_list(value) -> list:
    try:
        return list(value)
    except Exception:
        return [str(v) for v in value]


class GetQueueStatsUseCase:
    """Returns a snapshot of queue activity by inspecting Redis directly.

    Counts are derived from three sources:
    - Pending jobs  → ``ZCARD arq:queue``
    - In-progress   → number of ``arq:in-progress:*`` keys alive in Redis
    - Results       → scan of ``arq:result:*`` keys, partitioned by
                       ``JobResult.success``

    Worker health entries are read from the ``arq:queue:health-check``
    sorted set and parsed into structured objects.

    Note: scanning ``arq:result:*`` is O(n) in the number of stored results.
    ARQ's default result TTL caps this set, so the operation remains fast
    under normal workloads.

    Args:
        redis: ARQ connection pool bound to the application lifecycle.

    Returns:
        ``QueueStatsOutput`` with live counters and health entries.

    Raises:
        ``QueueInspectionError`` on Redis communication failures.
    """

    def __init__(self, redis: ArqRedis) -> None:
        self.redis = redis

    async def execute(self) -> QueueStatsOutput:
        try:
            pending = await self.redis.zcard(_DEFAULT_QUEUE_NAME)

            in_progress = 0
            async for _ in self.redis.scan_iter(match=f"{_IN_PROGRESS_KEY_PREFIX}*"):
                in_progress += 1

            total_failed = 0
            total_completed = 0
            async for key in self.redis.scan_iter(match=f"{_RESULT_KEY_PREFIX}*"):
                job_id = _decode(key).replace(_RESULT_KEY_PREFIX, "")
                info = await Job(job_id, self.redis).result_info()
                if info is not None:
                    if info.success:
                        total_completed += 1
                    else:
                        total_failed += 1

            raw_entries = await self.redis.zrange(_HEALTH_CHECK_KEY, 0, -1)
            worker_health = [_parse_health_entry(_decode(e)) for e in raw_entries]

            return QueueStatsOutput(
                queue_name=_DEFAULT_QUEUE_NAME,
                pending=pending,
                in_progress=in_progress,
                total_failed=total_failed,
                total_completed=total_completed,
                worker_health=worker_health,
            )
        except Exception as exc:
            raise QueueInspectionError(f"Failed to inspect queue state: {exc}") from exc


class ListDeadJobsUseCase:
    """Retrieves all jobs whose final execution ended in failure.

    Scans ``arq:result:*`` and filters entries where ``JobResult.success``
    is ``False``.  Each entry is deserialised via ARQ's ``Job.result_info()``
    helper, which handles pickle decoding transparently.

    Args:
        redis: ARQ connection pool.

    Returns:
        ``ListDeadJobsOutput`` containing the list and total count.

    Raises:
        ``QueueInspectionError`` on Redis or deserialisation failures.
    """

    def __init__(self, redis: ArqRedis) -> None:
        self.redis = redis

    async def execute(self) -> ListDeadJobsOutput:
        dead: list[DeadJobInfo] = []
        try:
            async for key in self.redis.scan_iter(match=f"{_RESULT_KEY_PREFIX}*"):
                job_id = _decode(key).replace(_RESULT_KEY_PREFIX, "")
                info = await Job(job_id, self.redis).result_info()
                if info is not None and not info.success:
                    dead.append(
                        DeadJobInfo(
                            job_id=job_id,
                            function=info.function,
                            args=_safe_list(info.args),
                            kwargs=info.kwargs or {},
                            job_try=info.job_try,
                            enqueue_time=info.enqueue_time,
                            finish_time=info.finish_time,
                            error=str(info.result) if info.result is not None else "Unknown error",
                        )
                    )
        except Exception as exc:
            raise QueueInspectionError(f"Failed to list dead jobs: {exc}") from exc
        return ListDeadJobsOutput(jobs=dead, total=len(dead))


class RetryDeadJobUseCase:
    """Re-enqueues a failed job and removes it from the dead-letter store.

    Concurrency control: acquires ``SET NX EX 30`` on
    ``arq:dlq:retry-lock:{job_id}`` before any read-modify-write operation.
    This serialises concurrent retry requests for the same job ID across all
    running API instances.  The lock is unconditionally released in a
    ``finally`` block.

    After a successful re-enqueue the original ``arq:result:{job_id}`` key is
    deleted so the job no longer appears in the DLQ.  The new job receives a
    fresh ``job_id`` and a reset retry counter, giving it the full
    ``max_tries`` quota.

    Args:
        redis: ARQ connection pool.

    Returns:
        ``RetryJobOutput`` with the original and new job IDs.

    Raises:
        ``JobNotFoundError``      — result key absent or expired.
        ``JobNotDeadError``       — job succeeded and is not in the DLQ.
        ``JobRetryConflictError`` — concurrent retry already in progress.
        ``QueueInspectionError``  — unexpected Redis or ARQ error.
    """

    def __init__(self, redis: ArqRedis) -> None:
        self.redis = redis

    async def execute(self, job_id: str) -> RetryJobOutput:
        lock_key = f"{_DLQ_RETRY_LOCK_PREFIX}{job_id}"
        acquired = await self.redis.set(lock_key, "1", nx=True, ex=_RETRY_LOCK_TTL)
        if not acquired:
            raise JobRetryConflictError(job_id)

        try:
            info = await Job(job_id, self.redis).result_info()

            if info is None:
                raise JobNotFoundError(job_id)
            if info.success:
                raise JobNotDeadError(job_id)

            new_job = await self.redis.enqueue_job(info.function, *info.args, **info.kwargs)
            await self.redis.delete(f"{_RESULT_KEY_PREFIX}{job_id}")

            return RetryJobOutput(
                original_job_id=job_id,
                new_job_id=new_job.job_id if new_job else job_id,
                function=info.function,
            )
        except (JobNotFoundError, JobNotDeadError, JobRetryConflictError):
            raise
        except Exception as exc:
            raise QueueInspectionError(f"Failed to retry job '{job_id}': {exc}") from exc
        finally:
            await self.redis.delete(lock_key)


class DeleteDeadJobUseCase:
    """Permanently removes a single failed job from the dead-letter store.

    Deletes the ``arq:result:{job_id}`` key after confirming the job exists
    and has ``success=False``.  The ``DEL`` command is atomic in Redis, so
    no additional locking is required for a simple delete.

    Args:
        redis: ARQ connection pool.

    Returns:
        ``DeleteJobOutput`` confirming the deletion.

    Raises:
        ``JobNotFoundError`` — result key absent or expired.
        ``JobNotDeadError``  — job succeeded and should not be deleted via DLQ.
        ``QueueInspectionError`` — unexpected Redis error.
    """

    def __init__(self, redis: ArqRedis) -> None:
        self.redis = redis

    async def execute(self, job_id: str) -> DeleteJobOutput:
        try:
            info = await Job(job_id, self.redis).result_info()

            if info is None:
                raise JobNotFoundError(job_id)
            if info.success:
                raise JobNotDeadError(job_id)

            deleted = await self.redis.delete(f"{_RESULT_KEY_PREFIX}{job_id}")
            return DeleteJobOutput(job_id=job_id, deleted=bool(deleted))
        except (JobNotFoundError, JobNotDeadError):
            raise
        except Exception as exc:
            raise QueueInspectionError(f"Failed to delete job '{job_id}': {exc}") from exc


class PurgeDeadJobsUseCase:
    """Bulk-deletes all failed jobs from the dead-letter store in one operation.

    Collects all ``arq:result:*`` keys where ``success=False``, then issues a
    single ``DEL`` call with all matching keys for efficiency.  Because the
    scan and delete are not wrapped in a transaction, a job that transitions
    from in-progress to failed between the scan and the delete will not be
    caught by this purge — it will be eligible on the next purge call.  This
    is an acceptable trade-off for a bulk maintenance operation.

    Args:
        redis: ARQ connection pool.

    Returns:
        ``PurgeDeadJobsOutput`` with the total number of keys deleted.

    Raises:
        ``QueueInspectionError`` on Redis failures.
    """

    def __init__(self, redis: ArqRedis) -> None:
        self.redis = redis

    async def execute(self) -> PurgeDeadJobsOutput:
        keys_to_delete: list = []
        try:
            async for key in self.redis.scan_iter(match=f"{_RESULT_KEY_PREFIX}*"):
                job_id = _decode(key).replace(_RESULT_KEY_PREFIX, "")
                info = await Job(job_id, self.redis).result_info()
                if info is not None and not info.success:
                    keys_to_delete.append(key)

            if keys_to_delete:
                await self.redis.delete(*keys_to_delete)

            return PurgeDeadJobsOutput(deleted_count=len(keys_to_delete))
        except Exception as exc:
            raise QueueInspectionError(f"Failed to purge dead jobs: {exc}") from exc
