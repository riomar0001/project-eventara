from datetime import datetime
from sqlalchemy import ForeignKey, Integer, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from uuid import UUID

from app.infrastructure.database.base import Base
from app.infrastructure.database.models.user_models import User
from app.infrastructure.database.models.venue_models import Venue


class VenueRating(Base):
    __tablename__ = "venue_ratings"

    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    venue_id: Mapped[UUID] = mapped_column(ForeignKey("venues.id", ondelete="CASCADE"), nullable=False)
    rating: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    user: Mapped["User"] = relationship(back_populates="ratings", foreign_keys=[user_id])
    venue: Mapped["Venue"] = relationship(back_populates="ratings", foreign_keys=[venue_id])
    
    