"""Unit tests for OngoingEventDataUseCase."""

import uuid
from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.application.dto.analytics_dto import GetOngoingEventDataInput
from app.application.use_cases.analytics_ongoing_usecase import OngoingEventDataUseCase
from app.domain.entities.analytics_entities import (
    LateRegistration,
    LiveCheckinEntry,
    OngoingEventData,
    PendingWithdrawalAlert,
    SessionProgress,
    StartedEventSummary,
    VolunteerOnDuty,
)
from app.domain.exceptions.analytics_exceptions import AnalyticsDataFetchError

EVENT_ID = uuid.uuid4()
SESSION_ID = uuid.uuid4()
USER_ID = uuid.uuid4()
VOLUNTEER_ID = uuid.uuid4()
PARTICIPANT_ID = uuid.uuid4()
NOW = datetime.now(UTC)


def _make_repo(**overrides):
    repo = MagicMock()
    repo.get_started_events = AsyncMock(
        return_value=[StartedEventSummary(event_id=EVENT_ID, event_title="Active Event", session_count=3, checked_in_count=75, remaining_slots=25)]
    )
    repo.get_live_checkin_feed = AsyncMock(
        return_value=[
            LiveCheckinEntry(
                participant_id=PARTICIPANT_ID,
                user_id=USER_ID,
                first_name="John",
                last_name="Doe",
                alias="johnd",
                session_id=SESSION_ID,
                session_title="Session 1",
                event_id=EVENT_ID,
                event_title="Active Event",
                checked_in_time=NOW,
                checkin_method="qr",
            )
        ]
    )
    repo.get_volunteer_on_duty = AsyncMock(
        return_value=[
            VolunteerOnDuty(
                volunteer_id=VOLUNTEER_ID,
                user_id=USER_ID,
                first_name="Jane",
                last_name="Doe",
                alias="janed",
                contact_phone="1234567890",
                role_name="Usher",
                event_id=EVENT_ID,
                event_title="Active Event",
            )
        ]
    )
    repo.get_session_progress = AsyncMock(
        return_value=[
            SessionProgress(
                session_id=SESSION_ID,
                session_title="Session 1",
                event_id=EVENT_ID,
                event_title="Active Event",
                start_datetime=NOW,
                end_datetime=NOW,
                elapsed_pct=50.0,
            )
        ]
    )
    repo.get_pending_withdrawals = AsyncMock(
        return_value=[PendingWithdrawalAlert(session_id=SESSION_ID, session_title="Session 1", event_id=EVENT_ID, withdrawal_count=3)]
    )
    repo.get_late_registrations = AsyncMock(
        return_value=[
            LateRegistration(
                participant_id=PARTICIPANT_ID,
                user_id=USER_ID,
                first_name="Late",
                last_name="Registrant",
                alias="later",
                session_id=SESSION_ID,
                session_title="Session 1",
                event_id=EVENT_ID,
                registered_at=NOW,
                session_started_at=NOW,
            )
        ]
    )
    for key, value in overrides.items():
        setattr(repo, key, value)
    return repo


def _make_uc(repo=None):
    return OngoingEventDataUseCase(repo or _make_repo())


