"""Functional test cases for EventVolunteerUseCase."""

import uuid
from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.dto.event_volunteer_dto import (
    AssignVolunteerInput,
    GetEventParticipantsInput,
    ListEventVolunteersInput,
    RemoveEventVolunteerInput,
    UpdateEventVolunteerStatusInput,
)
from app.application.use_cases.event_volunteer_usecase import EventVolunteerUseCase
from app.domain.entities.event_entity import (
    Event as EventEntity,
)
from app.domain.entities.event_entity import (
    EventParticipant as EventParticipantEntity,
)
from app.domain.entities.event_entity import (
    EventParticipantStatus,
    EventStatus,
    EventVolunteerStatus,
)
from app.domain.entities.event_entity import (
    EventVolunteer as EventVolunteerEntity,
)
from app.domain.entities.volunteer_entity import Volunteer as VolunteerEntity
from app.domain.entities.volunteer_entity import VolunteerStatus
from app.domain.exceptions.event_exceptions import EventNotFoundError
from app.domain.exceptions.event_volunteer_exceptions import (
    EventVolunteerAlreadyExistsError,
    EventVolunteerNotFoundError,
    InvalidEventVolunteerStatusTransitionError,
    UnauthorizedEventVolunteerOperationError,
)
from app.domain.exceptions.volunteer_exceptions import VolunteerNotFoundError
from app.infrastructure.database.repositories.event_volunteer_repository import EventVolunteerRepository

ORGANIZER_ID = uuid.UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
OTHER_USER_ID = uuid.UUID("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")
EVENT_ID = uuid.UUID("cccccccc-cccc-cccc-cccc-cccccccccccc")
VOLUNTEER_ID = uuid.UUID("dddddddd-dddd-dddd-dddd-dddddddddddd")
VOLUNTEER_ALIAS = "testvolunteer"
EV_ID = uuid.UUID("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee")
SESSION_ID = uuid.UUID("ffffffff-ffff-ffff-ffff-ffffffffffff")
PARTICIPANT_ID = uuid.UUID("11111111-1111-1111-1111-111111111111")

_NOW = datetime(2026, 1, 1, tzinfo=UTC)


def _sample_event(*, created_by: uuid.UUID = ORGANIZER_ID) -> EventEntity:
    return EventEntity(
        id=EVENT_ID,
        title="Test Event",
        description="A test event",
        start_date=_NOW,
        end_date=_NOW,
        status=EventStatus.POSTED,
        created_by=created_by,
    )


def _sample_volunteer() -> VolunteerEntity:
    return VolunteerEntity(
        id=VOLUNTEER_ID,
        user_id=OTHER_USER_ID,
        contact_phone="+1234567890",
        volunteer_role_id=uuid.uuid4(),
        status=VolunteerStatus.ACTIVE,
    )


def _sample_ev(*, status: EventVolunteerStatus = EventVolunteerStatus.PENDING) -> EventVolunteerEntity:
    return EventVolunteerEntity(
        id=EV_ID,
        volunteer_id=VOLUNTEER_ID,
        event_id=EVENT_ID,
        status=status,
    )


def _sample_participant() -> EventParticipantEntity:
    return EventParticipantEntity(
        id=PARTICIPANT_ID,
        user_id=OTHER_USER_ID,
        event_session_id=SESSION_ID,
        status=EventParticipantStatus.REGISTERED,
    )


def _make_repo(**overrides) -> MagicMock:
    repo = MagicMock(spec=EventVolunteerRepository)
    repo.get_event_by_id = AsyncMock(return_value=_sample_event())
    repo.get_volunteer_by_alias = AsyncMock(return_value=_sample_volunteer())
    repo.get_event_volunteer_by_id = AsyncMock(return_value=_sample_ev())
    repo.get_event_volunteer_by_volunteer_and_event = AsyncMock(return_value=None)
    repo.get_joined_event_volunteer_for_user = AsyncMock(return_value=None)
    repo.get_event_volunteers_by_event = AsyncMock(return_value=[_sample_ev()])
    repo.create_event_volunteer = AsyncMock(return_value=_sample_ev())
    repo.update_event_volunteer_status = AsyncMock(side_effect=lambda ev_id, new_status: _sample_ev(status=new_status))
    repo.delete_event_volunteer = AsyncMock(return_value=True)
    repo.get_participants_by_event = AsyncMock(return_value=[_sample_participant()])
    repo.count_participants_by_event = AsyncMock(return_value=1)
    for key, value in overrides.items():
        setattr(repo, key, value)
    return repo


