"""Use cases for volunteer registration, dynamic volunteer role management, and volunteer applications."""

import math

from sqlalchemy.ext.asyncio import AsyncSession

from app.application.dto.volunteer_dto import (
    AddVolunteerInput,
    AddVolunteerOutput,
    CreateVolunteerRoleInput,
    CreateVolunteerRoleOutput,
    DeleteVolunteerRoleInput,
    DeleteVolunteerRoleOutput,
    GetAllVolunteerRolesInput,
    GetAllVolunteerRolesOutput,
    GetAllVolunteersInput,
    GetAllVolunteersOutput,
    GetPotentialVolunteersInput,
    GetPotentialVolunteersOutput,
    ReviewApplicationInput,
    ReviewApplicationOutput,
    SubmitApplicationInput,
    SubmitApplicationOutput,
    UpdateVolunteerInfoInput,
    UpdateVolunteerInfoOutput,
    UpdateVolunteerRoleInput,
    UpdateVolunteerRoleOutput,
    WithdrawApplicationInput,
    WithdrawApplicationOutput,
    _UNSET,
)
from app.application.interfaces.volunteer_interface import IVolunteerRepository
from app.domain.entities.volunteer_entity import ApplicationStatus
from app.domain.exceptions.role_exceptions import RoleAlreadyAssignedError
from app.domain.exceptions.user_exceptions import UserNotFoundError
from app.domain.exceptions.volunteer_application_exceptions import (
    InvalidApplicationStatusTransitionError,
    UnauthorizedApplicationOperationError,
    VolunteerApplicationAlreadyExistsError,
    VolunteerApplicationNotFoundError,
)
from app.domain.exceptions.volunteer_exceptions import VolunteerAlreadyExistsError, VolunteerNotFoundError
from app.domain.exceptions.volunteer_role_exceptions import (
    VolunteerRoleAlreadyExistsError,
    VolunteerRoleInactiveError,
    VolunteerRoleNotFoundError,
)
from app.infrastructure.database.repositories.role_repository import RoleRepository

_VOLUNTEER_RBAC_ROLE_NAME = "volunteer"

_ALLOWED_APPLICATION_TRANSITIONS: dict[ApplicationStatus, frozenset[ApplicationStatus]] = {
    ApplicationStatus.PENDING: frozenset({
        ApplicationStatus.APPROVED,
        ApplicationStatus.REJECTED,
        ApplicationStatus.WITHDRAWN,
    }),
}


class GetVolunteerUseCase:
    """Read-only application service for listing volunteers with optional filters.

    Concurrency strategy — no locking:
        This use case performs a pure read (SELECT with optional WHERE clauses and
        OFFSET/LIMIT pagination).  There is no check-then-modify sequence, so no
        TOCTOU race is possible and no pessimistic or optimistic lock is needed.
        Reads execute at the database's default READ COMMITTED isolation level,
        which guarantees each row is returned in a fully committed state.

    Args:
        repo: Concrete implementation of ``IVolunteerRepository``.
    """

    def __init__(self, repo: IVolunteerRepository) -> None:
        self.repo = repo

    async def get_all_volunteers(self, data: GetAllVolunteersInput) -> GetAllVolunteersOutput:
        """Return a paginated, optionally filtered list of volunteers.

        Args:
            data: ``GetAllVolunteersInput`` with pagination parameters and optional
                  status and volunteer-role-id filters.

        Returns:
            ``GetAllVolunteersOutput`` containing the matching volunteer slice,
            the total record count, and computed pagination metadata.
        """
        volunteers, total = await self.repo.get_all_volunteers(
            status=data.status,
            role_id=data.role_id,
            page=data.page,
            page_size=data.page_size,
        )
        total_pages = max(1, math.ceil(total / data.page_size))
        return GetAllVolunteersOutput(
            volunteers=volunteers,
            total=total,
            page=data.page,
            page_size=data.page_size,
            total_pages=total_pages,
        )

    async def get_potential_volunteers(self, data: GetPotentialVolunteersInput) -> GetPotentialVolunteersOutput:
        """Return a paginated list of users ranked by event participation who are not yet volunteers.

        Users are ordered by descending event count so the most engaged participants
        appear first, making them the highest-priority candidates for outreach.

        Args:
            data: ``GetPotentialVolunteersInput`` with pagination parameters, a
                  minimum-event-count threshold, and an optional search string.

        Returns:
            ``GetPotentialVolunteersOutput`` containing the matching user slice,
            the total record count, and computed pagination metadata.
        """
        potential_volunteers, total = await self.repo.get_potential_volunteers(
            page=data.page,
            page_size=data.page_size,
            min_events=data.min_events,
            search=data.search,
        )
        total_pages = max(1, math.ceil(total / data.page_size))
        return GetPotentialVolunteersOutput(
            potential_volunteers=potential_volunteers,
            total=total,
            page=data.page,
            page_size=data.page_size,
            total_pages=total_pages,
        )


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


