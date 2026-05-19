from __future__ import annotations

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
    max_slots: int | None = Field(default=None, gt=0)

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
    banner_url: str | None = Field(default=None, max_length=512)
    sessions: list[EventSessionCreateRequest] = Field(min_length=1)

    @field_validator("description", mode="before")
    @classmethod
    def sanitize_description(cls, v: str) -> str:
        return sanitize_html(v)


class EventSessionRecordResponse(BaseModel):
    id: uuid.UUID
    event_id: uuid.UUID
    venue_id: uuid.UUID
    venue_name: str | None = None
    venue_location: str | None = None
    title: str
    description: str | None
    start_datetime: datetime
    end_datetime: datetime
    status: str
    max_slots: int | None
    registered_count: int = 0
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
    banner_url: str | None = None
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
    banner_url: str | None = Field(default=None, max_length=512)

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
    max_slots: int | None = Field(default=None, gt=0)

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


class EventSessionCreatedResponse(BaseModel):
    success: bool = True
    message: str = "Event session created successfully."
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


class EventDeletedResponse(BaseModel):
    success: bool = True
    message: str = "Event deleted successfully."
    data: EventRecordResponse


class EventSessionDeletedResponse(BaseModel):
    success: bool = True
    message: str = "Event session deleted successfully."
    data: EventSessionRecordResponse


class EventBannerUploadRequest(BaseModel):
    content_type: str = Field(min_length=1, max_length=100)


class EventBannerUploadData(BaseModel):
    upload_url: str
    object_key: str
    public_url: str
    expires_in: int


class EventBannerUploadResponse(BaseModel):
    success: bool = True
    message: str = "Banner upload URL generated. Use upload_url to PUT your image directly to storage."
    data: EventRecordResponse
    upload: EventBannerUploadData


class EventListResponse(BaseModel):
    success: bool = True
    message: str = "Events retrieved successfully."
    data: list[EventRecordResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class EventDetailResponse(BaseModel):
    success: bool = True
    message: str = "Event retrieved successfully."
    data: EventRecordResponse
    sessions: list[EventSessionRecordResponse]


class HomeEventWithSessions(BaseModel):
    id: uuid.UUID
    title: str
    description: str
    start_date: datetime
    end_date: datetime
    status: str
    banner_url: str | None = None
    sessions: list[EventSessionRecordResponse]


class LiveEventData(BaseModel):
    event: EventRecordResponse
    sessions: list[EventSessionRecordResponse]


class HomeEventsData(BaseModel):
    live_event: LiveEventData | None
    events: list[HomeEventWithSessions]
    events_type: str


class HomeEventsResponse(BaseModel):
    success: bool = True
    message: str = "Home events retrieved successfully."
    data: HomeEventsData


class PublicEventsListData(BaseModel):
    events: list[HomeEventWithSessions]
    total: int
    page: int
    page_size: int
    total_pages: int
    events_type: str


class PublicEventsListResponse(BaseModel):
    success: bool = True
    message: str = "Events retrieved successfully."
    data: PublicEventsListData


class PublicEventDetailResponse(BaseModel):
    success: bool = True
    message: str = "Event retrieved successfully."
    data: HomeEventWithSessions