def _make_uc(repo=None):
    repo = repo or _make_repo()
    db = AsyncMock(spec=AsyncSession)
    return EventVolunteerUseCase(repo, db), repo, db


# ---------------------------------------------------------------------------
# assign_volunteer
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_assign_volunteer_raises_when_event_not_found():
    """Raises EventNotFoundError when the target event does not exist."""
    repo = _make_repo(get_event_by_id=AsyncMock(return_value=None))
    uc, _, db = _make_uc(repo=repo)
    with pytest.raises(EventNotFoundError):
        await uc.assign_volunteer(AssignVolunteerInput(event_id=EVENT_ID, alias=VOLUNTEER_ALIAS, actor_id=ORGANIZER_ID))
    db.commit.assert_not_called()


@pytest.mark.asyncio
async def test_assign_volunteer_raises_when_caller_is_not_organizer():
    """Raises UnauthorizedEventVolunteerOperationError when the caller did not create the event."""
    repo = _make_repo(get_event_by_id=AsyncMock(return_value=_sample_event(created_by=OTHER_USER_ID)))
    uc, _, db = _make_uc(repo=repo)
    with pytest.raises(UnauthorizedEventVolunteerOperationError):
        await uc.assign_volunteer(AssignVolunteerInput(event_id=EVENT_ID, alias=VOLUNTEER_ALIAS, actor_id=ORGANIZER_ID))
    db.commit.assert_not_called()


@pytest.mark.asyncio
async def test_assign_volunteer_raises_when_volunteer_not_found():
    """Raises VolunteerNotFoundError when the volunteer record does not exist."""
    repo = _make_repo(get_volunteer_by_alias=AsyncMock(return_value=None))
    uc, _, db = _make_uc(repo=repo)
    with pytest.raises(VolunteerNotFoundError):
        await uc.assign_volunteer(AssignVolunteerInput(event_id=EVENT_ID, alias=VOLUNTEER_ALIAS, actor_id=ORGANIZER_ID))
    db.commit.assert_not_called()


@pytest.mark.asyncio
async def test_assign_volunteer_raises_when_already_assigned():
    """Raises EventVolunteerAlreadyExistsError when the volunteer is already assigned to the event."""
    repo = _make_repo(get_event_volunteer_by_volunteer_and_event=AsyncMock(return_value=_sample_ev()))
    uc, _, db = _make_uc(repo=repo)
    with pytest.raises(EventVolunteerAlreadyExistsError):
        await uc.assign_volunteer(AssignVolunteerInput(event_id=EVENT_ID, alias=VOLUNTEER_ALIAS, actor_id=ORGANIZER_ID))
    db.rollback.assert_called_once()


@pytest.mark.asyncio
async def test_assign_volunteer_creates_pending_assignment_and_commits():
    """Creates an EventVolunteer record with PENDING status and commits the transaction."""
    uc, repo, db = _make_uc()
    result = await uc.assign_volunteer(AssignVolunteerInput(event_id=EVENT_ID, alias=VOLUNTEER_ALIAS, actor_id=ORGANIZER_ID))
    repo.create_event_volunteer.assert_called_once_with(volunteer_id=VOLUNTEER_ID, event_id=EVENT_ID)
    db.commit.assert_called_once()
    assert result.event_volunteer.status == EventVolunteerStatus.PENDING


@pytest.mark.asyncio
async def test_assign_volunteer_uses_pessimistic_lock_on_event_row():
    """Passes for_update=True when fetching the event to prevent concurrent event deletion."""
    uc, repo, _ = _make_uc()
    await uc.assign_volunteer(AssignVolunteerInput(event_id=EVENT_ID, alias=VOLUNTEER_ALIAS, actor_id=ORGANIZER_ID))
    repo.get_event_by_id.assert_called_once_with(EVENT_ID, for_update=True)


@pytest.mark.asyncio
async def test_assign_volunteer_uses_pessimistic_lock_on_assignment_check():
    """Passes for_update=True when checking for duplicate assignments to prevent TOCTOU races."""
    uc, repo, _ = _make_uc()
    await uc.assign_volunteer(AssignVolunteerInput(event_id=EVENT_ID, alias=VOLUNTEER_ALIAS, actor_id=ORGANIZER_ID))
    repo.get_event_volunteer_by_volunteer_and_event.assert_called_once_with(VOLUNTEER_ID, EVENT_ID, for_update=True)


