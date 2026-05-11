"""Functional test cases for VolunteerRoleUseCase (get_all, update, delete)."""

import uuid
from unittest.mock import AsyncMock, MagicMock

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.dto.volunteer_dto import (
    DeleteVolunteerRoleInput,
    GetAllVolunteerRolesInput,
    UpdateVolunteerRoleInput,
)
from app.application.use_cases.volunteer_usecase import VolunteerRoleUseCase
from app.domain.entities.volunteer_entity import Volunteer, VolunteerRole, VolunteerStatus
from app.domain.exceptions.volunteer_role_exceptions import (
    VolunteerRoleAlreadyExistsError,
    VolunteerRoleNotFoundError,
)
from app.infrastructure.database.repositories.volunteer_repository import VolunteerRepository

ACTOR_ID = uuid.UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
ROLE_ID = uuid.UUID("dddddddd-dddd-dddd-dddd-dddddddddddd")
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


# ---------------------------------------------------------------------------
# get_all_volunteer_roles
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_get_all_roles_returns_paginated_list_with_metadata():
    """Returns a list of roles with correct pagination metadata for a non-empty result set."""
    uc, _, _ = _make_uc()
    result = await uc.get_all_volunteer_roles(GetAllVolunteerRolesInput(page=1, page_size=20))
    assert result.total == 1
    assert result.total_pages == 1
    assert len(result.roles) == 1


@pytest.mark.asyncio
async def test_get_all_roles_forwards_search_filter_to_repository():
    """Passes the search string to the repository without modification."""
    uc, repo, _ = _make_uc()
    await uc.get_all_volunteer_roles(GetAllVolunteerRolesInput(page=1, page_size=20, search="coord"))
    repo.get_all_volunteer_roles.assert_called_once_with(search="coord", is_active=None, page=1, page_size=20)


@pytest.mark.asyncio
async def test_get_all_roles_forwards_is_active_filter_to_repository():
    """Passes the is_active boolean filter to the repository."""
    uc, repo, _ = _make_uc()
    await uc.get_all_volunteer_roles(GetAllVolunteerRolesInput(page=1, page_size=20, is_active=False))
    repo.get_all_volunteer_roles.assert_called_once_with(search=None, is_active=False, page=1, page_size=20)


@pytest.mark.asyncio
async def test_get_all_roles_computes_total_pages_for_partial_page():
    """Calculates total_pages correctly when the total count exceeds page_size by any amount."""
    repo = _make_repo(get_all_volunteer_roles=AsyncMock(return_value=([_sample_role()], 21)))
    uc, _, _ = _make_uc(repo=repo)
    result = await uc.get_all_volunteer_roles(GetAllVolunteerRolesInput(page=1, page_size=20))
    assert result.total_pages == 2


@pytest.mark.asyncio
async def test_get_all_roles_returns_at_least_one_page_when_no_results():
    """Returns total_pages=1 even when the result set is empty."""
    repo = _make_repo(get_all_volunteer_roles=AsyncMock(return_value=([], 0)))
    uc, _, _ = _make_uc(repo=repo)
    result = await uc.get_all_volunteer_roles(GetAllVolunteerRolesInput(page=1, page_size=20))
    assert result.total_pages == 1
    assert result.roles == []


# ---------------------------------------------------------------------------
# update_volunteer_role
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_update_volunteer_role_raises_when_role_not_found():
    """Raises VolunteerRoleNotFoundError when no role matches the given ID."""
    repo = _make_repo(get_volunteer_role_by_id=AsyncMock(return_value=None))
    uc, _, db = _make_uc(repo=repo)
    with pytest.raises(VolunteerRoleNotFoundError):
        await uc.update_volunteer_role(UpdateVolunteerRoleInput(role_id=ROLE_ID, actor_id=ACTOR_ID))
    db.commit.assert_not_called()


@pytest.mark.asyncio
async def test_update_volunteer_role_raises_when_new_name_already_taken():
    """Raises VolunteerRoleAlreadyExistsError when the new name conflicts with another existing role."""
    existing = _sample_role(name="Stage Manager")
    repo = _make_repo(get_volunteer_role_by_name=AsyncMock(return_value=existing))
    uc, _, db = _make_uc(repo=repo)
    with pytest.raises(VolunteerRoleAlreadyExistsError):
        await uc.update_volunteer_role(UpdateVolunteerRoleInput(role_id=ROLE_ID, actor_id=ACTOR_ID, name="Stage Manager"))
    db.commit.assert_not_called()


@pytest.mark.asyncio
async def test_update_volunteer_role_skips_uniqueness_check_when_name_is_unchanged():
    """Does not check name uniqueness when the provided name matches the current name exactly."""
    uc, repo, db = _make_uc()
    await uc.update_volunteer_role(UpdateVolunteerRoleInput(role_id=ROLE_ID, actor_id=ACTOR_ID, name="Field Coordinator"))
    repo.get_volunteer_role_by_name.assert_not_called()
    db.commit.assert_called_once()


