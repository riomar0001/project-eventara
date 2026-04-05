import uuid
from datetime import datetime

from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.audit_log import ActionType, AuditLogStatus
from app.domain.entities.audit_log import AuditLog as DomainAuditLog
from app.infrastructure.database.models.audit_log_models import AuditLog


class AuditLogRepository:
    """Concrete implementation of audit log persistence using PostgreSQL.
    
    Strictly append-only - no update or delete methods are provided. Uses cursor-based
    pagination with composite (id, timestamp) ordering for stable result sets under
    concurrent inserts. Filters are applied via indexed columns for query performance.
    """

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create(self, audit_log: DomainAuditLog) -> DomainAuditLog:
        orm_audit_log = AuditLog(
            id=audit_log.id,
            user_id=audit_log.user_id,
            ip_address=audit_log.ip_address,
            user_agent=audit_log.user_agent,
            timestamp=audit_log.timestamp,
            action_type=audit_log.action_type.value,
            resource_type=audit_log.resource_type,
            resource_id=audit_log.resource_id,
            status=audit_log.status.value,
            old_values=audit_log.old_values,
            new_values=audit_log.new_values,
            additional_context=audit_log.additional_context,
        )

        self.db.add(orm_audit_log)
        await self.db.flush()

        return self._to_domain(orm_audit_log)

    async def get_paginated(
        self,
        limit: int,
        cursor: uuid.UUID | None,
        user_id: uuid.UUID | None,
        action_type: ActionType | None,
        resource_type: str | None,
        start_date: datetime | None,
        end_date: datetime | None,
    ) -> tuple[list[DomainAuditLog], uuid.UUID | None]:
        query = select(AuditLog).order_by(AuditLog.timestamp.desc(), AuditLog.id.desc())

        filters = []

        if cursor:
            cursor_result = await self.db.execute(select(AuditLog).where(AuditLog.id == cursor))
            cursor_log = cursor_result.scalar_one_or_none()
            if cursor_log:
                filters.append(
                    (AuditLog.timestamp < cursor_log.timestamp)
                    | (
                        and_(
                            AuditLog.timestamp == cursor_log.timestamp,
                            AuditLog.id < cursor_log.id,
                        )
                    )
                )

        if user_id:
            filters.append(AuditLog.user_id == user_id)

        if action_type:
            filters.append(AuditLog.action_type == action_type.value)

        if resource_type:
            filters.append(AuditLog.resource_type == resource_type)

        if start_date:
            filters.append(AuditLog.timestamp >= start_date)

        if end_date:
            filters.append(AuditLog.timestamp <= end_date)

        if filters:
            query = query.where(and_(*filters))

        query = query.limit(limit + 1)

        result = await self.db.execute(query)
        logs = result.scalars().all()

        has_more = len(logs) > limit
        if has_more:
            logs = logs[:limit]

        next_cursor = logs[-1].id if has_more and logs else None

        return [self._to_domain(log) for log in logs], next_cursor

    def _to_domain(self, orm_log: AuditLog) -> DomainAuditLog:
        return DomainAuditLog(
            id=orm_log.id,
            user_id=orm_log.user_id,
            ip_address=orm_log.ip_address,
            user_agent=orm_log.user_agent,
            timestamp=orm_log.timestamp,
            action_type=ActionType(orm_log.action_type),
            resource_type=orm_log.resource_type,
            resource_id=orm_log.resource_id,
            status=AuditLogStatus(orm_log.status),
            old_values=orm_log.old_values,
            new_values=orm_log.new_values,
            additional_context=orm_log.additional_context,
        )
