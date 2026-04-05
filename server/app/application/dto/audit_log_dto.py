import uuid
from dataclasses import dataclass
from datetime import datetime

from app.domain.entities.audit_log import ActionType, AuditLog, AuditLogStatus


@dataclass
class CreateAuditLogInput:
    user_id: uuid.UUID | None
    ip_address: str | None
    user_agent: str | None
    action_type: ActionType
    resource_type: str
    resource_id: str | None
    status: AuditLogStatus
    old_values: dict | None = None
    new_values: dict | None = None
    additional_context: dict | None = None


@dataclass
class GetAuditLogsInput:
    limit: int
    cursor: uuid.UUID | None
    user_id: uuid.UUID | None
    action_type: ActionType | None
    resource_type: str | None
    start_date: datetime | None
    end_date: datetime | None


@dataclass
class GetAuditLogsOutput:
    logs: list[AuditLog]
    next_cursor: uuid.UUID | None
    has_more: bool
