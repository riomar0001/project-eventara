"""Unit tests for CreateAuditLogUseCase and GetAuditLogsUseCase."""

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
        user_id=USER_ID,
        ip_address="127.0.0.1",
        user_agent="TestAgent/1.0",
        action_type=ActionType.CREATE,
        resource_type="events",
        resource_id=str(uuid.uuid4()),
        status=AuditLogStatus.SUCCESS,
    )


def _make_get_input(limit=50, cursor=None) -> GetAuditLogsInput:
    return GetAuditLogsInput(
        limit=limit,
        cursor=cursor,
        user_id=None,
        action_type=None,
        resource_type=None,
        start_date=None,
        end_date=None,
    )


# ─── CreateAuditLogUseCase ────────────────────────────────────────────────────


class TestCreateAuditLogUseCase:
    @pytest.mark.asyncio
    async def test_enqueues_via_redis_when_available(self):
        repo = MagicMock()
        redis = AsyncMock()
        redis.enqueue_job = AsyncMock()
        uc = CreateAuditLogUseCase(repository=repo, redis=redis)
        await uc.execute(_make_create_input())
        redis.enqueue_job.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_falls_back_to_sync_write_on_redis_failure(self):
        repo = MagicMock()
        repo.create = AsyncMock()
        redis = AsyncMock()
        redis.enqueue_job = AsyncMock(side_effect=RuntimeError("redis down"))
        uc = CreateAuditLogUseCase(repository=repo, redis=redis)
        await uc.execute(_make_create_input())
        repo.create.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_writes_synchronously_when_no_redis(self):
        repo = MagicMock()
        repo.create = AsyncMock()
        uc = CreateAuditLogUseCase(repository=repo, redis=None)
        await uc.execute(_make_create_input())
        repo.create.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_sync_write_failure_raises_audit_log_write_error(self):
        repo = MagicMock()
        repo.create = AsyncMock(side_effect=RuntimeError("db down"))
        uc = CreateAuditLogUseCase(repository=repo, redis=None)
        with patch("app.core.config.settings") as mock_settings:
            mock_settings.DEBUG = False
            with pytest.raises(AuditLogWriteError):
                await uc.execute(_make_create_input())


# ─── GetAuditLogsUseCase ──────────────────────────────────────────────────────


class TestGetAuditLogsUseCase:
    def _make_repo(self, *, logs=None, total=0, next_cursor=None, prev_cursor=None):
        repo = MagicMock()
        repo.get_paginated = AsyncMock(return_value=(logs or [], total, next_cursor, prev_cursor))
        return repo

    @pytest.mark.asyncio
    async def test_returns_paginated_logs(self):
        logs = [MagicMock(), MagicMock()]
        repo = self._make_repo(logs=logs, total=2, next_cursor="cursor123")
        result = await GetAuditLogsUseCase(repo).execute(_make_get_input())
        assert result.logs == logs
        assert result.total_count == 2
        assert result.has_next is True

    @pytest.mark.asyncio
    async def test_clamps_limit_to_max(self):
        repo = self._make_repo()
        await GetAuditLogsUseCase(repo).execute(_make_get_input(limit=9999))
        _, kwargs = repo.get_paginated.call_args
        assert kwargs["limit"] == GetAuditLogsUseCase.MAX_LIMIT

    @pytest.mark.asyncio
    async def test_applies_default_limit_when_none(self):
        repo = self._make_repo()
        await GetAuditLogsUseCase(repo).execute(_make_get_input(limit=None))
        _, kwargs = repo.get_paginated.call_args
        assert kwargs["limit"] == GetAuditLogsUseCase.DEFAULT_LIMIT

    @pytest.mark.asyncio
    async def test_has_next_false_when_no_cursor(self):
        repo = self._make_repo(next_cursor=None)
        result = await GetAuditLogsUseCase(repo).execute(_make_get_input())
        assert result.has_next is False

    @pytest.mark.asyncio
    async def test_passes_filters_to_repo(self):
        repo = self._make_repo()
        inp = GetAuditLogsInput(
            limit=10,
            cursor="c1",
            user_id=USER_ID,
            action_type=ActionType.DELETE,
            resource_type="users",
            start_date=None,
            end_date=None,
        )
        await GetAuditLogsUseCase(repo).execute(inp)
        repo.get_paginated.assert_awaited_once_with(
            limit=10,
            cursor="c1",
            user_id=USER_ID,
            action_type=ActionType.DELETE,
            resource_type="users",
            start_date=None,
            end_date=None,
        )
