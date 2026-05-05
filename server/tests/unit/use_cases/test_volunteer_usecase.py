"""Unit tests for VolunteerUseCase (add_volunteer and create_volunteer_role)."""

import uuid
from unittest.mock import AsyncMock, MagicMock

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.dto.volunteer_dto import AddVolunteerInput, CreateVolunteerRoleInput
from app.application.use_cases.volunteer_usecase import VolunteerUseCase
from app.domain.entities.authorization_entities import Role as RoleEntity
from app.domain.entities.user_entity import User as UserEntity
from app.domain.entities.volunteer_entity import Volunteer, VolunteerRole, VolunteerStatus
from app.domain.exceptions.user_exceptions import UserNotFoundError
from app.domain.exceptions.volunteer_exceptions import VolunteerAlreadyExistsError
from app.domain.exceptions.volunteer_role_exceptions import (
    VolunteerRoleAlreadyExistsError,
    VolunteerRoleInactiveError,
    VolunteerRoleNotFoundError,
)
from app.infrastructure.database.repositories.role_repository import RoleRepository
from app.infrastructure.database.repositories.volunteer_repository import VolunteerRepository

ACTOR_ID = uuid.UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
USER_ID = uuid.UUID("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")
VOLUNTEER_ID = uuid.UUID("cccccccc-cccc-cccc-cccc-cccccccccccc")
ROLE_ID = uuid.UUID("dddddddd-dddd-dddd-dddd-dddddddddddd")
RBAC_ROLE_ID = uuid.UUID("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee")


def _sample_user() -> UserEntity:
    return UserEntity(
        id=USER_ID,
        email="user@example.com",
        password="hashed",
    )


