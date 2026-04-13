import uuid
from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, Field


class EventStatus(StrEnum):
    DRAFT = "draft"
    PUBLISHED = "published"
    CANCELLED = "cancelled"
    COMPLETED = "completed"
    POSTPONED = "postponed"


class Event(BaseModel):
    """Event entity definition"""

    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    title: str = Field(min_length=1, max_length=255)
    description: str = Field(min_length=1, max_length=2000)
    start_date: datetime
    end_date: datetime
    status: EventStatus = EventStatus.DRAFT
    created_by: uuid.UUID

    # Timestamps
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}
