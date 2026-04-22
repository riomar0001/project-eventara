"""Use cases for audit log creation and retrieval."""

from arq.connections import ArqRedis

from app.application.dto.audit_log_dto import (
    CreateAuditLogInput,
    GetAuditLogsInput,
    GetAuditLogsOutput,
)
from app.application.interfaces.audit_log_interface import IAuditLogRepository
from app.domain.entities.audit_log import AuditLog
from app.domain.exceptions.audit_exceptions import AuditLogWriteError


class AuditLogUseCase:
    """Application service for creating and retrieving audit log entries.

    Performance strategy: ``create`` enqueues writes through ARQ (Redis-backed
    task queue) so audit persistence never blocks the business transaction.
    If queue submission fails the log is written synchronously as a fallback.

    Fail-safe strategy: audit log failures do **not** roll back successful
    business operations.  Errors are surfaced to the caller so they can be
    logged to stderr or monitoring; the core request still succeeds.

    Args:
        repository: Repository for synchronous / fallback audit log writes.
        redis:      Optional ARQ pool.  When ``None``, every write falls back
                    to the synchronous path immediately.
    """

    MAX_LIMIT = 1000
    DEFAULT_LIMIT = 100

    def __init__(self, repository: IAuditLogRepository, redis: ArqRedis | None = None) -> None:
        self.repository = repository
        self.redis = redis

    async def create(self, input_dto: CreateAuditLogInput) -> None:
        """Persist an audit log entry, preferring the async queue path.

        Enqueues a ``persist_audit_log`` job when a Redis pool is available.
        Falls back to a direct synchronous write if the enqueue raises.

        Raises:
            AuditLogWriteError: Both the queue path and the synchronous
                fallback failed.
        """
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
                await self.redis.enqueue_job("persist_audit_log", audit_log.model_dump(mode="json"))
            except Exception:
                await self._fallback_sync_write(audit_log)
        else:
            await self._fallback_sync_write(audit_log)

    async def get_logs(self, input_dto: GetAuditLogsInput) -> GetAuditLogsOutput:
        """Retrieve paginated audit logs with optional filtering.

        Enforces ``MAX_LIMIT`` to prevent resource exhaustion on large datasets.
        Uses cursor-based pagination for stable results under concurrent writes.

        Args:
            input_dto: Pagination and filter parameters.

        Returns:
            ``GetAuditLogsOutput`` with the log page, totals, and cursors.
        """
        limit = min(input_dto.limit or self.DEFAULT_LIMIT, self.MAX_LIMIT)

        logs, total_count, next_cursor, prev_cursor = await self.repository.get_paginated(
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
            total_count=total_count,
            next_cursor=next_cursor,
            prev_cursor=prev_cursor,
            has_next=next_cursor is not None,
        )

    async def _fallback_sync_write(self, audit_log: AuditLog) -> None:
        try:
            await self.repository.create(audit_log)
        except Exception as e:
            from app.core.config import settings

            msg = "Failed to persist audit log"
            if settings.DEBUG:
                msg = f"Failed to persist audit log: {e}"
            raise AuditLogWriteError(msg) from e
