"""Unit tests for VolunteerRoleUseCase (get_all, update, delete)."""

import uuid
from unittest.mock import AsyncMock, MagicMock

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.dto.volunteer_dto import (
    DeleteVolunteerRoleInput,
    GetAllVolunteerRolesInput,
    UpdateVolunteerRoleInput,
    _UNSET,
)
from app.application.use_cases.volunteer_usecase import VolunteerRoleUseCase
from app.domain.entities.volunteer_entity import VolunteerRole, VolunteerStatus, Volunteer
from app.domain.exceptions.volunteer_role_exceptions import (
    VolunteerRoleAlreadyExistsError,
    VolunteerRoleNotFoundError,
)
from app.infrastructure.database.repositories.volunteer_repository import VolunteerRepository

ACTOR_ID = uuid.UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
ROLE_ID = uuid.UUID("dddddddd-dddd-dddd-dddd-dddddddddddd")
OTHER_ROLE_ID = uuid.UUID("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee")
USER_ID = uuid.UUID("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")
VOLUNTEER_ID = uuid.UUID("cccccccc-cccc-cccc-cccc-cccccccccccc")


def _sample_role(*, is_active: bool = True, name: str = "Field Coordinator") -> VolunteerRole:
    return VolunteerRole(
        id=ROLE_ID,
        name=name,
        description="Coordinates field activities",
        created_by=ACTOR_ID,
        is_active=is_active,
    )


def _sample_volunteer() -> Volunteer:
    return Volunteer(
        id=VOLUNTEER_ID,
        user_id=USER_ID,
        contact_phone="+1234567890",
        volunteer_role_id=ROLE_ID,
        status=VolunteerStatus.ACTIVE,
    )


def _make_repo(**overrides) -> MagicMock:
    repo = MagicMock(spec=VolunteerRepository)
    repo.get_volunteer_role_by_id = AsyncMock(return_value=_sample_role())
    repo.get_volunteer_role_by_name = AsyncMock(return_value=None)
    repo.get_all_volunteer_roles = AsyncMock(return_value=([_sample_role()], 1))
    repo.update_volunteer_role = AsyncMock(return_value=_sample_role())
    repo.delete_volunteers_by_role_id = AsyncMock(return_value=2)
    repo.delete_volunteer_role_by_id = AsyncMock(return_value=None)
    for key, value in overrides.items():
        setattr(repo, key, value)
    return repo


def _make_uc(repo=None):
    repo = repo or _make_repo()
    db = AsyncMock(spec=AsyncSession)
    return VolunteerRoleUseCase(repo, db), repo, db


def _get_input(**overrides):
    defaults = dict(page=1, page_size=20, search=None, is_active=None)
    defaults.update(overrides)
    return GetAllVolunteerRolesInput(**defaults)


def _update_input(**overrides):
    defaults = dict(role_id=ROLE_ID, actor_id=ACTOR_ID, name=None, description=_UNSET, is_active=None)
    defaults.update(overrides)
    return UpdateVolunteerRoleInput(**defaults)


def _delete_input(**overrides):
    defaults = dict(role_id=ROLE_ID, actor_id=ACTOR_ID)
    defaults.update(overrides)
    return DeleteVolunteerRoleInput(**defaults)


# ---------------------------------------------------------------------------
# TestGetAllVolunteerRoles
# ---------------------------------------------------------------------------


class TestGetAllVolunteerRoles:
    @pytest.mark.asyncio
    async def test_get_all_returns_roles_with_pagination_metadata(self):
        uc, repo, _ = _make_uc()
        result = await uc.get_all_volunteer_roles(_get_input(page=1, page_size=20))
        assert result.total == 1
        assert result.page == 1
        assert result.page_size == 20
        assert result.total_pages == 1
        assert len(result.roles) == 1

    @pytest.mark.asyncio
    async def test_get_all_passes_search_to_repository(self):
        uc, repo, _ = _make_uc()
        await uc.get_all_volunteer_roles(_get_input(search="coord"))
        repo.get_all_volunteer_roles.assert_called_once_with(
            search="coord", is_active=None, page=1, page_size=20
        )

    @pytest.mark.asyncio
    async def test_get_all_passes_is_active_filter_to_repository(self):
        uc, repo, _ = _make_uc()
        await uc.get_all_volunteer_roles(_get_input(is_active=True))
        repo.get_all_volunteer_roles.assert_called_once_with(
            search=None, is_active=True, page=1, page_size=20
        )

    @pytest.mark.asyncio
    async def test_get_all_computes_total_pages_correctly_for_partial_last_page(self):
        repo = _make_repo(get_all_volunteer_roles=AsyncMock(return_value=([_sample_role()], 21)))
        uc, _, _ = _make_uc(repo=repo)
        result = await uc.get_all_volunteer_roles(_get_input(page_size=20))
        assert result.total_pages == 2

    @pytest.mark.asyncio
    async def test_get_all_returns_at_least_one_total_page_when_empty(self):
        repo = _make_repo(get_all_volunteer_roles=AsyncMock(return_value=([], 0)))
        uc, _, _ = _make_uc(repo=repo)
        result = await uc.get_all_volunteer_roles(_get_input())
        assert result.total_pages == 1
        assert result.roles == []


# ---------------------------------------------------------------------------
# TestUpdateVolunteerRole
# ---------------------------------------------------------------------------


