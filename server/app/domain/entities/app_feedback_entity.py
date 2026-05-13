import uuid
from datetime import datetime

from pydantic import BaseModel


class AppFeedback(BaseModel):
    id: uuid.UUID
    rating: int
    comment: str | None = None
    ip_address: str | None = None
    created_at: datetime
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}
