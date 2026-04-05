import uuid
from datetime import datetime

from pydantic import BaseModel

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


class PaginationMeta(BaseModel):
    limit: int
    total_pages: int
    next_cursor: str | None
    prev_cursor: str | None
    has_next: bool


class GetAuditLogsResponse(BaseModel):
    success: bool = True
    data: list[AuditLogResponse]
    pagination: PaginationMeta
