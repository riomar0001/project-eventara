"""Functional test cases for GetVolunteerUseCase, VolunteerUseCase, VolunteerApplicationUseCase, and UpdateVolunteerInfoUseCase."""

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
# get_all_volunteers
# ---------------------------------------------------------------------------


def _get_all_input(**overrides):
    defaults = dict(page=1, page_size=20, status=None, role_id=None)
    defaults.update(overrides)
    return GetAllVolunteersInput(**defaults)


@pytest.mark.asyncio
async def test_get_all_volunteers_returns_paginated_volunteers_on_success():
    """Returns a paginated list of volunteers with correct total and metadata."""
    uc, _ = _make_get_uc()
    result = await uc.get_all_volunteers(_get_all_input())
    assert len(result.volunteers) == 1
    assert result.total == 1
    assert result.page == 1
    assert result.page_size == 20
    assert result.total_pages == 1


@pytest.mark.asyncio
async def test_get_all_volunteers_passes_status_filter_to_repository():
    """Delegates the status filter to the repository when provided."""
    uc, vol_repo = _make_get_uc()
    await uc.get_all_volunteers(_get_all_input(status=VolunteerStatus.ACTIVE))
    vol_repo.get_all_volunteers.assert_called_once_with(
        status=VolunteerStatus.ACTIVE,
        role_id=None,
        page=1,
        page_size=20,
    )


@pytest.mark.asyncio
async def test_get_all_volunteers_passes_role_id_filter_to_repository():
    """Delegates the role_id filter to the repository when provided."""
    uc, vol_repo = _make_get_uc()
    await uc.get_all_volunteers(_get_all_input(role_id=ROLE_ID))
    vol_repo.get_all_volunteers.assert_called_once_with(
        status=None,
        role_id=ROLE_ID,
        page=1,
        page_size=20,
    )


@pytest.mark.asyncio
async def test_get_all_volunteers_calculates_total_pages_from_total_and_page_size():
    """Computes total_pages as the ceiling of total divided by page_size."""
    vol_repo = _make_vol_repo(get_all_volunteers=AsyncMock(return_value=([_sample_volunteer()], 45)))
    uc, _ = _make_get_uc(vol_repo=vol_repo)
    result = await uc.get_all_volunteers(_get_all_input(page_size=20))
    assert result.total_pages == 3


@pytest.mark.asyncio
async def test_get_all_volunteers_returns_minimum_one_total_page_when_roster_is_empty():
    """Returns total_pages of 1 and an empty volunteers list when no volunteers exist."""
    vol_repo = _make_vol_repo(get_all_volunteers=AsyncMock(return_value=([], 0)))
    uc, _ = _make_get_uc(vol_repo=vol_repo)
    result = await uc.get_all_volunteers(_get_all_input())
    assert result.total_pages == 1
    assert result.volunteers == []


# ---------------------------------------------------------------------------
# add_volunteer
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_add_volunteer_raises_when_user_not_found():
    """Raises UserNotFoundError when the target user does not exist."""
    vol_repo = _make_vol_repo(get_user_by_id=AsyncMock(return_value=None))
    uc, _, _, db = _make_uc(vol_repo=vol_repo)
    with pytest.raises(UserNotFoundError):
        await uc.add_volunteer(_add_input())
    db.commit.assert_not_called()


@pytest.mark.asyncio
async def test_add_volunteer_raises_when_volunteer_role_not_found():
    """Raises VolunteerRoleNotFoundError when the custom role does not exist."""
    vol_repo = _make_vol_repo(get_volunteer_role_by_id=AsyncMock(return_value=None))
    uc, _, _, db = _make_uc(vol_repo=vol_repo)
    with pytest.raises(VolunteerRoleNotFoundError):
        await uc.add_volunteer(_add_input())
    db.commit.assert_not_called()


@pytest.mark.asyncio
async def test_add_volunteer_raises_when_volunteer_role_inactive():
    """Raises VolunteerRoleInactiveError when the custom role is inactive."""
    vol_repo = _make_vol_repo(get_volunteer_role_by_id=AsyncMock(return_value=_sample_volunteer_role(is_active=False)))
    uc, _, _, db = _make_uc(vol_repo=vol_repo)
    with pytest.raises(VolunteerRoleInactiveError):
        await uc.add_volunteer(_add_input())
    db.commit.assert_not_called()


