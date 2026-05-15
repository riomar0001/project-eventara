"""Analytics controller schemas — request/response models for all five analytics domains."""

import uuid
from datetime import datetime

from pydantic import BaseModel

# ── Logistics Response Models ───────────────────────────────────────────


class SessionVenueAssignmentResponse(BaseModel):
    session_id: uuid.UUID
    session_title: str
    venue_id: uuid.UUID
    venue_name: str
    venue_city: str | None = None
    venue_capacity: int


class SessionUtilisationResponse(BaseModel):
    session_id: uuid.UUID
    session_title: str
    checked_in: int
    max_slots: int | None = None
    utilisation_pct: float | None = None
    over_capacity: bool = False


class VenueCapacityVsRegistrationResponse(BaseModel):
    session_id: uuid.UUID
    session_title: str
    venue_capacity: int
    registered_count: int


class EventLogisticsOverviewData(BaseModel):
    event_id: uuid.UUID
    event_title: str
    total_sessions: int
    scheduled_dates: list[datetime]
    venue_assignments: list[SessionVenueAssignmentResponse]
    session_utilisation: list[SessionUtilisationResponse]
    over_capacity_sessions: list[SessionUtilisationResponse]
    venue_capacity_vs_registrations: list[VenueCapacityVsRegistrationResponse]


class EventLogisticsOverviewResponse(BaseModel):
    success: bool = True
    message: str = "Event logistics overview retrieved successfully"
    data: EventLogisticsOverviewData


class SessionTimelineEntryResponse(BaseModel):
    session_id: uuid.UUID
    session_title: str
    event_id: uuid.UUID
    event_title: str
    venue_id: uuid.UUID
    venue_name: str
    start_datetime: datetime
    end_datetime: datetime
    status: str


class SessionTimelineData(BaseModel):
    ongoing: list[SessionTimelineEntryResponse]
    upcoming: list[SessionTimelineEntryResponse]
    completed: list[SessionTimelineEntryResponse]


class SessionTimelineResponse(BaseModel):
    success: bool = True
    message: str = "Session timeline retrieved successfully"
    data: SessionTimelineData


class VolunteerRosterEntryResponse(BaseModel):
    volunteer_id: uuid.UUID
    user_id: uuid.UUID
    first_name: str | None = None
    last_name: str | None = None
    alias: str | None = None
    role_name: str | None = None
    contact_phone: str | None = None
    status: str


class VolunteerLogisticsData(BaseModel):
    event_id: uuid.UUID
    event_title: str
    joined_volunteer_count: int
    joined_volunteer_roster: list[VolunteerRosterEntryResponse]
    volunteer_to_participant_ratio: float | None = None
    pending_volunteer_count: int


class VolunteerLogisticsResponse(BaseModel):
    success: bool = True
    message: str = "Volunteer logistics retrieved successfully"
    data: VolunteerLogisticsData


class RegistrationLogisticsEntryResponse(BaseModel):
    session_id: uuid.UUID
    session_title: str
    total_registrations: int
    cancelled_count: int
    cancellation_rate_pct: float | None = None
    no_show_count: int
    no_show_rate_pct: float | None = None
    qr_checkin_count: int
    manual_checkin_count: int


class RegistrationLogisticsData(BaseModel):
    sessions: list[RegistrationLogisticsEntryResponse]


class RegistrationLogisticsResponse(BaseModel):
    success: bool = True
    message: str = "Registration logistics retrieved successfully"
    data: RegistrationLogisticsData


# ── Performance Response Models ─────────────────────────────────────────


class AttendanceRateResponse(BaseModel):
    session_id: uuid.UUID
    session_title: str
    event_id: uuid.UUID
    registered_count: int
    attended_count: int
    attendance_rate_pct: float | None = None


class EventAttendanceRateResponse(BaseModel):
    event_id: uuid.UUID
    event_title: str
    registered_count: int
    attended_count: int
    attendance_rate_pct: float | None = None


class FeedbackScoreSummaryResponse(BaseModel):
    event_id: uuid.UUID
    event_title: str
    average_rating: float | None = None
    total_feedback_count: int


