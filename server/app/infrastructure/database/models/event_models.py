from __future__ import annotations

from datetime import datetime
from uuid import UUID

from sqlalchemy import JSON, Boolean, DateTime, Enum, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.domain.entities.event_entity import (
    EventParticipantStatus,
    EventSessionStatus,
    EventStatus,
    EventVolunteerStatus,
)
from app.infrastructure.database.base import Base


class Event(Base):
    __tablename__ = "events"

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    start_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    status: Mapped[str] = mapped_column(Enum(EventStatus, native_enum=False), nullable=False, default="draft")
    created_by: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    banner_url: Mapped[str | None] = mapped_column(String(512), nullable=True)

    creator = relationship("User", back_populates="events")
    volunteers = relationship("EventVolunteer", back_populates="event")
    ratings = relationship("EventRating", back_populates="event")
    sessions = relationship("EventSession", back_populates="event")

    __table_args__ = (
        Index("idx_events_status", "status"),
        Index("idx_events_created_by", "created_by"),
        Index("idx_events_start_date", "start_date"),
        Index("idx_events_end_date", "end_date"),
    )


class EventSession(Base):
    __tablename__ = "event_sessions"

    event_id: Mapped[UUID] = mapped_column(ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    venue_id: Mapped[UUID] = mapped_column(ForeignKey("venues.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    start_datetime: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_datetime: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    status: Mapped[str] = mapped_column(Enum(EventSessionStatus, native_enum=False), nullable=False, default="scheduled")
    max_slots: Mapped[int | None] = mapped_column(Integer, nullable=True)

    event = relationship("Event", back_populates="sessions")
    venue = relationship("Venue", back_populates="event_sessions")
    participants = relationship("EventParticipant", back_populates="event_session")

    __table_args__ = (
        Index("idx_event_sessions_event_id", "event_id"),
        Index("idx_event_sessions_venue_id", "venue_id"),
        Index("idx_event_sessions_start_datetime", "start_datetime"),
        Index("idx_event_sessions_end_datetime", "end_datetime"),
        Index("idx_event_sessions_status", "status"),
    )


class EventParticipant(Base):
    __tablename__ = "event_participants"

    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    event_session_id: Mapped[UUID] = mapped_column(ForeignKey("event_sessions.id", ondelete="CASCADE"), nullable=False)
    status: Mapped[str] = mapped_column(Enum(EventParticipantStatus, native_enum=False), nullable=False, default="registered")

    user = relationship("User", back_populates="event_participants")
    event_session = relationship("EventSession", back_populates="participants")

    __table_args__ = (
        Index("idx_event_participants_user_id", "user_id"),
        Index("idx_event_participants_event_session_id", "event_session_id"),
        Index("idx_event_participants_status", "status"),
        Index("idx_event_participants_user_session", "user_id", "event_session_id", unique=True),
    )


class EventRating(Base):
    __tablename__ = "event_ratings"

    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    event_id: Mapped[UUID] = mapped_column(ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    overall_rating: Mapped[int] = mapped_column(Integer, nullable=False)
    organization_rating: Mapped[int | None] = mapped_column(Integer, nullable=True)
    venue_rating: Mapped[int | None] = mapped_column(Integer, nullable=True)
    activities_rating: Mapped[int | None] = mapped_column(Integer, nullable=True)
    title: Mapped[str] = mapped_column(String(100), nullable=False)
    review: Mapped[str] = mapped_column(Text, nullable=False)
    would_recommend: Mapped[bool] = mapped_column(Boolean, default=True)
    media_urls: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    helpful_count: Mapped[int] = mapped_column(Integer, default=0)
    creator_response: Mapped[str | None] = mapped_column(Text, nullable=True)
    creator_responded_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

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


class EventVolunteer(Base):
    __tablename__ = "event_volunteers"

    volunteer_id: Mapped[UUID] = mapped_column(ForeignKey("volunteers.id", ondelete="CASCADE"), nullable=False)
    event_id: Mapped[UUID] = mapped_column(ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    status: Mapped[str] = mapped_column(Enum(EventVolunteerStatus, native_enum=False), nullable=False, default="pending")

    volunteer = relationship("Volunteer", back_populates="event_volunteers")
    event = relationship("Event", back_populates="volunteers")

    __table_args__ = (
        Index("idx_event_volunteers_volunteer_id", "volunteer_id"),
        Index("idx_event_volunteers_event_id", "event_id"),
        Index("idx_event_volunteers_status", "status"),
        Index("idx_event_volunteers_volunteer_event", "volunteer_id", "event_id", unique=True),
    )