@pytest.mark.asyncio
async def test_add_volunteer_raises_when_user_is_already_a_volunteer():
    """Raises VolunteerAlreadyExistsError when the user is already registered as a volunteer."""
    vol_repo = _make_vol_repo(get_volunteer_by_user_id=AsyncMock(return_value=_sample_volunteer()))
    uc, _, _, _ = _make_uc(vol_repo=vol_repo)
    with pytest.raises(VolunteerAlreadyExistsError):
        await uc.add_volunteer(_add_input())


@pytest.mark.asyncio
async def test_add_volunteer_creates_record_and_commits_on_success():
    """Creates a volunteer record and commits the transaction on a successful registration."""
    uc, vol_repo, _, db = _make_uc()
    result = await uc.add_volunteer(_add_input())
    vol_repo.create_volunteer.assert_called_once()
    db.commit.assert_called_once()
    assert result.volunteer.user_id == USER_ID


@pytest.mark.asyncio
async def test_add_volunteer_uses_pessimistic_lock_for_existence_check():
    """Passes for_update=True when checking if the user is already a volunteer."""
    uc, vol_repo, _, _ = _make_uc()
    await uc.add_volunteer(_add_input())
    vol_repo.get_volunteer_by_user_id.assert_called_once_with(USER_ID, for_update=True)


@pytest.mark.asyncio
async def test_add_volunteer_assigns_rbac_volunteer_role_when_role_exists():
    """Assigns the RBAC 'volunteer' role to the user when the platform role is configured."""
    uc, _, role_repo, _ = _make_uc()
    await uc.add_volunteer(_add_input())
    role_repo.create_assignment.assert_called_once_with(
        user_id=USER_ID,
        role_id=RBAC_ROLE_ID,
        expires_at=None,
        assigned_by=ACTOR_ID,
    )


@pytest.mark.asyncio
async def test_add_volunteer_skips_rbac_assignment_when_platform_role_missing():
    """Completes volunteer registration without error when no 'volunteer' RBAC role exists."""
    vol_repo = _make_vol_repo(get_rbac_role_by_name=AsyncMock(return_value=None))
    uc, _, role_repo, db = _make_uc(vol_repo=vol_repo)
    result = await uc.add_volunteer(_add_input())
    role_repo.create_assignment.assert_not_called()
    db.commit.assert_called_once()
    assert result.volunteer is not None


@pytest.mark.asyncio
async def test_add_volunteer_skips_rbac_assignment_when_role_already_assigned():
    """Completes volunteer registration without error when the user already holds the RBAC role."""
    role_repo = _make_role_repo(get_active_assignment=AsyncMock(return_value=MagicMock()))
    uc, _, role_repo_instance, db = _make_uc(role_repo=role_repo)
    result = await uc.add_volunteer(_add_input())
    role_repo_instance.create_assignment.assert_not_called()
    db.commit.assert_called_once()
    assert result.volunteer is not None


@pytest.mark.asyncio
async def test_add_volunteer_rolls_back_and_reraises_on_unexpected_error():
    """Rolls back the transaction and re-raises when an unexpected error occurs during creation."""
    vol_repo = _make_vol_repo(create_volunteer=AsyncMock(side_effect=RuntimeError("db error")))
    uc, _, _, db = _make_uc(vol_repo=vol_repo)
    with pytest.raises(RuntimeError):
        await uc.add_volunteer(_add_input())
    db.rollback.assert_called_once()
    db.commit.assert_not_called()


# ---------------------------------------------------------------------------
# create_volunteer_role
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_create_volunteer_role_raises_when_name_already_exists():
    """Raises VolunteerRoleAlreadyExistsError when a role with the same name already exists."""
    vol_repo = _make_vol_repo(get_volunteer_role_by_name=AsyncMock(return_value=_sample_volunteer_role()))
    uc, _, _, _ = _make_uc(vol_repo=vol_repo)
    with pytest.raises(VolunteerRoleAlreadyExistsError):
        await uc.create_volunteer_role(_create_role_input())


@pytest.mark.asyncio
async def test_create_volunteer_role_creates_and_commits_on_success():
    """Creates a new volunteer role record and commits the transaction."""
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
async def test_create_volunteer_role_rolls_back_and_reraises_on_unexpected_error():
    """Rolls back the transaction and re-raises when an unexpected error occurs during role creation."""
    vol_repo = _make_vol_repo(create_volunteer_role=AsyncMock(side_effect=RuntimeError("db error")))
    uc, _, _, db = _make_uc(vol_repo=vol_repo)
    with pytest.raises(RuntimeError):
        await uc.create_volunteer_role(_create_role_input())
    db.rollback.assert_called_once()
    db.commit.assert_not_called()


