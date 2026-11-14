"""Use cases for background job queue inspection and dead-letter management.

Live counts come from the job queue (SQS attributes, or the in-process queue
locally). Jobs that exhausted their retries are kept in the Redis-backed
dead-job store, which supports paging, retry and deletion; SQS itself cannot
be browsed.

Concurrency: ``retry_dead_job`` takes a short ``SET NX EX`` lock per job so two
concurrent requests cannot enqueue the same failed job twice. The lock is
released in ``finally`` and its TTL guards against a crashed request.
"""

from app.application.dto.queue_dto import (
    DeleteJobOutput,
    ListDeadJobsOutput,
    PurgeDeadJobsOutput,
    QueueStatsOutput,
    RetryJobOutput,
)
from app.application.interfaces.job_queue_interface import IDeadJobStore, IJobQueue
from app.core.config import settings
from app.domain.exceptions.queue_exceptions import (
    JobNotFoundError,
    JobRetryConflictError,
    QueueInspectionError,
)


def _inspection_error(action: str, exc: Exception) -> QueueInspectionError:
    return QueueInspectionError(f"{action}: {exc}" if settings.DEBUG else action)


class QueueUseCase:
    """Application service for queue statistics and dead-letter job management.

    Args:
        jobs:      Job queue used for live counts and to re-enqueue retried jobs.
        dead_jobs: Store of jobs whose final attempt failed.
    """

    def __init__(self, jobs: IJobQueue, dead_jobs: IDeadJobStore) -> None:
        self.jobs = jobs
        self.dead_jobs = dead_jobs

    async def get_stats(self) -> QueueStatsOutput:
        """Return a live snapshot of queue activity.

        Raises:
            QueueInspectionError: The queue or Redis could not be read.
        """
        try:
            counts = await self.jobs.counts()
            total_failed = await self.dead_jobs.count()
            total_completed = await self.dead_jobs.completed_count()
        except Exception as exc:
            raise _inspection_error("Failed to inspect queue state", exc) from exc

        return QueueStatsOutput(
            queue_name=counts.queue_name,
            pending=counts.pending,
            in_progress=counts.in_progress,
            total_failed=total_failed,
            total_completed=total_completed,
            # Lambda workers have no long-lived process to report heartbeats.
            worker_health=[],
        )

    async def list_dead_jobs(self, page: int = 1, limit: int = 10) -> ListDeadJobsOutput:
        """Return a page of failed jobs, newest failure first.

        Raises:
            QueueInspectionError: Redis read or deserialisation failure.
        """
        page, limit = max(1, page), max(1, limit)
        try:
            jobs, total = await self.dead_jobs.list_page((page - 1) * limit, limit)
        except Exception as exc:
            raise _inspection_error("Failed to list dead jobs", exc) from exc

        total_pages = max(1, -(-total // limit))
        return ListDeadJobsOutput(jobs=jobs, total=total, page=page, limit=limit, total_pages=total_pages)

    async def retry_dead_job(self, job_id: str) -> RetryJobOutput:
        """Re-enqueue a failed job and remove it from the dead-job store.

        Raises:
            JobNotFoundError: No failed job with that id (or it expired).
            JobRetryConflictError: Another retry of this job is in progress.
            QueueInspectionError: Unexpected Redis or queue error.
        """
        if not await self.dead_jobs.acquire_retry_lock(job_id):
            raise JobRetryConflictError(job_id)

        try:
            info = await self.dead_jobs.get(job_id)
            if info is None:
                raise JobNotFoundError(job_id)
            new_job_id = await self.jobs.enqueue_job(info.function, *info.args, **info.kwargs)
            await self.dead_jobs.delete(job_id)
            return RetryJobOutput(original_job_id=job_id, new_job_id=new_job_id, function=info.function)
        except JobNotFoundError:
            raise
        except Exception as exc:
            raise _inspection_error("Failed to retry job", exc) from exc
        finally:
            await self.dead_jobs.release_retry_lock(job_id)

    async def delete_dead_job(self, job_id: str) -> DeleteJobOutput:
        """Permanently remove one failed job.

        Raises:
            JobNotFoundError: No failed job with that id (or it expired).
            QueueInspectionError: Unexpected Redis error.
        """
        try:
            if await self.dead_jobs.get(job_id) is None:
                raise JobNotFoundError(job_id)
            deleted = await self.dead_jobs.delete(job_id)
        except JobNotFoundError:
            raise
        except Exception as exc:
            raise _inspection_error("Failed to delete job", exc) from exc
        return DeleteJobOutput(job_id=job_id, deleted=deleted)

    async def purge_dead_jobs(self) -> PurgeDeadJobsOutput:
        """Delete every failed job.

        Raises:
            QueueInspectionError: Redis failure.
        """
        try:
            deleted = await self.dead_jobs.purge()
        except Exception as exc:
            raise _inspection_error("Failed to purge dead jobs", exc) from exc
        return PurgeDeadJobsOutput(deleted_count=deleted)
