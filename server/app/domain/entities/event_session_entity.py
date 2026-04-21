import uuid
from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, Field


class EventSessionStatus(StrEnum):
    SCHEDULED = "scheduled"
    CANCELLED = "cancelled"
    COMPLETED = "completed"


class EventSession(BaseModel):
    """Event Session entity definition - A specific session/instance of an event at a venue"""

    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    event_id: uuid.UUID
    venue_id: uuid.UUID

    # Session details
    title: str = Field(min_length=5, max_length=255)
    description: str | None = Field(default=None, max_length=2000)

    # Timing
    start_datetime: datetime
    end_datetime: datetime

    # Status
    status: EventSessionStatus = EventSessionStatus.SCHEDULED

    # Metadata for flexible data storage
    session_metadata: dict | None = None

    # Timestamps
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}