class VolunteerRoleUseCase:
    """Application service for listing, updating, and deleting volunteer custom roles.

    Owns the transaction lifecycle for every mutating operation: commits on
    success, rolls back on any validation or infrastructure failure, then
    re-raises the exception.

    Concurrency strategy — pessimistic locking (SELECT … FOR UPDATE):
        ``update_volunteer_role`` acquires a row-level lock on the target role
        before the name-uniqueness check and the attribute update.  This
        serialises concurrent updates to the same record and prevents two
        callers from simultaneously renaming a role to the same name while both
        pass the application-layer uniqueness check.

        ``delete_volunteer_role`` acquires a row-level lock on the role row,
        then locks and bulk-deletes all volunteer rows assigned to that role
        within the same transaction.  This prevents a concurrent volunteer
        assignment from targeting the role after the existence check and before
        the delete.

    Args:
        repo: Concrete implementation of ``IVolunteerRepository``.
        db:   The active async database session used for commit and rollback.
    """

    def __init__(self, repo: IVolunteerRepository, db: AsyncSession) -> None:
        self.repo = repo
        self.db = db

    async def get_all_volunteer_roles(self, data: GetAllVolunteerRolesInput) -> GetAllVolunteerRolesOutput:
        """Return a paginated, optionally filtered list of volunteer custom roles.

        Args:
            data: ``GetAllVolunteerRolesInput`` with pagination parameters and
                  optional search string and active-status filter.

        Returns:
            ``GetAllVolunteerRolesOutput`` containing the matching roles slice,
            the total record count, and computed pagination metadata.
        """
        roles, total = await self.repo.get_all_volunteer_roles(
            search=data.search,
            is_active=data.is_active,
            page=data.page,
            page_size=data.page_size,
        )
        total_pages = max(1, math.ceil(total / data.page_size))
        return GetAllVolunteerRolesOutput(
            roles=roles,
            total=total,
            page=data.page,
            page_size=data.page_size,
            total_pages=total_pages,
        )

    async def update_volunteer_role(self, data: UpdateVolunteerRoleInput) -> UpdateVolunteerRoleOutput:
        """Update attributes of an existing volunteer custom role.

        Only the fields explicitly provided in ``data`` are changed.  A name
        change triggers a case-insensitive uniqueness check against all other
        existing roles before the update is applied.  A row-level lock is held
        from the initial fetch through the commit to prevent concurrent edits
        from producing an inconsistent state.

        Args:
            data: ``UpdateVolunteerRoleInput`` with the role ID and any subset
                  of ``name``, ``description``, and ``is_active`` to change.

        Returns:
            ``UpdateVolunteerRoleOutput`` wrapping the updated ``VolunteerRole``
            entity.

        Raises:
            VolunteerRoleNotFoundError: No role exists for ``data.role_id``.
            VolunteerRoleAlreadyExistsError: The requested new name is already
                taken by another role (case-insensitive).
        """
        role = await self.repo.get_volunteer_role_by_id(data.role_id, for_update=True)
        if not role:
            raise VolunteerRoleNotFoundError(str(data.role_id))

        if data.name is not None and data.name.lower() != role.name.lower():
            existing = await self.repo.get_volunteer_role_by_name(data.name)
            if existing:
                raise VolunteerRoleAlreadyExistsError(data.name)

        description = data.description if data.description is not _UNSET else _UNSET

        try:
            updated = await self.repo.update_volunteer_role(
                role_id=data.role_id,
                name=data.name,
                description=description,
                is_active=data.is_active,
            )
            if updated is None:
                raise VolunteerRoleNotFoundError(str(data.role_id))
        except VolunteerRoleNotFoundError:
            await self.db.rollback()
            raise
        except Exception:
            await self.db.rollback()
            raise

        await self.db.commit()
        return UpdateVolunteerRoleOutput(role=updated)

    async def delete_volunteer_role(self, data: DeleteVolunteerRoleInput) -> DeleteVolunteerRoleOutput:
        """Delete a volunteer custom role and remove all volunteers assigned to it.

        The operation is atomic: all associated volunteer records are deleted
        within the same transaction as the role itself.  A row-level lock on
        the role prevents a concurrent assignment from succeeding after the
        existence check.

        Args:
            data: ``DeleteVolunteerRoleInput`` with the role ID and the actor's
                  user ID for audit purposes.

        Returns:
            ``DeleteVolunteerRoleOutput`` with the deleted role's ID and the
            count of volunteer records that were removed as a side effect.

        Raises:
            VolunteerRoleNotFoundError: No role exists for ``data.role_id``.
        """
        role = await self.repo.get_volunteer_role_by_id(data.role_id, for_update=True)
        if not role:
            raise VolunteerRoleNotFoundError(str(data.role_id))

        try:
            volunteers_removed = await self.repo.delete_volunteers_by_role_id(data.role_id)
            await self.repo.delete_volunteer_role_by_id(data.role_id)
        except Exception:
            await self.db.rollback()
            raise

        await self.db.commit()
        return DeleteVolunteerRoleOutput(role_id=data.role_id, volunteers_removed=volunteers_removed)


