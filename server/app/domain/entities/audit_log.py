import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.domain.entities.authorization import RoleAction


class AuditLog(BaseModel):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    user_id: uuid.UUID
    feature_slug: str
    action: RoleAction
    granted: bool
    reason: str | None = None
    ip_address: str | None = None
    user_agent: str | None = None
    request_id: str | None = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
