import uuid
from datetime import datetime
from typing import Protocol

from app.domain.entities.authorization_entities import GrantEffect, RoleAction
from app.domain.entities.authorization_entities import UserGrant as UserGrantEntity
from app.domain.entities.authorization_entities import UserRole as UserRoleEntity


class IRoleRepository(Protocol):
    """Contract for user role assignment and user grant persistence operations."""

    async def user_exists(self, user_id: uuid.UUID) -> bool: ...

    async def role_exists(self, role_id: uuid.UUID) -> bool: ...

    async def feature_exists(self, feature_id: uuid.UUID) -> bool: ...

    async def get_active_assignment(self, user_id: uuid.UUID, role_id: uuid.UUID) -> UserRoleEntity | None: ...

    async def create_assignment(
        self,
        user_id: uuid.UUID,
        role_id: uuid.UUID,
        expires_at: datetime | None,
        assigned_by: uuid.UUID,
    ) -> UserRoleEntity: ...

    async def get_assignments_by_user(self, user_id: uuid.UUID) -> list[UserRoleEntity]: ...

    async def get_assignment_by_id(self, assignment_id: uuid.UUID) -> UserRoleEntity | None: ...

    async def update_assignment_expiry(self, assignment_id: uuid.UUID, expires_at: datetime | None) -> UserRoleEntity | None: ...

    async def delete_assignment(self, assignment_id: uuid.UUID) -> bool: ...

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
        expires_at: datetime | None,
        reason: str | None,
        granted_by: uuid.UUID,
    ) -> list[UserGrantEntity]: ...

    async def get_grants_by_user(self, user_id: uuid.UUID) -> list[UserGrantEntity]: ...

    async def get_grant_by_id(self, grant_id: uuid.UUID) -> UserGrantEntity | None: ...

    async def delete_grant(self, grant_id: uuid.UUID) -> bool: ...