@pytest.mark.asyncio
async def test_update_volunteer_role_commits_and_returns_updated_entity():
    """Commits the transaction and returns the updated VolunteerRole entity on success."""
    uc, _, db = _make_uc()
    result = await uc.update_volunteer_role(UpdateVolunteerRoleInput(role_id=ROLE_ID, actor_id=ACTOR_ID, is_active=False))
    db.commit.assert_called_once()
    assert result.role is not None


@pytest.mark.asyncio
async def test_update_volunteer_role_acquires_pessimistic_lock_on_role_row():
    """Passes for_update=True when fetching the role to prevent concurrent edits."""
    uc, repo, _ = _make_uc()
    await uc.update_volunteer_role(UpdateVolunteerRoleInput(role_id=ROLE_ID, actor_id=ACTOR_ID))
    repo.get_volunteer_role_by_id.assert_called_once_with(ROLE_ID, for_update=True)


@pytest.mark.asyncio
async def test_update_volunteer_role_rolls_back_and_reraises_on_unexpected_error():
    """Rolls back the transaction and re-raises when an unexpected error occurs during the update."""
    repo = _make_repo(update_volunteer_role=AsyncMock(side_effect=RuntimeError("db error")))
    uc, _, db = _make_uc(repo=repo)
    with pytest.raises(RuntimeError):
        await uc.update_volunteer_role(UpdateVolunteerRoleInput(role_id=ROLE_ID, actor_id=ACTOR_ID, is_active=True))
    db.rollback.assert_called_once()
    db.commit.assert_not_called()


# ---------------------------------------------------------------------------
# delete_volunteer_role
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_delete_volunteer_role_raises_when_role_not_found():
    """Raises VolunteerRoleNotFoundError when no role matches the given ID."""
    repo = _make_repo(get_volunteer_role_by_id=AsyncMock(return_value=None))
    uc, _, db = _make_uc(repo=repo)
    with pytest.raises(VolunteerRoleNotFoundError):
        await uc.delete_volunteer_role(DeleteVolunteerRoleInput(role_id=ROLE_ID, actor_id=ACTOR_ID))
    db.commit.assert_not_called()


@pytest.mark.asyncio
async def test_delete_volunteer_role_removes_volunteers_then_role_in_same_transaction():
    """Deletes volunteer records before deleting the role within the same transaction."""
    uc, repo, db = _make_uc()
    await uc.delete_volunteer_role(DeleteVolunteerRoleInput(role_id=ROLE_ID, actor_id=ACTOR_ID))
    repo.delete_volunteers_by_role_id.assert_called_once_with(ROLE_ID)
    repo.delete_volunteer_role_by_id.assert_called_once_with(ROLE_ID)
    db.commit.assert_called_once()


@pytest.mark.asyncio
async def test_delete_volunteer_role_returns_role_id_and_volunteer_count():
    """Returns the deleted role ID and the count of volunteer records that were removed."""
    uc, _, _ = _make_uc()
    result = await uc.delete_volunteer_role(DeleteVolunteerRoleInput(role_id=ROLE_ID, actor_id=ACTOR_ID))
    assert result.role_id == ROLE_ID
    assert result.volunteers_removed == 2


@pytest.mark.asyncio
async def test_delete_volunteer_role_succeeds_with_no_assigned_volunteers():
    """Completes the delete without error when no volunteers are assigned to the role."""
    repo = _make_repo(delete_volunteers_by_role_id=AsyncMock(return_value=0))
    uc, _, db = _make_uc(repo=repo)
    result = await uc.delete_volunteer_role(DeleteVolunteerRoleInput(role_id=ROLE_ID, actor_id=ACTOR_ID))
    assert result.volunteers_removed == 0
    db.commit.assert_called_once()


@pytest.mark.asyncio
async def test_delete_volunteer_role_acquires_pessimistic_lock_on_role_row():
    """Passes for_update=True when fetching the role to prevent concurrent volunteer assignments."""
    uc, repo, _ = _make_uc()
    await uc.delete_volunteer_role(DeleteVolunteerRoleInput(role_id=ROLE_ID, actor_id=ACTOR_ID))
    repo.get_volunteer_role_by_id.assert_called_once_with(ROLE_ID, for_update=True)


@pytest.mark.asyncio
async def test_delete_volunteer_role_rolls_back_and_reraises_on_unexpected_error():
    """Rolls back the transaction and re-raises when an unexpected error occurs during deletion."""
    repo = _make_repo(delete_volunteers_by_role_id=AsyncMock(side_effect=RuntimeError("db error")))
    uc, _, db = _make_uc(repo=repo)
    with pytest.raises(RuntimeError):
        await uc.delete_volunteer_role(DeleteVolunteerRoleInput(role_id=ROLE_ID, actor_id=ACTOR_ID))
    db.rollback.assert_called_once()
    db.commit.assert_not_called()
