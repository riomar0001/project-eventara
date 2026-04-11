from datetime import datetime
from sqlalchemy import DateTime, Enum, ForeignKey, String, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from uuid import UUID

from app.domain.entities.venue_entities import VenueType
from app.infrastructure.database.base import Base
from app.infrastructure.database.models.venue_rating_models import VenueRating


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
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    
    # Relationships
    ratings: Mapped[list["VenueRating"]] = relationship(back_populates="venue", foreign_keys="VenueRating.venue_id")
    
    