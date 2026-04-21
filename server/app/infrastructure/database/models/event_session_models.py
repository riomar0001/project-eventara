from __future__ import annotations

from datetime import datetime
from uuid import UUID

from sqlalchemy import JSON, DateTime, Enum, ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.domain.entities.event_session_entity import EventSessionStatus
from app.infrastructure.database.base import Base


class EventSession(Base):
    __tablename__ = "event_sessions"

    event_id: Mapped[UUID] = mapped_column(ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    venue_id: Mapped[UUID] = mapped_column(ForeignKey("venues.id", ondelete="CASCADE"), nullable=False)

    # Session details
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Timing
    start_datetime: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_datetime: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    # Status
    status: Mapped[str] = mapped_column(
        Enum(EventSessionStatus, native_enum=False),
        nullable=False,
        default="scheduled",
    )

    # Metadata for flexible data storage
    session_metadata: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # Relationships
    event = relationship("Event", back_populates="sessions")
    venue = relationship("Venue", back_populates="event_sessions")

    __table_args__ = (
        Index("idx_event_sessions_event_id", "event_id"),
        Index("idx_event_sessions_venue_id", "venue_id"),
        Index("idx_event_sessions_start_datetime", "start_datetime"),
        Index("idx_event_sessions_end_datetime", "end_datetime"),
        Index("idx_event_sessions_status", "status"),
    )
