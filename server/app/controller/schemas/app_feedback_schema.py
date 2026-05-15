import uuid
from datetime import datetime
from math import ceil

from pydantic import BaseModel, Field, field_validator


class SubmitAppFeedbackRequest(BaseModel):
    rating: int = Field(..., ge=1, le=5, description="Rating from 1 (worst) to 5 (best)")
    comment: str | None = Field(None, max_length=2000, description="Optional feedback text")

    @field_validator("comment", mode="before")
    @classmethod
    def strip_comment(cls, v):
        if isinstance(v, str):
            stripped = v.strip()
            return stripped or None
        return v


class AppFeedbackRecordResponse(BaseModel):
    id: uuid.UUID
    rating: int
    comment: str | None
    created_at: datetime


class AppFeedbackListData(BaseModel):
    feedback: list[AppFeedbackRecordResponse]
    total: int
    page: int
    page_size: int
    total_pages: int

    @classmethod
    def build(
        cls,
        feedback: list[AppFeedbackRecordResponse],
        total: int,
        page: int,
        page_size: int,
    ) -> AppFeedbackListData:
        return cls(
            feedback=feedback,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=ceil(total / page_size) if page_size else 0,
        )


class SubmitAppFeedbackResponse(BaseModel):
    success: bool = True
    message: str = "Feedback submitted successfully"
    data: AppFeedbackRecordResponse


class AppFeedbackListResponse(BaseModel):
    success: bool = True
    message: str = "Feedback retrieved successfully"
    data: AppFeedbackListData


class WeeklyRegistrationEntry(BaseModel):
    week_start: datetime
    week_end: datetime
    count: int


class UsersPerWeekData(BaseModel):
    entries: list[WeeklyRegistrationEntry]
    weeks: int


class UsersPerWeekResponse(BaseModel):
    success: bool = True
    message: str = "Weekly user registrations retrieved successfully"
    data: UsersPerWeekData
