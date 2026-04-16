import uuid
from dataclasses import dataclass

from pydantic import AwareDatetime

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
    cursor: str | None
    user_id: uuid.UUID | None
    action_type: ActionType | None
    resource_type: str | None
    start_date: AwareDatetime | None
    end_date: AwareDatetime | None


@dataclass
class GetAuditLogsOutput:
    logs: list[AuditLog]
    total_count: int
    next_cursor: str | None
    prev_cursor: str | None
    has_next: bool
