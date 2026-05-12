import uuid
from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.dto.event_feedback_dto import CreateEventFeedbackInput
from app.application.use_cases.event_feedback_usecase import EventFeedbackUseCase
from app.domain.entities.event_entity import Event, EventFeedback, EventParticipant, EventParticipantStatus, EventStatus
from app.domain.exceptions.event_exceptions import EventNotFoundError
from app.domain.exceptions.event_feedback_exceptions import DuplicateEventFeedbackError, EventFeedbackEligibilityError, EventFeedbackNotOpenError
from app.infrastructure.database.repositories.event_feedback_repository import EventFeedbackRepository
from app.infrastructure.database.repositories.event_participant_repository import EventParticipantRepository
from app.infrastructure.database.repositories.event_repository import EventRepository

EVENT_ID = uuid.UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
USER_ID = uuid.UUID("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee")
PARTICIPANT_ID = uuid.UUID("ffffffff-ffff-ffff-ffff-ffffffffffff")
CREATOR_ID = uuid.UUID("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")
FEEDBACK_ID = uuid.UUID("11111111-1111-1111-1111-111111111111")


def _event(**overrides):
    defaults = dict(
        id=EVENT_ID,
        title="Ended Event",
        description="desc",
        start_date=datetime(2026, 1, 1, tzinfo=UTC),
        end_date=datetime(2026, 1, 2, tzinfo=UTC),
        status=EventStatus.ENDED,
        created_by=CREATOR_ID,
    )
    defaults.update(overrides)
    return Event(**defaults)


def _participant(**overrides):
    defaults = dict(
        id=PARTICIPANT_ID,
        user_id=USER_ID,
        event_session_id=uuid.uuid4(),
        status=EventParticipantStatus.ATTENDED,
        is_checked_in=True,
    )
    defaults.update(overrides)
    return EventParticipant(**defaults)


def _feedback(**overrides):
    defaults = dict(
        id=FEEDBACK_ID,
        user_id=USER_ID,
        event_id=EVENT_ID,
        participant_id=PARTICIPANT_ID,
        rating=5,
        comment="Great event",
        suggestion=None,
    )
    defaults.update(overrides)
    return EventFeedback(**defaults)


def _use_case(feedback_repo=None, event_repo=None, participant_repo=None):
    if feedback_repo is None:
        feedback_repo = MagicMock(spec=EventFeedbackRepository)
        feedback_repo.get_by_user_and_event = AsyncMock(return_value=None)
        feedback_repo.create = AsyncMock(return_value=_feedback())

    if event_repo is None:
        event_repo = MagicMock(spec=EventRepository)
        event_repo.get_event_by_id = AsyncMock(return_value=_event())

    if participant_repo is None:
        participant_repo = MagicMock(spec=EventParticipantRepository)
        participant_repo.get_by_user_and_event = AsyncMock(return_value=_participant())

    db = AsyncMock(spec=AsyncSession)
    return EventFeedbackUseCase(feedback_repo, event_repo, participant_repo, db), feedback_repo, event_repo, participant_repo, db


def _input(**overrides):
    defaults = dict(user_id=USER_ID, event_id=EVENT_ID, rating=5, comment="Great event", suggestion=None)
    defaults.update(overrides)
    return CreateEventFeedbackInput(**defaults)


@pytest.mark.asyncio
async def test_create_feedback_locks_event_before_eligibility_checks():
    uc, _, event_repo, _, _ = _use_case()
    await uc.create_feedback(_input())
    event_repo.get_event_by_id.assert_called_once_with(EVENT_ID, for_update=True)


@pytest.mark.asyncio
async def test_create_feedback_requires_event_to_exist():
    event_repo = MagicMock(spec=EventRepository)
    event_repo.get_event_by_id = AsyncMock(return_value=None)
    uc, _, _, _, _ = _use_case(event_repo=event_repo)
    with pytest.raises(EventNotFoundError):
        await uc.create_feedback(_input())


@pytest.mark.asyncio
async def test_create_feedback_requires_event_to_be_ended():
    event_repo = MagicMock(spec=EventRepository)
    event_repo.get_event_by_id = AsyncMock(return_value=_event(status=EventStatus.STARTED))
    uc, _, _, _, _ = _use_case(event_repo=event_repo)
    with pytest.raises(EventFeedbackNotOpenError):
        await uc.create_feedback(_input())


@pytest.mark.asyncio
async def test_create_feedback_requires_checked_in_participant():
    participant_repo = MagicMock(spec=EventParticipantRepository)
    participant_repo.get_by_user_and_event = AsyncMock(return_value=_participant(is_checked_in=False))
    uc, _, _, _, _ = _use_case(participant_repo=participant_repo)
    with pytest.raises(EventFeedbackEligibilityError):
        await uc.create_feedback(_input())


@pytest.mark.asyncio
async def test_create_feedback_rejects_duplicate_submission():
    feedback_repo = MagicMock(spec=EventFeedbackRepository)
    feedback_repo.get_by_user_and_event = AsyncMock(return_value=_feedback())
    uc, _, _, _, _ = _use_case(feedback_repo=feedback_repo)
    with pytest.raises(DuplicateEventFeedbackError):
        await uc.create_feedback(_input())


@pytest.mark.asyncio
async def test_create_feedback_persists_feedback_and_commits():
    uc, feedback_repo, _, _, db = _use_case()
    result = await uc.create_feedback(_input())
    feedback_repo.create.assert_called_once_with(
        user_id=USER_ID,
        event_id=EVENT_ID,
        participant_id=PARTICIPANT_ID,
        rating=5,
        comment="Great event",
        suggestion=None,
    )
    assert result.feedback.id == FEEDBACK_ID
    db.commit.assert_called_once()