class VolunteerApplicationUseCase:
    """Application service for volunteer application submission, review, and withdrawal.

    Owns the transaction lifecycle for every mutating operation: commits on
    success, rolls back on any validation or infrastructure failure, then
    re-raises the exception.

    Concurrency strategy — pessimistic locking (SELECT … FOR UPDATE):
        ``submit_application`` acquires a row-level lock on any existing active
        application for the user before the duplicate-submission check.  If two
        concurrent requests from the same user both reach the lock, the second
        request blocks until the first commits, then observes the newly-created
        PENDING row and raises ``VolunteerApplicationAlreadyExistsError``.

        ``review_application`` and ``withdraw_application`` acquire a row-level
        lock on the application row before checking and updating its status.
        This serialises concurrent state transitions on the same application,
        eliminating TOCTOU races where two concurrent callers both observe PENDING
        and both attempt a conflicting transition.

    Args:
        repo:      Concrete implementation of ``IVolunteerRepository``.
        role_repo: ``RoleRepository`` for RBAC role assignment on approval.
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

    async def submit_application(self, data: SubmitApplicationInput) -> SubmitApplicationOutput:
        """Submit a new volunteer application on behalf of the authenticated user.

        Prevents duplicate active applications by acquiring a row-level lock on any
        existing active application row before the check. A user who is already an
        active volunteer cannot submit a new application.

        Args:
            data: ``SubmitApplicationInput`` containing the applicant's user ID and
                  optional free-form application data (skills, availability, etc.).

        Returns:
            ``SubmitApplicationOutput`` wrapping the newly created
            ``VolunteerApplication`` entity in PENDING status.

        Raises:
            UserNotFoundError: No user exists for ``data.user_id``.
            VolunteerAlreadyExistsError: The user is already an active volunteer.
            VolunteerApplicationAlreadyExistsError: The user already has a PENDING
                or APPROVED application.
        """
        user = await self.repo.get_user_by_id(data.user_id)
        if not user:
            raise UserNotFoundError(str(data.user_id))

        existing_volunteer = await self.repo.get_volunteer_by_user_id(data.user_id)
        if existing_volunteer:
            raise VolunteerAlreadyExistsError(str(data.user_id))

        try:
            active_application = await self.repo.get_active_application_by_user_id(
                data.user_id, for_update=True
            )
            if active_application:
                raise VolunteerApplicationAlreadyExistsError(str(data.user_id))

            application = await self.repo.create_application(
                user_id=data.user_id,
                application_data=data.application_data,
            )
        except (VolunteerApplicationAlreadyExistsError, UserNotFoundError, VolunteerAlreadyExistsError):
            await self.db.rollback()
            raise
        except Exception:
            await self.db.rollback()
            raise

        await self.db.commit()
        return SubmitApplicationOutput(application=application)

    async def review_application(self, data: ReviewApplicationInput) -> ReviewApplicationOutput:
        """Review a pending volunteer application by approving or rejecting it.

        Acquires a row-level lock on the application before the transition check to
        serialise concurrent review attempts on the same record. When the status is
        set to APPROVED and both ``contact_phone`` and ``volunteer_role_id`` are
        provided, the method atomically creates a ``Volunteer`` record and assigns
        the RBAC 'volunteer' role within the same transaction.

        Transition rules:
            PENDING → APPROVED: creates a Volunteer record if ``contact_phone`` and
                ``volunteer_role_id`` are provided; otherwise only updates the status.
            PENDING → REJECTED: updates the status with no side effects.
            Any other current status rejects the transition.

        Args:
            data: ``ReviewApplicationInput`` containing the application ID, the
                  reviewer's user ID, the target status, and optional volunteer
                  creation details for approval.

        Returns:
            ``ReviewApplicationOutput`` with the updated application and the newly
            created ``Volunteer`` entity, or ``None`` if no volunteer was created.

        Raises:
            VolunteerApplicationNotFoundError: No application for ``data.application_id``.
            InvalidApplicationStatusTransitionError: Current status does not permit
                the requested transition.
            VolunteerRoleNotFoundError: The referenced volunteer role does not exist
                (only when approving with a role ID).
            VolunteerRoleInactiveError: The referenced volunteer role is inactive
                (only when approving with a role ID).
            VolunteerAlreadyExistsError: The applicant is already a volunteer
                (only when approving).
        """
        application = await self.repo.get_application_by_id(data.application_id, for_update=True)
        if not application:
            raise VolunteerApplicationNotFoundError(str(data.application_id))

        allowed_targets = _ALLOWED_APPLICATION_TRANSITIONS.get(application.status, frozenset())
        if data.new_status not in allowed_targets:
            raise InvalidApplicationStatusTransitionError(
                str(application.id),
                application.status.value,
                data.new_status.value,
            )

        volunteer = None
        try:
            updated_application = await self.repo.update_application_status(
                data.application_id, data.new_status
            )
            if updated_application is None:
                raise VolunteerApplicationNotFoundError(str(data.application_id))

            if data.new_status == ApplicationStatus.APPROVED and data.contact_phone and data.volunteer_role_id:
                volunteer_role = await self.repo.get_volunteer_role_by_id(data.volunteer_role_id)
                if not volunteer_role:
                    raise VolunteerRoleNotFoundError(str(data.volunteer_role_id))
                if not volunteer_role.is_active:
                    raise VolunteerRoleInactiveError(str(data.volunteer_role_id))

                existing_volunteer = await self.repo.get_volunteer_by_user_id(
                    application.user_id, for_update=True
                )
                if existing_volunteer:
                    raise VolunteerAlreadyExistsError(str(application.user_id))

                volunteer = await self.repo.create_volunteer(
                    user_id=application.user_id,
                    contact_phone=data.contact_phone,
                    volunteer_role_id=data.volunteer_role_id,
                )
                await self._assign_rbac_volunteer_role(application.user_id, data.reviewer_id)

        except (
            VolunteerApplicationNotFoundError,
            InvalidApplicationStatusTransitionError,
            VolunteerRoleNotFoundError,
            VolunteerRoleInactiveError,
            VolunteerAlreadyExistsError,
        ):
            await self.db.rollback()
            raise
        except Exception:
            await self.db.rollback()
            raise

        await self.db.commit()
        return ReviewApplicationOutput(application=updated_application, volunteer=volunteer)

    async def withdraw_application(self, data: WithdrawApplicationInput) -> WithdrawApplicationOutput:
        """Withdraw a pending volunteer application by the applicant.

        Acquires a row-level lock on the application before the ownership and
        transition checks to prevent a concurrent review from conflicting with
        a simultaneous withdrawal.

        Args:
            data: ``WithdrawApplicationInput`` containing the application ID and
                  the ID of the user requesting the withdrawal.

        Returns:
            ``WithdrawApplicationOutput`` wrapping the updated application with
            WITHDRAWN status.

        Raises:
            VolunteerApplicationNotFoundError: No application for ``data.application_id``.
            UnauthorizedApplicationOperationError: The requesting user is not the
                owner of the application.
            InvalidApplicationStatusTransitionError: The application's current status
                does not permit withdrawal (only PENDING can be withdrawn).
        """
        application = await self.repo.get_application_by_id(data.application_id, for_update=True)
        if not application:
            raise VolunteerApplicationNotFoundError(str(data.application_id))

        if application.user_id != data.user_id:
            raise UnauthorizedApplicationOperationError(str(data.application_id))

        allowed_targets = _ALLOWED_APPLICATION_TRANSITIONS.get(application.status, frozenset())
        if ApplicationStatus.WITHDRAWN not in allowed_targets:
            raise InvalidApplicationStatusTransitionError(
                str(application.id),
                application.status.value,
                ApplicationStatus.WITHDRAWN.value,
            )

        try:
            updated_application = await self.repo.update_application_status(
                data.application_id, ApplicationStatus.WITHDRAWN
            )
            if updated_application is None:
                raise VolunteerApplicationNotFoundError(str(data.application_id))
        except (VolunteerApplicationNotFoundError, UnauthorizedApplicationOperationError, InvalidApplicationStatusTransitionError):
            await self.db.rollback()
            raise
        except Exception:
            await self.db.rollback()
            raise

        await self.db.commit()
        return WithdrawApplicationOutput(application=updated_application)

    async def _assign_rbac_volunteer_role(self, user_id, actor_id) -> None:
        """Assign the platform 'volunteer' RBAC role to the user if available.

        Silently skips if no RBAC role named 'volunteer' exists or if the user
        already holds the assignment, so that missing platform configuration never
        blocks volunteer approval.
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


