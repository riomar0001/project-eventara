"""Application services for RBAC feature definition management.

This module manages the RBAC feature catalog that routes, roles, and per-user
grants depend on.

Concurrency strategy:
    Update and delete flows acquire ``SELECT ... FOR UPDATE`` locks on the
    target feature row before validating dependent state. PostgreSQL foreign-key
    inserts take ``KEY SHARE`` locks on the referenced parent row, so holding a
    stronger lock on the feature row serializes concurrent attempts to attach
    new role permissions or user grants while a management transaction is
    deciding whether a slug change or deletion is safe.

    Uniqueness of ``features.slug`` is enforced by the database. The use case
    converts integrity errors into domain-specific exceptions so concurrent
    duplicate creates or renames fail predictably.
"""

import uuid

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.dto.feature_management_dto import (
    CreateFeatureInput,
    FeatureOutput,
    ListFeaturesOutput,
    UpdateFeatureInput,
)
from app.application.interfaces.role_interface import IRoleRepository
from app.domain.exceptions.role_exceptions import (
    FeatureAlreadyExistsError,
    FeatureInUseError,
    FeatureNotFoundError,
)


class FeatureManagementUseCase:
    """Coordinates CRUD operations for RBAC feature definitions."""

    def __init__(self, repo: IRoleRepository, db: AsyncSession) -> None:
        self.repo = repo
        self.db = db

    async def list_features(self) -> ListFeaturesOutput:
        """Return the complete RBAC feature catalog, including disabled entries."""
        return ListFeaturesOutput(features=await self.repo.list_all_features())

    async def get_feature(self, feature_id: uuid.UUID) -> FeatureOutput:
        """Return one RBAC feature definition by identifier."""
        feature = await self.repo.get_feature_by_id(feature_id)
        if feature is None:
            raise FeatureNotFoundError(str(feature_id))
        return FeatureOutput(feature=feature)

    async def create_feature(self, data: CreateFeatureInput) -> FeatureOutput:
        """Create a new RBAC feature definition identified by a unique slug."""
        try:
            feature = await self.repo.create_feature_definition(
                slug=data.slug,
                name=data.name,
                description=data.description,
                is_enabled=data.is_enabled,
            )
            await self.db.commit()
            return FeatureOutput(feature=feature)
        except IntegrityError as exc:
            await self.db.rollback()
            raise FeatureAlreadyExistsError(data.slug) from exc
        except Exception:
            await self.db.rollback()
            raise

    async def update_feature(self, data: UpdateFeatureInput) -> FeatureOutput:
        """Update a feature definition while protecting in-use slugs from drift."""
        try:
            existing = await self.repo.get_feature_by_id(data.feature_id, for_update=True)
            if existing is None:
                raise FeatureNotFoundError(str(data.feature_id))

            if existing.slug != data.slug:
                role_permission_count, user_grant_count = await self.repo.get_feature_dependency_counts(data.feature_id)
                if role_permission_count or user_grant_count:
                    raise FeatureInUseError("Feature slug cannot change while roles or user grants depend on it.")

            feature = await self.repo.update_feature_definition(
                feature_id=data.feature_id,
                slug=data.slug,
                name=data.name,
                description=data.description,
                is_enabled=data.is_enabled,
            )
            if feature is None:
                raise FeatureNotFoundError(str(data.feature_id))
            await self.db.commit()
            return FeatureOutput(feature=feature)
        except IntegrityError as exc:
            await self.db.rollback()
            raise FeatureAlreadyExistsError(data.slug) from exc
        except Exception:
            await self.db.rollback()
            raise

    async def delete_feature(self, feature_id: uuid.UUID) -> None:
        """Delete a feature only when no roles or user grants still reference it."""
        try:
            feature = await self.repo.get_feature_by_id(feature_id, for_update=True)
            if feature is None:
                raise FeatureNotFoundError(str(feature_id))

            role_permission_count, user_grant_count = await self.repo.get_feature_dependency_counts(feature_id)
            if role_permission_count or user_grant_count:
                raise FeatureInUseError("Feature cannot be deleted while roles or user grants still reference it.")

            deleted = await self.repo.delete_feature_definition(feature_id)
            if not deleted:
                raise FeatureNotFoundError(str(feature_id))
            await self.db.commit()
        except Exception:
            await self.db.rollback()
            raise
