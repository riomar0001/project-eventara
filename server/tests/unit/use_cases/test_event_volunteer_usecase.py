"""Unit tests for EventVolunteerUseCase — assign, update status, remove, list, get participants."""

import uuid
from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.dto.event_volunteer_dto import (
    ApplyEventVolunteerInput,
    AssignVolunteerInput,
    ListEventVolunteersInput,
    RemoveEventVolunteerInput,
    UpdateEventVolunteerStatusInput,
)
from app.application.use_cases.event_volunteer_usecase import EventVolunteerUseCase
from app.domain.entities.event_entity import (
    Event as EventEntity,
)
from app.domain.entities.event_entity import EventStatus, EventVolunteerStatus
from app.domain.entities.event_entity import (
    EventVolunteer as EventVolunteerEntity,
)
from app.domain.entities.volunteer_entity import Volunteer as VolunteerEntity
from app.domain.entities.volunteer_entity import VolunteerStatus
from app.domain.exceptions.event_exceptions import EventNotFoundError
from app.domain.exceptions.event_volunteer_exceptions import (
    EventVolunteerAlreadyExistsError,
    EventVolunteerApplicationClosedError,
    EventVolunteerNotFoundError,
    InvalidEventVolunteerStatusTransitionError,
    UnauthorizedEventVolunteerOperationError,
)
from app.domain.exceptions.volunteer_exceptions import VolunteerInactiveError, VolunteerNotFoundError
from app.infrastructure.database.repositories.event_volunteer_repository import EventVolunteerRepository

ORGANIZER_ID = uuid.UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
OTHER_USER_ID = uuid.UUID("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")
EVENT_ID = uuid.UUID("cccccccc-cccc-cccc-cccc-cccccccccccc")
VOLUNTEER_ID = uuid.UUID("dddddddd-dddd-dddd-dddd-dddddddddddd")
VOLUNTEER_ALIAS = "testvolunteer"
EV_ID = uuid.UUID("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee")

_NOW = datetime(2026, 1, 1, tzinfo=UTC)


def _sample_event(*, created_by: uuid.UUID = ORGANIZER_ID, status: EventStatus = EventStatus.POSTED) -> EventEntity:
    return EventEntity(
        id=EVENT_ID,
        title="Test Event",
        description="A test event",
        start_date=_NOW,
        end_date=_NOW,
        status=status,
        created_by=created_by,
    )


def _sample_volunteer(*, status: VolunteerStatus = VolunteerStatus.ACTIVE) -> VolunteerEntity:
    return VolunteerEntity(
        id=VOLUNTEER_ID,
        user_id=OTHER_USER_ID,
        contact_phone="+1234567890",
        volunteer_role_id=uuid.uuid4(),
        status=status,
    )


def _sample_ev(*, status: EventVolunteerStatus = EventVolunteerStatus.PENDING) -> EventVolunteerEntity:
    return EventVolunteerEntity(
        id=EV_ID,
        volunteer_id=VOLUNTEER_ID,
        event_id=EVENT_ID,
        status=status,
        volunteer_user_id=OTHER_USER_ID,
        volunteer_first_name="Test",
        volunteer_last_name="Volunteer",
        volunteer_alias=VOLUNTEER_ALIAS,
        volunteer_profile_picture_url="user-profile/test.webp",
        volunteer_role_name="Marshal",
    )


def _make_repo(**overrides) -> MagicMock:
    repo = MagicMock(spec=EventVolunteerRepository)
    repo.get_event_by_id = AsyncMock(return_value=_sample_event())
    repo.get_volunteer_by_alias = AsyncMock(return_value=_sample_volunteer())
    repo.get_volunteer_by_user_id = AsyncMock(return_value=_sample_volunteer())
    repo.get_event_volunteer_by_id = AsyncMock(return_value=_sample_ev())
    repo.get_event_volunteer_by_volunteer_and_event = AsyncMock(return_value=None)
    repo.get_joined_event_volunteer_for_user = AsyncMock(return_value=None)
    repo.get_event_volunteers_by_event = AsyncMock(return_value=[_sample_ev()])
    repo.create_event_volunteer = AsyncMock(side_effect=lambda volunteer_id, event_id, status=EventVolunteerStatus.JOINED: _sample_ev(status=status))
    repo.update_event_volunteer_status = AsyncMock(side_effect=lambda ev_id, new_status: _sample_ev(status=new_status))
    repo.delete_event_volunteer = AsyncMock(return_value=True)
    for key, value in overrides.items():
        setattr(repo, key, value)
    return repo