class FeedbackTrendPointResponse(BaseModel):
    event_id: uuid.UUID
    event_title: str
    end_date: datetime
    average_rating: float | None = None
    feedback_count: int


class TopRatedEventResponse(BaseModel):
    event_id: uuid.UUID
    event_title: str
    average_rating: float
    feedback_count: int


class VolunteerPerformanceResponse(BaseModel):
    volunteer_id: uuid.UUID
    user_id: uuid.UUID
    first_name: str | None = None
    last_name: str | None = None
    alias: str | None = None
    role_name: str | None = None
    joined_count: int
    left_count: int


class OrganizerOutputResponse(BaseModel):
    organizer_id: uuid.UUID
    first_name: str | None = None
    last_name: str | None = None
    alias: str | None = None
    total_events_created: int
    average_sessions_per_event: float | None = None
    average_attendance_rate_pct: float | None = None


class SessionStatusDistributionResponse(BaseModel):
    status: str
    count: int


class EventPerformanceData(BaseModel):
    attendance_rates: list[AttendanceRateResponse]
    event_attendance_rates: list[EventAttendanceRateResponse]
    feedback_summaries: list[FeedbackScoreSummaryResponse]
    feedback_trend: list[FeedbackTrendPointResponse]
    top_rated_events: list[TopRatedEventResponse]
    volunteer_performance: list[VolunteerPerformanceResponse]
    organizer_output: list[OrganizerOutputResponse]
    session_status_distribution: list[SessionStatusDistributionResponse]
    repeat_attendee_rate_pct: float | None = None
    average_registration_to_checkin_lead_time_hours: float | None = None


class EventPerformanceResponse(BaseModel):
    success: bool = True
    message: str = "Event performance data retrieved successfully"
    data: EventPerformanceData


class LiveAttendanceResponse(BaseModel):
    session_id: uuid.UUID
    session_title: str
    event_id: uuid.UUID
    event_title: str
    checked_in_count: int
    max_slots: int | None = None
    remaining_slots: int | None = None


class OngoingPerformanceData(BaseModel):
    live_attendance: list[LiveAttendanceResponse]
    real_time_slot_availability: list[LiveAttendanceResponse]


class OngoingPerformanceResponse(BaseModel):
    success: bool = True
    message: str = "Ongoing performance data retrieved successfully"
    data: OngoingPerformanceData


class YearOverYearAttendanceResponse(BaseModel):
    year: int
    attended_count: int
    growth_pct: float | None = None


class EventStatusTransitionResponse(BaseModel):
    period: str
    status: str
    count: int


class HistoricalPerformanceData(BaseModel):
    year_over_year_attendance: list[YearOverYearAttendanceResponse]
    events_by_status_over_time: list[EventStatusTransitionResponse]


class HistoricalPerformanceResponse(BaseModel):
    success: bool = True
    message: str = "Historical performance data retrieved successfully"
    data: HistoricalPerformanceData


# ── Demographic Response Models ─────────────────────────────────────────


class DeviceBreakdownResponse(BaseModel):
    device_type: str
    count: int
    percentage: float | None = None


class OsBreakdownResponse(BaseModel):
    os: str
    count: int
    percentage: float | None = None


class BrowserBreakdownResponse(BaseModel):
    browser: str
    count: int
    percentage: float | None = None


class CityParticipationResponse(BaseModel):
    city: str
    country: str | None = None
    participant_count: int


class AccountAgeDistributionResponse(BaseModel):
    bucket: str
    count: int
    percentage: float | None = None


class VolunteerRoleBreakdownResponse(BaseModel):
    role_name: str
    count: int


class EventInterestCategoryResponse(BaseModel):
    category: str | None = None
    event_count: int
    registration_count: int


class FirstTimeVsReturningResponse(BaseModel):
    event_id: uuid.UUID
    event_title: str
    first_time_count: int
    returning_count: int


class GenderDistributionResponse(BaseModel):
    gender: str
    count: int
    percentage: float | None = None


class GeographicSpreadResponse(BaseModel):
    city: str
    latitude: float | None = None
    longitude: float | None = None
    participant_count: int


