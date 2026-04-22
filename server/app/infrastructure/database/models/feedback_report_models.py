from __future__ import annotations

from uuid import UUID

from sqlalchemy import JSON, Enum, ForeignKey, Index, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.domain.entities.feedback_report_entity import (
    EntityType,
    FeedbackStatus,
    FeedbackType,
    SeverityLevel,
)
from app.infrastructure.database.base import Base


class FeedbackReport(Base):
    __tablename__ = "feedback_reports"

    created_by: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    feedback_type: Mapped[str] = mapped_column(
        Enum(FeedbackType, native_enum=False),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    entity_type: Mapped[str] = mapped_column(
        Enum(EntityType, native_enum=False),
        nullable=False,
    )
    entity_id: Mapped[UUID | None] = mapped_column(nullable=True)
    status: Mapped[str] = mapped_column(
        Enum(FeedbackStatus, native_enum=False),
        nullable=False,
        default="open",
    )
    severity: Mapped[str] = mapped_column(
        Enum(SeverityLevel, native_enum=False),
        nullable=False,
        default="medium",
    )

    __table_args__ = (
        Index("idx_feedback_reports_created_by", "created_by"),
        Index("idx_feedback_reports_status", "status"),
        Index("idx_feedback_reports_severity", "severity"),
        Index("idx_feedback_reports_feedback_type", "feedback_type"),
        Index("idx_feedback_reports_entity", "entity_type", "entity_id"),
    )