@pytest.mark.asyncio
async def test_create_volunteer_role_returns_active_role_with_correct_creator():
    """Returns an active VolunteerRole entity attributed to the creator."""
    uc, _, _, _ = _make_uc()
    result = await uc.create_volunteer_role(_create_role_input())
    assert result.role.is_active is True
    assert result.role.created_by == ACTOR_ID


# ---------------------------------------------------------------------------
# submit_application
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_submit_application_raises_when_user_not_found():
    """Raises UserNotFoundError when the applicant user does not exist."""
    vol_repo = _make_vol_repo(get_user_by_id=AsyncMock(return_value=None))
    uc, _, _, db = _make_app_uc(vol_repo=vol_repo)
    with pytest.raises(UserNotFoundError):
        await uc.submit_application(_submit_input())
    db.commit.assert_not_called()


@pytest.mark.asyncio
async def test_submit_application_raises_when_user_is_already_a_volunteer():
    """Raises VolunteerAlreadyExistsError when the user is already an active volunteer."""
    vol_repo = _make_vol_repo(get_volunteer_by_user_id=AsyncMock(return_value=_sample_volunteer()))
    uc, _, _, db = _make_app_uc(vol_repo=vol_repo)
    with pytest.raises(VolunteerAlreadyExistsError):
        await uc.submit_application(_submit_input())
    db.commit.assert_not_called()


@pytest.mark.asyncio
async def test_submit_application_raises_when_active_application_already_exists():
    """Raises VolunteerApplicationAlreadyExistsError when the user already has a PENDING or APPROVED application."""
    vol_repo = _make_vol_repo(
        get_active_application_by_user_id=AsyncMock(return_value=_sample_application())
    )
    uc, _, _, db = _make_app_uc(vol_repo=vol_repo)
    with pytest.raises(VolunteerApplicationAlreadyExistsError):
        await uc.submit_application(_submit_input())
    db.rollback.assert_called_once()


@pytest.mark.asyncio
async def test_submit_application_creates_record_and_commits_on_success():
    """Creates a PENDING application record and commits the transaction on a valid submission."""
    uc, vol_repo, _, db = _make_app_uc()
    result = await uc.submit_application(_submit_input())
    vol_repo.create_application.assert_called_once()
    db.commit.assert_called_once()
    assert result.application.user_id == USER_ID


@pytest.mark.asyncio
async def test_submit_application_uses_pessimistic_lock_for_duplicate_check():
    """Passes for_update=True when checking for an existing active application."""
    uc, vol_repo, _, _ = _make_app_uc()
    await uc.submit_application(_submit_input())
    vol_repo.get_active_application_by_user_id.assert_called_once_with(USER_ID, for_update=True)


@pytest.mark.asyncio
async def test_submit_application_rolls_back_and_reraises_on_unexpected_error():
    """Rolls back the transaction and re-raises when an unexpected error occurs during creation."""
    vol_repo = _make_vol_repo(create_application=AsyncMock(side_effect=RuntimeError("db error")))
    uc, _, _, db = _make_app_uc(vol_repo=vol_repo)
    with pytest.raises(RuntimeError):
        await uc.submit_application(_submit_input())
    db.rollback.assert_called_once()
    db.commit.assert_not_called()


# ---------------------------------------------------------------------------
# review_application
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_review_application_raises_when_application_not_found():
    """Raises VolunteerApplicationNotFoundError when no application matches the given ID."""
    vol_repo = _make_vol_repo(get_application_by_id=AsyncMock(return_value=None))
    uc, _, _, db = _make_app_uc(vol_repo=vol_repo)
    with pytest.raises(VolunteerApplicationNotFoundError):
        await uc.review_application(_review_input())
    db.commit.assert_not_called()


@pytest.mark.asyncio
async def test_review_application_raises_on_invalid_status_transition():
    """Raises InvalidApplicationStatusTransitionError when trying to approve an already-approved application."""
    approved_app = _sample_application(status=ApplicationStatus.APPROVED)
    vol_repo = _make_vol_repo(get_application_by_id=AsyncMock(return_value=approved_app))
    uc, _, _, db = _make_app_uc(vol_repo=vol_repo)
    with pytest.raises(InvalidApplicationStatusTransitionError):
        await uc.review_application(_review_input(new_status=ApplicationStatus.APPROVED))
    db.commit.assert_not_called()