def _make_uc(repo=None):
    repo = repo or _make_repo()
    db = AsyncMock(spec=AsyncSession)
    return EventVolunteerUseCase(repo, db), repo, db


def _assign_input(**overrides):
    defaults = dict(event_id=EVENT_ID, alias=VOLUNTEER_ALIAS, actor_id=ORGANIZER_ID)
    defaults.update(overrides)
    return AssignVolunteerInput(**defaults)


def _apply_input(**overrides):
    defaults = dict(event_id=EVENT_ID, actor_id=OTHER_USER_ID, message="Ready to help")
    defaults.update(overrides)
    return ApplyEventVolunteerInput(**defaults)


def _update_input(**overrides):
    defaults = dict(
        event_volunteer_id=EV_ID,
        actor_id=ORGANIZER_ID,
        new_status=EventVolunteerStatus.JOINED,
    )
    defaults.update(overrides)
    return UpdateEventVolunteerStatusInput(**defaults)


def _remove_input(**overrides):
    defaults = dict(event_volunteer_id=EV_ID, actor_id=ORGANIZER_ID)
    defaults.update(overrides)
    return RemoveEventVolunteerInput(**defaults)


def _list_input(**overrides):
    defaults = dict(event_id=EVENT_ID, actor_id=ORGANIZER_ID)
    defaults.update(overrides)
    return ListEventVolunteersInput(**defaults)


# ---------------------------------------------------------------------------
# TestAssignVolunteer
# ---------------------------------------------------------------------------


class TestAssignVolunteer:
    @pytest.mark.asyncio
    async def test_assign_volunteer_raises_when_event_not_found(self):
        repo = _make_repo(get_event_by_id=AsyncMock(return_value=None))
        uc, _, db = _make_uc(repo=repo)
        with pytest.raises(EventNotFoundError):
            await uc.assign_volunteer(_assign_input())
        db.commit.assert_not_called()

    @pytest.mark.asyncio
    async def test_assign_volunteer_raises_when_caller_is_not_organizer(self):
        repo = _make_repo(get_event_by_id=AsyncMock(return_value=_sample_event(created_by=OTHER_USER_ID)))
        uc, _, db = _make_uc(repo=repo)
        with pytest.raises(UnauthorizedEventVolunteerOperationError):
            await uc.assign_volunteer(_assign_input())
        db.commit.assert_not_called()

    @pytest.mark.asyncio
    async def test_assign_volunteer_raises_when_volunteer_not_found(self):
        repo = _make_repo(get_volunteer_by_alias=AsyncMock(return_value=None))
        uc, _, db = _make_uc(repo=repo)
        with pytest.raises(VolunteerNotFoundError):
            await uc.assign_volunteer(_assign_input())
        db.commit.assert_not_called()

    @pytest.mark.asyncio
    async def test_assign_volunteer_raises_when_already_assigned(self):
        repo = _make_repo(get_event_volunteer_by_volunteer_and_event=AsyncMock(return_value=_sample_ev()))
        uc, _, db = _make_uc(repo=repo)
        with pytest.raises(EventVolunteerAlreadyExistsError):
            await uc.assign_volunteer(_assign_input())
        db.rollback.assert_called_once()

    @pytest.mark.asyncio
    async def test_assign_volunteer_creates_assignment_and_commits(self):
        uc, repo, db = _make_uc()
        result = await uc.assign_volunteer(_assign_input())
        repo.create_event_volunteer.assert_called_once_with(
            volunteer_id=VOLUNTEER_ID,
            event_id=EVENT_ID,
        )
        db.commit.assert_called_once()
        assert result.event_volunteer.volunteer_id == VOLUNTEER_ID
        assert result.event_volunteer.status == EventVolunteerStatus.JOINED

    @pytest.mark.asyncio
    async def test_assign_volunteer_locks_event_row(self):
        uc, repo, _ = _make_uc()
        await uc.assign_volunteer(_assign_input())
        repo.get_event_by_id.assert_called_once_with(EVENT_ID, for_update=True)

    @pytest.mark.asyncio
    async def test_assign_volunteer_locks_existing_assignment_row(self):
        uc, repo, _ = _make_uc()
        await uc.assign_volunteer(_assign_input())
        repo.get_event_volunteer_by_volunteer_and_event.assert_called_once_with(VOLUNTEER_ID, EVENT_ID, for_update=True)

    @pytest.mark.asyncio
    async def test_assign_volunteer_rollback_on_unexpected_exception(self):
        repo = _make_repo(create_event_volunteer=AsyncMock(side_effect=RuntimeError("db error")))
        uc, _, db = _make_uc(repo=repo)
        with pytest.raises(RuntimeError):
            await uc.assign_volunteer(_assign_input())
        db.rollback.assert_called_once()
        db.commit.assert_not_called()


