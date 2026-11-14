"""Redis store for jobs that exhausted their retries.

SQS cannot be browsed or paginated, so the worker records each job's final
failure here; the admin Queues page lists, retries and deletes from this store.
The SQS dead-letter queue still exists as a backstop for crashes and timeouts.

Keys:
  ``jobs:dead:{job_id}``       JSON record, expires after ``DEAD_JOB_TTL``
  ``jobs:dead:index``          sorted set of job ids scored by failure time
  ``jobs:stats:completed``     counter of successfully finished jobs
  ``jobs:dead:retry-lock:{id}`` short lock preventing double retries
"""

import json
from datetime import UTC, datetime, timedelta

from redis.asyncio import Redis

from app.application.dto.queue_dto import DeadJobInfo

DEAD_JOB_TTL = timedelta(days=14)
_RECORD_PREFIX = "jobs:dead:"
_INDEX_KEY = "jobs:dead:index"
_COMPLETED_KEY = "jobs:stats:completed"
_LOCK_PREFIX = "jobs:dead:retry-lock:"
_LOCK_TTL_SECONDS = 30
_PURGE_CHUNK = 500


def _serialize(info: DeadJobInfo) -> str:
    return json.dumps(
        {
            "job_id": info.job_id,
            "function": info.function,
            "args": info.args,
            "kwargs": info.kwargs,
            "job_try": info.job_try,
            "enqueue_time": info.enqueue_time.isoformat(),
            "finish_time": info.finish_time.isoformat() if info.finish_time else None,
            "error": info.error,
        }
    )


def _deserialize(raw: str) -> DeadJobInfo:
    data = json.loads(raw)
    return DeadJobInfo(
        job_id=data["job_id"],
        function=data["function"],
        args=list(data.get("args") or []),
        kwargs=dict(data.get("kwargs") or {}),
        job_try=int(data.get("job_try") or 1),
        enqueue_time=datetime.fromisoformat(data["enqueue_time"]),
        finish_time=datetime.fromisoformat(data["finish_time"]) if data.get("finish_time") else None,
        error=str(data.get("error") or "Unknown error"),
    )


class DeadJobStore:
    def __init__(self, redis: Redis) -> None:
        self.redis = redis

    async def record(self, info: DeadJobInfo) -> None:
        finished = info.finish_time or datetime.now(UTC)
        async with self.redis.pipeline(transaction=True) as pipe:
            pipe.set(f"{_RECORD_PREFIX}{info.job_id}", _serialize(info), ex=int(DEAD_JOB_TTL.total_seconds()))
            pipe.zadd(_INDEX_KEY, {info.job_id: finished.timestamp()})
            await pipe.execute()

    async def _prune_expired(self) -> None:
        cutoff = (datetime.now(UTC) - DEAD_JOB_TTL).timestamp()
        await self.redis.zremrangebyscore(_INDEX_KEY, "-inf", cutoff)

    async def count(self) -> int:
        await self._prune_expired()
        return int(await self.redis.zcard(_INDEX_KEY))

    async def list_page(self, offset: int, limit: int) -> tuple[list[DeadJobInfo], int]:
        offset, limit = max(0, offset), max(1, limit)
        await self._prune_expired()
        total = int(await self.redis.zcard(_INDEX_KEY))
        job_ids = await self.redis.zrevrange(_INDEX_KEY, offset, offset + limit - 1)
        if not job_ids:
            return [], total
        raws = await self.redis.mget([f"{_RECORD_PREFIX}{job_id}" for job_id in job_ids])
        jobs = [_deserialize(raw) for raw in raws if raw]
        missing = [job_id for job_id, raw in zip(job_ids, raws, strict=True) if not raw]
        if missing:
            await self.redis.zrem(_INDEX_KEY, *missing)
        return jobs, total

    async def get(self, job_id: str) -> DeadJobInfo | None:
        raw = await self.redis.get(f"{_RECORD_PREFIX}{job_id}")
        return _deserialize(raw) if raw else None

    async def delete(self, job_id: str) -> bool:
        async with self.redis.pipeline(transaction=True) as pipe:
            pipe.delete(f"{_RECORD_PREFIX}{job_id}")
            pipe.zrem(_INDEX_KEY, job_id)
            deleted, _ = await pipe.execute()
        return bool(deleted)

    async def purge(self) -> int:
        job_ids = await self.redis.zrange(_INDEX_KEY, 0, -1)
        for start in range(0, len(job_ids), _PURGE_CHUNK):
            chunk = job_ids[start : start + _PURGE_CHUNK]
            await self.redis.delete(*(f"{_RECORD_PREFIX}{job_id}" for job_id in chunk))
            await self.redis.zrem(_INDEX_KEY, *chunk)
        return len(job_ids)

    async def incr_completed(self) -> None:
        await self.redis.incr(_COMPLETED_KEY)

    async def completed_count(self) -> int:
        value = await self.redis.get(_COMPLETED_KEY)
        return int(value) if value and str(value).isdigit() else 0

    async def acquire_retry_lock(self, job_id: str) -> bool:
        return bool(await self.redis.set(f"{_LOCK_PREFIX}{job_id}", "1", nx=True, ex=_LOCK_TTL_SECONDS))

    async def release_retry_lock(self, job_id: str) -> None:
        await self.redis.delete(f"{_LOCK_PREFIX}{job_id}")
