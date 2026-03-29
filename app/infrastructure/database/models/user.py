from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.entities.user import UserRole, UserStatus
from app.infrastructure.database.base import Base

if TYPE_CHECKING:
    from app.infrastructure.database.models.token import Token


class User(Base):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False)
    password: Mapped[str] = mapped_column(Text, nullable=False)
    role: Mapped[str] = mapped_column(
        Enum(UserRole, name="user_role"), nullable=False, default="user")

    status: Mapped[str] = mapped_column(
        Enum(UserStatus, name="user_status"), nullable=False, default="active")
    delete_at: Mapped[datetime | None] = mapped_column(DateTime)

    # Relationships
    security: Mapped["UserSecurity"] = relationship(
        back_populates="user", uselist=False)
    activity: Mapped["UserActivity"] = relationship(
        back_populates="user", uselist=False)
    tokens: Mapped[list["Token"]] = relationship(
        back_populates="user")


class UserSecurity(Base):
    __tablename__ = "user_security"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True)

    email_verified: Mapped[bool] = mapped_column(default=False)
    email_verified_at: Mapped[datetime | None] = mapped_column(DateTime)
    password_change_at: Mapped[datetime | None] = mapped_column(DateTime)

    failed_login_attempts: Mapped[int] = mapped_column(Integer, default=0)
    locked_until: Mapped[datetime | None] = mapped_column(DateTime)

    # Relationship
    user: Mapped["User"] = relationship(back_populates="security")


class UserActivity(Base):
    __tablename__ = "user_activity"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True)

    last_login_at: Mapped[datetime | None] = mapped_column(DateTime)
    last_activity_at: Mapped[datetime | None] = mapped_column(DateTime)
    login_count: Mapped[int] = mapped_column(Integer, default=0)

    # Relationship
    user: Mapped["User"] = relationship(back_populates="activity")
