"""Unit tests for queue use cases (GetQueueStats, ListDeadJobs, RetryDeadJob, DeleteDeadJob, PurgeDeadJobs)."""

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


def _make_redis(*, scan_keys=None, job_type="string", key_value=b"1") -> MagicMock:
    redis = MagicMock()

    async def _scan_iter(match="*"):
        for key in scan_keys or []:
            yield key.encode() if isinstance(key, str) else key

    redis.scan_iter = _scan_iter
    redis.type = AsyncMock(return_value=b"string")
    redis.get = AsyncMock(return_value=key_value)
    redis.zcard = AsyncMock(return_value=0)
    redis.llen = AsyncMock(return_value=0)
    redis.zrange = AsyncMock(return_value=[])
    redis.delete = AsyncMock(return_value=1)
    redis.set = AsyncMock(return_value=True)
    redis.enqueue_job = AsyncMock(return_value=MagicMock(job_id=str(uuid.uuid4())))
    return redis


# ─── GetQueueStatsUseCase ─────────────────────────────────────────────────────


class TestGetQueueStatsUseCase:
    @pytest.mark.asyncio
    async def test_returns_stats(self):
        redis = _make_redis()
        with patch("app.application.use_cases.queue_usecase.Job") as MockJob:
            mock_job = MagicMock()
            mock_job.result_info = AsyncMock(return_value=_make_result_info(success=False))
            MockJob.return_value = mock_job

            async def _scan(match="*"):
                if "result" in match:
                    yield b"arq:result:abc"
                elif "in-progress" in match:
                    yield b"arq:in-progress:abc"

            redis.scan_iter = _scan
            result = await GetQueueStatsUseCase(redis).execute()

        assert result.total_failed == 1
        assert result.in_progress == 1

    @pytest.mark.asyncio
    async def test_redis_error_raises_inspection_error(self):
        redis = MagicMock()
        redis.scan_iter = MagicMock(side_effect=RuntimeError("redis down"))
        with pytest.raises(QueueInspectionError):
            await GetQueueStatsUseCase(redis).execute()


# ─── ListDeadJobsUseCase ──────────────────────────────────────────────────────


class TestListDeadJobsUseCase:
    @pytest.mark.asyncio
    async def test_returns_dead_jobs_paginated(self):
        redis = _make_redis()
        info = _make_result_info(success=False)

        with patch("app.application.use_cases.queue_usecase.Job") as MockJob:
            mock_job = MagicMock()
            mock_job.result_info = AsyncMock(return_value=info)
            MockJob.return_value = mock_job

            async def _scan(match="*"):
                yield b"arq:result:" + JOB_ID.encode()

            redis.scan_iter = _scan
            result = await ListDeadJobsUseCase(redis).execute(page=1, limit=10)

        assert result.total == 1
        assert len(result.jobs) == 1
        assert result.page == 1
        assert result.total_pages == 1

    @pytest.mark.asyncio
    async def test_skips_successful_jobs(self):
        redis = _make_redis()
        with patch("app.application.use_cases.queue_usecase.Job") as MockJob:
            mock_job = MagicMock()
            mock_job.result_info = AsyncMock(return_value=_make_result_info(success=True))
            MockJob.return_value = mock_job

            async def _scan(match="*"):
                yield b"arq:result:abc"

            redis.scan_iter = _scan
            result = await ListDeadJobsUseCase(redis).execute(page=1, limit=10)

        assert result.total == 0

    @pytest.mark.asyncio
    async def test_pagination_slices_correctly(self):
        redis = _make_redis()
        with patch("app.application.use_cases.queue_usecase.Job") as MockJob:
            mock_job = MagicMock()
            mock_job.result_info = AsyncMock(return_value=_make_result_info(success=False))
            MockJob.return_value = mock_job

            async def _scan(match="*"):
                for i in range(15):
                    yield f"arq:result:job{i}".encode()

            redis.scan_iter = _scan
            result = await ListDeadJobsUseCase(redis).execute(page=2, limit=10)

        assert result.total == 15
        assert len(result.jobs) == 5
        assert result.page == 2
        assert result.total_pages == 2


# ─── RetryDeadJobUseCase ──────────────────────────────────────────────────────


