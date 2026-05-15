"""Analytics domain entities — value objects for all five analytics domains."""

import uuid
from datetime import datetime

from pydantic import BaseModel

# ── Logistics ──────────────────────────────────────────────────────────


class SessionVenueAssignment(BaseModel):
    session_id: uuid.UUID
    session_title: str
    venue_id: uuid.UUID
    venue_name: str
    venue_city: str | None = None
    venue_capacity: int


class SessionUtilisation(BaseModel):
    session_id: uuid.UUID
    session_title: str
    checked_in: int
    max_slots: int | None = None
    utilisation_pct: float | None = None
    over_capacity: bool = False


class VenueCapacityVsRegistration(BaseModel):
    session_id: uuid.UUID
    session_title: str
    venue_capacity: int
    registered_count: int


class EventLogisticsOverview(BaseModel):
    event_id: uuid.UUID
    event_title: str
    total_sessions: int
    scheduled_dates: list[datetime]
    venue_assignments: list[SessionVenueAssignment]
    session_utilisation: list[SessionUtilisation]
    over_capacity_sessions: list[SessionUtilisation]
    venue_capacity_vs_registrations: list[VenueCapacityVsRegistration]


class SessionTimelineEntry(BaseModel):
    session_id: uuid.UUID
    session_title: str
    event_id: uuid.UUID
    event_title: str
    venue_id: uuid.UUID
    venue_name: str
    start_datetime: datetime
    end_datetime: datetime
    status: str


class SessionTimeline(BaseModel):
    ongoing: list[SessionTimelineEntry]
    upcoming: list[SessionTimelineEntry]
    completed: list[SessionTimelineEntry]


class VolunteerRosterEntry(BaseModel):
    volunteer_id: uuid.UUID
    user_id: uuid.UUID
    first_name: str | None = None
    last_name: str | None = None
    alias: str | None = None
    role_name: str | None = None
    contact_phone: str | None = None
    status: str


class VolunteerLogistics(BaseModel):
    event_id: uuid.UUID
    event_title: str
    joined_volunteer_count: int
    joined_volunteer_roster: list[VolunteerRosterEntry]
    volunteer_to_participant_ratio: float | None = None
    pending_volunteer_count: int


class RegistrationLogistics(BaseModel):
    session_id: uuid.UUID
    session_title: str
    total_registrations: int
    cancelled_count: int
    cancellation_rate_pct: float | None = None
    no_show_count: int
    no_show_rate_pct: float | None = None
    qr_checkin_count: int
    manual_checkin_count: int


# ── Performance ────────────────────────────────────────────────────────


class AttendanceRate(BaseModel):
    session_id: uuid.UUID
    session_title: str
    event_id: uuid.UUID
    registered_count: int
    attended_count: int
    attendance_rate_pct: float | None = None


class EventAttendanceRate(BaseModel):
    event_id: uuid.UUID
    event_title: str
    registered_count: int
    attended_count: int
    attendance_rate_pct: float | None = None


class FeedbackScoreSummary(BaseModel):
    event_id: uuid.UUID
    event_title: str
    average_rating: float | None = None
    total_feedback_count: int


class FeedbackTrendPoint(BaseModel):
    event_id: uuid.UUID
    event_title: str
    end_date: datetime | None = None
    average_rating: float | None = None
    feedback_count: int


class TopRatedEvent(BaseModel):
    event_id: uuid.UUID
    event_title: str
    average_rating: float
    feedback_count: int


class VolunteerPerformance(BaseModel):
    volunteer_id: uuid.UUID
    user_id: uuid.UUID
    first_name: str | None = None
    last_name: str | None = None
    alias: str | None = None
    role_name: str | None = None
    joined_count: int
    left_count: int


class OrganizerOutput(BaseModel):
    organizer_id: uuid.UUID
    first_name: str | None = None
    last_name: str | None = None
    alias: str | None = None
    total_events_created: int
    average_sessions_per_event: float | None = None
    average_attendance_rate_pct: float | None = None


class SessionStatusDistribution(BaseModel):
    status: str
    count: int


class EventPerformance(BaseModel):
    attendance_rates: list[AttendanceRate]
    event_attendance_rates: list[EventAttendanceRate]
    feedback_summaries: list[FeedbackScoreSummary]
    feedback_trend: list[FeedbackTrendPoint]
    top_rated_events: list[TopRatedEvent]
    volunteer_performance: list[VolunteerPerformance]
    organizer_output: list[OrganizerOutput]
    session_status_distribution: list[SessionStatusDistribution]
    repeat_attendee_rate_pct: float | None = None
    average_registration_to_checkin_lead_time_hours: float | None = None


class LiveAttendance(BaseModel):
    session_id: uuid.UUID
    session_title: str
    event_id: uuid.UUID
    event_title: str
    checked_in_count: int
    max_slots: int | None = None
    remaining_slots: int | None = None


class OngoingPerformance(BaseModel):
    live_attendance: list[LiveAttendance]
    real_time_slot_availability: list[LiveAttendance]


class YearOverYearAttendance(BaseModel):
    year: int
    attended_count: int
    growth_pct: float | None = None


class EventStatusTransition(BaseModel):
    period: str
    status: str
    count: int


