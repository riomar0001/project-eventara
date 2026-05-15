import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.domain.entities.event_entity import EventVolunteerStatus


class AssignVolunteerRequest(BaseModel):
    alias: str


class ApplyEventVolunteerRequest(BaseModel):
    message: str | None = Field(default=None, max_length=500)


class UpdateEventVolunteerStatusRequest(BaseModel):
    status: EventVolunteerStatus


class EventVolunteerRecordResponse(BaseModel):
    id: uuid.UUID
    volunteer_id: uuid.UUID
    event_id: uuid.UUID
    status: str
    volunteer_user_id: uuid.UUID | None = None
    volunteer_first_name: str | None = None
    volunteer_last_name: str | None = None
    volunteer_alias: str | None = None
    volunteer_profile_picture_url: str | None = None
    volunteer_role_name: str | None = None
    created_at: datetime | None
    updated_at: datetime | None


class EventVolunteerResponse(BaseModel):
    success: bool
    message: str
    data: EventVolunteerRecordResponse


class EventVolunteerListResponse(BaseModel):
    success: bool
    message: str
    data: list[EventVolunteerRecordResponse]
