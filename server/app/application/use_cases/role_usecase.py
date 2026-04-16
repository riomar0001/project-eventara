import uuid

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.dto.role_dto import (
    AssignRoleInput,
    AssignRoleOutput,
    CreateGrantsInput,
    CreateGrantsOutput,
    GetUserGrantsOutput,
    GetUserRolesOutput,
    ListGrantFeaturesOutput,
    UpdateAssignmentInput,
    UpdateAssignmentOutput,
)
from app.application.dto.role_management_dto import (
    CreateRoleInput,
    ListRolesOutput,
    ManagedRoleDetail,
    RoleOutput,
    RolePermissionInput,
    UpdateRoleInput,
)
from app.application.interfaces.role_interface import IRoleRepository
from app.domain.entities.authorization_entities import GrantEffect, RoleAction
from app.domain.entities.authorization_entities import Role as RoleEntity
from app.domain.entities.authorization_entities import UserRole as UserRoleEntity
from app.domain.exceptions.role_exceptions import (
    DuplicateUserGrantError,
    FeatureNotFoundError,
    ProtectedRoleDeletionError,
    RoleAlreadyAssignedError,
    RoleAlreadyExistsError,
    RoleAssignmentNotFoundError,
    RoleInUseError,
    RoleNotFoundError,
    UserGrantNotFoundError,
)
from app.domain.exceptions.user_exceptions import UserNotFoundError


