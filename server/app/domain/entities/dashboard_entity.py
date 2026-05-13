import uuid
from datetime import datetime

from pydantic import BaseModel


class EventSummary(BaseModel):
    id: uuid.UUID
    title: str
    status: str
    start_date: datetime
    end_date: datetime
    created_at: datetime | None = None

    model_config = {"from_attributes": True}


class ParticipantLeaderboardEntry(BaseModel):
    user_id: uuid.UUID
    full_name: str | None = None
    alias: str | None = None
    profile_picture_url: str | None = None
    count: int

    model_config = {"from_attributes": True}


class VolunteerLeaderboardEntry(BaseModel):
    volunteer_id: uuid.UUID | None = None
    user_id: uuid.UUID | None = None
    full_name: str | None = None
    alias: str | None = None
    profile_picture_url: str | None = None
    role_name: str | None = None
    count: int

    model_config = {"from_attributes": True}


class VenueUsageSummary(BaseModel):
    venue_id: uuid.UUID
    name: str
    city: str | None = None
    province: str | None = None
    event_session_count: int

    model_config = {"from_attributes": True}


class UserRegistrationWeek(BaseModel):
    week_start: datetime
    week_end: datetime
    count: int


class DashboardMetrics(BaseModel):
    recent_events: list[EventSummary]
    ongoing_events: list[EventSummary]
    upcoming_events: list[EventSummary]
    top_weekly_participants: list[ParticipantLeaderboardEntry]
    top_weekly_volunteer_applications: list[VolunteerLeaderboardEntry]
    top_active_volunteers: list[VolunteerLeaderboardEntry]
    top_active_participants: list[ParticipantLeaderboardEntry]
    top_venues: list[VenueUsageSummary]
    users_per_week: list[UserRegistrationWeek]
