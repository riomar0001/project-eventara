import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class EventSessionCreateRequest(BaseModel):
    venue_id: uuid.UUID
    title: str = Field(min_length=5, max_length=255)
    description: str | None = Field(default=None, max_length=5000)
    start_datetime: datetime
    end_datetime: datetime


class EventCreateRequest(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str = Field(min_length=1)
    start_date: datetime
    end_date: datetime
    sessions: list[EventSessionCreateRequest] = Field(min_length=1)


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