@pytest.mark.asyncio
async def test_review_application_approves_and_creates_volunteer_record():
    """Approves the application and creates a Volunteer record when contact info is provided."""
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
async def test_review_application_rejects_without_creating_volunteer_record():
    """Rejects the application and does not create a Volunteer record."""
    uc, vol_repo, _, db = _make_app_uc()
    result = await uc.review_application(
        _review_input(new_status=ApplicationStatus.REJECTED, contact_phone=None, volunteer_role_id=None)
    )
    vol_repo.create_volunteer.assert_not_called()
    db.commit.assert_called_once()
    assert result.volunteer is None


@pytest.mark.asyncio
async def test_review_application_approves_without_volunteer_when_no_contact_info_provided():
    """Approves the application without creating a Volunteer record when contact details are omitted."""
    uc, vol_repo, _, db = _make_app_uc()
    result = await uc.review_application(_review_input(contact_phone=None, volunteer_role_id=None))
    vol_repo.create_volunteer.assert_not_called()
    db.commit.assert_called_once()
    assert result.volunteer is None


@pytest.mark.asyncio
async def test_review_application_raises_when_volunteer_role_not_found_on_approval():
    """Raises VolunteerRoleNotFoundError when the provided volunteer role does not exist during approval."""
    vol_repo = _make_vol_repo(get_volunteer_role_by_id=AsyncMock(return_value=None))
    uc, _, _, db = _make_app_uc(vol_repo=vol_repo)
    with pytest.raises(VolunteerRoleNotFoundError):
        await uc.review_application(_review_input())
    db.rollback.assert_called_once()


@pytest.mark.asyncio
async def test_review_application_raises_when_volunteer_role_is_inactive_on_approval():
    """Raises VolunteerRoleInactiveError when the provided volunteer role is inactive during approval."""
    vol_repo = _make_vol_repo(
        get_volunteer_role_by_id=AsyncMock(return_value=_sample_volunteer_role(is_active=False))
    )
    uc, _, _, db = _make_app_uc(vol_repo=vol_repo)
    with pytest.raises(VolunteerRoleInactiveError):
        await uc.review_application(_review_input())
    db.rollback.assert_called_once()


@pytest.mark.asyncio
async def test_review_application_raises_when_applicant_is_already_a_volunteer():
    """Raises VolunteerAlreadyExistsError when the applicant is already an active volunteer during approval."""
    vol_repo = _make_vol_repo(get_volunteer_by_user_id=AsyncMock(return_value=_sample_volunteer()))
    uc, _, _, db = _make_app_uc(vol_repo=vol_repo)
    with pytest.raises(VolunteerAlreadyExistsError):
        await uc.review_application(_review_input())
    db.rollback.assert_called_once()


@pytest.mark.asyncio
async def test_review_application_uses_pessimistic_lock_on_application_row():
    """Passes for_update=True when fetching the application to prevent concurrent review conflicts."""
    uc, vol_repo, _, _ = _make_app_uc()
    await uc.review_application(_review_input())
    vol_repo.get_application_by_id.assert_called_once_with(APPLICATION_ID, for_update=True)


@pytest.mark.asyncio
async def test_review_application_assigns_rbac_volunteer_role_on_approval():
    """Assigns the RBAC 'volunteer' role to the applicant when the application is approved."""
    uc, _, role_repo, _ = _make_app_uc()
    await uc.review_application(_review_input())
    role_repo.create_assignment.assert_called_once_with(
        user_id=USER_ID,
        role_id=RBAC_ROLE_ID,
        expires_at=None,
        assigned_by=ACTOR_ID,
    )


@pytest.mark.asyncio
async def test_review_application_rolls_back_and_reraises_on_unexpected_error():
    """Rolls back the transaction and re-raises when an unexpected error occurs during review."""
    vol_repo = _make_vol_repo(
        update_application_status=AsyncMock(side_effect=RuntimeError("db error"))
    )
    uc, _, _, db = _make_app_uc(vol_repo=vol_repo)
    with pytest.raises(RuntimeError):
        await uc.review_application(_review_input())
    db.rollback.assert_called_once()
    db.commit.assert_not_called()


# ---------------------------------------------------------------------------
# withdraw_application
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_withdraw_application_raises_when_application_not_found():
    """Raises VolunteerApplicationNotFoundError when no application matches the given ID."""
    vol_repo = _make_vol_repo(get_application_by_id=AsyncMock(return_value=None))
    uc, _, _, db = _make_app_uc(vol_repo=vol_repo)
    with pytest.raises(VolunteerApplicationNotFoundError):
        await uc.withdraw_application(_withdraw_input())
    db.commit.assert_not_called()


