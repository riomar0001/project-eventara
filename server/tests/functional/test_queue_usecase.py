"""Functional test cases for queue use cases."""

import uuid
from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.application.use_cases.queue_usecase import (
    DeleteDeadJobUseCase,
    GetQueueStatsUseCase,
    ListDeadJobsUseCase,
    PurgeDeadJobsUseCase,
    RetryDeadJobUseCase,
)
from app.domain.exceptions.queue_exceptions import (
    JobNotDeadError,
    JobNotFoundError,
    JobRetryConflictError,
    QueueInspectionError,
)

JOB_ID = str(uuid.uuid4())


def _make_result_info(*, success=False, function="my_func", job_try=1, result="Error"):
    info = MagicMock()
    info.success = success
    info.function = function
    info.args = ("arg1",)
    info.kwargs = {"key": "val"}
    info.job_try = job_try
    info.enqueue_time = datetime.now(UTC)
    info.finish_time = datetime.now(UTC)
    info.result = result
    return info


def _make_redis(*, lock_acquired=True) -> MagicMock:
    redis = MagicMock()

    async def _empty_scan(match="*"):
        return
        yield  # makes this an async generator

    redis.scan_iter = _empty_scan
    redis.type = AsyncMock(return_value=b"string")
    redis.get = AsyncMock(return_value=b"1")
    redis.zcard = AsyncMock(return_value=0)
    redis.delete = AsyncMock(return_value=1)
    redis.set = AsyncMock(return_value=lock_acquired)
    redis.enqueue_job = AsyncMock(return_value=MagicMock(job_id=str(uuid.uuid4())))
    return redis


# ─── GetQueueStatsUseCase ─────────────────────────────────────────────────────


class TestGetQueueStatsUseCase:
    @pytest.mark.asyncio
    async def test_counts_failed_and_in_progress_jobs(self):
        """Returns a QueueStatsOutput with correct failed and in-progress counts from Redis"""
        redis = _make_redis()

        async def _scan(match="*"):
            if "result" in match:
                yield b"arq:result:abc"
            elif "in-progress" in match:
                yield b"arq:in-progress:abc"

        redis.scan_iter = _scan

        with patch("app.application.use_cases.queue_usecase.Job") as MockJob:
            MockJob.return_value.result_info = AsyncMock(return_value=_make_result_info(success=False))
            result = await GetQueueStatsUseCase(redis).execute()

        assert result.total_failed == 1 and result.in_progress == 1

    @pytest.mark.asyncio
    async def test_redis_error_raises_inspection_error(self):
        """Raises QueueInspectionError when Redis communication fails during stats collection"""
        redis = MagicMock()
        redis.scan_iter = MagicMock(side_effect=RuntimeError("redis down"))
        with pytest.raises(QueueInspectionError):
            await GetQueueStatsUseCase(redis).execute()


# ─── ListDeadJobsUseCase ──────────────────────────────────────────────────────


class TestListDeadJobsUseCase:
    @pytest.mark.asyncio
    async def test_returns_paginated_dead_jobs(self):
        """Scans Redis for failed job results and returns them sliced to the requested page"""
        redis = _make_redis()

        async def _scan(match="*"):
            yield b"arq:result:" + JOB_ID.encode()

        redis.scan_iter = _scan

        with patch("app.application.use_cases.queue_usecase.Job") as MockJob:
            MockJob.return_value.result_info = AsyncMock(return_value=_make_result_info(success=False))
            result = await ListDeadJobsUseCase(redis).execute(page=1, limit=10)

        assert result.total == 1 and len(result.jobs) == 1 and result.page == 1

    @pytest.mark.asyncio
    async def test_skips_successful_jobs(self):
        """Excludes jobs where success=True from the dead-letter listing"""
        redis = _make_redis()

        async def _scan(match="*"):
            yield b"arq:result:abc"

        redis.scan_iter = _scan

        with patch("app.application.use_cases.queue_usecase.Job") as MockJob:
            MockJob.return_value.result_info = AsyncMock(return_value=_make_result_info(success=True))
            result = await ListDeadJobsUseCase(redis).execute(page=1, limit=10)

        assert result.total == 0

    @pytest.mark.asyncio
    async def test_pagination_slices_correctly(self):
        """Slices the full result set to the correct page window using page and limit"""
        redis = _make_redis()

        async def _scan(match="*"):
            for i in range(15):
                yield f"arq:result:job{i}".encode()

        redis.scan_iter = _scan

        with patch("app.application.use_cases.queue_usecase.Job") as MockJob:
            MockJob.return_value.result_info = AsyncMock(return_value=_make_result_info(success=False))
            result = await ListDeadJobsUseCase(redis).execute(page=2, limit=10)

        assert result.total == 15 and len(result.jobs) == 5 and result.total_pages == 2


