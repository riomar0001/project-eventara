"""Unit tests for GetVolunteerUseCase, VolunteerUseCase, VolunteerApplicationUseCase, and UpdateVolunteerInfoUseCase."""

import uuid
from unittest.mock import AsyncMock, MagicMock

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.dto.volunteer_dto import (
    AddVolunteerInput,
    CreateVolunteerRoleInput,
    GetAllVolunteersInput,
    GetPotentialVolunteersInput,
    ReviewApplicationInput,
    SubmitApplicationInput,
    UpdateVolunteerInfoInput,
    WithdrawApplicationInput,
)
from app.application.use_cases.volunteer_usecase import GetVolunteerUseCase, UpdateVolunteerInfoUseCase, VolunteerApplicationUseCase, VolunteerUseCase
from app.domain.entities.authorization_entities import Role as RoleEntity
from app.domain.entities.user_entity import User as UserEntity
from app.domain.entities.volunteer_entity import ApplicationStatus, PotentialVolunteer, Volunteer, VolunteerApplication, VolunteerRole, VolunteerStatus
from app.domain.exceptions.user_exceptions import UserNotFoundError
from app.domain.exceptions.volunteer_application_exceptions import (
    InvalidApplicationStatusTransitionError,
    UnauthorizedApplicationOperationError,
    VolunteerApplicationAlreadyExistsError,
    VolunteerApplicationNotFoundError,
)
from app.domain.exceptions.volunteer_exceptions import VolunteerAlreadyExistsError, VolunteerNotFoundError
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
APPLICATION_ID = uuid.UUID("ffffffff-ffff-ffff-ffff-ffffffffffff")


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


def _sample_application(*, status: ApplicationStatus = ApplicationStatus.PENDING) -> VolunteerApplication:
    return VolunteerApplication(
        id=APPLICATION_ID,
        user_id=USER_ID,
        status=status,
        application_data={"skills": "logistics"},
    )


def _sample_potential_volunteer() -> PotentialVolunteer:
    return PotentialVolunteer(
        user_id=USER_ID,
        first_name="Maya",
        last_name="Chen",
        alias="maya-chen",
        email="user@example.com",
        events_count=3,
    )


def _make_vol_repo(**overrides) -> MagicMock:
    repo = MagicMock(spec=VolunteerRepository)
    repo.get_user_by_id = AsyncMock(return_value=_sample_user())
    repo.get_volunteer_role_by_id = AsyncMock(return_value=_sample_volunteer_role())
    repo.get_volunteer_by_user_id = AsyncMock(return_value=None)
    repo.get_volunteer_by_id = AsyncMock(return_value=_sample_volunteer())
    repo.create_volunteer = AsyncMock(return_value=_sample_volunteer())
    repo.update_volunteer = AsyncMock(return_value=_sample_volunteer())
    repo.get_volunteer_role_by_name = AsyncMock(return_value=None)
    repo.create_volunteer_role = AsyncMock(return_value=_sample_volunteer_role())
    repo.get_rbac_role_by_name = AsyncMock(return_value=_sample_rbac_role())
    repo.get_application_by_id = AsyncMock(return_value=_sample_application())
    repo.get_active_application_by_user_id = AsyncMock(return_value=None)
    repo.create_application = AsyncMock(return_value=_sample_application())
    repo.update_application_status = AsyncMock(
        side_effect=lambda app_id, new_status: _sample_application(status=new_status)
    )
    repo.get_all_volunteers = AsyncMock(return_value=([_sample_volunteer()], 1))
    repo.get_potential_volunteers = AsyncMock(return_value=([_sample_potential_volunteer()], 1))
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


def _make_get_uc(vol_repo=None):
    vol_repo = vol_repo or _make_vol_repo()
    return GetVolunteerUseCase(vol_repo), vol_repo


def _make_update_uc(vol_repo=None):
    vol_repo = vol_repo or _make_vol_repo()
    db = AsyncMock(spec=AsyncSession)
    return UpdateVolunteerInfoUseCase(vol_repo, db), vol_repo, db


def _make_uc(vol_repo=None, role_repo=None):
    vol_repo = vol_repo or _make_vol_repo()
    role_repo = role_repo or _make_role_repo()
    db = AsyncMock(spec=AsyncSession)
    return VolunteerUseCase(vol_repo, role_repo, db), vol_repo, role_repo, db


