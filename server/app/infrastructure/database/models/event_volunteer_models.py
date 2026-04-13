from __future__ import annotations

from uuid import UUID

from sqlalchemy import Enum, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.domain.entities.event_volunteer_entity import EventVolunteerStatus
from app.infrastructure.database.base import Base


class EventVolunteer(Base):
    __tablename__ = "event_volunteers"

    volunteer_id: Mapped[UUID] = mapped_column(ForeignKey("volunteers.id", ondelete="CASCADE"), nullable=False)
    event_id: Mapped[UUID] = mapped_column(ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    status: Mapped[str] = mapped_column(
        Enum(EventVolunteerStatus, native_enum=False),
        nullable=False,
        default="pending",
    )

    # Relationships
    volunteer = relationship("Volunteer", back_populates="event_volunteers")
    event = relationship("Event", back_populates="volunteers")

    __table_args__ = (
        Index("idx_event_volunteers_volunteer_id", "volunteer_id"),
        Index("idx_event_volunteers_event_id", "event_id"),
        Index("idx_event_volunteers_status", "status"),
        Index("idx_event_volunteers_volunteer_event", "volunteer_id", "event_id", unique=True),
    )