class TestUpdateVolunteerRole:
    @pytest.mark.asyncio
    async def test_update_raises_when_role_not_found(self):
        repo = _make_repo(get_volunteer_role_by_id=AsyncMock(return_value=None))
        uc, _, db = _make_uc(repo=repo)
        with pytest.raises(VolunteerRoleNotFoundError):
            await uc.update_volunteer_role(_update_input())
        db.commit.assert_not_called()

    @pytest.mark.asyncio
    async def test_update_raises_when_new_name_already_taken(self):
        existing = _sample_role(name="Stage Manager")
        repo = _make_repo(get_volunteer_role_by_name=AsyncMock(return_value=existing))
        uc, _, db = _make_uc(repo=repo)
        with pytest.raises(VolunteerRoleAlreadyExistsError):
            await uc.update_volunteer_role(_update_input(name="Stage Manager"))
        db.commit.assert_not_called()

    @pytest.mark.asyncio
    async def test_update_skips_name_uniqueness_check_when_name_unchanged(self):
        repo = _make_repo()
        uc, _, db = _make_uc(repo=repo)
        await uc.update_volunteer_role(_update_input(name="Field Coordinator"))
        repo.get_volunteer_role_by_name.assert_not_called()
        db.commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_update_skips_name_uniqueness_check_when_name_not_provided(self):
        uc, repo, db = _make_uc()
        await uc.update_volunteer_role(_update_input(name=None))
        repo.get_volunteer_role_by_name.assert_not_called()
        db.commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_update_commits_and_returns_updated_role(self):
        uc, repo, db = _make_uc()
        result = await uc.update_volunteer_role(_update_input(name="Stage Lead", is_active=False))
        db.commit.assert_called_once()
        assert result.role is not None

    @pytest.mark.asyncio
    async def test_update_acquires_row_lock_on_role(self):
        uc, repo, _ = _make_uc()
        await uc.update_volunteer_role(_update_input())
        repo.get_volunteer_role_by_id.assert_called_once_with(ROLE_ID, for_update=True)

    @pytest.mark.asyncio
    async def test_update_rollback_on_unexpected_exception(self):
        repo = _make_repo(update_volunteer_role=AsyncMock(side_effect=RuntimeError("db error")))
        uc, _, db = _make_uc(repo=repo)
        with pytest.raises(RuntimeError):
            await uc.update_volunteer_role(_update_input(is_active=False))
        db.rollback.assert_called_once()
        db.commit.assert_not_called()

    @pytest.mark.asyncio
    async def test_update_passes_unset_description_sentinel_to_repository(self):
        uc, repo, db = _make_uc()
        await uc.update_volunteer_role(_update_input(description=_UNSET))
        call_kwargs = repo.update_volunteer_role.call_args.kwargs
        assert call_kwargs.get("description") is _UNSET

    @pytest.mark.asyncio
    async def test_update_passes_explicit_description_value_to_repository(self):
        uc, repo, db = _make_uc()
        await uc.update_volunteer_role(_update_input(description="New description"))
        call_kwargs = repo.update_volunteer_role.call_args.kwargs
        assert call_kwargs.get("description") == "New description"


# ---------------------------------------------------------------------------
# TestDeleteVolunteerRole
# ---------------------------------------------------------------------------


class TestDeleteVolunteerRole:
    @pytest.mark.asyncio
    async def test_delete_raises_when_role_not_found(self):
        repo = _make_repo(get_volunteer_role_by_id=AsyncMock(return_value=None))
        uc, _, db = _make_uc(repo=repo)
        with pytest.raises(VolunteerRoleNotFoundError):
            await uc.delete_volunteer_role(_delete_input())
        db.commit.assert_not_called()

    @pytest.mark.asyncio
    async def test_delete_removes_volunteers_before_deleting_role(self):
        uc, repo, db = _make_uc()
        result = await uc.delete_volunteer_role(_delete_input())
        repo.delete_volunteers_by_role_id.assert_called_once_with(ROLE_ID)
        repo.delete_volunteer_role_by_id.assert_called_once_with(ROLE_ID)
        db.commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_delete_returns_volunteer_count_removed(self):
        uc, _, _ = _make_uc()
        result = await uc.delete_volunteer_role(_delete_input())
        assert result.volunteers_removed == 2
        assert result.role_id == ROLE_ID

    @pytest.mark.asyncio
    async def test_delete_returns_zero_volunteers_removed_when_none_assigned(self):
        repo = _make_repo(delete_volunteers_by_role_id=AsyncMock(return_value=0))
        uc, _, _ = _make_uc(repo=repo)
        result = await uc.delete_volunteer_role(_delete_input())
        assert result.volunteers_removed == 0

    @pytest.mark.asyncio
    async def test_delete_acquires_row_lock_on_role(self):
        uc, repo, _ = _make_uc()
        await uc.delete_volunteer_role(_delete_input())
        repo.get_volunteer_role_by_id.assert_called_once_with(ROLE_ID, for_update=True)

    @pytest.mark.asyncio
    async def test_delete_rollback_on_unexpected_exception_during_volunteer_removal(self):
        repo = _make_repo(delete_volunteers_by_role_id=AsyncMock(side_effect=RuntimeError("db error")))
        uc, _, db = _make_uc(repo=repo)
        with pytest.raises(RuntimeError):
            await uc.delete_volunteer_role(_delete_input())
        db.rollback.assert_called_once()
        db.commit.assert_not_called()

    @pytest.mark.asyncio
    async def test_delete_rollback_on_unexpected_exception_during_role_deletion(self):
        repo = _make_repo(delete_volunteer_role_by_id=AsyncMock(side_effect=RuntimeError("db error")))
        uc, _, db = _make_uc(repo=repo)
        with pytest.raises(RuntimeError):
            await uc.delete_volunteer_role(_delete_input())
        db.rollback.assert_called_once()
        db.commit.assert_not_called()
