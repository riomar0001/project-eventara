from __future__ import annotations
from datetime import datetime
from uuid import uuid4
import uuid
from sqlalchemy import DateTime, Enum, ForeignKey, Integer, JSON, String, Text, Index, text, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.domain.entities.user_entity import AgeGroup, EducationLevel, Gender, UserStatus
from app.domain.entities.authorization import GrantEffect, RoleAction
from app.infrastructure.database.base import Base



class User(Base):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(Enum(UserStatus, name="user_status"), nullable=False, default="active")
    delete_at: Mapped[datetime | None] = mapped_column(DateTime)

    # Relationships
    profile: Mapped["UserProfile"] = relationship(back_populates="user", uselist=False)
    security: Mapped["UserSecurity"] = relationship(back_populates="user", uselist=False)
    activity: Mapped["UserActivity"] = relationship(back_populates="user", uselist=False)
    tokens: Mapped[list["Token"]] = relationship(back_populates="user", foreign_keys="Token.user_id")
    roles: Mapped[list["UserRole"]] = relationship(back_populates="user", foreign_keys="UserRole.user_id")
    grants: Mapped[list["UserGrant"]] = relationship(back_populates="user", foreign_keys="UserGrant.user_id")
    login_history: Mapped[list["UserLoginHistory"]] = relationship(back_populates="user", foreign_keys="UserLoginHistory.user_id")
    one_time_codes: Mapped[list["UserOneTimeCode"]] = relationship(back_populates="user", foreign_keys="UserOneTimeCode.user_id")

    __table_args__ = (
        Index(
            "idx_users_not_deleted",
            "id",
            postgresql_where=text("delete_at IS NULL"),
        ),
        Index("idx_users_status", "status"),
    )


class UserProfile(Base):
    __tablename__ = "user_profiles"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True)

    alias: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    image_file_id: Mapped[str | None] = mapped_column(String(255), nullable=True)

    age_group: Mapped[str] = mapped_column(Enum(AgeGroup, name="age_group"), nullable=False)
    gender: Mapped[str] = mapped_column(Enum(Gender, name="gender"), nullable=False)
    occupation: Mapped[str | None] = mapped_column(String(150), nullable=True)
    education_level: Mapped[str] = mapped_column(Enum(EducationLevel, name="education_level"), nullable=False)
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    preferences: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    user: Mapped["User"] = relationship(back_populates="profile")


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

    __table_args__ = (
        Index("idx_user_security_locked_until", "locked_until"),
        Index("idx_user_security_email_verified", "email_verified"),
    )


class UserActivity(Base):
    __tablename__ = "user_activity"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True)

    last_login_at: Mapped[datetime | None] = mapped_column(DateTime)
    last_activity_at: Mapped[datetime | None] = mapped_column(DateTime)
    login_count: Mapped[int] = mapped_column(Integer, default=0)

    # Relationship
    user: Mapped["User"] = relationship(back_populates="activity")

    __table_args__ = (
        Index("idx_user_activity_last_activity", "last_activity_at"),
        Index("idx_user_activity_last_login", "last_login_at"),
    )


class Feature(Base):
    __tablename__ = "features"

    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_enabled: Mapped[bool] = mapped_column(default=True)

    # Relationships
    permissions: Mapped[list["RolePermission"]] = relationship(back_populates="feature")
    grants: Mapped[list["UserGrant"]] = relationship(back_populates="feature")

    __table_args__ = (
        Index("idx_features_slug", "slug"),
        Index("idx_features_is_enabled", "is_enabled"),
    )


class Role(Base):
    __tablename__ = "roles"

    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_default: Mapped[bool] = mapped_column(default=False)
    is_system: Mapped[bool] = mapped_column(default=False)

    # Relationships
    permissions: Mapped[list["RolePermission"]] = relationship(back_populates="role")
    user_roles: Mapped[list["UserRole"]] = relationship(back_populates="role")
    user_grants: Mapped[list["UserGrant"]] = relationship(back_populates="role")

    __table_args__ = (
        Index("idx_roles_name", "name"),
        Index("idx_roles_is_default", "is_default"),
        Index("idx_roles_is_system", "is_system"),
    )