class UpdateVolunteerInfoUseCase:
    """Application service for updating an existing volunteer's contact and role information.

    Owns the transaction lifecycle: commits on success, rolls back on any
    validation or infrastructure failure, then re-raises the exception.

    Concurrency strategy — pessimistic locking (SELECT … FOR UPDATE):
        ``update_volunteer_info`` acquires a row-level lock on the target
        volunteer row before applying changes.  This serialises concurrent
        update requests for the same volunteer and prevents two callers from
        reading the same state and then both attempting to persist conflicting
        modifications.

    Args:
        repo: Concrete implementation of ``IVolunteerRepository``.
        db:   The active async database session used for commit and rollback.
    """

    def __init__(self, repo: IVolunteerRepository, db: AsyncSession) -> None:
        self.repo = repo
        self.db = db

    async def update_volunteer_info(self, data: UpdateVolunteerInfoInput) -> UpdateVolunteerInfoOutput:
        """Update contact phone, volunteer role assignment, and/or status of a volunteer.

        Only the fields explicitly provided (non-None) in ``data`` are changed.
        When a new ``volunteer_role_id`` is specified the referenced role must
        exist and be active.  A row-level lock is held from the initial fetch
        through the commit to prevent concurrent updates from producing an
        inconsistent state.

        Args:
            data: ``UpdateVolunteerInfoInput`` with the volunteer ID, the actor's
                  user ID, and any subset of ``contact_phone``, ``volunteer_role_id``,
                  and ``status`` to change.

        Returns:
            ``UpdateVolunteerInfoOutput`` containing the updated ``Volunteer``
            entity and a snapshot of the state before the change.

        Raises:
            VolunteerNotFoundError: No volunteer record exists for ``data.volunteer_id``.
            VolunteerRoleNotFoundError: The referenced new volunteer role does not exist.
            VolunteerRoleInactiveError: The referenced new volunteer role is inactive.
        """
        volunteer = await self.repo.get_volunteer_by_id(data.volunteer_id, for_update=True)
        if not volunteer:
            raise VolunteerNotFoundError(str(data.volunteer_id))

        old_values = {
            "contact_phone": volunteer.contact_phone,
            "volunteer_role_id": str(volunteer.volunteer_role_id),
            "status": volunteer.status.value if hasattr(volunteer.status, "value") else volunteer.status,
        }

        if data.volunteer_role_id is not None:
            role = await self.repo.get_volunteer_role_by_id(data.volunteer_role_id)
            if not role:
                raise VolunteerRoleNotFoundError(str(data.volunteer_role_id))
            if not role.is_active:
                raise VolunteerRoleInactiveError(str(data.volunteer_role_id))

        try:
            updated = await self.repo.update_volunteer(
                volunteer_id=data.volunteer_id,
                contact_phone=data.contact_phone,
                volunteer_role_id=data.volunteer_role_id,
                status=data.status,
            )
            if updated is None:
                raise VolunteerNotFoundError(str(data.volunteer_id))
        except (VolunteerNotFoundError, VolunteerRoleNotFoundError, VolunteerRoleInactiveError):
            await self.db.rollback()
            raise
        except Exception:
            await self.db.rollback()
            raise

        await self.db.commit()
        return UpdateVolunteerInfoOutput(volunteer=updated, old_values=old_values)
