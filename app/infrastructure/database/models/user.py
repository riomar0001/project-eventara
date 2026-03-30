from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, JSON, String, Text, Index, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.entities.user_entities import AgeGroup, EducationLevel, Gender, UserStatus
from app.infrastructure.database.base import Base

if TYPE_CHECKING:
    from app.infrastructure.database.models.token import Token


class User(Base):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False)
    password: Mapped[str] = mapped_column(Text, nullable=False)
    role: Mapped[str] = mapped_column(String(50), nullable=False)

    status: Mapped[str] = mapped_column(
        Enum(UserStatus, name="user_status"), nullable=False, default="active")

    delete_at: Mapped[datetime | None] = mapped_column(DateTime)

    # Relationships
    profile: Mapped["UserProfile"] = relationship(
        back_populates="user", uselist=False)
    security: Mapped["UserSecurity"] = relationship(
        back_populates="user", uselist=False)
    activity: Mapped["UserActivity"] = relationship(
        back_populates="user", uselist=False)
    tokens: Mapped[list["Token"]] = relationship(
        back_populates="user")

    __table_args__ = (
        Index(
            "idx_users_not_deleted",
            "id",
            postgresql_where=text("delete_at IS NULL"),
        ),
        Index("idx_users_status", "status"),
        Index("idx_users_role", "role"),
    )


class UserProfile(Base):
    __tablename__ = "user_profiles"

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), unique=True)

    alias: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    image_file_id: Mapped[str | None] = mapped_column(String(255), nullable=True)

    age_group: Mapped[str] = mapped_column(
        Enum(AgeGroup, name="age_group"), nullable=False)
    gender: Mapped[str] = mapped_column(
        Enum(Gender, name="gender"), nullable=False)
    occupation: Mapped[str | None] = mapped_column(String(150), nullable=True)
    education_level: Mapped[str] = mapped_column(
        Enum(EducationLevel, name="education_level"), nullable=False)
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    preferences: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    user: Mapped["User"] = relationship(back_populates="profile")


class UserSecurity(Base):
    __tablename__ = "user_security"

    user_id: Mapped[int] = mapped_column(ForeignKey(
        "users.id", ondelete="CASCADE"), unique=True)

    email_verified: Mapped[bool] = mapped_column(default=False)
    email_verified_at: Mapped[datetime | None] = mapped_column(DateTime)
    password_change_at: Mapped[datetime | None] = mapped_column(DateTime)

    failed_login_attempts: Mapped[int] = mapped_column(Integer, default=0)
    locked_until: Mapped[datetime | None
                         ] = mapped_column(DateTime)

    # Relationship
    user: Mapped["User"] = relationship(back_populates="security")

    __table_args__ = (
        Index("idx_user_security_locked_until", "locked_until"),
        Index("idx_user_security_email_verified", "email_verified"),
    )


class UserActivity(Base):
    __tablename__ = "user_activity"

    user_id: Mapped[int] = mapped_column(ForeignKey(
        "users.id", ondelete="CASCADE"), unique=True)

    last_login_at: Mapped[datetime | None] = mapped_column(DateTime)
    last_activity_at: Mapped[datetime | None] = mapped_column(DateTime)
    login_count: Mapped[int] = mapped_column(Integer, default=0)

    # Relationship
    user: Mapped["User"] = relationship(back_populates="activity")

    __table_args__ = (
        Index("idx_user_activity_last_activity", "last_activity_at"),
        Index("idx_user_activity_last_login", "last_login_at"),
    )