class TestRetryDeadJobUseCase:
    @pytest.mark.asyncio
    async def test_success(self):
        redis = _make_redis()
        with patch("app.application.use_cases.queue_usecase.Job") as MockJob:
            mock_job = MagicMock()
            mock_job.result_info = AsyncMock(return_value=_make_result_info(success=False))
            MockJob.return_value = mock_job
            result = await RetryDeadJobUseCase(redis).execute(JOB_ID)

        assert result.original_job_id == JOB_ID
        redis.delete.assert_awaited()

    @pytest.mark.asyncio
    async def test_lock_not_acquired_raises_conflict(self):
        redis = _make_redis()
        redis.set = AsyncMock(return_value=False)
        with pytest.raises(JobRetryConflictError):
            await RetryDeadJobUseCase(redis).execute(JOB_ID)

    @pytest.mark.asyncio
    async def test_job_not_found(self):
        redis = _make_redis()
        with patch("app.application.use_cases.queue_usecase.Job") as MockJob:
            mock_job = MagicMock()
            mock_job.result_info = AsyncMock(return_value=None)
            MockJob.return_value = mock_job
            with pytest.raises(JobNotFoundError):
                await RetryDeadJobUseCase(redis).execute(JOB_ID)

    @pytest.mark.asyncio
    async def test_job_not_dead(self):
        redis = _make_redis()
        with patch("app.application.use_cases.queue_usecase.Job") as MockJob:
            mock_job = MagicMock()
            mock_job.result_info = AsyncMock(return_value=_make_result_info(success=True))
            MockJob.return_value = mock_job
            with pytest.raises(JobNotDeadError):
                await RetryDeadJobUseCase(redis).execute(JOB_ID)


# ─── DeleteDeadJobUseCase ─────────────────────────────────────────────────────


class TestDeleteDeadJobUseCase:
    @pytest.mark.asyncio
    async def test_success(self):
        redis = _make_redis()
        with patch("app.application.use_cases.queue_usecase.Job") as MockJob:
            mock_job = MagicMock()
            mock_job.result_info = AsyncMock(return_value=_make_result_info(success=False))
            MockJob.return_value = mock_job
            result = await DeleteDeadJobUseCase(redis).execute(JOB_ID)
        assert result.deleted is True

    @pytest.mark.asyncio
    async def test_job_not_found(self):
        redis = _make_redis()
        with patch("app.application.use_cases.queue_usecase.Job") as MockJob:
            mock_job = MagicMock()
            mock_job.result_info = AsyncMock(return_value=None)
            MockJob.return_value = mock_job
            with pytest.raises(JobNotFoundError):
                await DeleteDeadJobUseCase(redis).execute(JOB_ID)

    @pytest.mark.asyncio
    async def test_job_not_dead(self):
        redis = _make_redis()
        with patch("app.application.use_cases.queue_usecase.Job") as MockJob:
            mock_job = MagicMock()
            mock_job.result_info = AsyncMock(return_value=_make_result_info(success=True))
            MockJob.return_value = mock_job
            with pytest.raises(JobNotDeadError):
                await DeleteDeadJobUseCase(redis).execute(JOB_ID)


# ─── PurgeDeadJobsUseCase ─────────────────────────────────────────────────────


class TestPurgeDeadJobsUseCase:
    @pytest.mark.asyncio
    async def test_purges_all_dead_jobs(self):
        redis = _make_redis()
        with patch("app.application.use_cases.queue_usecase.Job") as MockJob:
            mock_job = MagicMock()
            mock_job.result_info = AsyncMock(return_value=_make_result_info(success=False))
            MockJob.return_value = mock_job

            async def _scan(match="*"):
                yield b"arq:result:job1"
                yield b"arq:result:job2"

            redis.scan_iter = _scan
            result = await PurgeDeadJobsUseCase(redis).execute()

        assert result.deleted_count == 2
        redis.delete.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_empty_dlq_returns_zero(self):
        redis = _make_redis()
        with patch("app.application.use_cases.queue_usecase.Job") as MockJob:
            MockJob.return_value.result_info = AsyncMock(return_value=_make_result_info(success=True))

            async def _scan(match="*"):
                return

            redis.scan_iter = _scan
            result = await PurgeDeadJobsUseCase(redis).execute()

        assert result.deleted_count == 0
