"""Unit tests for QueueUseCase over mocked job queue and dead-job store."""

from datetime import UTC, datetime
from unittest.mock import AsyncMock

import pytest

from app.application.dto.queue_dto import DeadJobInfo
from app.application.interfaces.job_queue_interface import QueueCounts
from app.application.use_cases.queue_usecase import QueueUseCase
from app.domain.exceptions.queue_exceptions import JobNotFoundError, JobRetryConflictError, QueueInspectionError

JOB_ID = "job-123"


def _dead_job(job_id: str = JOB_ID) -> DeadJobInfo:
    return DeadJobInfo(
        job_id=job_id,
        function="send_email_job",
        args=[],
        kwargs={"to": "a@b.com"},
        job_try=3,
        enqueue_time=datetime.now(UTC),
        finish_time=datetime.now(UTC),
        error="RuntimeError('smtp down')",
    )


def _make(dead: DeadJobInfo | None = None, lock: bool = True):
    jobs = AsyncMock()
    jobs.counts = AsyncMock(return_value=QueueCounts(queue_name="eventara-jobs", pending=4, in_progress=2))
    jobs.enqueue_job = AsyncMock(return_value="new-job")
    store = AsyncMock()
    store.count = AsyncMock(return_value=1)
    store.completed_count = AsyncMock(return_value=10)
    store.list_page = AsyncMock(return_value=([dead] if dead else [], 1 if dead else 0))
    store.get = AsyncMock(return_value=dead)
    store.delete = AsyncMock(return_value=True)
    store.purge = AsyncMock(return_value=5)
    store.acquire_retry_lock = AsyncMock(return_value=lock)
    store.release_retry_lock = AsyncMock()
    return QueueUseCase(jobs, store), jobs, store


@pytest.mark.asyncio
async def test_get_stats_combines_queue_counts_and_dead_store():
    """Returns SQS pending/in-flight counts with failed and completed totals from the store."""
    uc, _, _ = _make()
    stats = await uc.get_stats()
    assert (stats.queue_name, stats.pending, stats.in_progress) == ("eventara-jobs", 4, 2)
    assert (stats.total_failed, stats.total_completed, stats.worker_health) == (1, 10, [])


@pytest.mark.asyncio
async def test_get_stats_wraps_backend_errors():
    """Raises QueueInspectionError when the queue cannot be read."""
    uc, jobs, _ = _make()
    jobs.counts.side_effect = RuntimeError("sqs down")
    with pytest.raises(QueueInspectionError):
        await uc.get_stats()


@pytest.mark.asyncio
async def test_list_dead_jobs_uses_offset_and_clamps_page():
    """Translates page/limit into an offset and clamps invalid pages to 1."""
    uc, _, store = _make(dead=_dead_job())
    result = await uc.list_dead_jobs(page=0, limit=10)
    store.list_page.assert_awaited_once_with(0, 10)
    assert (result.total, result.page, result.total_pages, len(result.jobs)) == (1, 1, 1, 1)


@pytest.mark.asyncio
async def test_retry_reenqueues_and_deletes_record():
    """Re-enqueues the job with its original arguments, then removes the record and releases the lock."""
    uc, jobs, store = _make(dead=_dead_job())
    result = await uc.retry_dead_job(JOB_ID)
    jobs.enqueue_job.assert_awaited_once_with("send_email_job", to="a@b.com")
    store.delete.assert_awaited_once_with(JOB_ID)
    store.release_retry_lock.assert_awaited_once_with(JOB_ID)
    assert (result.original_job_id, result.new_job_id) == (JOB_ID, "new-job")


@pytest.mark.asyncio
async def test_retry_conflict_when_lock_held():
    """Raises JobRetryConflictError without touching the queue when another retry holds the lock."""
    uc, jobs, _ = _make(dead=_dead_job(), lock=False)
    with pytest.raises(JobRetryConflictError):
        await uc.retry_dead_job(JOB_ID)
    jobs.enqueue_job.assert_not_awaited()


@pytest.mark.asyncio
async def test_retry_missing_job_releases_lock():
    """Raises JobNotFoundError and still releases the lock."""
    uc, _, store = _make(dead=None)
    with pytest.raises(JobNotFoundError):
        await uc.retry_dead_job(JOB_ID)
    store.release_retry_lock.assert_awaited_once_with(JOB_ID)


@pytest.mark.asyncio
async def test_retry_keeps_record_when_enqueue_fails():
    """Keeps the failure record when re-enqueueing fails, so the job is not lost."""
    uc, jobs, store = _make(dead=_dead_job())
    jobs.enqueue_job.side_effect = RuntimeError("sqs down")
    with pytest.raises(QueueInspectionError):
        await uc.retry_dead_job(JOB_ID)
    store.delete.assert_not_awaited()


@pytest.mark.asyncio
async def test_delete_missing_job_raises_not_found():
    """Raises JobNotFoundError when no record exists."""
    uc, _, _ = _make(dead=None)
    with pytest.raises(JobNotFoundError):
        await uc.delete_dead_job(JOB_ID)


@pytest.mark.asyncio
async def test_delete_and_purge():
    """Deletes one record, and purge reports how many were removed."""
    uc, _, _ = _make(dead=_dead_job())
    assert (await uc.delete_dead_job(JOB_ID)).deleted is True
    assert (await uc.purge_dead_jobs()).deleted_count == 5
