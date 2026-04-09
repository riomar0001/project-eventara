from sqlalchemy import ForeignKey, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column
from uuid import UUID

from app.infrastructure.database.base import Base


class VenueRating(Base):
    __tablename__ = "venue_ratings"

    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    venue_id: Mapped[UUID] = mapped_column(ForeignKey("venues.id", ondelete="CASCADE"), nullable=False)
    rating: Mapped[int] = mapped_column(Integer, nullable=False)