# ─── RetryDeadJobUseCase ──────────────────────────────────────────────────────


class TestRetryDeadJobUseCase:
    @pytest.mark.asyncio
    async def test_success(self):
        """Re-enqueues the job with fresh arguments and removes the dead-letter result key"""
        redis = _make_redis()

        with patch("app.application.use_cases.queue_usecase.Job") as MockJob:
            MockJob.return_value.result_info = AsyncMock(return_value=_make_result_info(success=False))
            result = await RetryDeadJobUseCase(redis).execute(JOB_ID)

        assert result.original_job_id == JOB_ID
        redis.delete.assert_awaited()

    @pytest.mark.asyncio
    async def test_lock_not_acquired_raises_conflict(self):
        """Raises JobRetryConflictError when a concurrent retry already holds the distributed lock"""
        redis = _make_redis(lock_acquired=False)
        with pytest.raises(JobRetryConflictError):
            await RetryDeadJobUseCase(redis).execute(JOB_ID)

    @pytest.mark.asyncio
    async def test_job_not_found(self):
        """Raises JobNotFoundError when the result key is absent or has expired"""
        redis = _make_redis()
        with patch("app.application.use_cases.queue_usecase.Job") as MockJob:
            MockJob.return_value.result_info = AsyncMock(return_value=None)
            with pytest.raises(JobNotFoundError):
                await RetryDeadJobUseCase(redis).execute(JOB_ID)

    @pytest.mark.asyncio
    async def test_job_not_dead(self):
        """Raises JobNotDeadError when the job succeeded and is not eligible for retry"""
        redis = _make_redis()
        with patch("app.application.use_cases.queue_usecase.Job") as MockJob:
            MockJob.return_value.result_info = AsyncMock(return_value=_make_result_info(success=True))
            with pytest.raises(JobNotDeadError):
                await RetryDeadJobUseCase(redis).execute(JOB_ID)


# ─── DeleteDeadJobUseCase ─────────────────────────────────────────────────────


class TestDeleteDeadJobUseCase:
    @pytest.mark.asyncio
    async def test_success(self):
        """Confirms the job is dead then deletes the result key from Redis"""
        redis = _make_redis()
        with patch("app.application.use_cases.queue_usecase.Job") as MockJob:
            MockJob.return_value.result_info = AsyncMock(return_value=_make_result_info(success=False))
            result = await DeleteDeadJobUseCase(redis).execute(JOB_ID)
        assert result.deleted is True

    @pytest.mark.asyncio
    async def test_job_not_found(self):
        """Raises JobNotFoundError when the result key is absent or has expired"""
        redis = _make_redis()
        with patch("app.application.use_cases.queue_usecase.Job") as MockJob:
            MockJob.return_value.result_info = AsyncMock(return_value=None)
            with pytest.raises(JobNotFoundError):
                await DeleteDeadJobUseCase(redis).execute(JOB_ID)

    @pytest.mark.asyncio
    async def test_job_not_dead(self):
        """Raises JobNotDeadError when the job succeeded and cannot be deleted via the DLQ endpoint"""
        redis = _make_redis()
        with patch("app.application.use_cases.queue_usecase.Job") as MockJob:
            MockJob.return_value.result_info = AsyncMock(return_value=_make_result_info(success=True))
            with pytest.raises(JobNotDeadError):
                await DeleteDeadJobUseCase(redis).execute(JOB_ID)


# ─── PurgeDeadJobsUseCase ─────────────────────────────────────────────────────


class TestPurgeDeadJobsUseCase:
    @pytest.mark.asyncio
    async def test_purges_all_dead_jobs(self):
        """Collects all failed result keys and deletes them in a single batched DEL command"""
        redis = _make_redis()

        async def _scan(match="*"):
            yield b"arq:result:job1"
            yield b"arq:result:job2"

        redis.scan_iter = _scan

        with patch("app.application.use_cases.queue_usecase.Job") as MockJob:
            MockJob.return_value.result_info = AsyncMock(return_value=_make_result_info(success=False))
            result = await PurgeDeadJobsUseCase(redis).execute()

        assert result.deleted_count == 2
        redis.delete.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_empty_dlq_returns_zero(self):
        """Returns deleted_count=0 and skips the DEL call when no dead jobs exist"""
        redis = _make_redis()

        async def _scan(match="*"):
            return
            yield  # makes this an async generator

        redis.scan_iter = _scan
        result = await PurgeDeadJobsUseCase(redis).execute()
        assert result.deleted_count == 0
        redis.delete.assert_not_awaited()
