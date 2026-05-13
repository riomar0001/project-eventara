import uuid
from datetime import datetime

from pydantic import BaseModel


class EventSummaryResponse(BaseModel):
    id: uuid.UUID
    title: str
    status: str
    start_date: datetime
    end_date: datetime
    created_at: datetime | None = None


class ParticipantLeaderboardResponse(BaseModel):
    user_id: uuid.UUID
    full_name: str | None = None
    alias: str | None = None
    profile_picture_url: str | None = None
    count: int


class VolunteerLeaderboardResponse(BaseModel):
    volunteer_id: uuid.UUID | None = None
    user_id: uuid.UUID | None = None
    full_name: str | None = None
    alias: str | None = None
    profile_picture_url: str | None = None
    role_name: str | None = None
    count: int


class VenueUsageResponse(BaseModel):
    venue_id: uuid.UUID
    name: str
    city: str | None = None
    province: str | None = None
    event_session_count: int


class UserRegistrationWeekResponse(BaseModel):
    week_start: datetime
    week_end: datetime
    count: int


class DashboardMetricsResponse(BaseModel):
    recent_events: list[EventSummaryResponse]
    ongoing_events: list[EventSummaryResponse]
    upcoming_events: list[EventSummaryResponse]
    top_weekly_participants: list[ParticipantLeaderboardResponse]
    top_weekly_volunteer_applications: list[VolunteerLeaderboardResponse]
    top_active_volunteers: list[VolunteerLeaderboardResponse]
    top_active_participants: list[ParticipantLeaderboardResponse]
    top_venues: list[VenueUsageResponse]
    users_per_week: list[UserRegistrationWeekResponse]


class DashboardDataResponse(BaseModel):
    success: bool = True
    message: str = "Dashboard data retrieved successfully"
    data: DashboardMetricsResponse
