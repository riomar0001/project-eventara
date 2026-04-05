from arq.connections import ArqRedis

from app.application.dto.audit_log_dto import (
    CreateAuditLogInput,
    GetAuditLogsInput,
    GetAuditLogsOutput,
)
from app.application.interfaces.audit_log_interface import IAuditLogRepository
from app.domain.entities.audit_log import AuditLog
from app.domain.exceptions.audit_exceptions import AuditLogWriteError


class CreateAuditLogUseCase:
    """Orchestrates the asynchronous creation of audit log entries.
    
    Performance Strategy: Uses ARQ (Redis-backed task queue) to persist audit logs
    asynchronously without blocking business transactions. If the queue submission
    fails, logs are written synchronously as a fallback to ensure compliance.
    
    Fail-Safe Strategy: Audit log failures do NOT rollback successful business
    operations. Instead, errors are logged to stderr and monitoring systems for
    investigation. This prevents audit system issues from disrupting core services
    while maintaining visibility into compliance gaps.
    """

    def __init__(self, repository: IAuditLogRepository, redis: ArqRedis | None = None) -> None:
        self.repository = repository
        self.redis = redis

    async def execute(self, input_dto: CreateAuditLogInput) -> None:
        audit_log = AuditLog(
            user_id=input_dto.user_id,
            ip_address=input_dto.ip_address,
            user_agent=input_dto.user_agent,
            action_type=input_dto.action_type,
            resource_type=input_dto.resource_type,
            resource_id=input_dto.resource_id,
            status=input_dto.status,
            old_values=input_dto.old_values,
            new_values=input_dto.new_values,
            additional_context=input_dto.additional_context,
        )

        if self.redis:
            try:
                await self.redis.enqueue_job("persist_audit_log", audit_log.model_dump())
            except Exception:
                await self._fallback_sync_write(audit_log)
        else:
            await self._fallback_sync_write(audit_log)

    async def _fallback_sync_write(self, audit_log: AuditLog) -> None:
        try:
            await self.repository.create(audit_log)
        except Exception as e:
            raise AuditLogWriteError(f"Failed to persist audit log: {str(e)}") from e


class GetAuditLogsUseCase:
    """Retrieves paginated audit logs with optional filtering.
    
    Validates pagination parameters and enforces reasonable limits to prevent
    resource exhaustion when querying potentially massive audit datasets.
    Uses cursor-based pagination for consistent results under concurrent writes.
    """

    MAX_LIMIT = 1000
    DEFAULT_LIMIT = 100

    def __init__(self, repository: IAuditLogRepository) -> None:
        self.repository = repository

    async def execute(self, input_dto: GetAuditLogsInput) -> GetAuditLogsOutput:
        limit = min(input_dto.limit or self.DEFAULT_LIMIT, self.MAX_LIMIT)

        logs, next_cursor = await self.repository.get_paginated(
            limit=limit,
            cursor=input_dto.cursor,
            user_id=input_dto.user_id,
            action_type=input_dto.action_type,
            resource_type=input_dto.resource_type,
            start_date=input_dto.start_date,
            end_date=input_dto.end_date,
        )

        return GetAuditLogsOutput(
            logs=logs,
            next_cursor=next_cursor,
            has_more=next_cursor is not None,
        )
