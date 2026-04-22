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
  ``retry_dead_job`` issues a ``SET NX EX`` lock on
  ``arq:dlq:retry-lock:{job_id}`` before touching the result key.
  This prevents two concurrent HTTP requests from double-enqueuing the same
  failed job.  The lock TTL (30 s) acts as a deadlock safeguard should the
  handler crash after acquiring it.  The lock is always released in a
  ``finally`` block so it never outlives the request.  All other operations
  (list, delete, purge) are either read-only or use atomic Redis ``DEL``,
  which is inherently safe under concurrency.
"""

import re
from collections.abc import Awaitable
from typing import cast

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
from app.core.config import settings
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

_HEALTH_RE = re.compile(r"(\S+\s+\S+)\s+j_complete=(\d+)\s+j_failed=(\d+)\s+j_retried=(\d+)\s+j_ongoing=(\d+)\s+queued=(\d+)")


def _decode(value: bytes | bytearray | memoryview | str) -> str:
    if isinstance(value, str):
        return value
    return bytes(value).decode()


def _decode_optional(value: bytes | str | None) -> str | None:
    if value is None:
        return None
    return _decode(value)


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
    return WorkerHealthEntry(raw=raw, timestamp=None, j_complete=0, j_failed=0, j_retried=0, j_ongoing=0, queued=0)


def _safe_list(value) -> list:
    try:
        return list(value)
    except Exception:
        return [str(v) for v in value]


async def _get_key_type(redis: ArqRedis, key: str) -> str:
    key_type = await redis.type(key)
    return _decode(key_type).lower()


async def _get_collection_size(redis: ArqRedis, key: str) -> int:
    key_type = await _get_key_type(redis, key)
    if key_type == "none":
        return 0
    if key_type == "zset":
        return await cast(Awaitable[int], redis.zcard(key))
    if key_type == "list":
        return await cast(Awaitable[int], redis.llen(key))
    if key_type == "set":
        return await cast(Awaitable[int], redis.scard(key))
    if key_type == "stream":
        return await cast(Awaitable[int], redis.xlen(key))
    if key_type == "hash":
        return await cast(Awaitable[int], redis.hlen(key))
    if key_type == "string":
        return 1 if await redis.get(key) is not None else 0
    return 0


async def _get_key_entries(redis: ArqRedis, key: str) -> list[str]:
    key_type = await _get_key_type(redis, key)
    if key_type == "none":
        return []
    if key_type == "zset":
        return [_decode(e) for e in await cast(Awaitable[list], redis.zrange(key, 0, -1))]
    if key_type == "list":
        return [_decode(e) for e in await cast(Awaitable[list], redis.lrange(key, 0, -1))]
    if key_type == "set":
        return sorted(_decode(e) for e in await cast(Awaitable[set], redis.smembers(key)))
    if key_type == "hash":
        return [_decode(e) for e in await cast(Awaitable[list], redis.hvals(key))]
    if key_type == "string":
        value = _decode_optional(await redis.get(key))
        return [value] if value else []
    return []


async def _get_health_entries(redis: ArqRedis) -> list[str]:
    entries: list[str] = []
    matched_keys: list[str] = []
    async for key in redis.scan_iter(match=f"{_HEALTH_CHECK_KEY}*"):
        matched_keys.append(_decode(key))
    if not matched_keys:
        matched_keys = [_HEALTH_CHECK_KEY]
    for key in matched_keys:
        entries.extend(await _get_key_entries(redis, key))
    return entries


class QueueUseCase:
    """Application service for ARQ queue inspection and dead-letter management.

    All operations query or mutate Redis directly via the ARQ connection pool.
    ``retry_dead_job`` uses a distributed ``SET NX EX`` lock to prevent
    concurrent double-enqueue of the same failed job.

    Args:
        redis: ARQ connection pool bound to the application lifecycle.
    """

    def __init__(self, redis: ArqRedis) -> None:
        self.redis = redis

    async def get_stats(self) -> QueueStatsOutput:
        """Return a live snapshot of queue activity.

        Counts pending, in-progress, completed, and failed jobs by scanning
        Redis directly.  Worker health entries are parsed from the
        ``arq:queue:health-check`` sorted set.

        Raises:
            QueueInspectionError: Redis communication failure.
        """
        try:
            pending = await _get_collection_size(self.redis, _DEFAULT_QUEUE_NAME)

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

            raw_entries = await _get_health_entries(self.redis)
            worker_health = [_parse_health_entry(e) for e in raw_entries]

            return QueueStatsOutput(
                queue_name=_DEFAULT_QUEUE_NAME,
                pending=pending,
                in_progress=in_progress,
                total_failed=total_failed,
                total_completed=total_completed,
                worker_health=worker_health,
            )
        except Exception as exc:
            msg = "Failed to inspect queue state"
            if settings.DEBUG:
                msg = f"Failed to inspect queue state: {exc}"
            raise QueueInspectionError(msg) from exc

    async def list_dead_jobs(self, page: int = 1, limit: int = 10) -> ListDeadJobsOutput:
        """Return paginated failed jobs from the dead-letter store.

        Scans ``arq:result:*`` and filters entries where
        ``JobResult.success is False``.

        Raises:
            QueueInspectionError: Redis or deserialisation failure.
        """
        dead: list[DeadJobInfo] = []
        try:
            async for key in self.redis.scan_iter(match=f"{_RESULT_KEY_PREFIX}*"):
                job_id = _decode(key).replace(_RESULT_KEY_PREFIX, "")
                info = await Job(job_id, self.redis).result_info()
                if info is not None and not info.success:
                    dead.append(DeadJobInfo(
                        job_id=job_id,
                        function=info.function,
                        args=_safe_list(info.args),
                        kwargs=info.kwargs or {},
                        job_try=info.job_try,
                        enqueue_time=info.enqueue_time,
                        finish_time=info.finish_time,
                        error=str(info.result) if info.result is not None else "Unknown error",
                    ))
        except Exception as exc:
            msg = "Failed to list dead jobs"
            if settings.DEBUG:
                msg = f"Failed to list dead jobs: {exc}"
            raise QueueInspectionError(msg) from exc

        total = len(dead)
        total_pages = max(1, -(-total // limit))
        offset = (page - 1) * limit
        return ListDeadJobsOutput(jobs=dead[offset:offset + limit], total=total, page=page, limit=limit, total_pages=total_pages)

    async def retry_dead_job(self, job_id: str) -> RetryJobOutput:
        """Re-enqueue a failed job and remove it from the dead-letter store.

        Acquires ``SET NX EX 30`` on ``arq:dlq:retry-lock:{job_id}`` before
        the read-modify-write sequence.  The lock is released unconditionally
        in a ``finally`` block.

        Raises:
            JobNotFoundError: Result key absent or expired.
            JobNotDeadError: Job succeeded and is not in the DLQ.
            JobRetryConflictError: Concurrent retry already in progress.
            QueueInspectionError: Unexpected Redis or ARQ error.
        """
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
            msg = "Failed to retry job"
            if settings.DEBUG:
                msg = f"Failed to retry job: {exc}"
            raise QueueInspectionError(msg) from exc
        finally:
            await self.redis.delete(lock_key)

    async def delete_dead_job(self, job_id: str) -> DeleteJobOutput:
        """Permanently remove a single failed job from the dead-letter store.

        Confirms the job exists and has ``success=False`` before issuing the
        atomic ``DEL`` command.

        Raises:
            JobNotFoundError: Result key absent or expired.
            JobNotDeadError: Job succeeded and is not a DLQ candidate.
            QueueInspectionError: Unexpected Redis error.
        """
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
            msg = "Failed to delete job"
            if settings.DEBUG:
                msg = f"Failed to delete job: {exc}"
            raise QueueInspectionError(msg) from exc

    async def purge_dead_jobs(self) -> PurgeDeadJobsOutput:
        """Bulk-delete all failed jobs from the dead-letter store.

        Collects all ``arq:result:*`` keys where ``success=False``, then
        issues a single ``DEL`` call for efficiency.  Jobs that transition
        from in-progress to failed between the scan and the delete will not
        be caught by this purge.

        Raises:
            QueueInspectionError: Redis scan or delete failure.
        """
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
            msg = "Failed to purge dead jobs"
            if settings.DEBUG:
                msg = f"Failed to purge dead jobs: {exc}"
            raise QueueInspectionError(msg) from exc