@pytest.mark.asyncio
async def test_withdraw_application_raises_when_caller_is_not_the_owner():
    """Raises UnauthorizedApplicationOperationError when the caller does not own the application."""
    other_user_id = uuid.UUID("11111111-1111-1111-1111-111111111111")
    uc, _, _, db = _make_app_uc()
    with pytest.raises(UnauthorizedApplicationOperationError):
        await uc.withdraw_application(_withdraw_input(user_id=other_user_id))
    db.commit.assert_not_called()


@pytest.mark.asyncio
async def test_withdraw_application_raises_when_application_is_not_pending():
    """Raises InvalidApplicationStatusTransitionError when trying to withdraw a non-PENDING application."""
    approved_app = _sample_application(status=ApplicationStatus.APPROVED)
    vol_repo = _make_vol_repo(get_application_by_id=AsyncMock(return_value=approved_app))
    uc, _, _, db = _make_app_uc(vol_repo=vol_repo)
    with pytest.raises(InvalidApplicationStatusTransitionError):
        await uc.withdraw_application(_withdraw_input())
    db.commit.assert_not_called()


@pytest.mark.asyncio
async def test_withdraw_application_updates_status_to_withdrawn_and_commits():
    """Updates the application status to WITHDRAWN and commits the transaction."""
    uc, vol_repo, _, db = _make_app_uc()
    result = await uc.withdraw_application(_withdraw_input())
    vol_repo.update_application_status.assert_called_once_with(APPLICATION_ID, ApplicationStatus.WITHDRAWN)
    db.commit.assert_called_once()
    assert result.application.status == ApplicationStatus.WITHDRAWN


@pytest.mark.asyncio
async def test_withdraw_application_uses_pessimistic_lock_on_application_row():
    """Passes for_update=True when fetching the application to prevent concurrent withdrawal conflicts."""
    uc, vol_repo, _, _ = _make_app_uc()
    await uc.withdraw_application(_withdraw_input())
    vol_repo.get_application_by_id.assert_called_once_with(APPLICATION_ID, for_update=True)


@pytest.mark.asyncio
async def test_withdraw_application_rolls_back_and_reraises_on_unexpected_error():
    """Rolls back the transaction and re-raises when an unexpected error occurs during withdrawal."""
    vol_repo = _make_vol_repo(
        update_application_status=AsyncMock(side_effect=RuntimeError("db error"))
    )
    uc, _, _, db = _make_app_uc(vol_repo=vol_repo)
    with pytest.raises(RuntimeError):
        await uc.withdraw_application(_withdraw_input())
    db.rollback.assert_called_once()
    db.commit.assert_not_called()


# ---------------------------------------------------------------------------
# update_volunteer_info
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


@pytest.mark.asyncio
async def test_update_volunteer_info_raises_when_volunteer_not_found():
    """Raises VolunteerNotFoundError when no volunteer record matches the given ID."""
    vol_repo = _make_vol_repo(get_volunteer_by_id=AsyncMock(return_value=None))
    uc, _, db = _make_update_uc(vol_repo=vol_repo)
    with pytest.raises(VolunteerNotFoundError):
        await uc.update_volunteer_info(_update_volunteer_input())
    db.commit.assert_not_called()


@pytest.mark.asyncio
async def test_update_volunteer_info_raises_when_new_role_not_found():
    """Raises VolunteerRoleNotFoundError when the requested new volunteer role does not exist."""
    vol_repo = _make_vol_repo(get_volunteer_role_by_id=AsyncMock(return_value=None))
    uc, _, db = _make_update_uc(vol_repo=vol_repo)
    with pytest.raises(VolunteerRoleNotFoundError):
        await uc.update_volunteer_info(_update_volunteer_input(volunteer_role_id=ROLE_ID))
    db.commit.assert_not_called()


@pytest.mark.asyncio
async def test_update_volunteer_info_raises_when_new_role_is_inactive():
    """Raises VolunteerRoleInactiveError when the requested new volunteer role is not active."""
    inactive_role = _sample_volunteer_role(is_active=False)
    vol_repo = _make_vol_repo(get_volunteer_role_by_id=AsyncMock(return_value=inactive_role))
    uc, _, db = _make_update_uc(vol_repo=vol_repo)
    with pytest.raises(VolunteerRoleInactiveError):
        await uc.update_volunteer_info(_update_volunteer_input(volunteer_role_id=ROLE_ID))
    db.commit.assert_not_called()