def _make_app_uc(vol_repo=None, role_repo=None):
    vol_repo = vol_repo or _make_vol_repo()
    role_repo = role_repo or _make_role_repo()
    db = AsyncMock(spec=AsyncSession)
    return VolunteerApplicationUseCase(vol_repo, role_repo, db), vol_repo, role_repo, db


def _submit_input(**overrides):
    defaults = dict(user_id=USER_ID, application_data={"skills": "logistics"})
    defaults.update(overrides)
    return SubmitApplicationInput(**defaults)


def _review_input(**overrides):
    defaults = dict(
        application_id=APPLICATION_ID,
        reviewer_id=ACTOR_ID,
        new_status=ApplicationStatus.APPROVED,
        contact_phone="+1234567890",
        volunteer_role_id=ROLE_ID,
    )
    defaults.update(overrides)
    return ReviewApplicationInput(**defaults)


def _withdraw_input(**overrides):
    defaults = dict(application_id=APPLICATION_ID, user_id=USER_ID)
    defaults.update(overrides)
    return WithdrawApplicationInput(**defaults)


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
# TestGetAllVolunteers
# ---------------------------------------------------------------------------


def _get_all_input(**overrides):
    defaults = dict(page=1, page_size=20, status=None, role_id=None)
    defaults.update(overrides)
    return GetAllVolunteersInput(**defaults)


class TestGetAllVolunteers:
    @pytest.mark.asyncio
    async def test_get_all_volunteers_calls_repo_with_correct_parameters(self):
        uc, vol_repo = _make_get_uc()
        await uc.get_all_volunteers(_get_all_input(page=2, page_size=10))
        vol_repo.get_all_volunteers.assert_called_once_with(
            status=None,
            role_id=None,
            page=2,
            page_size=10,
        )

    @pytest.mark.asyncio
    async def test_get_all_volunteers_passes_status_filter_to_repo(self):
        uc, vol_repo = _make_get_uc()
        await uc.get_all_volunteers(_get_all_input(status=VolunteerStatus.ACTIVE))
        vol_repo.get_all_volunteers.assert_called_once_with(
            status=VolunteerStatus.ACTIVE,
            role_id=None,
            page=1,
            page_size=20,
        )

    @pytest.mark.asyncio
    async def test_get_all_volunteers_passes_role_id_filter_to_repo(self):
        uc, vol_repo = _make_get_uc()
        await uc.get_all_volunteers(_get_all_input(role_id=ROLE_ID))
        vol_repo.get_all_volunteers.assert_called_once_with(
            status=None,
            role_id=ROLE_ID,
            page=1,
            page_size=20,
        )

    @pytest.mark.asyncio
    async def test_get_all_volunteers_returns_volunteers_and_pagination_metadata(self):
        uc, _ = _make_get_uc()
        result = await uc.get_all_volunteers(_get_all_input())
        assert len(result.volunteers) == 1
        assert result.total == 1
        assert result.page == 1
        assert result.page_size == 20
        assert result.total_pages == 1

    @pytest.mark.asyncio
    async def test_get_all_volunteers_calculates_total_pages_correctly(self):
        vol_repo = _make_vol_repo(
            get_all_volunteers=AsyncMock(return_value=([_sample_volunteer()], 45))
        )
        uc, _ = _make_get_uc(vol_repo=vol_repo)
        result = await uc.get_all_volunteers(_get_all_input(page_size=20))
        assert result.total_pages == 3

    @pytest.mark.asyncio
    async def test_get_all_volunteers_returns_at_least_one_total_page_when_empty(self):
        vol_repo = _make_vol_repo(get_all_volunteers=AsyncMock(return_value=([], 0)))
        uc, _ = _make_get_uc(vol_repo=vol_repo)
        result = await uc.get_all_volunteers(_get_all_input())
        assert result.total_pages == 1
        assert result.volunteers == []


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


# ---------------------------------------------------------------------------
# TestVolunteerApplicationUseCase
# ---------------------------------------------------------------------------