class UserRoleUseCase:
    """Manages role assignments and per-user action grants.

    Role assignments (``user_roles`` table) determine which system roles a user
    holds.  User grants (``user_grants`` table) are fine-grained, per-user
    overrides that allow or deny specific actions on individual features,
    bypassing or supplementing role-level permissions.

    Both operations use pessimistic locking inside the repository to prevent
    duplicate rows under concurrent requests.  The use-case layer owns the
    transaction lifecycle: it commits on success and rolls back on any
    domain-level or integrity failure.

    Args:
        repo: Concrete implementation of ``IRoleRepository``.
        db:   The active async database session used for commit / rollback.
    """

    def __init__(self, repo: IRoleRepository, db: AsyncSession) -> None:
        self.repo = repo
        self.db = db

    async def assign_role(self, data: AssignRoleInput) -> AssignRoleOutput:
        """Assign a role to a user, preventing duplicate active assignments.

        The existence check for the target user and role happens before the
        pessimistically-locked duplicate check so that FK-violation errors
        surface as clean domain exceptions rather than raw database errors.

        Args:
            data: ``AssignRoleInput`` containing the target user ID, role ID,
                  assigning admin's user ID, and an optional expiry date.

        Returns:
            ``AssignRoleOutput`` wrapping the newly created ``UserRole`` entity.

        Raises:
            UserNotFoundError: No user exists for ``data.user_id``.
            RoleNotFoundError: No role exists for ``data.role_id``.
            RoleAlreadyAssignedError: The role is already assigned to the user.
        """
        if not await self.repo.user_exists(data.user_id):
            raise UserNotFoundError(str(data.user_id))

        if not await self.repo.role_exists(data.role_id):
            raise RoleNotFoundError(str(data.role_id))

        existing = await self.repo.get_active_assignment(data.user_id, data.role_id)
        if existing:
            raise RoleAlreadyAssignedError()

        assignment = await self.repo.create_assignment(
            user_id=data.user_id,
            role_id=data.role_id,
            expires_at=data.expires_at,
            assigned_by=data.assigned_by,
        )
        await self.db.commit()
        return AssignRoleOutput(assignment=assignment)

    async def get_user_roles(self, user_id: uuid.UUID) -> GetUserRolesOutput:
        """Return all role assignments for a given user.

        Args:
            user_id: The UUID of the user whose role assignments to retrieve.

        Returns:
            ``GetUserRolesOutput`` containing the list of ``UserRole`` entities.

        Raises:
            UserNotFoundError: No user exists for ``user_id``.
        """
        if not await self.repo.user_exists(user_id):
            raise UserNotFoundError(str(user_id))

        assignments = await self.repo.get_assignments_by_user(user_id)
        return GetUserRolesOutput(assignments=assignments)

    async def get_assignment(self, assignment_id: uuid.UUID) -> UserRoleEntity:
        """Return a single role assignment by its ID.

        Args:
            assignment_id: The UUID of the ``user_roles`` row.

        Returns:
            The matching ``UserRole`` entity.

        Raises:
            RoleAssignmentNotFoundError: No assignment exists for ``assignment_id``.
        """
        assignment = await self.repo.get_assignment_by_id(assignment_id)
        if not assignment:
            raise RoleAssignmentNotFoundError()
        return assignment

    async def update_assignment(self, data: UpdateAssignmentInput) -> UpdateAssignmentOutput:
        """Update the expiry date of an existing role assignment.

        Passing ``None`` as ``expires_at`` removes the expiry, making the
        assignment permanent until explicitly revoked.

        Args:
            data: ``UpdateAssignmentInput`` with the assignment ID and the new
                  expiry date (or ``None`` to clear it).

        Returns:
            ``UpdateAssignmentOutput`` wrapping the updated ``UserRole`` entity.

        Raises:
            RoleAssignmentNotFoundError: No assignment exists for the given ID.
        """
        existing = await self.repo.get_assignment_by_id(data.assignment_id)
        if not existing:
            raise RoleAssignmentNotFoundError()

        updated = await self.repo.update_assignment_expiry(
            assignment_id=data.assignment_id,
            expires_at=data.expires_at,
        )
        await self.db.commit()
        return UpdateAssignmentOutput(assignment=updated)

    async def revoke_assignment(self, assignment_id: uuid.UUID) -> None:
        """Permanently remove a role assignment.

        Args:
            assignment_id: The UUID of the ``user_roles`` row to delete.

        Raises:
            RoleAssignmentNotFoundError: No assignment exists for the given ID.
        """
        deleted = await self.repo.delete_assignment(assignment_id)
        if not deleted:
            raise RoleAssignmentNotFoundError()
        await self.db.commit()

    async def create_grants(self, data: CreateGrantsInput) -> CreateGrantsOutput:
        """Create per-user action grants for a specific feature, atomically.

        Accepts an array of ``RoleAction`` values and creates one ``UserGrant``
        row per action in a single transaction.  Any action in the array that
        already has an active grant for the same user and feature is treated as
        a conflict and the entire operation is rejected to avoid partial state.

        Pessimistic locking inside ``get_existing_grants`` serializes concurrent
        requests targeting the same user + feature + action set.

        Args:
            data: ``CreateGrantsInput`` with user, role, feature IDs; a list of
                  actions; the grant effect; optional expiry; and optional reason.

        Returns:
            ``CreateGrantsOutput`` wrapping the list of newly created
            ``UserGrant`` entities.

        Raises:
            UserNotFoundError: No user exists for ``data.user_id``.
            RoleNotFoundError: No role exists for ``data.role_id``.
            FeatureNotFoundError: No feature exists for ``data.feature_id``.
            DuplicateUserGrantError: One or more actions already have an active
                grant for this user and feature.
        """
        if not await self.repo.user_exists(data.user_id):
            raise UserNotFoundError(str(data.user_id))

        if not await self.repo.role_exists(data.role_id):
            raise RoleNotFoundError(str(data.role_id))

        if not await self.repo.feature_exists(data.feature_id):
            raise FeatureNotFoundError(str(data.feature_id))

        existing = await self.repo.get_existing_grants(data.user_id, data.feature_id, data.actions)
        if existing:
            conflicting_actions = [g.action.value for g in existing]
            raise DuplicateUserGrantError(conflicting_actions)

        grants = await self.repo.create_grants(
            user_id=data.user_id,
            role_id=data.role_id,
            feature_id=data.feature_id,
            actions=data.actions,
            effect=data.effect,
            starts_at=data.starts_at,
            expires_at=data.expires_at,
            reason=data.reason,
            granted_by=data.granted_by,
        )
        await self.db.commit()
        return CreateGrantsOutput(grants=grants)

    async def list_grant_features(self) -> ListGrantFeaturesOutput:
        """Return the enabled feature catalog available for per-user grants."""
        features = await self.repo.list_features()
        return ListGrantFeaturesOutput(features=features)

    async def get_user_grants(self, user_id: uuid.UUID) -> GetUserGrantsOutput:
        """Return all active grants for a given user.

        Args:
            user_id: The UUID of the user whose grants to retrieve.

        Returns:
            ``GetUserGrantsOutput`` containing the list of ``UserGrant`` entities.

        Raises:
            UserNotFoundError: No user exists for ``user_id``.
        """
        if not await self.repo.user_exists(user_id):
            raise UserNotFoundError(str(user_id))

        grants = await self.repo.get_grants_by_user(user_id)
        return GetUserGrantsOutput(grants=grants)

    async def revoke_grant(self, grant_id: uuid.UUID) -> None:
        """Permanently remove a user grant.

        Args:
            grant_id: The UUID of the ``user_grants`` row to delete.

        Raises:
            UserGrantNotFoundError: No grant exists for the given ID.
        """
        deleted = await self.repo.delete_grant(grant_id)
        if not deleted:
            raise UserGrantNotFoundError()
        await self.db.commit()


