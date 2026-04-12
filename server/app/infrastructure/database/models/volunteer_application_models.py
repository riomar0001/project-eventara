from uuid import UUID

from sqlalchemy import JSON, Enum, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.domain.entities.volunteer_application_entity import ApplicationStatus
from app.infrastructure.database.base import Base


class VolunteerApplication(Base):
    __tablename__ = "volunteer_applications"

    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    status: Mapped[str] = mapped_column(
        Enum(ApplicationStatus, native_enum=False),
        nullable=False,
        default="pending",
    )
    application_data: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # Relationships
    user: Mapped["User"] = relationship(back_populates="volunteer_applications")

    __table_args__ = (
        Index("idx_volunteer_applications_user_id", "user_id"),
        Index("idx_volunteer_applications_status", "status"),
    )