class TestSubmitApplication:
    @pytest.mark.asyncio
    async def test_submit_application_raises_when_user_not_found(self):
        vol_repo = _make_vol_repo(get_user_by_id=AsyncMock(return_value=None))
        uc, _, _, db = _make_app_uc(vol_repo=vol_repo)
        with pytest.raises(UserNotFoundError):
            await uc.submit_application(_submit_input())
        db.commit.assert_not_called()

    @pytest.mark.asyncio
    async def test_submit_application_raises_when_user_is_already_a_volunteer(self):
        vol_repo = _make_vol_repo(get_volunteer_by_user_id=AsyncMock(return_value=_sample_volunteer()))
        uc, _, _, db = _make_app_uc(vol_repo=vol_repo)
        with pytest.raises(VolunteerAlreadyExistsError):
            await uc.submit_application(_submit_input())
        db.commit.assert_not_called()

    @pytest.mark.asyncio
    async def test_submit_application_raises_when_active_application_exists(self):
        vol_repo = _make_vol_repo(
            get_active_application_by_user_id=AsyncMock(return_value=_sample_application())
        )
        uc, _, _, db = _make_app_uc(vol_repo=vol_repo)
        with pytest.raises(VolunteerApplicationAlreadyExistsError):
            await uc.submit_application(_submit_input())
        db.rollback.assert_called_once()

    @pytest.mark.asyncio
    async def test_submit_application_creates_application_and_commits(self):
        uc, vol_repo, _, db = _make_app_uc()
        result = await uc.submit_application(_submit_input())
        vol_repo.create_application.assert_called_once_with(
            user_id=USER_ID,
            application_data={"skills": "logistics"},
        )
        db.commit.assert_called_once()
        assert result.application.user_id == USER_ID

    @pytest.mark.asyncio
    async def test_submit_application_locks_active_application_row_before_check(self):
        uc, vol_repo, _, _ = _make_app_uc()
        await uc.submit_application(_submit_input())
        vol_repo.get_active_application_by_user_id.assert_called_once_with(USER_ID, for_update=True)

    @pytest.mark.asyncio
    async def test_submit_application_rollback_on_unexpected_exception(self):
        vol_repo = _make_vol_repo(create_application=AsyncMock(side_effect=RuntimeError("db error")))
        uc, _, _, db = _make_app_uc(vol_repo=vol_repo)
        with pytest.raises(RuntimeError):
            await uc.submit_application(_submit_input())
        db.rollback.assert_called_once()
        db.commit.assert_not_called()