# ---------------------------------------------------------------------------
# TestApplyToEvent
# ---------------------------------------------------------------------------


class TestApplyToEvent:
    @pytest.mark.asyncio
    async def test_apply_raises_when_event_not_found(self):
        repo = _make_repo(get_event_by_id=AsyncMock(return_value=None))
        uc, _, db = _make_uc(repo=repo)
        with pytest.raises(EventNotFoundError):
            await uc.apply_to_event(_apply_input())
        db.commit.assert_not_called()

    @pytest.mark.asyncio
    async def test_apply_raises_when_event_applications_closed(self):
        repo = _make_repo(get_event_by_id=AsyncMock(return_value=_sample_event(status=EventStatus.DRAFT)))
        uc, _, db = _make_uc(repo=repo)
        with pytest.raises(EventVolunteerApplicationClosedError):
            await uc.apply_to_event(_apply_input())
        db.commit.assert_not_called()

    @pytest.mark.asyncio
    async def test_apply_raises_when_user_has_no_volunteer_profile(self):
        repo = _make_repo(get_volunteer_by_user_id=AsyncMock(return_value=None))
        uc, _, db = _make_uc(repo=repo)
        with pytest.raises(VolunteerNotFoundError):
            await uc.apply_to_event(_apply_input())
        db.commit.assert_not_called()

    @pytest.mark.asyncio
    async def test_apply_raises_when_volunteer_inactive(self):
        repo = _make_repo(get_volunteer_by_user_id=AsyncMock(return_value=_sample_volunteer(status=VolunteerStatus.INACTIVE)))
        uc, _, db = _make_uc(repo=repo)
        with pytest.raises(VolunteerInactiveError):
            await uc.apply_to_event(_apply_input())
        db.commit.assert_not_called()

    @pytest.mark.asyncio
    async def test_apply_raises_when_already_assigned(self):
        repo = _make_repo(get_event_volunteer_by_volunteer_and_event=AsyncMock(return_value=_sample_ev()))
        uc, _, db = _make_uc(repo=repo)
        with pytest.raises(EventVolunteerAlreadyExistsError):
            await uc.apply_to_event(_apply_input())
        db.rollback.assert_called_once()

    @pytest.mark.asyncio
    async def test_apply_creates_pending_assignment_and_commits(self):
        uc, repo, db = _make_uc()
        result = await uc.apply_to_event(_apply_input())
        repo.create_event_volunteer.assert_called_once_with(
            volunteer_id=VOLUNTEER_ID,
            event_id=EVENT_ID,
            status=EventVolunteerStatus.PENDING,
        )
        db.commit.assert_called_once()
        assert result.event_volunteer.status == EventVolunteerStatus.PENDING

    @pytest.mark.asyncio
    async def test_apply_locks_event_row(self):
        uc, repo, _ = _make_uc()
        await uc.apply_to_event(_apply_input())
        repo.get_event_by_id.assert_called_once_with(EVENT_ID, for_update=True)

    @pytest.mark.asyncio
    async def test_apply_locks_existing_assignment_row(self):
        uc, repo, _ = _make_uc()
        await uc.apply_to_event(_apply_input())
        repo.get_event_volunteer_by_volunteer_and_event.assert_called_once_with(VOLUNTEER_ID, EVENT_ID, for_update=True)

    @pytest.mark.asyncio
    async def test_apply_rollback_on_unexpected_exception(self):
        repo = _make_repo(create_event_volunteer=AsyncMock(side_effect=RuntimeError("db error")))
        uc, _, db = _make_uc(repo=repo)
        with pytest.raises(RuntimeError):
            await uc.apply_to_event(_apply_input())
        db.rollback.assert_called_once()
        db.commit.assert_not_called()


