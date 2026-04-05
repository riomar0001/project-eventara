import uuid
from datetime import datetime

from sqlalchemy import JSON, UUID, DateTime, Enum, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.domain.entities.audit_log import ActionType, AuditLogStatus
from app.infrastructure.database.base import Base


class AuditLog(Base):
    """SQLAlchemy model for immutable audit trail storage.
    
    Table design enforces append-only semantics at the application layer.
    Indexes are optimized for common query patterns (user lookups, time ranges,
    action filtering) while maintaining write performance for high-volume logging.
    """

    __tablename__ = "audit_logs"

    user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(Text, nullable=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    action_type: Mapped[str] = mapped_column(
        Enum(ActionType, name="action_type"), nullable=False
    )
    resource_type: Mapped[str] = mapped_column(String(255), nullable=False)
    resource_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(
        Enum(AuditLogStatus, name="audit_log_status"), nullable=False
    )
    old_values: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    new_values: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    additional_context: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    __table_args__ = (
        Index("idx_audit_logs_user_id", "user_id"),
        Index("idx_audit_logs_timestamp", "timestamp"),
        Index("idx_audit_logs_action_type", "action_type"),
        Index("idx_audit_logs_resource", "resource_type", "resource_id"),
        Index("idx_audit_logs_cursor", "id", "timestamp"),
    )
