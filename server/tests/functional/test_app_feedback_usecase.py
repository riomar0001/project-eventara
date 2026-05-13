"""Functional test cases for AppFeedbackUseCase."""

import uuid
from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.dto.app_feedback_dto import (
    GetAppFeedbackInput,
    GetUsersPerWeekInput,
    SubmitAppFeedbackInput,
)
from app.application.use_cases.app_feedback_usecase import AppFeedbackUseCase
from app.domain.entities.app_feedback_entity import AppFeedback
from app.domain.entities.dashboard_entity import UserRegistrationWeek

FEEDBACK_ID = uuid.UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
NOW = datetime(2026, 5, 14, 12, 0, 0, tzinfo=UTC)


def _feedback(**overrides):
    defaults = dict(
        id=FEEDBACK_ID,
        rating=5,
        comment="Great app",
        ip_address="127.0.0.1",
        created_at=NOW,
    )
    defaults.update(overrides)
    return AppFeedback(**defaults)


def _make_repo(**overrides):
    repo = MagicMock()
    repo.create = AsyncMock(return_value=_feedback())
    repo.get_paginated = AsyncMock(return_value=([], 0))
    repo.get_users_per_week = AsyncMock(return_value=[])
    for key, value in overrides.items():
        setattr(repo, key, value)
    return repo


def _make_uc(repo=None):
    if repo is None:
        repo = _make_repo()
    db = AsyncMock(spec=AsyncSession)
    return AppFeedbackUseCase(repo, db), repo, db


class TestSubmitAppFeedback:
    @pytest.mark.asyncio
    async def test_submit_feedback_calls_repository_create_with_correct_params(self):
        """Passes rating, comment, and ip_address as keyword arguments to repository.create"""
        uc, repo, _ = _make_uc()
        await uc.submit_feedback(SubmitAppFeedbackInput(rating=4, comment="Good", ip_address="1.2.3.4"))
        repo.create.assert_awaited_once_with(rating=4, comment="Good", ip_address="1.2.3.4")

    @pytest.mark.asyncio
    async def test_submit_feedback_commits_transaction_on_success(self):
        """Calls db.commit exactly once after the repository create succeeds"""
        uc, _, db = _make_uc()
        await uc.submit_feedback(SubmitAppFeedbackInput(rating=5, comment=None, ip_address=None))
        db.commit.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_submit_feedback_returns_output_containing_persisted_feedback(self):
        """Returns SubmitAppFeedbackOutput with the feedback record returned by the repository"""
        uc, _, _ = _make_uc()
        result = await uc.submit_feedback(SubmitAppFeedbackInput(rating=5, comment="Great app", ip_address="127.0.0.1"))
        assert result.feedback.id == FEEDBACK_ID and result.feedback.rating == 5

    @pytest.mark.asyncio
    async def test_submit_feedback_rollbacks_and_reraises_when_repository_raises(self):
        """Calls db.rollback and re-raises the original exception when repository.create fails"""
        repo = _make_repo(create=AsyncMock(side_effect=RuntimeError("db error")))
        uc, _, db = _make_uc(repo=repo)
        with pytest.raises(RuntimeError):
            await uc.submit_feedback(SubmitAppFeedbackInput(rating=3, comment=None, ip_address=None))
        db.rollback.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_submit_feedback_does_not_commit_when_repository_raises(self):
        """Never calls db.commit when the repository create raises an exception"""
        repo = _make_repo(create=AsyncMock(side_effect=Exception("fail")))
        uc, _, db = _make_uc(repo=repo)
        with pytest.raises(Exception):
            await uc.submit_feedback(SubmitAppFeedbackInput(rating=2, comment=None, ip_address=None))
        db.commit.assert_not_awaited()


class TestGetAllFeedback:
    @pytest.mark.asyncio
    async def test_get_all_feedback_returns_paginated_output_with_correct_fields(self):
        """Returns GetAppFeedbackOutput with feedback list, total, page, and page_size populated"""
        records = [_feedback(rating=i) for i in range(1, 4)]
        repo = _make_repo(get_paginated=AsyncMock(return_value=(records, 3)))
        uc, _, _ = _make_uc(repo=repo)
        result = await uc.get_all_feedback(GetAppFeedbackInput(page=1, page_size=20))
        assert result.total == 3 and len(result.feedback) == 3 and result.page == 1

    @pytest.mark.asyncio
    async def test_get_all_feedback_caps_page_size_at_max(self):
        """Passes MAX_PAGE_SIZE to the repository when the requested page_size exceeds the limit"""
        repo = _make_repo(get_paginated=AsyncMock(return_value=([], 0)))
        uc, _, _ = _make_uc(repo=repo)
        await uc.get_all_feedback(GetAppFeedbackInput(page=1, page_size=999))
        repo.get_paginated.assert_awaited_once_with(page=1, page_size=AppFeedbackUseCase.MAX_PAGE_SIZE)

    @pytest.mark.asyncio
    async def test_get_all_feedback_returns_empty_list_when_repository_returns_no_records(self):
        """Returns an output with an empty feedback list and zero total when the repository has no data"""
        uc, _, _ = _make_uc()
        result = await uc.get_all_feedback(GetAppFeedbackInput(page=1, page_size=20))
        assert result.feedback == [] and result.total == 0

    @pytest.mark.asyncio
    async def test_get_all_feedback_passes_page_and_page_size_to_repository(self):
        """Forwards the page and page_size values from the input DTO to repository.get_paginated"""
        repo = _make_repo(get_paginated=AsyncMock(return_value=([], 0)))
        uc, _, _ = _make_uc(repo=repo)
        await uc.get_all_feedback(GetAppFeedbackInput(page=3, page_size=10))
        repo.get_paginated.assert_awaited_once_with(page=3, page_size=10)


class TestGetUsersPerWeek:
    @pytest.mark.asyncio
    async def test_get_users_per_week_calls_repository_with_weeks_param(self):
        """Passes the weeks integer directly to repository.get_users_per_week"""
        repo = _make_repo()
        uc, _, _ = _make_uc(repo=repo)
        await uc.get_users_per_week(GetUsersPerWeekInput(weeks=8))
        repo.get_users_per_week.assert_awaited_once_with(8)

    @pytest.mark.asyncio
    async def test_get_users_per_week_returns_entries_from_repository(self):
        """Returns GetUsersPerWeekOutput with the UserRegistrationWeek list from the repository"""
        entries = [UserRegistrationWeek(week_start=NOW, week_end=NOW, count=5)]
        repo = _make_repo(get_users_per_week=AsyncMock(return_value=entries))
        uc, _, _ = _make_uc(repo=repo)
        result = await uc.get_users_per_week(GetUsersPerWeekInput(weeks=1))
        assert len(result.entries) == 1 and result.entries[0].count == 5

    @pytest.mark.asyncio
    async def test_get_users_per_week_returns_empty_list_when_no_registrations(self):
        """Returns an output with an empty entries list when the repository returns no rows"""
        uc, _, _ = _make_uc()
        result = await uc.get_users_per_week(GetUsersPerWeekInput(weeks=12))
        assert result.entries == []

    @pytest.mark.asyncio
    async def test_get_users_per_week_uses_default_weeks_when_not_specified(self):
        """Passes 12 as the weeks argument when GetUsersPerWeekInput is instantiated with defaults"""
        repo = _make_repo()
        uc, _, _ = _make_uc(repo=repo)
        await uc.get_users_per_week(GetUsersPerWeekInput())
        repo.get_users_per_week.assert_awaited_once_with(12)
