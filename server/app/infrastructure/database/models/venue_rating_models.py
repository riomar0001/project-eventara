from uuid import UUID

from sqlalchemy import ForeignKey, Index, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.database.base import Base


class VenueRating(Base):
    __tablename__ = "venue_ratings"

    user_id: Mapped[UUID] = mapped_column(ForeignKey("user_profiles.user_id", ondelete="CASCADE"), nullable=False)
    venue_id: Mapped[UUID] = mapped_column(ForeignKey("venues.id", ondelete="CASCADE"), nullable=False)
    rating: Mapped[int] = mapped_column(Integer, nullable=False)
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    user: Mapped["UserProfile"] = relationship(back_populates="venue_ratings")
    venue: Mapped["Venue"] = relationship(back_populates="venue_ratings")

    __table_args__ = (
        Index("idx_venue_ratings_user_id", "user_id"),
        Index("idx_venue_ratings_venue_id", "venue_id"),
        Index("idx_venue_ratings_user_venue", "user_id", "venue_id", unique=True),
    )
