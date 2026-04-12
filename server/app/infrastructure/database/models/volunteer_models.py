from uuid import UUID

from sqlalchemy import Enum, ForeignKey, Index, String
from sqlalchemy.orm import Mapped, mapped_column

from app.domain.entities.volunteer_entity import VolunteerRole, VolunteerStatus
from app.infrastructure.database.base import Base


class Volunteer(Base):
    __tablename__ = "volunteers"

    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    contact_phone: Mapped[str] = mapped_column(String(20), nullable=False)
    role: Mapped[str] = mapped_column(
        Enum(VolunteerRole, native_enum=False),
        nullable=False,
        default="volunteer",
    )
    status: Mapped[str] = mapped_column(
        Enum(VolunteerStatus, native_enum=False),
        nullable=False,
        default="active",
    )

    __table_args__ = (
        Index("idx_volunteers_user_id", "user_id"),
        Index("idx_volunteers_status", "status"),
        Index("idx_volunteers_role", "role"),
        Index("idx_volunteers_email", "email"),
    )