@pytest.mark.asyncio
async def test_update_volunteer_info_persists_changes_and_commits():
    """Applies the provided updates to the volunteer record and commits the transaction."""
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
async def test_update_volunteer_info_acquires_row_lock_before_update():
    """Passes for_update=True when fetching the volunteer to prevent concurrent update conflicts."""
    uc, vol_repo, _ = _make_update_uc()
    await uc.update_volunteer_info(_update_volunteer_input(contact_phone="+9999999999"))
    vol_repo.get_volunteer_by_id.assert_called_once_with(VOLUNTEER_ID, for_update=True)


@pytest.mark.asyncio
async def test_update_volunteer_info_includes_old_values_in_output():
    """Returns a snapshot of the volunteer state before the change in old_values."""
    uc, _, _ = _make_update_uc()
    result = await uc.update_volunteer_info(_update_volunteer_input(contact_phone="+9999999999"))
    assert "contact_phone" in result.old_values
    assert "volunteer_role_id" in result.old_values
    assert "status" in result.old_values


@pytest.mark.asyncio
async def test_update_volunteer_info_skips_role_check_when_no_role_change():
    """Does not query the volunteer role when volunteer_role_id is not provided."""
    uc, vol_repo, db = _make_update_uc()
    await uc.update_volunteer_info(_update_volunteer_input(status=VolunteerStatus.INACTIVE))
    vol_repo.get_volunteer_role_by_id.assert_not_called()
    db.commit.assert_called_once()


@pytest.mark.asyncio
async def test_update_volunteer_info_rolls_back_on_unexpected_error():
    """Rolls back the transaction and re-raises when an unexpected error occurs during update."""
    vol_repo = _make_vol_repo(update_volunteer=AsyncMock(side_effect=RuntimeError("db error")))
    uc, _, db = _make_update_uc(vol_repo=vol_repo)
    with pytest.raises(RuntimeError):
        await uc.update_volunteer_info(_update_volunteer_input(contact_phone="+9999999999"))
    db.rollback.assert_called_once()
    db.commit.assert_not_called()


# ---------------------------------------------------------------------------
# get_potential_volunteers
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_get_potential_volunteers_passes_all_parameters_to_repo():
    """Forwards page, page_size, min_events, and search to the repository unchanged."""
    uc, vol_repo = _make_get_uc()
    await uc.get_potential_volunteers(_get_potential_input(page=2, page_size=10, min_events=3, search="maya"))
    vol_repo.get_potential_volunteers.assert_called_once_with(
        page=2,
        page_size=10,
        min_events=3,
        search="maya",
    )


@pytest.mark.asyncio
async def test_get_potential_volunteers_returns_data_with_pagination_metadata():
    """Returns the list of potential volunteers and correct pagination metadata."""
    uc, _ = _make_get_uc()
    result = await uc.get_potential_volunteers(_get_potential_input())
    assert len(result.potential_volunteers) == 1
    assert result.total == 1
    assert result.page == 1
    assert result.total_pages == 1


@pytest.mark.asyncio
async def test_get_potential_volunteers_calculates_total_pages_correctly():
    """Computes total_pages by ceiling-dividing total count by page_size."""
    vol_repo = _make_vol_repo(
        get_potential_volunteers=AsyncMock(return_value=([_sample_potential_volunteer()], 45))
    )
    uc, _ = _make_get_uc(vol_repo=vol_repo)
    result = await uc.get_potential_volunteers(_get_potential_input(page_size=20))
    assert result.total_pages == 3


@pytest.mark.asyncio
async def test_get_potential_volunteers_returns_minimum_one_page_when_empty():
    """Returns total_pages of 1 even when there are no results."""
    vol_repo = _make_vol_repo(get_potential_volunteers=AsyncMock(return_value=([], 0)))
    uc, _ = _make_get_uc(vol_repo=vol_repo)
    result = await uc.get_potential_volunteers(_get_potential_input())
    assert result.total_pages == 1
    assert result.potential_volunteers == []


@pytest.mark.asyncio
async def test_get_potential_volunteers_result_includes_events_count():
    """Each returned potential volunteer carries the count of distinct events participated in."""
    uc, _ = _make_get_uc()
    result = await uc.get_potential_volunteers(_get_potential_input())
    assert result.potential_volunteers[0].events_count == 3