# ---------------------------------------------------------------------------
# TestUpdateEventVolunteerStatus
# ---------------------------------------------------------------------------


class TestUpdateEventVolunteerStatus:
    @pytest.mark.asyncio
    async def test_update_status_raises_when_assignment_not_found(self):
        repo = _make_repo(get_event_volunteer_by_id=AsyncMock(return_value=None))
        uc, _, db = _make_uc(repo=repo)
        with pytest.raises(EventVolunteerNotFoundError):
            await uc.update_volunteer_status(_update_input())
        db.commit.assert_not_called()

    @pytest.mark.asyncio
    async def test_update_status_raises_when_event_not_found(self):
        repo = _make_repo(get_event_by_id=AsyncMock(return_value=None))
        uc, _, db = _make_uc(repo=repo)
        with pytest.raises(EventNotFoundError):
            await uc.update_volunteer_status(_update_input())
        db.commit.assert_not_called()

    @pytest.mark.asyncio
    async def test_update_status_raises_when_caller_is_not_organizer(self):
        repo = _make_repo(get_event_by_id=AsyncMock(return_value=_sample_event(created_by=OTHER_USER_ID)))
        uc, _, db = _make_uc(repo=repo)
        with pytest.raises(UnauthorizedEventVolunteerOperationError):
            await uc.update_volunteer_status(_update_input())
        db.commit.assert_not_called()

    @pytest.mark.asyncio
    async def test_update_status_raises_on_invalid_transition(self):
        rejected_ev = _sample_ev(status=EventVolunteerStatus.REJECTED)
        repo = _make_repo(get_event_volunteer_by_id=AsyncMock(return_value=rejected_ev))
        uc, _, db = _make_uc(repo=repo)
        with pytest.raises(InvalidEventVolunteerStatusTransitionError):
            await uc.update_volunteer_status(_update_input(new_status=EventVolunteerStatus.JOINED))
        db.commit.assert_not_called()

    @pytest.mark.asyncio
    async def test_update_status_pending_to_joined_commits(self):
        uc, repo, db = _make_uc()
        result = await uc.update_volunteer_status(_update_input(new_status=EventVolunteerStatus.JOINED))
        repo.update_event_volunteer_status.assert_called_once_with(EV_ID, EventVolunteerStatus.JOINED)
        db.commit.assert_called_once()
        assert result.event_volunteer.status == EventVolunteerStatus.JOINED

    @pytest.mark.asyncio
    async def test_update_status_pending_to_rejected_commits(self):
        uc, repo, db = _make_uc()
        result = await uc.update_volunteer_status(_update_input(new_status=EventVolunteerStatus.REJECTED))
        db.commit.assert_called_once()
        assert result.event_volunteer.status == EventVolunteerStatus.REJECTED

    @pytest.mark.asyncio
    async def test_update_status_joined_to_left_commits(self):
        joined_ev = _sample_ev(status=EventVolunteerStatus.JOINED)
        repo = _make_repo(get_event_volunteer_by_id=AsyncMock(return_value=joined_ev))
        uc, _, db = _make_uc(repo=repo)
        result = await uc.update_volunteer_status(_update_input(new_status=EventVolunteerStatus.LEFT))
        db.commit.assert_called_once()
        assert result.old_status == EventVolunteerStatus.JOINED

    @pytest.mark.asyncio
    async def test_update_status_locks_assignment_row(self):
        uc, repo, _ = _make_uc()
        await uc.update_volunteer_status(_update_input())
        repo.get_event_volunteer_by_id.assert_called_once_with(EV_ID, for_update=True)

    @pytest.mark.asyncio
    async def test_update_status_rollback_on_unexpected_exception(self):
        repo = _make_repo(update_event_volunteer_status=AsyncMock(side_effect=RuntimeError("db error")))
        uc, _, db = _make_uc(repo=repo)
        with pytest.raises(RuntimeError):
            await uc.update_volunteer_status(_update_input())
        db.rollback.assert_called_once()
        db.commit.assert_not_called()


