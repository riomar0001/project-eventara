"""Analytics repository interface — read-only aggregate queries for all five analytics domains."""

import uuid
from datetime import datetime
from typing import Protocol

from app.domain.entities.analytics_entities import (
    AccountAgeDistribution,
    AttendanceRate,
    BrowserBreakdown,
    CancelledEventReport,
    CityParticipation,
    DeviceBreakdown,
    EndedEventSummary,
    EventAttendanceRate,
    EventInterestCategory,
    EventLogisticsOverview,
    EventStatusTransition,
    FeedbackCompleteness,
    FeedbackScoreSummary,
    FeedbackTrendPoint,
    FirstTimeVsReturning,
    GenderDistribution,
    GeographicSpread,
    LateRegistration,
    LiveAttendance,
    LiveCheckinEntry,
    OrganizerOutput,
    OsBreakdown,
    PendingWithdrawalAlert,
    RegistrationLogistics,
    SessionProgress,
    SessionStatusDistribution,
    SessionTimeline,
    StartedEventSummary,
    TopRatedEvent,
    VenueCapacityVsRegistration,
    VolunteerLogistics,
    VolunteerOnDuty,
    VolunteerPerformance,
    VolunteerRoleBreakdown,
    YearOverYearAttendance,
)


class IAnalyticsRepository(Protocol):
    """Contract for read-only analytics data retrieval."""

    # ── Logistics ──────────────────────────────────────────────────

    async def get_event_logistics_overview(self, event_id: uuid.UUID) -> EventLogisticsOverview: ...

    async def get_session_utilisation(self, event_id: uuid.UUID) -> list[VenueCapacityVsRegistration]: ...

    async def get_session_timeline(self) -> SessionTimeline: ...

    async def get_volunteer_logistics(self, event_id: uuid.UUID) -> VolunteerLogistics: ...

    async def get_registration_logistics(self, event_id: uuid.UUID) -> list[RegistrationLogistics]: ...

    # ── Performance ────────────────────────────────────────────────

    async def get_attendance_rates(self, event_id: uuid.UUID | None = None) -> list[AttendanceRate]: ...

    async def get_event_attendance_rates(self) -> list[EventAttendanceRate]: ...

    async def get_feedback_summaries(self) -> list[FeedbackScoreSummary]: ...

    async def get_feedback_trend(self, limit: int) -> list[FeedbackTrendPoint]: ...

    async def get_top_rated_events(self, limit: int, min_feedback_count: int) -> list[TopRatedEvent]: ...

    async def get_volunteer_performance(self) -> list[VolunteerPerformance]: ...

    async def get_organizer_output(self) -> list[OrganizerOutput]: ...

    async def get_session_status_distribution(self) -> list[SessionStatusDistribution]: ...

    async def get_repeat_attendee_rate(self) -> float | None: ...

    async def get_average_registration_to_checkin_lead_time(self) -> float | None: ...

    async def get_live_attendance(self) -> list[LiveAttendance]: ...

    async def get_year_over_year_attendance(self) -> list[YearOverYearAttendance]: ...

    async def get_events_by_status_over_time(self) -> list[EventStatusTransition]: ...

    # ── Demographics ───────────────────────────────────────────────

    async def get_device_breakdown(self) -> list[DeviceBreakdown]: ...

    async def get_os_breakdown(self) -> list[OsBreakdown]: ...

    async def get_browser_breakdown(self) -> list[BrowserBreakdown]: ...

    async def get_top_participating_cities(self, limit: int) -> list[CityParticipation]: ...

    async def get_account_age_distribution(self) -> list[AccountAgeDistribution]: ...

    async def get_volunteer_role_breakdown(self) -> list[VolunteerRoleBreakdown]: ...

    async def get_event_interest_categories(self) -> list[EventInterestCategory]: ...

    async def get_first_time_vs_returning(self) -> list[FirstTimeVsReturning]: ...

    async def get_gender_distribution(self) -> list[GenderDistribution]: ...

    async def get_geographic_spread(self) -> list[GeographicSpread]: ...

    # ── On-going ───────────────────────────────────────────────────

    async def get_started_events(self) -> list[StartedEventSummary]: ...

    async def get_live_checkin_feed(self, limit: int) -> list[LiveCheckinEntry]: ...

    async def get_volunteer_on_duty(self) -> list[VolunteerOnDuty]: ...

    async def get_session_progress(self) -> list[SessionProgress]: ...

    async def get_pending_withdrawals(self) -> list[PendingWithdrawalAlert]: ...

    async def get_late_registrations(self) -> list[LateRegistration]: ...

    # ── Historical ─────────────────────────────────────────────────

    async def get_ended_events(
        self,
        from_date: datetime | None = None,
        to_date: datetime | None = None,
        organizer_id: uuid.UUID | None = None,
        venue_id: uuid.UUID | None = None,
    ) -> list[EndedEventSummary]: ...

    async def get_cancelled_events_report(self) -> list[CancelledEventReport]: ...

    async def get_feedback_completeness(self) -> list[FeedbackCompleteness]: ...
