import uuid
from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, Field


class FeedbackType(StrEnum):
    BUG_REPORT = "bug_report"
    FEATURE_REQUEST = "feature_request"
    COMPLAINT = "complaint"
    SUGGESTION = "suggestion"
    OTHER = "other"


class EntityType(StrEnum):
    EVENT = "event"
    VENUE = "venue"
    USER = "user"
    VOLUNTEER = "volunteer"
    OTHER = "other"


class FeedbackStatus(StrEnum):
    OPEN = "open"
    IN_REVIEW = "in_review"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"
    REJECTED = "rejected"


class SeverityLevel(StrEnum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class FeedbackReport(BaseModel):
    """Feedback Report entity definition"""

    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    feedback_type: FeedbackType
    title: str = Field(min_length=5, max_length=255)
    description: str = Field(min_length=10, max_length=5000)
    entity_type: EntityType
    entity_id: uuid.UUID | None = None
    status: FeedbackStatus = FeedbackStatus.OPEN
    severity: SeverityLevel = SeverityLevel.MEDIUM
    metadata: dict | None = None

    # Timestamps
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}
