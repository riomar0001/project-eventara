from __future__ import annotations

from uuid import UUID

from sqlalchemy import JSON, Boolean, Enum, ForeignKey, Index, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.domain.entities.volunteer_entity import ApplicationStatus, VolunteerStatus
from app.infrastructure.database.base import Base


class VolunteerRole(Base):
    """Dynamic volunteer role definitions created by community leaders."""

    __tablename__ = "volunteer_custom_roles"

    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by: Mapped[UUID | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    creator = relationship("User", foreign_keys=[created_by])
    volunteers = relationship("Volunteer", back_populates="volunteer_role")

    __table_args__ = (
        Index("idx_volunteer_custom_roles_name", "name"),
        Index("idx_volunteer_custom_roles_created_by", "created_by"),
    )


class Volunteer(Base):
    __tablename__ = "volunteers"

    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    contact_phone: Mapped[str] = mapped_column(String(20), nullable=False)
    volunteer_role_id: Mapped[UUID] = mapped_column(ForeignKey("volunteer_custom_roles.id"), nullable=False)
    status: Mapped[str] = mapped_column(Enum(VolunteerStatus, native_enum=False), nullable=False, default="active")

    user = relationship("User", back_populates="volunteer")
    volunteer_role = relationship("VolunteerRole", back_populates="volunteers")
    event_volunteers = relationship("EventVolunteer", back_populates="volunteer")

    __table_args__ = (
        UniqueConstraint("user_id", name="uq_volunteers_user_id"),
        Index("idx_volunteers_user_id", "user_id"),
        Index("idx_volunteers_status", "status"),
        Index("idx_volunteers_volunteer_role_id", "volunteer_role_id"),
    )


class VolunteerApplication(Base):
    __tablename__ = "volunteer_applications"

    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    status: Mapped[str] = mapped_column(Enum(ApplicationStatus, native_enum=False), nullable=False, default="pending")
    application_data: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    user = relationship("User", back_populates="volunteer_applications")

    __table_args__ = (
        Index("idx_volunteer_applications_user_id", "user_id"),
        Index("idx_volunteer_applications_status", "status"),
    )