class RoleManagementUseCase:
    """Application services for RBAC role definition management.

    This module manages role records and the role-to-feature permission matrix
    stored in ``role_permissions``.

    Concurrency strategy:
        Update and delete flows acquire ``SELECT ... FOR UPDATE`` locks on the
        target role row before validating dependent state. PostgreSQL
        foreign-key inserts take ``KEY SHARE`` locks on referenced parent rows,
        so the role lock serializes concurrent assignment, grant, and
        permission-attachment attempts while a management transaction is
        evaluating whether a rename or delete is safe.

        Create and update flows also lock every referenced feature row before
        replacing ``role_permissions`` so a feature cannot be deleted between
        validation and write.

        Uniqueness of ``roles.name`` is enforced by the database. Integrity
        errors are mapped into domain-specific exceptions so concurrent duplicate
        creates or renames fail predictably.
    """

    protected_role_name = "system_administrator"

    def __init__(self, repo: IRoleRepository, db: AsyncSession) -> None:
        self.repo = repo
        self.db = db

    async def list_roles(self) -> ListRolesOutput:
        """Return all RBAC roles together with their resolved feature permissions."""
        roles = await self.repo.list_roles()
        permissions_by_role = await self.repo.list_role_permissions([role.id for role in roles])
        return ListRolesOutput(
            roles=[
                ManagedRoleDetail(
                    id=role.id,
                    name=role.name,
                    description=role.description,
                    is_default=role.is_default,
                    is_system=role.is_system,
                    permissions=permissions_by_role.get(role.id, []),
                )
                for role in roles
            ]
        )

    async def get_role(self, role_id: uuid.UUID) -> RoleOutput:
        """Return one RBAC role together with its feature permission matrix."""
        role = await self.repo.get_role_by_id(role_id)
        if role is None:
            raise RoleNotFoundError(str(role_id))
        return RoleOutput(
            role=ManagedRoleDetail(
                id=role.id,
                name=role.name,
                description=role.description,
                is_default=role.is_default,
                is_system=role.is_system,
                permissions=await self.repo.get_role_permissions(role_id),
            )
        )

    async def create_role(self, data: CreateRoleInput) -> RoleOutput:
        """Create a role definition and atomically attach its feature permissions."""
        try:
            flattened_permissions = self._flatten_permissions(data.permissions)
            await self._ensure_features_exist(flattened_permissions)
            role = await self.repo.create_role_definition(
                name=data.name,
                description=data.description,
                is_default=data.is_default,
                is_system=data.is_system,
            )
            await self.repo.replace_role_permissions(role.id, flattened_permissions)
            await self.db.commit()
            return await self.get_role(role.id)
        except IntegrityError as exc:
            await self.db.rollback()
            raise RoleAlreadyExistsError(data.name) from exc
        except Exception:
            await self.db.rollback()
            raise

    async def update_role(self, data: UpdateRoleInput) -> RoleOutput:
        """Update a role definition and replace its permission matrix atomically."""
        try:
            existing = await self.repo.get_role_by_id(data.role_id, for_update=True)
            if existing is None:
                raise RoleNotFoundError(str(data.role_id))

            if existing.name != data.name:
                user_assignment_count, user_grant_count = await self.repo.get_role_dependency_counts(data.role_id)
                if user_assignment_count or user_grant_count:
                    raise RoleInUseError("Role name cannot change while user assignments or grants depend on it.")

            flattened_permissions = self._flatten_permissions(data.permissions)
            await self._ensure_features_exist(flattened_permissions)

            role = await self.repo.update_role_definition(
                role_id=data.role_id,
                name=data.name,
                description=data.description,
                is_default=data.is_default,
                is_system=data.is_system,
            )
            if role is None:
                raise RoleNotFoundError(str(data.role_id))

            await self.repo.replace_role_permissions(data.role_id, flattened_permissions)
            await self.db.commit()
            return await self.get_role(data.role_id)
        except IntegrityError as exc:
            await self.db.rollback()
            raise RoleAlreadyExistsError(data.name) from exc
        except Exception:
            await self.db.rollback()
            raise

    async def delete_role(self, role_id: uuid.UUID) -> None:
        """Delete a role only when no user assignments or grants still depend on it."""
        try:
            role = await self.repo.get_role_by_id(role_id, for_update=True)
            if role is None:
                raise RoleNotFoundError(str(role_id))

            self._ensure_role_can_be_deleted(role)

            user_assignment_count, user_grant_count = await self.repo.get_role_dependency_counts(role_id)
            if user_assignment_count or user_grant_count:
                raise RoleInUseError("Role cannot be deleted while user assignments or grants still reference it.")

            deleted = await self.repo.delete_role_definition(role_id)
            if not deleted:
                raise RoleNotFoundError(str(role_id))
            await self.db.commit()
        except Exception:
            await self.db.rollback()
            raise

    def _ensure_role_can_be_deleted(self, role: RoleEntity) -> None:
        """Reject deletion of protected built-in roles that anchor platform administration."""
        if role.is_system and role.name == self.protected_role_name:
            raise ProtectedRoleDeletionError()

    async def _ensure_features_exist(self, permissions: list[tuple[uuid.UUID, RoleAction, GrantEffect]]) -> None:
        """Lock and validate every feature referenced by a role permission payload."""
        feature_ids = sorted({feature_id for feature_id, _, _ in permissions}, key=str)
        if not feature_ids:
            return

        features = await self.repo.get_features_by_ids(feature_ids, for_update=True)
        features_by_id = {feature.id for feature in features}

        for feature_id in feature_ids:
            if feature_id not in features_by_id:
                raise FeatureNotFoundError(str(feature_id))

    @staticmethod
    def _flatten_permissions(permissions: list[RolePermissionInput]) -> list[tuple[uuid.UUID, RoleAction, GrantEffect]]:
        """Normalize nested permission payloads into unique role-permission rows."""
        flattened = {(permission.feature_id, action, permission.effect) for permission in permissions for action in permission.actions}
        return sorted(flattened, key=lambda value: (str(value[0]), value[1].value, value[2].value))
