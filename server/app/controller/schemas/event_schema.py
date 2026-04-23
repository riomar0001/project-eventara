import uuid
from datetime import datetime

from pydantic import BaseModel, Field, field_validator

from app.core.sanitize import sanitize_html, strip_html
from app.domain.entities.event_entity import EventSessionStatus, EventStatus


class EventSessionCreateRequest(BaseModel):
    venue_id: uuid.UUID
    title: str = Field(min_length=5, max_length=255)
    description: str | None = Field(default=None, max_length=5000)
    start_datetime: datetime
    end_datetime: datetime

    @field_validator("description", mode="before")
    @classmethod
    def sanitize_description(cls, v: str | None) -> str | None:
        if v is None:
            return None
        return strip_html(v) or None


class EventCreateRequest(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str = Field(min_length=1)
    start_date: datetime
    end_date: datetime
    sessions: list[EventSessionCreateRequest] = Field(min_length=1)

    @field_validator("description", mode="before")
    @classmethod
    def sanitize_description(cls, v: str) -> str:
        return sanitize_html(v)


class EventSessionRecordResponse(BaseModel):
    id: uuid.UUID
    event_id: uuid.UUID
    venue_id: uuid.UUID
    title: str
    description: str | None
    start_datetime: datetime
    end_datetime: datetime
    status: str
    created_at: datetime | None
    updated_at: datetime | None

    model_config = {"from_attributes": True}


class EventRecordResponse(BaseModel):
    id: uuid.UUID
    title: str
    description: str
    start_date: datetime
    end_date: datetime
    status: str
    created_by: uuid.UUID
    created_at: datetime | None
    updated_at: datetime | None

    model_config = {"from_attributes": True}


class EventWithSessionsResponse(BaseModel):
    success: bool = True
    message: str = "Event created successfully."
    data: EventRecordResponse
    sessions: list[EventSessionRecordResponse]


class EventUpdateRequest(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str = Field(min_length=1)
    start_date: datetime
    end_date: datetime

    @field_validator("description", mode="before")
    @classmethod
    def sanitize_description(cls, v: str) -> str:
        return sanitize_html(v)


class EventMetadataUpdatedResponse(BaseModel):
    success: bool = True
    message: str = "Event updated successfully."
    data: EventRecordResponse


class EventSessionUpdateRequest(BaseModel):
    venue_id: uuid.UUID
    title: str = Field(min_length=5, max_length=255)
    description: str | None = Field(default=None, max_length=5000)
    start_datetime: datetime
    end_datetime: datetime

    @field_validator("description", mode="before")
    @classmethod
    def sanitize_description(cls, v: str | None) -> str | None:
        if v is None:
            return None
        return strip_html(v) or None


class EventSessionUpdatedResponse(BaseModel):
    success: bool = True
    message: str = "Event session updated successfully."
    data: EventSessionRecordResponse


class EventStatusUpdateRequest(BaseModel):
    new_status: EventStatus


class EventSessionStatusUpdateRequest(BaseModel):
    new_status: EventSessionStatus


class EventStatusUpdatedResponse(BaseModel):
    success: bool = True
    message: str = "Event status updated successfully."
    data: EventRecordResponse


class EventSessionStatusUpdatedResponse(BaseModel):
    success: bool = True
    message: str = "Event session status updated successfully."
    data: EventSessionRecordResponse
