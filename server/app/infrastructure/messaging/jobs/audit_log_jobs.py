"""ARQ background job for persisting audit logs asynchronously.

This job is enqueued by CreateAuditLogUseCase to write audit logs without blocking
the main business transaction. If the job fails, ARQ will automatically retry with
exponential backoff up to max_tries (configured on the worker).
"""

import uuid

from app.domain.entities.audit_log import ActionType, AuditLog, AuditLogStatus
from app.infrastructure.database.repositories.audit_log_repository import (
    AuditLogRepository,
)
from app.infrastructure.database.session import AsyncSessionLocal


async def persist_audit_log(ctx: dict, audit_log_data: dict) -> None:
    """ARQ job that persists an audit log entry to PostgreSQL.
    
    Runs inside the ARQ worker process. Creates a new database session for each
    job execution to ensure transaction isolation from the main API request.
    
    Args:
        ctx: ARQ worker context (injected by framework)
        audit_log_data: Serialized audit log dictionary from domain entity
    """
    async with AsyncSessionLocal() as db:
        audit_log = AuditLog(
            id=uuid.UUID(audit_log_data["id"]),
            user_id=uuid.UUID(audit_log_data["user_id"]) if audit_log_data.get("user_id") else None,
            ip_address=audit_log_data.get("ip_address"),
            user_agent=audit_log_data.get("user_agent"),
            timestamp=audit_log_data["timestamp"],
            action_type=ActionType(audit_log_data["action_type"]),
            resource_type=audit_log_data["resource_type"],
            resource_id=audit_log_data.get("resource_id"),
            status=AuditLogStatus(audit_log_data["status"]),
            old_values=audit_log_data.get("old_values"),
            new_values=audit_log_data.get("new_values"),
            additional_context=audit_log_data.get("additional_context"),
        )

        repository = AuditLogRepository(db)
        await repository.create(audit_log)
        await db.commit()