# ---------------------------------------------------------------------------
# TestRemoveEventVolunteer
# ---------------------------------------------------------------------------


class TestRemoveEventVolunteer:
    @pytest.mark.asyncio
    async def test_remove_raises_when_assignment_not_found(self):
        repo = _make_repo(get_event_volunteer_by_id=AsyncMock(return_value=None))
        uc, _, db = _make_uc(repo=repo)
        with pytest.raises(EventVolunteerNotFoundError):
            await uc.remove_volunteer(_remove_input())
        db.commit.assert_not_called()

    @pytest.mark.asyncio
    async def test_remove_raises_when_event_not_found(self):
        repo = _make_repo(get_event_by_id=AsyncMock(return_value=None))
        uc, _, db = _make_uc(repo=repo)
        with pytest.raises(EventNotFoundError):
            await uc.remove_volunteer(_remove_input())
        db.commit.assert_not_called()

    @pytest.mark.asyncio
    async def test_remove_raises_when_caller_is_not_organizer(self):
        repo = _make_repo(get_event_by_id=AsyncMock(return_value=_sample_event(created_by=OTHER_USER_ID)))
        uc, _, db = _make_uc(repo=repo)
        with pytest.raises(UnauthorizedEventVolunteerOperationError):
            await uc.remove_volunteer(_remove_input())
        db.commit.assert_not_called()

    @pytest.mark.asyncio
    async def test_remove_deletes_assignment_and_commits(self):
        uc, repo, db = _make_uc()
        result = await uc.remove_volunteer(_remove_input())
        repo.delete_event_volunteer.assert_called_once_with(EV_ID)
        db.commit.assert_called_once()
        assert result.event_volunteer.id == EV_ID

    @pytest.mark.asyncio
    async def test_remove_locks_assignment_row(self):
        uc, repo, _ = _make_uc()
        await uc.remove_volunteer(_remove_input())
        repo.get_event_volunteer_by_id.assert_called_once_with(EV_ID, for_update=True)

    @pytest.mark.asyncio
    async def test_remove_rollback_on_unexpected_exception(self):
        repo = _make_repo(delete_event_volunteer=AsyncMock(side_effect=RuntimeError("db error")))
        uc, _, db = _make_uc(repo=repo)
        with pytest.raises(RuntimeError):
            await uc.remove_volunteer(_remove_input())
        db.rollback.assert_called_once()
        db.commit.assert_not_called()


# ---------------------------------------------------------------------------
# TestListEventVolunteers
# ---------------------------------------------------------------------------


class TestListEventVolunteers:
    @pytest.mark.asyncio
    async def test_list_raises_when_event_not_found(self):
        repo = _make_repo(get_event_by_id=AsyncMock(return_value=None))
        uc, _, db = _make_uc(repo=repo)
        with pytest.raises(EventNotFoundError):
            await uc.list_volunteers(_list_input())
        db.commit.assert_not_called()

    @pytest.mark.asyncio
    async def test_list_raises_when_caller_is_not_organizer(self):
        repo = _make_repo(get_event_by_id=AsyncMock(return_value=_sample_event(created_by=OTHER_USER_ID)))
        uc, _, db = _make_uc(repo=repo)
        with pytest.raises(UnauthorizedEventVolunteerOperationError):
            await uc.list_volunteers(_list_input())

    @pytest.mark.asyncio
    async def test_list_returns_event_volunteers(self):
        uc, repo, _ = _make_uc()
        result = await uc.list_volunteers(_list_input())
        repo.get_event_volunteers_by_event.assert_called_once_with(EVENT_ID, status=None)
        assert len(result.event_volunteers) == 1
        assert result.event_volunteers[0].volunteer_role_name == "Marshal"
        assert result.event_volunteers[0].volunteer_alias == VOLUNTEER_ALIAS

    @pytest.mark.asyncio
    async def test_list_passes_status_filter_to_repo(self):
        uc, repo, _ = _make_uc()
        await uc.list_volunteers(_list_input(status=EventVolunteerStatus.JOINED))
        repo.get_event_volunteers_by_event.assert_called_once_with(EVENT_ID, status=EventVolunteerStatus.JOINED)
