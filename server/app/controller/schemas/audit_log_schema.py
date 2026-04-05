import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.domain.entities.audit_log import ActionType, AuditLogStatus


class AuditLogResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID | None
    ip_address: str | None
    user_agent: str | None
    timestamp: datetime
    action_type: ActionType
    resource_type: str
    resource_id: str | None
    status: AuditLogStatus
    old_values: dict | None
    new_values: dict | None
    additional_context: dict | None


class GetAuditLogsRequest(BaseModel):
    limit: int | None = Field(default=100, ge=1, le=1000)
    cursor: uuid.UUID | None = None
    user_id: uuid.UUID | None = None
    action_type: ActionType | None = None
    resource_type: str | None = None
    start_date: datetime | None = None
    end_date: datetime | None = None


class GetAuditLogsResponse(BaseModel):
    success: bool = True
    data: list[AuditLogResponse]
    next_cursor: uuid.UUID | None
    has_more: bool
