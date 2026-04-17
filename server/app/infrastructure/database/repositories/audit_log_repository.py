import base64
import json
import uuid
from datetime import datetime
from typing import Literal

from pydantic import AwareDatetime
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.audit_log import ActionType, AuditLogStatus
from app.domain.entities.audit_log import AuditLog as DomainAuditLog
from app.infrastructure.database.models.audit_log_models import AuditLog


class AuditLogRepository:
    """Concrete implementation of audit log persistence using PostgreSQL.

    Strictly append-only - no update or delete methods are provided. Uses cursor-based
    pagination with base64-encoded cursors containing (id, timestamp) for stable result
    sets under concurrent inserts. Supports bidirectional pagination and total count.
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

    async def count_total(
        self,
        user_id: uuid.UUID | None,
        action_type: ActionType | None,
        resource_type: str | None,
        start_date: AwareDatetime | None,
        end_date: AwareDatetime | None,
    ) -> int:
        query = select(func.count(AuditLog.id))
        filters = self._build_filters(user_id, action_type, resource_type, start_date, end_date)

        if filters:
            query = query.where(and_(*filters))

        result = await self.db.execute(query)
        return result.scalar_one()

    async def get_paginated(
        self,
        limit: int,
        cursor: str | None,
        user_id: uuid.UUID | None,
        action_type: ActionType | None,
        resource_type: str | None,
        start_date: AwareDatetime | None,
        end_date: AwareDatetime | None,
    ) -> tuple[list[DomainAuditLog], int, str | None, str | None]:
        filters = self._build_filters(user_id, action_type, resource_type, start_date, end_date)
        direction: Literal["next", "prev"] = "next"

        if cursor:
            cursor_data = self._decode_cursor(cursor)
            cursor_id = uuid.UUID(cursor_data["id"])
            cursor_timestamp = datetime.fromisoformat(cursor_data["timestamp"])
            direction = cursor_data.get("direction", "next")

            if direction == "prev":
                filters.append(
                    (AuditLog.timestamp > cursor_timestamp)
                    | (
                        and_(
                            AuditLog.timestamp == cursor_timestamp,
                            AuditLog.id > cursor_id,
                        )
                    )
                )
            else:
                filters.append(
                    (AuditLog.timestamp < cursor_timestamp)
                    | (
                        and_(
                            AuditLog.timestamp == cursor_timestamp,
                            AuditLog.id < cursor_id,
                        )
                    )
                )

        if direction == "prev":
            query = select(AuditLog).order_by(AuditLog.timestamp.asc(), AuditLog.id.asc())
        else:
            query = select(AuditLog).order_by(AuditLog.timestamp.desc(), AuditLog.id.desc())

        if filters:
            query = query.where(and_(*filters))

        query = query.limit(limit + 1)

        result = await self.db.execute(query)
        logs = result.scalars().all()

        has_next = len(logs) > limit
        if has_next:
            logs = logs[:limit]

        if direction == "prev":
            logs.reverse()

        next_cursor = None
        prev_cursor = None

        if logs:
            if direction == "prev":
                next_cursor = self._encode_cursor(logs[-1].id, logs[-1].timestamp, "next")
                if has_next:
                    prev_cursor = self._encode_cursor(logs[0].id, logs[0].timestamp, "prev")
            else:
                if has_next:
                    next_cursor = self._encode_cursor(logs[-1].id, logs[-1].timestamp, "next")
                if cursor:
                    prev_cursor = self._encode_cursor(logs[0].id, logs[0].timestamp, "prev")

        total_count = await self.count_total(user_id, action_type, resource_type, start_date, end_date)

        return [self._to_domain(log) for log in logs], total_count, next_cursor, prev_cursor

    def _build_filters(
        self,
        user_id: uuid.UUID | None,
        action_type: ActionType | None,
        resource_type: str | None,
        start_date: AwareDatetime | None,
        end_date: AwareDatetime | None,
    ) -> list:
        filters = []

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

        return filters

    def _encode_cursor(self, log_id: uuid.UUID, timestamp: datetime, direction: Literal["next", "prev"] = "next") -> str:
        cursor_data = {"id": str(log_id), "timestamp": timestamp.isoformat(), "direction": direction}
        return base64.b64encode(json.dumps(cursor_data).encode()).decode()

    def _decode_cursor(self, cursor: str) -> dict:
        decoded = json.loads(base64.b64decode(cursor.encode()).decode())
        if decoded.get("direction") not in {"next", "prev", None}:
            decoded["direction"] = "next"
        elif decoded.get("direction") is None:
            decoded["direction"] = "next"
        return decoded

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
