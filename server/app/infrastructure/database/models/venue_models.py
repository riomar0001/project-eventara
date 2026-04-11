from datetime import datetime
from sqlalchemy import DateTime, Enum, ForeignKey, Index, String, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column
from uuid import UUID

from app.domain.entities.venue_entities import VenueType
from app.infrastructure.database.base import Base


class Venue(Base):
    __tablename__ = "venues"

    creator_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Address fields
    address_line: Mapped[str] = mapped_column(String(255), nullable=False)
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    province: Mapped[str] = mapped_column(String(100), nullable=False)
    postal_code: Mapped[str] = mapped_column(String(20), nullable=False)
    country: Mapped[str] = mapped_column(String(100), nullable=False)

    # Venue details
    capacity: Mapped[int] = mapped_column(Integer, nullable=False)
    venue_type: Mapped[VenueType] = mapped_column(
        Enum(VenueType, native_enum=False),
        nullable=False,
    )

    # Contact information
    contact_name: Mapped[str] = mapped_column(String(255), nullable=False)
    contact_phone: Mapped[str] = mapped_column(String(20), nullable=False)
    contact_email: Mapped[str] = mapped_column(String(255), nullable=False)

    # name, city, venue_type
    __table_args__ = (
        Index("idx_venues_name", "name"),
        Index("idx_venues_city", "city"),
        Index("idx_venues_venue_type", "venue_type"),
        Index("idx_venues_name_city", "name", "city"),
    )