class TestReviewApplication:
    @pytest.mark.asyncio
    async def test_review_application_raises_when_application_not_found(self):
        vol_repo = _make_vol_repo(get_application_by_id=AsyncMock(return_value=None))
        uc, _, _, db = _make_app_uc(vol_repo=vol_repo)
        with pytest.raises(VolunteerApplicationNotFoundError):
            await uc.review_application(_review_input())
        db.commit.assert_not_called()

    @pytest.mark.asyncio
    async def test_review_application_raises_on_invalid_status_transition(self):
        approved_app = _sample_application(status=ApplicationStatus.APPROVED)
        vol_repo = _make_vol_repo(get_application_by_id=AsyncMock(return_value=approved_app))
        uc, _, _, db = _make_app_uc(vol_repo=vol_repo)
        with pytest.raises(InvalidApplicationStatusTransitionError):
            await uc.review_application(_review_input(new_status=ApplicationStatus.APPROVED))
        db.commit.assert_not_called()

    @pytest.mark.asyncio
    async def test_review_application_approves_and_creates_volunteer(self):
        uc, vol_repo, _, db = _make_app_uc()
        result = await uc.review_application(_review_input())
        vol_repo.create_volunteer.assert_called_once_with(
            user_id=USER_ID,
            contact_phone="+1234567890",
            volunteer_role_id=ROLE_ID,
        )
        db.commit.assert_called_once()
        assert result.volunteer is not None
        assert result.application.status == ApplicationStatus.APPROVED

    @pytest.mark.asyncio
    async def test_review_application_rejects_and_does_not_create_volunteer(self):
        uc, vol_repo, _, db = _make_app_uc()
        result = await uc.review_application(
            _review_input(new_status=ApplicationStatus.REJECTED, contact_phone=None, volunteer_role_id=None)
        )
        vol_repo.create_volunteer.assert_not_called()
        db.commit.assert_called_once()
        assert result.volunteer is None

    @pytest.mark.asyncio
    async def test_review_application_approves_without_volunteer_when_no_contact_info(self):
        uc, vol_repo, _, db = _make_app_uc()
        result = await uc.review_application(
            _review_input(contact_phone=None, volunteer_role_id=None)
        )
        vol_repo.create_volunteer.assert_not_called()
        db.commit.assert_called_once()
        assert result.volunteer is None

    @pytest.mark.asyncio
    async def test_review_application_raises_when_volunteer_role_not_found_on_approval(self):
        vol_repo = _make_vol_repo(get_volunteer_role_by_id=AsyncMock(return_value=None))
        uc, _, _, db = _make_app_uc(vol_repo=vol_repo)
        with pytest.raises(VolunteerRoleNotFoundError):
            await uc.review_application(_review_input())
        db.rollback.assert_called_once()

    @pytest.mark.asyncio
    async def test_review_application_raises_when_volunteer_role_inactive_on_approval(self):
        vol_repo = _make_vol_repo(
            get_volunteer_role_by_id=AsyncMock(return_value=_sample_volunteer_role(is_active=False))
        )
        uc, _, _, db = _make_app_uc(vol_repo=vol_repo)
        with pytest.raises(VolunteerRoleInactiveError):
            await uc.review_application(_review_input())
        db.rollback.assert_called_once()

    @pytest.mark.asyncio
    async def test_review_application_raises_when_applicant_is_already_a_volunteer(self):
        vol_repo = _make_vol_repo(
            get_volunteer_by_user_id=AsyncMock(return_value=_sample_volunteer())
        )
        uc, _, _, db = _make_app_uc(vol_repo=vol_repo)
        with pytest.raises(VolunteerAlreadyExistsError):
            await uc.review_application(_review_input())
        db.rollback.assert_called_once()

    @pytest.mark.asyncio
    async def test_review_application_locks_application_row(self):
        uc, vol_repo, _, _ = _make_app_uc()
        await uc.review_application(_review_input())
        vol_repo.get_application_by_id.assert_called_once_with(APPLICATION_ID, for_update=True)

    @pytest.mark.asyncio
    async def test_review_application_assigns_rbac_volunteer_role_on_approval(self):
        uc, _, role_repo, _ = _make_app_uc()
        await uc.review_application(_review_input())
        role_repo.create_assignment.assert_called_once_with(
            user_id=USER_ID,
            role_id=RBAC_ROLE_ID,
            expires_at=None,
            assigned_by=ACTOR_ID,
        )

    @pytest.mark.asyncio
    async def test_review_application_rollback_on_unexpected_exception(self):
        vol_repo = _make_vol_repo(
            update_application_status=AsyncMock(side_effect=RuntimeError("db error"))
        )
        uc, _, _, db = _make_app_uc(vol_repo=vol_repo)
        with pytest.raises(RuntimeError):
            await uc.review_application(_review_input())
        db.rollback.assert_called_once()
        db.commit.assert_not_called()


