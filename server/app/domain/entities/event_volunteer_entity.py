import uuid
from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, Field


class EventVolunteerStatus(StrEnum):
    PENDING = "pending"
    JOINED = "joined"
    LEFT = "left"
    REJECTED = "rejected"


class EventVolunteer(BaseModel):
    """Event Volunteer entity definition"""

    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    volunteer_id: uuid.UUID
    event_id: uuid.UUID
    status: EventVolunteerStatus = EventVolunteerStatus.PENDING

    # Timestamps
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}
