from __future__ import annotations

from datetime import datetime
from uuid import UUID

from sqlalchemy import DateTime, Enum, ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.domain.entities.event_entity import EventStatus
from app.infrastructure.database.base import Base


class Event(Base):
    __tablename__ = "events"

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    start_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    status: Mapped[str] = mapped_column(
        Enum(EventStatus, native_enum=False),
        nullable=False,
        default="draft",
    )
    created_by: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # Relationships
    creator = relationship("User", back_populates="events")
    volunteers = relationship("EventVolunteer", back_populates="event")
    ratings = relationship("EventRating", back_populates="event")
    sessions = relationship("EventSession", back_populates="event")

    __table_args__ = (
        Index("idx_events_status", "status"),
        Index("idx_events_created_by", "created_by"),
        Index("idx_events_start_date", "start_date"),
        Index("idx_events_end_date", "end_date"),
    )