class DemographicAnalyticsData(BaseModel):
    device_breakdown: list[DeviceBreakdownResponse]
    os_breakdown: list[OsBreakdownResponse]
    browser_breakdown: list[BrowserBreakdownResponse]
    top_cities: list[CityParticipationResponse]
    account_age_distribution: list[AccountAgeDistributionResponse]
    volunteer_role_breakdown: list[VolunteerRoleBreakdownResponse]
    event_interest_categories: list[EventInterestCategoryResponse]
    first_time_vs_returning: list[FirstTimeVsReturningResponse]
    gender_distribution: list[GenderDistributionResponse]
    geographic_spread: list[GeographicSpreadResponse]


class DemographicAnalyticsResponse(BaseModel):
    success: bool = True
    message: str = "Demographic analytics retrieved successfully"
    data: DemographicAnalyticsData


# ── On-going Response Models ────────────────────────────────────────────


class StartedEventSummaryResponse(BaseModel):
    event_id: uuid.UUID
    event_title: str
    session_count: int
    checked_in_count: int
    remaining_slots: int | None = None


class LiveCheckinEntryResponse(BaseModel):
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
    checkin_method: str


class VolunteerOnDutyResponse(BaseModel):
    volunteer_id: uuid.UUID
    user_id: uuid.UUID
    first_name: str | None = None
    last_name: str | None = None
    alias: str | None = None
    contact_phone: str
    role_name: str | None = None
    event_id: uuid.UUID
    event_title: str


class SessionProgressResponse(BaseModel):
    session_id: uuid.UUID
    session_title: str
    event_id: uuid.UUID
    event_title: str
    start_datetime: datetime
    end_datetime: datetime
    elapsed_pct: float


class PendingWithdrawalAlertResponse(BaseModel):
    session_id: uuid.UUID
    session_title: str
    event_id: uuid.UUID
    withdrawal_count: int


class LateRegistrationResponse(BaseModel):
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


class OngoingEventDataData(BaseModel):
    started_events: list[StartedEventSummaryResponse]
    live_checkin_feed: list[LiveCheckinEntryResponse]
    volunteer_on_duty: list[VolunteerOnDutyResponse]
    session_progress: list[SessionProgressResponse]
    pending_withdrawals: list[PendingWithdrawalAlertResponse]
    late_registrations: list[LateRegistrationResponse]


class OngoingEventDataResponse(BaseModel):
    success: bool = True
    message: str = "Ongoing event data retrieved successfully"
    data: OngoingEventDataData


# ── Historical Response Models ──────────────────────────────────────────


class EndedEventSummaryResponse(BaseModel):
    event_id: uuid.UUID
    event_title: str
    start_date: datetime
    end_date: datetime
    total_registered: int
    total_attended: int
    total_no_show: int
    total_cancelled: int
    average_feedback: float | None = None


class CancelledEventReportResponse(BaseModel):
    event_id: uuid.UUID
    event_title: str
    cancelled_at: datetime | None = None
    created_by: uuid.UUID
    creator_first_name: str | None = None
    creator_last_name: str | None = None
    creator_alias: str | None = None
    session_count: int


class FeedbackCompletenessResponse(BaseModel):
    event_id: uuid.UUID
    event_title: str
    attended_count: int
    feedback_count: int
    completeness_rate_pct: float | None = None


class PeriodComparisonResponse(BaseModel):
    period_label: str
    from_date: datetime
    to_date: datetime
    total_events: int
    total_registered: int
    total_attended: int
    average_attendance_rate_pct: float | None = None
    average_feedback: float | None = None


class HistoricalEventDataData(BaseModel):
    ended_events: list[EndedEventSummaryResponse]
    cancelled_events: list[CancelledEventReportResponse]
    feedback_completeness: list[FeedbackCompletenessResponse]
    period_comparisons: list[PeriodComparisonResponse] | None = None
    total_count: int


class HistoricalEventDataResponse(BaseModel):
    success: bool = True
    message: str = "Historical event data retrieved successfully"
    data: HistoricalEventDataData
