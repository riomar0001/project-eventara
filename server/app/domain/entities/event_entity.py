import uuid
from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, Field


class EventStatus(StrEnum):
    DRAFT = "draft"
    POSTED = "posted"
    STARTED = "started"
    CANCELLED = "cancelled"
    ENDED = "ended"
    POSTPONED = "postponed"


class EventSessionStatus(StrEnum):
    DRAFT = "draft"
    POSTED = "posted"
    STARTED = "started"
    CANCELLED = "cancelled"
    ENDED = "ended"
    POSTPONED = "postponed"


class EventParticipantStatus(StrEnum):
    REGISTERED = "registered"
    ATTENDED = "attended"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"


class EventVolunteerStatus(StrEnum):
    PENDING = "pending"
    JOINED = "joined"
    LEFT = "left"
    REJECTED = "rejected"


class Event(BaseModel):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    title: str = Field(min_length=1, max_length=255)
    description: str = Field(min_length=1)
    start_date: datetime
    end_date: datetime
    status: EventStatus = EventStatus.DRAFT
    created_by: uuid.UUID
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}


class EventSession(BaseModel):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    event_id: uuid.UUID
    venue_id: uuid.UUID
    title: str = Field(min_length=5, max_length=255)
    description: str | None = Field(default=None, max_length=2000)
    start_datetime: datetime
    end_datetime: datetime
    status: EventSessionStatus = EventSessionStatus.POSTED
    max_slots: int | None = Field(default=None, gt=0)
    session_metadata: dict | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}


class EventParticipant(BaseModel):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    user_id: uuid.UUID
    event_session_id: uuid.UUID
    status: EventParticipantStatus = EventParticipantStatus.REGISTERED
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}


class EventRating(BaseModel):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    user_id: uuid.UUID
    event_id: uuid.UUID
    overall_rating: int = Field(ge=1, le=5)
    organization_rating: int | None = Field(default=None, ge=1, le=5)
    venue_rating: int | None = Field(default=None, ge=1, le=5)
    activities_rating: int | None = Field(default=None, ge=1, le=5)
    title: str = Field(min_length=5, max_length=100)
    review: str = Field(min_length=10, max_length=2000)
    would_recommend: bool = True
    media_urls: list[str] | None = None
    helpful_count: int = Field(default=0, ge=0)
    creator_response: str | None = Field(default=None, max_length=1000)
    creator_responded_at: datetime | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}


class EventVolunteer(BaseModel):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    volunteer_id: uuid.UUID
    event_id: uuid.UUID
    status: EventVolunteerStatus = EventVolunteerStatus.PENDING
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}