def _sample_volunteer_role(*, is_active: bool = True) -> VolunteerRole:
    return VolunteerRole(
        id=ROLE_ID,
        name="Field Coordinator",
        description=None,
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


def _sample_rbac_role() -> RoleEntity:
    return RoleEntity(
        id=RBAC_ROLE_ID,
        name="volunteer",
        description=None,
    )


def _make_vol_repo(**overrides) -> MagicMock:
    repo = MagicMock(spec=VolunteerRepository)
    repo.get_user_by_id = AsyncMock(return_value=_sample_user())
    repo.get_volunteer_role_by_id = AsyncMock(return_value=_sample_volunteer_role())
    repo.get_volunteer_by_user_id = AsyncMock(return_value=None)
    repo.create_volunteer = AsyncMock(return_value=_sample_volunteer())
    repo.get_volunteer_role_by_name = AsyncMock(return_value=None)
    repo.create_volunteer_role = AsyncMock(return_value=_sample_volunteer_role())
    repo.get_rbac_role_by_name = AsyncMock(return_value=_sample_rbac_role())
    for key, value in overrides.items():
        setattr(repo, key, value)
    return repo


def _make_role_repo(**overrides) -> MagicMock:
    repo = MagicMock(spec=RoleRepository)
    repo.get_active_assignment = AsyncMock(return_value=None)
    repo.create_assignment = AsyncMock(return_value=MagicMock())
    for key, value in overrides.items():
        setattr(repo, key, value)
    return repo


def _make_uc(vol_repo=None, role_repo=None):
    vol_repo = vol_repo or _make_vol_repo()
    role_repo = role_repo or _make_role_repo()
    db = AsyncMock(spec=AsyncSession)
    return VolunteerUseCase(vol_repo, role_repo, db), vol_repo, role_repo, db


def _add_input(**overrides):
    defaults = dict(
        actor_id=ACTOR_ID,
        target_user_id=USER_ID,
        contact_phone="+1234567890",
        volunteer_role_id=ROLE_ID,
    )
    defaults.update(overrides)
    return AddVolunteerInput(**defaults)


def _create_role_input(**overrides):
    defaults = dict(
        name="Field Coordinator",
        description="Coordinates field activities",
        created_by=ACTOR_ID,
    )
    defaults.update(overrides)
    return CreateVolunteerRoleInput(**defaults)


# ---------------------------------------------------------------------------
# TestAddVolunteer
# ---------------------------------------------------------------------------


class TestAddVolunteer:
    @pytest.mark.asyncio
    async def test_add_volunteer_raises_when_user_not_found(self):
        vol_repo = _make_vol_repo(get_user_by_id=AsyncMock(return_value=None))
        uc, _, _, db = _make_uc(vol_repo=vol_repo)
        with pytest.raises(UserNotFoundError):
            await uc.add_volunteer(_add_input())
        db.commit.assert_not_called()

    @pytest.mark.asyncio
    async def test_add_volunteer_raises_when_role_not_found(self):
        vol_repo = _make_vol_repo(get_volunteer_role_by_id=AsyncMock(return_value=None))
        uc, _, _, db = _make_uc(vol_repo=vol_repo)
        with pytest.raises(VolunteerRoleNotFoundError):
            await uc.add_volunteer(_add_input())
        db.commit.assert_not_called()

    @pytest.mark.asyncio
    async def test_add_volunteer_raises_when_role_inactive(self):
        inactive_role = _sample_volunteer_role(is_active=False)
        vol_repo = _make_vol_repo(get_volunteer_role_by_id=AsyncMock(return_value=inactive_role))
        uc, _, _, db = _make_uc(vol_repo=vol_repo)
        with pytest.raises(VolunteerRoleInactiveError):
            await uc.add_volunteer(_add_input())
        db.commit.assert_not_called()

    @pytest.mark.asyncio
    async def test_add_volunteer_raises_when_already_volunteer(self):
        vol_repo = _make_vol_repo(get_volunteer_by_user_id=AsyncMock(return_value=_sample_volunteer()))
        uc, _, _, db = _make_uc(vol_repo=vol_repo)
        with pytest.raises(VolunteerAlreadyExistsError):
            await uc.add_volunteer(_add_input())
        db.rollback.assert_called_once()

    @pytest.mark.asyncio
    async def test_add_volunteer_creates_volunteer_and_commits(self):
        uc, vol_repo, _, db = _make_uc()
        result = await uc.add_volunteer(_add_input())
        vol_repo.create_volunteer.assert_called_once_with(
            user_id=USER_ID,
            contact_phone="+1234567890",
            volunteer_role_id=ROLE_ID,
        )
        db.commit.assert_called_once()
        assert result.volunteer.user_id == USER_ID

    @pytest.mark.asyncio
    async def test_add_volunteer_locks_user_row_before_existence_check(self):
        uc, vol_repo, _, _ = _make_uc()
        await uc.add_volunteer(_add_input())
        vol_repo.get_volunteer_by_user_id.assert_called_once_with(USER_ID, for_update=True)

    @pytest.mark.asyncio
    async def test_add_volunteer_assigns_rbac_volunteer_role(self):
        uc, _, role_repo, _ = _make_uc()
        await uc.add_volunteer(_add_input())
        role_repo.create_assignment.assert_called_once_with(
            user_id=USER_ID,
            role_id=RBAC_ROLE_ID,
            expires_at=None,
            assigned_by=ACTOR_ID,
        )

    @pytest.mark.asyncio
    async def test_add_volunteer_skips_rbac_if_volunteer_role_missing(self):
        vol_repo = _make_vol_repo(get_rbac_role_by_name=AsyncMock(return_value=None))
        uc, _, role_repo, db = _make_uc(vol_repo=vol_repo)
        result = await uc.add_volunteer(_add_input())
        role_repo.create_assignment.assert_not_called()
        db.commit.assert_called_once()
        assert result.volunteer is not None

    @pytest.mark.asyncio
    async def test_add_volunteer_skips_rbac_if_already_assigned(self):
        existing_assignment = MagicMock()
        role_repo = _make_role_repo(get_active_assignment=AsyncMock(return_value=existing_assignment))
        uc, _, role_repo_instance, db = _make_uc(role_repo=role_repo)
        result = await uc.add_volunteer(_add_input())
        role_repo_instance.create_assignment.assert_not_called()
        db.commit.assert_called_once()
        assert result.volunteer is not None

    @pytest.mark.asyncio
    async def test_add_volunteer_rollback_on_unexpected_exception(self):
        vol_repo = _make_vol_repo(create_volunteer=AsyncMock(side_effect=RuntimeError("db error")))
        uc, _, _, db = _make_uc(vol_repo=vol_repo)
        with pytest.raises(RuntimeError):
            await uc.add_volunteer(_add_input())
        db.rollback.assert_called_once()
        db.commit.assert_not_called()


# ---------------------------------------------------------------------------
# TestCreateVolunteerRole
# ---------------------------------------------------------------------------


class TestCreateVolunteerRole:
    @pytest.mark.asyncio
    async def test_create_volunteer_role_raises_when_name_exists(self):
        vol_repo = _make_vol_repo(get_volunteer_role_by_name=AsyncMock(return_value=_sample_volunteer_role()))
        uc, _, _, db = _make_uc(vol_repo=vol_repo)
        with pytest.raises(VolunteerRoleAlreadyExistsError):
            await uc.create_volunteer_role(_create_role_input())
        db.rollback.assert_not_called()
        db.commit.assert_not_called()

    @pytest.mark.asyncio
    async def test_create_volunteer_role_creates_and_commits(self):
        uc, vol_repo, _, db = _make_uc()
        result = await uc.create_volunteer_role(_create_role_input())
        vol_repo.create_volunteer_role.assert_called_once_with(
            name="Field Coordinator",
            description="Coordinates field activities",
            created_by=ACTOR_ID,
        )
        db.commit.assert_called_once()
        assert result.role.name == "Field Coordinator"

    @pytest.mark.asyncio
    async def test_create_volunteer_role_rollback_on_unexpected_exception(self):
        vol_repo = _make_vol_repo(create_volunteer_role=AsyncMock(side_effect=RuntimeError("db error")))
        uc, _, _, db = _make_uc(vol_repo=vol_repo)
        with pytest.raises(RuntimeError):
            await uc.create_volunteer_role(_create_role_input())
        db.rollback.assert_called_once()
        db.commit.assert_not_called()

    @pytest.mark.asyncio
    async def test_create_volunteer_role_returns_created_role_entity(self):
        uc, _, _, _ = _make_uc()
        result = await uc.create_volunteer_role(_create_role_input())
        assert result.role.is_active is True
        assert result.role.created_by == ACTOR_ID
