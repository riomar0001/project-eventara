"""Use cases for volunteer registration and dynamic volunteer role management."""

from sqlalchemy.ext.asyncio import AsyncSession

from app.application.dto.volunteer_dto import (
    AddVolunteerInput,
    AddVolunteerOutput,
    CreateVolunteerRoleInput,
    CreateVolunteerRoleOutput,
)
from app.application.interfaces.volunteer_interface import IVolunteerRepository
from app.domain.exceptions.role_exceptions import RoleAlreadyAssignedError
from app.domain.exceptions.user_exceptions import UserNotFoundError
from app.domain.exceptions.volunteer_exceptions import VolunteerAlreadyExistsError
from app.domain.exceptions.volunteer_role_exceptions import (
    VolunteerRoleAlreadyExistsError,
    VolunteerRoleInactiveError,
    VolunteerRoleNotFoundError,
)
from app.infrastructure.database.repositories.role_repository import RoleRepository

_VOLUNTEER_RBAC_ROLE_NAME = "volunteer"


class VolunteerUseCase:
    """Application service for volunteer registration and volunteer role creation.

    Owns the transaction lifecycle for every mutating operation: commits on
    success, rolls back on any validation or infrastructure failure, then
    re-raises the exception.

    Concurrency strategy — pessimistic locking (SELECT … FOR UPDATE):
        ``add_volunteer`` locks the user row before the existence check on the
        volunteers table.  If two concurrent requests attempt to register the
        same user as a volunteer, the second request blocks on the lock, observes
        the committed row, and raises ``VolunteerAlreadyExistsError``.  A unique
        database constraint on ``volunteers.user_id`` provides a secondary safety
        net if the application lock is somehow bypassed.

        ``create_volunteer_role`` performs a name uniqueness check before the
        insert; the unique database constraint on ``volunteer_custom_roles.name``
        prevents duplicate rows under concurrent requests that both pass the
        application-layer check.

    Args:
        repo:      Concrete implementation of ``IVolunteerRepository``.
        role_repo: ``RoleRepository`` used to look up and assign RBAC roles
                   without committing a separate transaction.
        db:        The active async database session used for commit and rollback.
    """

    def __init__(
        self,
        repo: IVolunteerRepository,
        role_repo: RoleRepository,
        db: AsyncSession,
    ) -> None:
        self.repo = repo
        self.role_repo = role_repo
        self.db = db

    async def add_volunteer(self, data: AddVolunteerInput) -> AddVolunteerOutput:
        """Register a user as a volunteer and assign the RBAC 'volunteer' role.

        The operation is atomic: the volunteer record and the RBAC role assignment
        are both flushed within the same transaction and committed together.  If
        no RBAC role named 'volunteer' exists the volunteer record is still
        created; if the user already holds the RBAC volunteer role the assignment
        is silently skipped.

        Args:
            data: ``AddVolunteerInput`` containing the actor's ID, the target
                  user's ID, contact phone, and the volunteer role ID.

        Returns:
            ``AddVolunteerOutput`` wrapping the newly created ``Volunteer`` entity.

        Raises:
            UserNotFoundError: No user exists for ``data.target_user_id``.
            VolunteerRoleNotFoundError: No volunteer custom role for ``data.volunteer_role_id``.
            VolunteerRoleInactiveError: The referenced volunteer custom role is inactive.
            VolunteerAlreadyExistsError: The user is already registered as a volunteer.
        """
        user = await self.repo.get_user_by_id(data.target_user_id)
        if not user:
            raise UserNotFoundError(str(data.target_user_id))

        volunteer_role = await self.repo.get_volunteer_role_by_id(data.volunteer_role_id)
        if not volunteer_role:
            raise VolunteerRoleNotFoundError(str(data.volunteer_role_id))
        if not volunteer_role.is_active:
            raise VolunteerRoleInactiveError(str(data.volunteer_role_id))

        try:
            existing = await self.repo.get_volunteer_by_user_id(data.target_user_id, for_update=True)
            if existing:
                raise VolunteerAlreadyExistsError(str(data.target_user_id))

            volunteer = await self.repo.create_volunteer(
                user_id=data.target_user_id,
                contact_phone=data.contact_phone,
                volunteer_role_id=data.volunteer_role_id,
            )

            await self._assign_rbac_volunteer_role(data.target_user_id, data.actor_id)

        except (VolunteerAlreadyExistsError, UserNotFoundError, VolunteerRoleNotFoundError, VolunteerRoleInactiveError):
            await self.db.rollback()
            raise
        except Exception:
            await self.db.rollback()
            raise

        await self.db.commit()
        return AddVolunteerOutput(volunteer=volunteer)

    async def create_volunteer_role(self, data: CreateVolunteerRoleInput) -> CreateVolunteerRoleOutput:
        """Create a new dynamic volunteer role definition.

        Role names are case-insensitively unique across the platform.

        Args:
            data: ``CreateVolunteerRoleInput`` with the role name, optional
                  description, and the ID of the community leader creating it.

        Returns:
            ``CreateVolunteerRoleOutput`` wrapping the newly created
            ``VolunteerRole`` entity.

        Raises:
            VolunteerRoleAlreadyExistsError: A role with the same name already exists.
        """
        existing = await self.repo.get_volunteer_role_by_name(data.name)
        if existing:
            raise VolunteerRoleAlreadyExistsError(data.name)

        try:
            role = await self.repo.create_volunteer_role(
                name=data.name,
                description=data.description,
                created_by=data.created_by,
            )
        except Exception:
            await self.db.rollback()
            raise

        await self.db.commit()
        return CreateVolunteerRoleOutput(role=role)

    async def _assign_rbac_volunteer_role(self, user_id, actor_id) -> None:
        """Assign the platform 'volunteer' RBAC role to the user if available.

        Silently skips if no RBAC role named 'volunteer' exists or if the user
        already holds the assignment, so that missing platform configuration never
        blocks volunteer registration.
        """
        rbac_role = await self.repo.get_rbac_role_by_name(_VOLUNTEER_RBAC_ROLE_NAME)
        if not rbac_role:
            return

        existing_assignment = await self.role_repo.get_active_assignment(user_id, rbac_role.id)
        if existing_assignment:
            return

        try:
            await self.role_repo.create_assignment(
                user_id=user_id,
                role_id=rbac_role.id,
                expires_at=None,
                assigned_by=actor_id,
            )
        except RoleAlreadyAssignedError:
            return
