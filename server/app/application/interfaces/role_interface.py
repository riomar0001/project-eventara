import uuid
from typing import Protocol

from pydantic import AwareDatetime

from app.application.dto.roles_dto import RolePermissionSummary
from app.domain.entities.authorization_entities import Feature as FeatureEntity
from app.domain.entities.authorization_entities import GrantEffect, RoleAction
from app.domain.entities.authorization_entities import Role as RoleEntity
from app.domain.entities.authorization_entities import UserGrant as UserGrantEntity
from app.domain.entities.authorization_entities import UserRole as UserRoleEntity


class IRoleRepository(Protocol):
    """Contract for user role assignment and user grant persistence operations."""

    async def user_exists(self, user_id: uuid.UUID) -> bool: ...

    async def role_exists(self, role_id: uuid.UUID) -> bool: ...

    async def lock_user(self, user_id: uuid.UUID) -> bool: ...

    async def get_feature_by_id(self, feature_id: uuid.UUID, for_update: bool = False) -> FeatureEntity | None: ...

    async def get_feature_by_slug(self, slug: str) -> FeatureEntity | None: ...

    async def get_features_by_ids(self, feature_ids: list[uuid.UUID], for_update: bool = False) -> list[FeatureEntity]: ...

    async def list_all_features(self) -> list[FeatureEntity]: ...

    async def create_feature_definition(
        self,
        slug: str,
        name: str,
        description: str | None,
        is_enabled: bool,
    ) -> FeatureEntity: ...

    async def update_feature_definition(
        self,
        feature_id: uuid.UUID,
        slug: str,
        name: str,
        description: str | None,
        is_enabled: bool,
    ) -> FeatureEntity | None: ...

    async def get_feature_dependency_counts(self, feature_id: uuid.UUID) -> tuple[int, int]: ...

    async def delete_feature_definition(self, feature_id: uuid.UUID) -> bool: ...

    async def get_role_by_id(self, role_id: uuid.UUID, for_update: bool = False) -> RoleEntity | None: ...

    async def get_role_by_name(self, name: str) -> RoleEntity | None: ...

    async def list_roles(self) -> list[RoleEntity]: ...

    async def get_role_permissions(self, role_id: uuid.UUID) -> list[RolePermissionSummary]: ...

    async def list_role_permissions(self, role_ids: list[uuid.UUID]) -> dict[uuid.UUID, list[RolePermissionSummary]]: ...

    async def create_role_definition(
        self,
        name: str,
        description: str | None,
        is_default: bool,
        is_system: bool,
    ) -> RoleEntity: ...

    async def update_role_definition(
        self,
        role_id: uuid.UUID,
        name: str,
        description: str | None,
        is_default: bool,
        is_system: bool,
    ) -> RoleEntity | None: ...

    async def replace_role_permissions(
        self,
        role_id: uuid.UUID,
        permissions: list[tuple[uuid.UUID, RoleAction, GrantEffect]],
    ) -> list[RolePermissionSummary]: ...

    async def get_role_dependency_counts(self, role_id: uuid.UUID) -> tuple[int, int]: ...

    async def delete_role_definition(self, role_id: uuid.UUID) -> bool: ...

    async def feature_exists(self, feature_id: uuid.UUID) -> bool: ...

    async def list_features(self) -> list[FeatureEntity]: ...

    async def get_active_assignment(self, user_id: uuid.UUID, role_id: uuid.UUID) -> UserRoleEntity | None: ...

    async def get_active_assignments_for_user(self, user_id: uuid.UUID) -> list[UserRoleEntity]: ...

    async def create_assignment(
        self,
        user_id: uuid.UUID,
        role_id: uuid.UUID,
        expires_at: AwareDatetime | None,
        assigned_by: uuid.UUID,
    ) -> UserRoleEntity: ...

    async def get_assignments_by_user(self, user_id: uuid.UUID) -> list[UserRoleEntity]: ...

    async def get_assignment_by_id(self, assignment_id: uuid.UUID) -> UserRoleEntity | None: ...

    async def update_assignment_expiry(self, assignment_id: uuid.UUID, expires_at: AwareDatetime | None) -> UserRoleEntity | None: ...

    async def delete_assignment(self, assignment_id: uuid.UUID) -> bool: ...

    async def replace_active_assignments(
        self,
        user_id: uuid.UUID,
        role_id: uuid.UUID,
        assigned_by: uuid.UUID,
    ) -> UserRoleEntity: ...

    async def get_existing_grants(
        self,
        user_id: uuid.UUID,
        feature_id: uuid.UUID,
        actions: list[RoleAction],
    ) -> list[UserGrantEntity]: ...

    async def create_grants(
        self,
        user_id: uuid.UUID,
        role_id: uuid.UUID,
        feature_id: uuid.UUID,
        actions: list[RoleAction],
        effect: GrantEffect,
        starts_at: AwareDatetime | None,
        expires_at: AwareDatetime | None,
        reason: str | None,
        granted_by: uuid.UUID,
    ) -> list[UserGrantEntity]: ...

    async def get_grants_by_user(self, user_id: uuid.UUID) -> list[UserGrantEntity]: ...

    async def get_grant_by_id(self, grant_id: uuid.UUID) -> UserGrantEntity | None: ...

    async def delete_grant(self, grant_id: uuid.UUID) -> bool: ...
