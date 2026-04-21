from __future__ import annotations

from uuid import UUID

from sqlalchemy import Enum, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.domain.entities.event_participant_entity import EventParticipantStatus
from app.infrastructure.database.base import Base


class EventParticipant(Base):
    __tablename__ = "event_participants"

    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    event_session_id: Mapped[UUID] = mapped_column(ForeignKey("event_sessions.id", ondelete="CASCADE"), nullable=False)
    status: Mapped[str] = mapped_column(
        Enum(EventParticipantStatus, native_enum=False),
        nullable=False,
        default="registered",
    )

    # Relationships
    user = relationship("User", back_populates="event_participants")
    event_session = relationship("EventSession", back_populates="participants")

    __table_args__ = (
        Index("idx_event_participants_user_id", "user_id"),
        Index("idx_event_participants_event_session_id", "event_session_id"),
        Index("idx_event_participants_status", "status"),
        Index(
            "idx_event_participants_user_session",
            "user_id",
            "event_session_id",
            unique=True,
        ),
    )