@pytest.mark.asyncio
async def test_assign_volunteer_rolls_back_and_reraises_on_unexpected_error():
    """Rolls back the transaction and re-raises when an unexpected error occurs during creation."""
    repo = _make_repo(create_event_volunteer=AsyncMock(side_effect=RuntimeError("db error")))
    uc, _, db = _make_uc(repo=repo)
    with pytest.raises(RuntimeError):
        await uc.assign_volunteer(AssignVolunteerInput(event_id=EVENT_ID, alias=VOLUNTEER_ALIAS, actor_id=ORGANIZER_ID))
    db.rollback.assert_called_once()
    db.commit.assert_not_called()


# ---------------------------------------------------------------------------
# update_volunteer_status
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_update_status_raises_when_assignment_not_found():
    """Raises EventVolunteerNotFoundError when no assignment matches the given ID."""
    repo = _make_repo(get_event_volunteer_by_id=AsyncMock(return_value=None))
    uc, _, db = _make_uc(repo=repo)
    with pytest.raises(EventVolunteerNotFoundError):
        await uc.update_volunteer_status(
            UpdateEventVolunteerStatusInput(event_volunteer_id=EV_ID, actor_id=ORGANIZER_ID, new_status=EventVolunteerStatus.JOINED)
        )
    db.commit.assert_not_called()


@pytest.mark.asyncio
async def test_update_status_raises_when_caller_is_not_organizer():
    """Raises UnauthorizedEventVolunteerOperationError when the caller is not the event organizer."""
    repo = _make_repo(get_event_by_id=AsyncMock(return_value=_sample_event(created_by=OTHER_USER_ID)))
    uc, _, db = _make_uc(repo=repo)
    with pytest.raises(UnauthorizedEventVolunteerOperationError):
        await uc.update_volunteer_status(
            UpdateEventVolunteerStatusInput(event_volunteer_id=EV_ID, actor_id=ORGANIZER_ID, new_status=EventVolunteerStatus.JOINED)
        )


@pytest.mark.asyncio
async def test_update_status_raises_on_invalid_transition_from_rejected():
    """Raises InvalidEventVolunteerStatusTransitionError when trying to transition from REJECTED to JOINED."""
    rejected_ev = _sample_ev(status=EventVolunteerStatus.REJECTED)
    repo = _make_repo(get_event_volunteer_by_id=AsyncMock(return_value=rejected_ev))
    uc, _, db = _make_uc(repo=repo)
    with pytest.raises(InvalidEventVolunteerStatusTransitionError):
        await uc.update_volunteer_status(
            UpdateEventVolunteerStatusInput(event_volunteer_id=EV_ID, actor_id=ORGANIZER_ID, new_status=EventVolunteerStatus.JOINED)
        )
    db.commit.assert_not_called()


@pytest.mark.asyncio
async def test_update_status_pending_to_joined_updates_and_commits():
    """Transitions status from PENDING to JOINED and commits the transaction."""
    uc, repo, db = _make_uc()
    result = await uc.update_volunteer_status(
        UpdateEventVolunteerStatusInput(event_volunteer_id=EV_ID, actor_id=ORGANIZER_ID, new_status=EventVolunteerStatus.JOINED)
    )
    repo.update_event_volunteer_status.assert_called_once_with(EV_ID, EventVolunteerStatus.JOINED)
    db.commit.assert_called_once()
    assert result.event_volunteer.status == EventVolunteerStatus.JOINED


@pytest.mark.asyncio
async def test_update_status_joined_to_left_updates_and_commits():
    """Transitions status from JOINED to LEFT and commits the transaction."""
    joined_ev = _sample_ev(status=EventVolunteerStatus.JOINED)
    repo = _make_repo(get_event_volunteer_by_id=AsyncMock(return_value=joined_ev))
    uc, _, db = _make_uc(repo=repo)
    result = await uc.update_volunteer_status(
        UpdateEventVolunteerStatusInput(event_volunteer_id=EV_ID, actor_id=ORGANIZER_ID, new_status=EventVolunteerStatus.LEFT)
    )
    db.commit.assert_called_once()
    assert result.old_status == EventVolunteerStatus.JOINED