class TestWithdrawApplication:
    @pytest.mark.asyncio
    async def test_withdraw_application_raises_when_application_not_found(self):
        vol_repo = _make_vol_repo(get_application_by_id=AsyncMock(return_value=None))
        uc, _, _, db = _make_app_uc(vol_repo=vol_repo)
        with pytest.raises(VolunteerApplicationNotFoundError):
            await uc.withdraw_application(_withdraw_input())
        db.commit.assert_not_called()

    @pytest.mark.asyncio
    async def test_withdraw_application_raises_when_caller_is_not_owner(self):
        other_user_id = uuid.UUID("11111111-1111-1111-1111-111111111111")
        uc, _, _, db = _make_app_uc()
        with pytest.raises(UnauthorizedApplicationOperationError):
            await uc.withdraw_application(_withdraw_input(user_id=other_user_id))
        db.commit.assert_not_called()

    @pytest.mark.asyncio
    async def test_withdraw_application_raises_on_invalid_status_transition(self):
        approved_app = _sample_application(status=ApplicationStatus.APPROVED)
        vol_repo = _make_vol_repo(get_application_by_id=AsyncMock(return_value=approved_app))
        uc, _, _, db = _make_app_uc(vol_repo=vol_repo)
        with pytest.raises(InvalidApplicationStatusTransitionError):
            await uc.withdraw_application(_withdraw_input())
        db.commit.assert_not_called()

    @pytest.mark.asyncio
    async def test_withdraw_application_updates_status_and_commits(self):
        uc, vol_repo, _, db = _make_app_uc()
        result = await uc.withdraw_application(_withdraw_input())
        vol_repo.update_application_status.assert_called_once_with(
            APPLICATION_ID, ApplicationStatus.WITHDRAWN
        )
        db.commit.assert_called_once()
        assert result.application.status == ApplicationStatus.WITHDRAWN

    @pytest.mark.asyncio
    async def test_withdraw_application_locks_application_row(self):
        uc, vol_repo, _, _ = _make_app_uc()
        await uc.withdraw_application(_withdraw_input())
        vol_repo.get_application_by_id.assert_called_once_with(APPLICATION_ID, for_update=True)

    @pytest.mark.asyncio
    async def test_withdraw_application_rollback_on_unexpected_exception(self):
        vol_repo = _make_vol_repo(
            update_application_status=AsyncMock(side_effect=RuntimeError("db error"))
        )
        uc, _, _, db = _make_app_uc(vol_repo=vol_repo)
        with pytest.raises(RuntimeError):
            await uc.withdraw_application(_withdraw_input())
        db.rollback.assert_called_once()
        db.commit.assert_not_called()


# ---------------------------------------------------------------------------
# TestUpdateVolunteerInfo
# ---------------------------------------------------------------------------


def _update_volunteer_input(**overrides):
    defaults = dict(
        volunteer_id=VOLUNTEER_ID,
        actor_id=ACTOR_ID,
        contact_phone=None,
        volunteer_role_id=None,
        status=None,
    )
    defaults.update(overrides)
    return UpdateVolunteerInfoInput(**defaults)


def _get_potential_input(**overrides):
    defaults = dict(page=1, page_size=20, min_events=1, search=None)
    defaults.update(overrides)
    return GetPotentialVolunteersInput(**defaults)


class TestUpdateVolunteerInfo:
    @pytest.mark.asyncio
    async def test_update_volunteer_info_raises_when_volunteer_not_found(self):
        vol_repo = _make_vol_repo(get_volunteer_by_id=AsyncMock(return_value=None))
        uc, _, db = _make_update_uc(vol_repo=vol_repo)
        with pytest.raises(VolunteerNotFoundError):
            await uc.update_volunteer_info(_update_volunteer_input())
        db.commit.assert_not_called()

    @pytest.mark.asyncio
    async def test_update_volunteer_info_raises_when_new_role_not_found(self):
        vol_repo = _make_vol_repo(get_volunteer_role_by_id=AsyncMock(return_value=None))
        uc, _, db = _make_update_uc(vol_repo=vol_repo)
        with pytest.raises(VolunteerRoleNotFoundError):
            await uc.update_volunteer_info(_update_volunteer_input(volunteer_role_id=ROLE_ID))
        db.commit.assert_not_called()

    @pytest.mark.asyncio
    async def test_update_volunteer_info_raises_when_new_role_inactive(self):
        inactive_role = _sample_volunteer_role(is_active=False)
        vol_repo = _make_vol_repo(get_volunteer_role_by_id=AsyncMock(return_value=inactive_role))
        uc, _, db = _make_update_uc(vol_repo=vol_repo)
        with pytest.raises(VolunteerRoleInactiveError):
            await uc.update_volunteer_info(_update_volunteer_input(volunteer_role_id=ROLE_ID))
        db.commit.assert_not_called()

    @pytest.mark.asyncio
    async def test_update_volunteer_info_updates_and_commits(self):
        uc, vol_repo, db = _make_update_uc()
        result = await uc.update_volunteer_info(_update_volunteer_input(contact_phone="+9999999999"))
        vol_repo.update_volunteer.assert_called_once_with(
            volunteer_id=VOLUNTEER_ID,
            contact_phone="+9999999999",
            volunteer_role_id=None,
            status=None,
        )
        db.commit.assert_called_once()
        assert result.volunteer is not None

    @pytest.mark.asyncio
    async def test_update_volunteer_info_locks_volunteer_row_before_update(self):
        uc, vol_repo, _ = _make_update_uc()
        await uc.update_volunteer_info(_update_volunteer_input(contact_phone="+9999999999"))
        vol_repo.get_volunteer_by_id.assert_called_once_with(VOLUNTEER_ID, for_update=True)

    @pytest.mark.asyncio
    async def test_update_volunteer_info_captures_old_values_before_update(self):
        uc, _, _ = _make_update_uc()
        result = await uc.update_volunteer_info(_update_volunteer_input(contact_phone="+9999999999"))
        assert "contact_phone" in result.old_values
        assert "volunteer_role_id" in result.old_values
        assert "status" in result.old_values

    @pytest.mark.asyncio
    async def test_update_volunteer_info_skips_role_check_when_role_id_is_none(self):
        uc, vol_repo, db = _make_update_uc()
        await uc.update_volunteer_info(_update_volunteer_input(status=VolunteerStatus.INACTIVE))
        vol_repo.get_volunteer_role_by_id.assert_not_called()
        db.commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_update_volunteer_info_rollback_on_unexpected_exception(self):
        vol_repo = _make_vol_repo(update_volunteer=AsyncMock(side_effect=RuntimeError("db error")))
        uc, _, db = _make_update_uc(vol_repo=vol_repo)
        with pytest.raises(RuntimeError):
            await uc.update_volunteer_info(_update_volunteer_input(contact_phone="+9999999999"))
        db.rollback.assert_called_once()
        db.commit.assert_not_called()


