"""Background job queue interfaces — enqueue work and manage failed (dead) jobs."""

from dataclasses import dataclass
from datetime import timedelta
from typing import Any, Protocol

from app.application.dto.queue_dto import DeadJobInfo


@dataclass(frozen=True)
class QueueCounts:
    queue_name: str
    pending: int
    in_progress: int


class IJobQueue(Protocol):
    async def enqueue_job(
        self,
        function: str,
        *args: Any,
        _job_id: str | None = None,
        _expires: timedelta | None = None,
        **kwargs: Any,
    ) -> str:
        """Queue ``function(*args, **kwargs)`` for the worker and return the job id."""
        ...

    async def counts(self) -> QueueCounts: ...


class IDeadJobStore(Protocol):
    async def count(self) -> int: ...

    async def completed_count(self) -> int: ...

    async def list_page(self, offset: int, limit: int) -> tuple[list[DeadJobInfo], int]: ...

    async def get(self, job_id: str) -> DeadJobInfo | None: ...

    async def delete(self, job_id: str) -> bool: ...

    async def purge(self) -> int: ...

    async def acquire_retry_lock(self, job_id: str) -> bool: ...

    async def release_retry_lock(self, job_id: str) -> None: ...
