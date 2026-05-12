import uuid
from datetime import datetime

from pydantic import BaseModel

from app.domain.entities.event_entity import EventParticipantStatus


class EventParticipantRecordResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    event_session_id: uuid.UUID
    status: str
    is_checked_in: bool
    checked_in_time: datetime | None
    checked_in_by: uuid.UUID | None
    created_at: datetime | None
    updated_at: datetime | None

    model_config = {"from_attributes": True}


class EventParticipantRecord(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    event_session_id: uuid.UUID
    status: str
    is_checked_in: bool
    checked_in_time: datetime | None
    checked_in_by: uuid.UUID | None
    user_first_name: str | None = None
    user_last_name: str | None = None
    user_alias: str | None = None
    user_profile_picture_url: str | None = None
    event_session_title: str | None = None
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


class RegisterForSessionResponse(BaseModel):
    success: bool = True
    message: str = "Successfully registered for event session."
    data: EventParticipantRecordResponse


class UpdateParticipantStatusRequest(BaseModel):
    new_status: EventParticipantStatus


class UpdateParticipantStatusResponse(BaseModel):
    success: bool = True
    message: str = "Participant status updated successfully."
    data: EventParticipantRecordResponse


class WithdrawRegistrationResponse(BaseModel):
    success: bool = True
    message: str = "Registration withdrawn successfully."
    data: EventParticipantRecordResponse


class CheckInParticipantResponse(BaseModel):
    success: bool = True
    message: str = "Participant checked in successfully."
    data: EventParticipantRecordResponse


class CheckInParticipantQrCodeRequest(BaseModel):
    token: str