# ---------------------------------------------------------------------------
# TestGetPotentialVolunteers
# ---------------------------------------------------------------------------


class TestGetPotentialVolunteers:
    @pytest.mark.asyncio
    async def test_get_potential_volunteers_calls_repo_with_correct_parameters(self):
        uc, vol_repo = _make_get_uc()
        await uc.get_potential_volunteers(_get_potential_input(page=2, page_size=10, min_events=3))
        vol_repo.get_potential_volunteers.assert_called_once_with(
            page=2,
            page_size=10,
            min_events=3,
            search=None,
        )

    @pytest.mark.asyncio
    async def test_get_potential_volunteers_passes_search_filter_to_repo(self):
        uc, vol_repo = _make_get_uc()
        await uc.get_potential_volunteers(_get_potential_input(search="maya"))
        vol_repo.get_potential_volunteers.assert_called_once_with(
            page=1,
            page_size=20,
            min_events=1,
            search="maya",
        )

    @pytest.mark.asyncio
    async def test_get_potential_volunteers_returns_data_and_pagination_metadata(self):
        uc, _ = _make_get_uc()
        result = await uc.get_potential_volunteers(_get_potential_input())
        assert len(result.potential_volunteers) == 1
        assert result.total == 1
        assert result.page == 1
        assert result.page_size == 20
        assert result.total_pages == 1

    @pytest.mark.asyncio
    async def test_get_potential_volunteers_calculates_total_pages_correctly(self):
        vol_repo = _make_vol_repo(
            get_potential_volunteers=AsyncMock(return_value=([_sample_potential_volunteer()], 45))
        )
        uc, _ = _make_get_uc(vol_repo=vol_repo)
        result = await uc.get_potential_volunteers(_get_potential_input(page_size=20))
        assert result.total_pages == 3

    @pytest.mark.asyncio
    async def test_get_potential_volunteers_returns_at_least_one_page_when_empty(self):
        vol_repo = _make_vol_repo(get_potential_volunteers=AsyncMock(return_value=([], 0)))
        uc, _ = _make_get_uc(vol_repo=vol_repo)
        result = await uc.get_potential_volunteers(_get_potential_input())
        assert result.total_pages == 1
        assert result.potential_volunteers == []

    @pytest.mark.asyncio
    async def test_get_potential_volunteers_result_carries_events_count(self):
        uc, _ = _make_get_uc()
        result = await uc.get_potential_volunteers(_get_potential_input())
        assert result.potential_volunteers[0].events_count == 3
