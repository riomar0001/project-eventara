import uuid

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
from app.application.interfaces.role_interface import IRoleRepository
from app.domain.entities.authorization_entities import UserRole as UserRoleEntity
from app.domain.exceptions.role_exceptions import (
    DuplicateUserGrantError,
    FeatureNotFoundError,
    RoleAlreadyAssignedError,
    RoleAssignmentNotFoundError,
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
