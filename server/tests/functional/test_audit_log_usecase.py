"""Functional test cases for CreateAuditLogUseCase and GetAuditLogsUseCase."""

import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.application.dto.audit_log_dto import CreateAuditLogInput, GetAuditLogsInput
from app.application.use_cases.audit_log_usecase import CreateAuditLogUseCase, GetAuditLogsUseCase
from app.domain.entities.audit_log import ActionType, AuditLogStatus
from app.domain.exceptions.audit_exceptions import AuditLogWriteError

USER_ID = uuid.uuid4()


def _make_create_input() -> CreateAuditLogInput:
    return CreateAuditLogInput(
        user_id=USER_ID, ip_address="127.0.0.1", user_agent="TestAgent/1.0",
        action_type=ActionType.CREATE, resource_type="events",
        resource_id=str(uuid.uuid4()), status=AuditLogStatus.SUCCESS,
    )


def _make_get_input(limit=50, cursor=None) -> GetAuditLogsInput:
    return GetAuditLogsInput(
        limit=limit, cursor=cursor, user_id=None,
        action_type=None, resource_type=None, start_date=None, end_date=None,
    )


# ─── CreateAuditLogUseCase ────────────────────────────────────────────────────

class TestCreateAuditLogUseCase:
    @pytest.mark.asyncio
    async def test_enqueues_via_redis_when_available(self):
        """Enqueues the audit log as an ARQ job when a Redis connection is configured"""
        repo = MagicMock()
        redis = AsyncMock()
        redis.enqueue_job = AsyncMock()
        await CreateAuditLogUseCase(repository=repo, redis=redis).execute(_make_create_input())
        redis.enqueue_job.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_falls_back_to_sync_write_on_redis_failure(self):
        """Falls back to synchronous database write when the Redis enqueue raises an exception"""
        repo = MagicMock()
        repo.create = AsyncMock()
        redis = AsyncMock()
        redis.enqueue_job = AsyncMock(side_effect=RuntimeError("redis down"))
        await CreateAuditLogUseCase(repository=repo, redis=redis).execute(_make_create_input())
        repo.create.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_writes_synchronously_when_no_redis(self):
        """Writes directly to the database repository when no Redis connection is configured"""
        repo = MagicMock()
        repo.create = AsyncMock()
        await CreateAuditLogUseCase(repository=repo, redis=None).execute(_make_create_input())
        repo.create.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_sync_write_failure_raises_audit_log_write_error(self):
        """Raises AuditLogWriteError when the synchronous fallback write also fails"""
        repo = MagicMock()
        repo.create = AsyncMock(side_effect=RuntimeError("db down"))
        with patch("app.core.config.settings") as mock_settings:
            mock_settings.DEBUG = False
            with pytest.raises(AuditLogWriteError):
                await CreateAuditLogUseCase(repository=repo, redis=None).execute(_make_create_input())


# ─── GetAuditLogsUseCase ──────────────────────────────────────────────────────

class TestGetAuditLogsUseCase:
    def _make_repo(self, *, logs=None, total=0, next_cursor=None, prev_cursor=None):
        repo = MagicMock()
        repo.get_paginated = AsyncMock(return_value=(logs or [], total, next_cursor, prev_cursor))
        return repo

    @pytest.mark.asyncio
    async def test_returns_paginated_logs(self):
        """Returns the log entries, total count, cursors, and has_next flag from the repository"""
        logs = [MagicMock(), MagicMock()]
        result = await GetAuditLogsUseCase(self._make_repo(logs=logs, total=2, next_cursor="c1")).execute(_make_get_input())
        assert result.logs == logs and result.total_count == 2 and result.has_next is True

    @pytest.mark.asyncio
    async def test_clamps_limit_to_max(self):
        """Caps the effective limit at MAX_LIMIT (1000) regardless of the requested value"""
        repo = self._make_repo()
        await GetAuditLogsUseCase(repo).execute(_make_get_input(limit=9999))
        _, kwargs = repo.get_paginated.call_args
        assert kwargs["limit"] == GetAuditLogsUseCase.MAX_LIMIT

    @pytest.mark.asyncio
    async def test_applies_default_limit_when_none(self):
        """Uses DEFAULT_LIMIT (100) when the caller does not specify a limit"""
        repo = self._make_repo()
        await GetAuditLogsUseCase(repo).execute(_make_get_input(limit=None))
        _, kwargs = repo.get_paginated.call_args
        assert kwargs["limit"] == GetAuditLogsUseCase.DEFAULT_LIMIT

    @pytest.mark.asyncio
    async def test_has_next_false_when_no_cursor(self):
        """Sets has_next to False when the repository returns no next cursor"""
        result = await GetAuditLogsUseCase(self._make_repo(next_cursor=None)).execute(_make_get_input())
        assert result.has_next is False

    @pytest.mark.asyncio
    async def test_passes_all_filters_to_repo(self):
        """Forwards all filter parameters (user_id, action_type, resource_type, cursor) to the repository"""
        repo = self._make_repo()
        inp = GetAuditLogsInput(
            limit=10, cursor="c1", user_id=USER_ID,
            action_type=ActionType.DELETE, resource_type="users",
            start_date=None, end_date=None,
        )
        await GetAuditLogsUseCase(repo).execute(inp)
        repo.get_paginated.assert_awaited_once_with(
            limit=10, cursor="c1", user_id=USER_ID,
            action_type=ActionType.DELETE, resource_type="users",
            start_date=None, end_date=None,
        )
