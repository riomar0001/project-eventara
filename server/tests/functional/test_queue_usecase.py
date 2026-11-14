"""Functional tests: QueueUseCase over the real DeadJobStore (in-memory Redis)."""

from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock

import pytest

from app.application.dto.queue_dto import DeadJobInfo
from app.application.interfaces.job_queue_interface import QueueCounts
from app.application.use_cases.queue_usecase import QueueUseCase
from app.domain.exceptions.queue_exceptions import JobNotFoundError, JobRetryConflictError
from app.infrastructure.messaging.dead_jobs import DeadJobStore
from tests.fake_redis import FakeRedis


def _dead(job_id: str, minutes_ago: int = 0) -> DeadJobInfo:
    when = datetime.now(UTC) - timedelta(minutes=minutes_ago)
    return DeadJobInfo(
        job_id=job_id,
        function="persist_audit_log",
        args=[{"action": "login"}],
        kwargs={},
        job_try=3,
        enqueue_time=when,
        finish_time=when,
        error="ValueError('bad')",
    )


async def _setup(*records: DeadJobInfo):
    store = DeadJobStore(FakeRedis())
    for record in records:
        await store.record(record)
    jobs = AsyncMock()
    jobs.counts = AsyncMock(return_value=QueueCounts(queue_name="q", pending=0, in_progress=0))
    jobs.enqueue_job = AsyncMock(return_value="retried")
    return QueueUseCase(jobs, store), jobs, store


@pytest.mark.asyncio
async def test_lists_newest_failures_first_with_pagination():
    """Pages through failures newest-first and reports totals."""
    uc, _, _ = await _setup(_dead("old", 30), _dead("mid", 20), _dead("new", 10))
    first = await uc.list_dead_jobs(page=1, limit=2)
    second = await uc.list_dead_jobs(page=2, limit=2)
    assert [j.job_id for j in first.jobs] == ["new", "mid"]
    assert [j.job_id for j in second.jobs] == ["old"]
    assert (first.total, first.total_pages) == (3, 2)


@pytest.mark.asyncio
async def test_round_trips_job_arguments():
    """Preserves function, args and error text through serialisation."""
    uc, _, _ = await _setup(_dead("a"))
    job = (await uc.list_dead_jobs()).jobs[0]
    assert (job.function, job.args, job.job_try, job.error) == ("persist_audit_log", [{"action": "login"}], 3, "ValueError('bad')")


@pytest.mark.asyncio
async def test_retry_moves_job_back_to_queue():
    """Retrying re-enqueues the job and removes it from the store."""
    uc, jobs, store = await _setup(_dead("a"))
    await uc.retry_dead_job("a")
    jobs.enqueue_job.assert_awaited_once_with("persist_audit_log", {"action": "login"})
    assert await store.count() == 0
    with pytest.raises(JobNotFoundError):
        await uc.retry_dead_job("a")


@pytest.mark.asyncio
async def test_concurrent_retry_is_rejected():
    """A second retry while the lock is held raises JobRetryConflictError."""
    uc, _, store = await _setup(_dead("a"))
    assert await store.acquire_retry_lock("a")
    with pytest.raises(JobRetryConflictError):
        await uc.retry_dead_job("a")


@pytest.mark.asyncio
async def test_stats_and_purge():
    """Stats count failures and completions; purge empties the store."""
    uc, _, store = await _setup(_dead("a"), _dead("b"))
    await store.incr_completed()
    stats = await uc.get_stats()
    assert (stats.total_failed, stats.total_completed) == (2, 1)
    assert (await uc.purge_dead_jobs()).deleted_count == 2
    assert (await uc.get_stats()).total_failed == 0
