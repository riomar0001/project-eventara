from __future__ import annotations

from datetime import datetime
from uuid import UUID

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.database.base import Base

"""
kinda similar to ecomerce reviews but for events. 
Users can rate events on multiple aspects and leave detailed reviews. 
Event organizers can respond to reviews and users can mark reviews as helpful.
"""


class EventRating(Base):
    __tablename__ = "event_ratings"

    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    event_id: Mapped[UUID] = mapped_column(ForeignKey("events.id", ondelete="CASCADE"), nullable=False)

    # Core rating
    overall_rating: Mapped[int] = mapped_column(Integer, nullable=False)

    # Aspect ratings
    organization_rating: Mapped[int | None] = mapped_column(Integer, nullable=True)
    venue_rating: Mapped[int | None] = mapped_column(Integer, nullable=True)
    activities_rating: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Review content
    title: Mapped[str] = mapped_column(String(100), nullable=False)
    review: Mapped[str] = mapped_column(Text, nullable=False)

    # Engagement
    would_recommend: Mapped[bool] = mapped_column(Boolean, default=True)
    media_urls: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    helpful_count: Mapped[int] = mapped_column(Integer, default=0)

    # Creator response
    creator_response: Mapped[str | None] = mapped_column(Text, nullable=True)
    creator_responded_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    user = relationship("User", back_populates="event_ratings")
    event = relationship("Event", back_populates="ratings")

    __table_args__ = (
        Index("idx_event_ratings_user_id", "user_id"),
        Index("idx_event_ratings_event_id", "event_id"),
        Index("idx_event_ratings_overall", "event_id", "overall_rating"),
        Index("idx_event_ratings_helpful", "helpful_count"),
        Index("idx_event_ratings_recommend", "would_recommend"),
        Index("idx_event_ratings_user_event", "user_id", "event_id", unique=True),
    )
