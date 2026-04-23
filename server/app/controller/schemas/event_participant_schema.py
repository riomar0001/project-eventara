import uuid
from datetime import datetime

from pydantic import BaseModel

from app.domain.entities.event_entity import EventParticipantStatus


class EventParticipantRecordResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    event_session_id: uuid.UUID
    status: str
    created_at: datetime | None
    updated_at: datetime | None

    model_config = {"from_attributes": True}


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