@pytest.mark.asyncio
async def test_update_status_uses_pessimistic_lock_on_assignment_row():
    """Passes for_update=True when fetching the assignment to prevent concurrent status update conflicts."""
    uc, repo, _ = _make_uc()
    await uc.update_volunteer_status(
        UpdateEventVolunteerStatusInput(event_volunteer_id=EV_ID, actor_id=ORGANIZER_ID, new_status=EventVolunteerStatus.JOINED)
    )
    repo.get_event_volunteer_by_id.assert_called_once_with(EV_ID, for_update=True)


@pytest.mark.asyncio
async def test_update_status_rolls_back_and_reraises_on_unexpected_error():
    """Rolls back the transaction and re-raises when an unexpected error occurs during the update."""
    repo = _make_repo(update_event_volunteer_status=AsyncMock(side_effect=RuntimeError("db error")))
    uc, _, db = _make_uc(repo=repo)
    with pytest.raises(RuntimeError):
        await uc.update_volunteer_status(
            UpdateEventVolunteerStatusInput(event_volunteer_id=EV_ID, actor_id=ORGANIZER_ID, new_status=EventVolunteerStatus.JOINED)
        )
    db.rollback.assert_called_once()
    db.commit.assert_not_called()


# ---------------------------------------------------------------------------
# remove_volunteer
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_remove_volunteer_raises_when_assignment_not_found():
    """Raises EventVolunteerNotFoundError when the assignment does not exist."""
    repo = _make_repo(get_event_volunteer_by_id=AsyncMock(return_value=None))
    uc, _, db = _make_uc(repo=repo)
    with pytest.raises(EventVolunteerNotFoundError):
        await uc.remove_volunteer(RemoveEventVolunteerInput(event_volunteer_id=EV_ID, actor_id=ORGANIZER_ID))
    db.commit.assert_not_called()


@pytest.mark.asyncio
async def test_remove_volunteer_raises_when_caller_is_not_organizer():
    """Raises UnauthorizedEventVolunteerOperationError when the caller is not the event organizer."""
    repo = _make_repo(get_event_by_id=AsyncMock(return_value=_sample_event(created_by=OTHER_USER_ID)))
    uc, _, db = _make_uc(repo=repo)
    with pytest.raises(UnauthorizedEventVolunteerOperationError):
        await uc.remove_volunteer(RemoveEventVolunteerInput(event_volunteer_id=EV_ID, actor_id=ORGANIZER_ID))


@pytest.mark.asyncio
async def test_remove_volunteer_deletes_record_and_commits():
    """Deletes the event-volunteer record and commits the transaction."""
    uc, repo, db = _make_uc()
    result = await uc.remove_volunteer(RemoveEventVolunteerInput(event_volunteer_id=EV_ID, actor_id=ORGANIZER_ID))
    repo.delete_event_volunteer.assert_called_once_with(EV_ID)
    db.commit.assert_called_once()
    assert result.event_volunteer.id == EV_ID


@pytest.mark.asyncio
async def test_remove_volunteer_uses_pessimistic_lock_on_assignment_row():
    """Passes for_update=True when fetching the assignment to prevent concurrent update/delete races."""
    uc, repo, _ = _make_uc()
    await uc.remove_volunteer(RemoveEventVolunteerInput(event_volunteer_id=EV_ID, actor_id=ORGANIZER_ID))
    repo.get_event_volunteer_by_id.assert_called_once_with(EV_ID, for_update=True)


@pytest.mark.asyncio
async def test_remove_volunteer_rolls_back_and_reraises_on_unexpected_error():
    """Rolls back the transaction and re-raises when an unexpected error occurs during deletion."""
    repo = _make_repo(delete_event_volunteer=AsyncMock(side_effect=RuntimeError("db error")))
    uc, _, db = _make_uc(repo=repo)
    with pytest.raises(RuntimeError):
        await uc.remove_volunteer(RemoveEventVolunteerInput(event_volunteer_id=EV_ID, actor_id=ORGANIZER_ID))
    db.rollback.assert_called_once()
    db.commit.assert_not_called()


# ---------------------------------------------------------------------------
# list_volunteers
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_list_volunteers_raises_when_event_not_found():
    """Raises EventNotFoundError when the target event does not exist."""
    repo = _make_repo(get_event_by_id=AsyncMock(return_value=None))
    uc, _, _ = _make_uc(repo=repo)
    with pytest.raises(EventNotFoundError):
        await uc.list_volunteers(ListEventVolunteersInput(event_id=EVENT_ID, actor_id=ORGANIZER_ID))