class RolePermission(Base):
    __tablename__ = "role_permissions"

    role_id: Mapped[int] = mapped_column(ForeignKey("roles.id", ondelete="CASCADE"))
    feature_id: Mapped[int] = mapped_column(ForeignKey("features.id", ondelete="CASCADE"))
    action: Mapped[str] = mapped_column(Enum(RoleAction, name="role_action"), nullable=False)
    effect: Mapped[str] = mapped_column(Enum(GrantEffect, name="grant_effect"), nullable=False)

    # Relationships
    role: Mapped["Role"] = relationship(back_populates="permissions")
    feature: Mapped["Feature"] = relationship(back_populates="permissions")

    __table_args__ = (
        Index("idx_role_permissions_role_feature_action", "role_id", "feature_id", "action"),
    )


class UserRole(Base):
    __tablename__ = "user_roles"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    role_id: Mapped[int] = mapped_column(ForeignKey("roles.id", ondelete="CASCADE"))
    expires_at: Mapped[datetime | None] = mapped_column(DateTime)
    assigned_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    assigned_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    user: Mapped["User"] = relationship(back_populates="roles", foreign_keys=[user_id])
    role: Mapped["Role"] = relationship(back_populates="user_roles")
    assigner: Mapped["User | None"] = relationship("User", foreign_keys=[assigned_by])

    __table_args__ = (
        Index("idx_user_roles_user_role", "user_id", "role_id"),
        Index("idx_user_roles_expires_at", "expires_at"),
    )


class UserGrant(Base):
    __tablename__ = "user_grants"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    role_id: Mapped[int] = mapped_column(ForeignKey("roles.id", ondelete="CASCADE"))
    feature_id: Mapped[int] = mapped_column(ForeignKey("features.id", ondelete="CASCADE"))
    action: Mapped[str] = mapped_column(Enum(RoleAction, name="role_action"), nullable=False)
    effect: Mapped[str] = mapped_column(Enum(GrantEffect, name="grant_effect"), nullable=False)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime)
    granted_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)

    # Relationships
    user: Mapped["User"] = relationship(back_populates="grants", foreign_keys=[user_id])
    role: Mapped["Role"] = relationship(back_populates="user_grants")
    feature: Mapped["Feature"] = relationship(back_populates="grants")
    granter: Mapped["User | None"] = relationship("User", foreign_keys=[granted_by])

    __table_args__ = (
        Index("idx_user_grants_user_role_feature_action", "user_id", "role_id", "feature_id", "action"),
        Index("idx_user_grants_expires_at", "expires_at"),
    )
    
class Token(Base):
    __tablename__ = "refresh_tokens"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4
    )

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))

    token_hash: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True
    )
    
    is_active: Mapped[bool] = mapped_column(default=True)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    last_used_at: Mapped[datetime | None] = mapped_column(DateTime)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped["User"] = relationship(back_populates="tokens", foreign_keys=[user_id])


class UserLoginHistory(Base):
    __tablename__ = "login_history"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))

    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(Text, nullable=True)
    browser: Mapped[str | None] = mapped_column(String(100), nullable=True)
    os: Mapped[str | None] = mapped_column(String(100), nullable=True)
    device_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    region: Mapped[str | None] = mapped_column(String(100), nullable=True)
    country: Mapped[str | None] = mapped_column(String(100), nullable=True)
    successful: Mapped[bool] = mapped_column(default=True)

    # Relationships
    user: Mapped["User"] = relationship(back_populates="login_history")

    __table_args__ = (
        Index("idx_login_history_user_id", "user_id"),
        Index("idx_login_history_successful", "successful"),
    )

class UserOneTimeCode(Base):
    __tablename__ = "one_time_codes"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    code_hash: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    used_at: Mapped[datetime | None] = mapped_column(DateTime)

    # Relationships
    user: Mapped["User"] = relationship(back_populates="one_time_codes")
    
    __table_args__ = (
        Index("idx_one_time_codes_user_id", "user_id"),
        Index("idx_one_time_codes_expires_at", "expires_at"),
    )