class HistoricalPerformance(BaseModel):
    year_over_year_attendance: list[YearOverYearAttendance]
    events_by_status_over_time: list[EventStatusTransition]


# ── Demographics ───────────────────────────────────────────────────────


class DeviceBreakdown(BaseModel):
    device_type: str
    count: int
    percentage: float | None = None


class OsBreakdown(BaseModel):
    os: str
    count: int
    percentage: float | None = None


class BrowserBreakdown(BaseModel):
    browser: str
    count: int
    percentage: float | None = None


class CityParticipation(BaseModel):
    city: str
    country: str | None = None
    participant_count: int


class AccountAgeDistribution(BaseModel):
    bucket: str
    count: int
    percentage: float | None = None


class VolunteerRoleBreakdown(BaseModel):
    role_name: str
    count: int


class EventInterestCategory(BaseModel):
    category: str | None = None
    event_count: int
    registration_count: int


class FirstTimeVsReturning(BaseModel):
    event_id: uuid.UUID
    event_title: str
    first_time_count: int
    returning_count: int


class GenderDistribution(BaseModel):
    gender: str
    count: int
    percentage: float | None = None


class GeographicSpread(BaseModel):
    city: str
    latitude: float | None = None
    longitude: float | None = None
    participant_count: int


class DemographicAnalytics(BaseModel):
    device_breakdown: list[DeviceBreakdown]
    os_breakdown: list[OsBreakdown]
    browser_breakdown: list[BrowserBreakdown]
    top_cities: list[CityParticipation]
    account_age_distribution: list[AccountAgeDistribution]
    volunteer_role_breakdown: list[VolunteerRoleBreakdown]
    event_interest_categories: list[EventInterestCategory]
    first_time_vs_returning: list[FirstTimeVsReturning]
    gender_distribution: list[GenderDistribution]
    geographic_spread: list[GeographicSpread]


# ── On-going Event Data ────────────────────────────────────────────────


class StartedEventSummary(BaseModel):
    event_id: uuid.UUID
    event_title: str
    session_count: int
    checked_in_count: int
    remaining_slots: int | None = None


class LiveCheckinEntry(BaseModel):
    participant_id: uuid.UUID
    user_id: uuid.UUID
    first_name: str | None = None
    last_name: str | None = None
    alias: str | None = None
    session_id: uuid.UUID
    session_title: str
    event_id: uuid.UUID
    event_title: str
    checked_in_time: datetime | None = None
    checkin_method: str  # 'qr' or 'manual'


class VolunteerOnDuty(BaseModel):
    volunteer_id: uuid.UUID
    user_id: uuid.UUID
    first_name: str | None = None
    last_name: str | None = None
    alias: str | None = None
    contact_phone: str
    role_name: str | None = None
    event_id: uuid.UUID
    event_title: str


class SessionProgress(BaseModel):
    session_id: uuid.UUID
    session_title: str
    event_id: uuid.UUID
    event_title: str
    start_datetime: datetime
    end_datetime: datetime
    elapsed_pct: float


class PendingWithdrawalAlert(BaseModel):
    session_id: uuid.UUID
    session_title: str
    event_id: uuid.UUID
    withdrawal_count: int


class LateRegistration(BaseModel):
    participant_id: uuid.UUID
    user_id: uuid.UUID
    first_name: str | None = None
    last_name: str | None = None
    alias: str | None = None
    session_id: uuid.UUID
    session_title: str
    event_id: uuid.UUID
    registered_at: datetime
    session_started_at: datetime


class OngoingEventData(BaseModel):
    started_events: list[StartedEventSummary]
    live_checkin_feed: list[LiveCheckinEntry]
    volunteer_on_duty: list[VolunteerOnDuty]
    session_progress: list[SessionProgress]
    pending_withdrawals: list[PendingWithdrawalAlert]
    late_registrations: list[LateRegistration]


# ── Historical Event Data ──────────────────────────────────────────────


class EndedEventSummary(BaseModel):
    event_id: uuid.UUID
    event_title: str
    start_date: datetime
    end_date: datetime
    total_registered: int
    total_attended: int
    total_no_show: int
    total_cancelled: int
    average_feedback: float | None = None


class CancelledEventReport(BaseModel):
    event_id: uuid.UUID
    event_title: str
    cancelled_at: datetime | None = None
    created_by: uuid.UUID
    creator_first_name: str | None = None
    creator_last_name: str | None = None
    creator_alias: str | None = None
    session_count: int


class FeedbackCompleteness(BaseModel):
    event_id: uuid.UUID
    event_title: str
    attended_count: int
    feedback_count: int
    completeness_rate_pct: float | None = None


class PeriodComparison(BaseModel):
    period_label: str
    from_date: datetime
    to_date: datetime
    total_events: int
    total_registered: int
    total_attended: int
    average_attendance_rate_pct: float | None = None
    average_feedback: float | None = None


class HistoricalEventData(BaseModel):
    ended_events: list[EndedEventSummary]
    cancelled_events: list[CancelledEventReport]
    feedback_completeness: list[FeedbackCompleteness]
    period_comparisons: list[PeriodComparison] | None = None
    total_count: int
