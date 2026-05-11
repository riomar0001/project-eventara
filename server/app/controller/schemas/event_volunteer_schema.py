import uuid
from datetime import datetime

from pydantic import BaseModel

from app.domain.entities.event_entity import EventVolunteerStatus


class AssignVolunteerRequest(BaseModel):
    alias: str


class UpdateEventVolunteerStatusRequest(BaseModel):
    status: EventVolunteerStatus


class EventVolunteerRecordResponse(BaseModel):
    id: uuid.UUID
    volunteer_id: uuid.UUID
    event_id: uuid.UUID
    status: str
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


class EventParticipantRecord(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    event_session_id: uuid.UUID
    status: str
    created_at: datetime | None
    updated_at: datetime | None


class PaginationMeta(BaseModel):
    total: int
    limit: int
    offset: int


class EventParticipantsResponse(BaseModel):
    success: bool
    message: str
    data: list[EventParticipantRecord]
    meta: PaginationMeta
