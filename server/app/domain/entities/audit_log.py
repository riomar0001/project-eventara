import uuid
from datetime import UTC, datetime
from enum import StrEnum

from pydantic import BaseModel, Field


class ActionType(StrEnum):
    CREATE = "create"
    READ = "read"
    UPDATE = "update"
    DELETE = "delete"
    LOGIN = "login"
    LOGOUT = "logout"
    VERIFY = "verify"
    EXPORT = "export"
    IMPORT = "import"


class AuditLogStatus(StrEnum):
    SUCCESS = "success"
    FAILURE = "failure"


class AuditLog(BaseModel):
    """Domain entity representing an immutable audit trail record.

    Designed to meet ISO 27001 compliance requirements for security event logging.
    Each record captures complete context of an action including actor, event details,
    and state changes. Records are strictly append-only and never modified after creation.
    """

    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    user_id: uuid.UUID | None = None
    ip_address: str | None = None
    user_agent: str | None = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(UTC))
    action_type: ActionType
    resource_type: str
    resource_id: str | None = None
    status: AuditLogStatus
    old_values: dict | None = None
    new_values: dict | None = None
    additional_context: dict | None = None

    model_config = {"from_attributes": True}
