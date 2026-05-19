import uuid
from datetime import datetime

from pydantic import BaseModel, Field, model_validator


class CreateEventFeedbackRequest(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: str | None = Field(default=None, max_length=2000)
    suggestion: str | None = Field(default=None, max_length=2000)

    @model_validator(mode="after")
    def require_comment_or_suggestion(self):
        if not (self.comment and self.comment.strip()) and not (self.suggestion and self.suggestion.strip()):
            raise ValueError("Either comment or suggestion is required.")
        return self


class EventFeedbackRecordResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    event_id: uuid.UUID
    participant_id: uuid.UUID
    rating: int
    comment: str | None
    suggestion: str | None
    created_at: datetime | None
    updated_at: datetime | None


class EventFeedbackResponse(BaseModel):
    success: bool = True
    message: str = "Event feedback submitted successfully."
    data: EventFeedbackRecordResponse


class MyEventFeedbackStatusData(BaseModel):
    is_checked_in: bool
    has_submitted_feedback: bool


class MyEventFeedbackStatusResponse(BaseModel):
    success: bool = True
    message: str = "Feedback status retrieved successfully."
    data: MyEventFeedbackStatusData


class EventFeedbackPaginationMeta(BaseModel):
    total: int
    limit: int
    offset: int


class EventFeedbackListResponse(BaseModel):
    success: bool = True
    message: str = "Event feedback retrieved successfully."
    data: list[EventFeedbackRecordResponse]
    meta: EventFeedbackPaginationMeta
