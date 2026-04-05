import uuid
from datetime import datetime
from typing import Protocol

from app.domain.entities.audit_log import ActionType, AuditLog


class IAuditLogRepository(Protocol):
    """Contract for audit log persistence operations.
    
    Enforces append-only semantics - only creation and retrieval methods are exposed.
    No update or delete operations are permitted to maintain audit trail integrity.
    """

    async def create(self, audit_log: AuditLog) -> AuditLog: ...

    async def get_paginated(
        self,
        limit: int,
        cursor: str | None,
        user_id: uuid.UUID | None,
        action_type: ActionType | None,
        resource_type: str | None,
        start_date: datetime | None,
        end_date: datetime | None,
    ) -> tuple[list[AuditLog], int, str | None, str | None]: ...

    async def count_total(
        self,
        user_id: uuid.UUID | None,
        action_type: ActionType | None,
        resource_type: str | None,
        start_date: datetime | None,
        end_date: datetime | None,
    ) -> int: ...
