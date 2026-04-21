import uuid
from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, Field


class EventParticipantStatus(StrEnum):
    REGISTERED = "registered"
    ATTENDED = "attended"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"


class EventParticipant(BaseModel):
    """Event Participant entity definition - User participation in an event session"""

    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    user_id: uuid.UUID
    event_session_id: uuid.UUID
    status: EventParticipantStatus = EventParticipantStatus.REGISTERED

    # Timestamps
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}