class TestGetOngoingData:
    @pytest.mark.asyncio
    async def test_returns_full_ongoing_data(self):
        result = await _make_uc().get_ongoing_data(GetOngoingEventDataInput())
        data = result.data
        assert isinstance(data, OngoingEventData)
        assert len(data.started_events) == 1
        assert len(data.live_checkin_feed) == 1
        assert len(data.volunteer_on_duty) == 1
        assert len(data.session_progress) == 1
        assert len(data.pending_withdrawals) == 1
        assert len(data.late_registrations) == 1

    @pytest.mark.asyncio
    async def test_empty_when_no_active_events(self):
        repo = _make_repo(
            get_started_events=AsyncMock(return_value=[]),
            get_live_checkin_feed=AsyncMock(return_value=[]),
            get_volunteer_on_duty=AsyncMock(return_value=[]),
            get_session_progress=AsyncMock(return_value=[]),
            get_pending_withdrawals=AsyncMock(return_value=[]),
            get_late_registrations=AsyncMock(return_value=[]),
        )
        result = await _make_uc(repo).get_ongoing_data(GetOngoingEventDataInput())
        assert result.data.started_events == []
        assert result.data.live_checkin_feed == []

    @pytest.mark.asyncio
    async def test_checkin_method_is_qr_when_checked_in_by_set(self):
        repo = _make_repo(
            get_live_checkin_feed=AsyncMock(
                return_value=[
                    LiveCheckinEntry(
                        participant_id=PARTICIPANT_ID,
                        user_id=USER_ID,
                        first_name="John",
                        session_id=SESSION_ID,
                        session_title="S1",
                        event_id=EVENT_ID,
                        event_title="E1",
                        checked_in_time=NOW,
                        checkin_method="qr",
                    )
                ]
            )
        )
        result = await _make_uc(repo).get_ongoing_data(GetOngoingEventDataInput())
        assert result.data.live_checkin_feed[0].checkin_method == "qr"

    @pytest.mark.asyncio
    async def test_checkin_method_is_manual_when_checked_in_by_none(self):
        repo = _make_repo(
            get_live_checkin_feed=AsyncMock(
                return_value=[
                    LiveCheckinEntry(
                        participant_id=PARTICIPANT_ID,
                        user_id=USER_ID,
                        first_name="John",
                        session_id=SESSION_ID,
                        session_title="S1",
                        event_id=EVENT_ID,
                        event_title="E1",
                        checked_in_time=NOW,
                        checkin_method="manual",
                    )
                ]
            )
        )
        result = await _make_uc(repo).get_ongoing_data(GetOngoingEventDataInput())
        assert result.data.live_checkin_feed[0].checkin_method == "manual"

    @pytest.mark.asyncio
    async def test_passes_checkin_feed_limit(self):
        repo = _make_repo()
        await _make_uc(repo).get_ongoing_data(GetOngoingEventDataInput(checkin_feed_limit=25))
        repo.get_live_checkin_feed.assert_awaited_once_with(25)

    @pytest.mark.asyncio
    async def test_default_checkin_feed_limit(self):
        repo = _make_repo()
        await _make_uc(repo).get_ongoing_data(GetOngoingEventDataInput())
        repo.get_live_checkin_feed.assert_awaited_once_with(50)

    @pytest.mark.asyncio
    async def test_pending_withdrawals_has_count(self):
        result = await _make_uc().get_ongoing_data(GetOngoingEventDataInput())
        assert result.data.pending_withdrawals[0].withdrawal_count == 3

    @pytest.mark.asyncio
    async def test_session_progress_has_elapsed_pct(self):
        result = await _make_uc().get_ongoing_data(GetOngoingEventDataInput())
        assert result.data.session_progress[0].elapsed_pct == 50.0

    @pytest.mark.asyncio
    async def test_raises_analytics_data_fetch_error_on_failure(self):
        repo = _make_repo(get_started_events=AsyncMock(side_effect=RuntimeError("db down")))
        with patch("app.core.config.settings") as s:
            s.DEBUG = False
            with pytest.raises(AnalyticsDataFetchError):
                await _make_uc(repo).get_ongoing_data(GetOngoingEventDataInput())

    @pytest.mark.asyncio
    async def test_all_repo_methods_called(self):
        repo = _make_repo()
        await _make_uc(repo).get_ongoing_data(GetOngoingEventDataInput())
        repo.get_started_events.assert_awaited_once()
        repo.get_live_checkin_feed.assert_awaited_once()
        repo.get_volunteer_on_duty.assert_awaited_once()
        repo.get_session_progress.assert_awaited_once()
        repo.get_pending_withdrawals.assert_awaited_once()
        repo.get_late_registrations.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_remaining_slots_can_be_none(self):
        repo = _make_repo(
            get_started_events=AsyncMock(
                return_value=[StartedEventSummary(event_id=EVENT_ID, event_title="E1", session_count=1, checked_in_count=50, remaining_slots=None)]
            )
        )
        result = await _make_uc(repo).get_ongoing_data(GetOngoingEventDataInput())
        assert result.data.started_events[0].remaining_slots is None