@pytest.mark.asyncio
async def test_list_volunteers_raises_when_caller_is_not_organizer():
    """Raises UnauthorizedEventVolunteerOperationError when the caller is not the event organizer."""
    repo = _make_repo(get_event_by_id=AsyncMock(return_value=_sample_event(created_by=OTHER_USER_ID)))
    uc, _, _ = _make_uc(repo=repo)
    with pytest.raises(UnauthorizedEventVolunteerOperationError):
        await uc.list_volunteers(ListEventVolunteersInput(event_id=EVENT_ID, actor_id=ORGANIZER_ID))


@pytest.mark.asyncio
async def test_list_volunteers_returns_all_assignments_for_organizer():
    """Returns all EventVolunteer records for the event when the caller is the organizer."""
    uc, repo, _ = _make_uc()
    result = await uc.list_volunteers(ListEventVolunteersInput(event_id=EVENT_ID, actor_id=ORGANIZER_ID))
    repo.get_event_volunteers_by_event.assert_called_once_with(EVENT_ID, status=None)
    assert len(result.event_volunteers) == 1


@pytest.mark.asyncio
async def test_list_volunteers_passes_status_filter_to_repository():
    """Forwards the status filter to the repository query."""
    uc, repo, _ = _make_uc()
    await uc.list_volunteers(ListEventVolunteersInput(event_id=EVENT_ID, actor_id=ORGANIZER_ID, status=EventVolunteerStatus.JOINED))
    repo.get_event_volunteers_by_event.assert_called_once_with(EVENT_ID, status=EventVolunteerStatus.JOINED)


# ---------------------------------------------------------------------------
# get_participants
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_get_participants_raises_when_event_not_found():
    """Raises EventNotFoundError when the target event does not exist."""
    repo = _make_repo(get_event_by_id=AsyncMock(return_value=None))
    uc, _, _ = _make_uc(repo=repo)
    with pytest.raises(EventNotFoundError):
        await uc.get_participants(GetEventParticipantsInput(event_id=EVENT_ID, actor_id=ORGANIZER_ID))


@pytest.mark.asyncio
async def test_get_participants_allowed_for_event_organizer():
    """Returns participants without checking joined-volunteer status when caller is the organizer."""
    uc, repo, _ = _make_uc()
    result = await uc.get_participants(GetEventParticipantsInput(event_id=EVENT_ID, actor_id=ORGANIZER_ID))
    repo.get_joined_event_volunteer_for_user.assert_not_called()
    assert result.total == 1


@pytest.mark.asyncio
async def test_get_participants_allowed_for_joined_volunteer():
    """Returns participants when caller is a volunteer with JOINED status for the event."""
    repo = _make_repo(
        get_event_by_id=AsyncMock(return_value=_sample_event(created_by=OTHER_USER_ID)),
        get_joined_event_volunteer_for_user=AsyncMock(return_value=_sample_ev(status=EventVolunteerStatus.JOINED)),
    )
    uc, _, _ = _make_uc(repo=repo)
    result = await uc.get_participants(GetEventParticipantsInput(event_id=EVENT_ID, actor_id=ORGANIZER_ID))
    assert result.total == 1


@pytest.mark.asyncio
async def test_get_participants_raises_for_unauthenticated_non_joined_user():
    """Raises UnauthorizedEventVolunteerOperationError when caller has no JOINED assignment."""
    repo = _make_repo(
        get_event_by_id=AsyncMock(return_value=_sample_event(created_by=OTHER_USER_ID)),
        get_joined_event_volunteer_for_user=AsyncMock(return_value=None),
    )
    uc, _, _ = _make_uc(repo=repo)
    with pytest.raises(UnauthorizedEventVolunteerOperationError):
        await uc.get_participants(GetEventParticipantsInput(event_id=EVENT_ID, actor_id=ORGANIZER_ID))


@pytest.mark.asyncio
async def test_get_participants_passes_pagination_and_status_filter_to_repository():
    """Forwards limit, offset, and status filter parameters to the repository query."""
    uc, repo, _ = _make_uc()
    await uc.get_participants(GetEventParticipantsInput(event_id=EVENT_ID, actor_id=ORGANIZER_ID, status="registered", limit=25, offset=10))
    repo.get_participants_by_event.assert_called_once_with(EVENT_ID, status="registered", limit=25, offset=10)
    repo.count_participants_by_event.assert_called_once_with(EVENT_ID, status="registered")
