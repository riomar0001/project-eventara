import uuid
from datetime import UTC, datetime, timedelta

from arq.connections import ArqRedis
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.dto.user_dto import (
    ChangePasswordInput,
    GetLoginHistoryInput,
    GetLoginHistoryOutput,
    RequestAccountDeletionInput,
    RequestAccountDeletionOutput,
    UserOnboardingInput,
    UserOnboardingOutput,
)
from app.application.interfaces.user_interface import IUserRepository
from app.core.security.hashing import hash_string, verify_hash
from app.domain.entities.user_entity import UserProfile, UserStatus
from app.domain.exceptions.auth_exceptions import InvalidCredentialsError
from app.domain.exceptions.user_exceptions import (
    AccountDeletionAlreadyScheduledError,
    AccountDeletionGracePeriodExpiredError,
    AliasAlreadyTakenError,
    EmailNotVerifiedError,
    OnboardingAlreadyCompletedError,
    SamePasswordError,
    UserInactiveError,
    UserNotFoundError,
)
from app.infrastructure.database.repositories.refresh_token_repository import RefreshTokenRepository


class OnboardingUseCase:
    """Handles user onboarding after email verification.

    Onboarding collects the user's profile details (alias, name, demographics)
    and marks the account as fully set up. It can only be completed once.
    """

    def __init__(self, repo: IUserRepository, db: AsyncSession) -> None:
        self.repo = repo
        self.db = db

    async def complete_onboarding(self, data: UserOnboardingInput) -> UserOnboardingOutput:
        """Create the user's profile and mark onboarding as complete.

        Concurrency note:
            Alias uniqueness is checked optimistically before the INSERT, and the
            database unique constraint acts as the final guard.  ``complete_onboarding``
            uses a conditional UPDATE (``WHERE onboarding_completed = FALSE``) so
            concurrent requests for the same user cannot both succeed.

        Args:
            data: A ``UserOnboardingInput`` with the user ID and all profile fields.

        Returns:
            A ``UserOnboardingOutput`` containing the newly created profile.

        Raises:
            UserNotFoundError: No user exists for the given ID.
            EmailNotVerifiedError: The user has not yet verified their email address.
            OnboardingAlreadyCompletedError: Onboarding was already completed, or a
                concurrent request completed it just before this one.
            AliasAlreadyTakenError: The requested alias is already in use by another user.
        """
        user = await self.repo.get_by_id(data.user_id)
        if not user:
            raise UserNotFoundError()

        if user.status in (UserStatus.INACTIVE, UserStatus.DELETED):
            raise UserInactiveError()

        security = await self.repo.get_security_by_user_id(data.user_id)
        if not security or not security.email_verified:
            raise EmailNotVerifiedError()

        if user.onboarding_completed:
            raise OnboardingAlreadyCompletedError()

        existing_alias = await self.repo.get_by_alias(data.alias)
        if existing_alias:
            raise AliasAlreadyTakenError(data.alias)

        profile = UserProfile(
            user_id=data.user_id,
            email=user.email,
            alias=data.alias,
            first_name=data.first_name,
            last_name=data.last_name,
            age_group=data.age_group,
            gender=data.gender,
            education_level=data.education_level,
            occupation=data.occupation,
            bio=data.bio,
        )

        try:
            created_profile = await self.repo.create_profile(profile)
        except IntegrityError as exc:
            await self.db.rollback()
            orig = str(getattr(exc, "orig", exc)).lower()
            if "alias" in orig:
                raise AliasAlreadyTakenError(data.alias)
            raise OnboardingAlreadyCompletedError()

        updated = await self.repo.complete_onboarding(data.user_id)
        if not updated:
            await self.db.rollback()
            raise OnboardingAlreadyCompletedError()

        return UserOnboardingOutput(profile=created_profile)


class CheckAliasUseCase:
    """Checks whether a given alias is available."""

    def __init__(self, repo: IUserRepository) -> None:
        self.repo = repo

    async def is_available(self, alias: str) -> bool:
        existing = await self.repo.get_by_alias(alias)
        return existing is None


class ChangePasswordUseCase:
    """Handles authenticated password changes for an existing user account.

    Requires a valid access token — the caller must already be authenticated.
    On success, all refresh tokens belonging to the account are revoked so
    every other active session is immediately invalidated, limiting the damage
    window if credentials were compromised.

    Concurrency strategy — sequential atomic updates:
        Two concurrent change-password requests from the same authenticated user
        require no distributed lock because both operations are inherently atomic
        at the database level:

        1. ``UserRepository.update_password`` executes a single SQL ``UPDATE``
           on ``users`` followed by an ``UPDATE`` on ``user_security``, both
           within the same transaction.  If two requests race, the second write
           simply overwrites the first — both originate from the authenticated
           owner, so the final state is always a valid password.

        2. ``RefreshTokenRepository.revoke_all_for_user`` executes a single bulk
           ``UPDATE … WHERE is_active = TRUE``.  If the two requests overlap, the
           second call matches zero rows (already revoked) and commits a no-op,
           which is the correct outcome.

        Pessimistic locking (``SELECT … FOR UPDATE``) is deliberately avoided
        because the naturally idempotent semantics of both updates make it
        unnecessary overhead for this particular flow.
    """

    def __init__(self, repo: IUserRepository, db: AsyncSession) -> None:
        self.repo = repo
        self.db = db

    async def change_password(self, data: ChangePasswordInput) -> None:
        """Verify the current password and replace it with a new bcrypt hash.

        Guards are applied in the following order to fail fast on the cheapest
        checks before reaching the bcrypt comparison:

        1. User existence — avoids a bcrypt call for a non-existent account.
        2. Account status — inactive and deleted accounts cannot authenticate.
        3. Email verification — an unverified account should not hold an active
           session, but this acts as a belt-and-suspenders guard.
        4. Current password verification — constant-time bcrypt check.
        5. Same-password guard — prevents a no-op change that would silently
           succeed and confuse the caller.

        On success, the new password hash is written atomically alongside the
        ``password_change_at`` timestamp, and all existing refresh tokens are
        revoked to invalidate every other active session.

        Args:
            data: A ``ChangePasswordInput`` carrying the caller's user ID,
                their current plaintext password, and the desired new password.

        Raises:
            UserNotFoundError: No user exists for the given ID.
            UserInactiveError: The account is deactivated or soft-deleted.
            EmailNotVerifiedError: The account's email address is unverified.
            InvalidCredentialsError: The supplied current password is incorrect.
            SamePasswordError: The new password is identical to the current one.
        """
        user = await self.repo.get_by_id(data.user_id)
        if not user:
            raise UserNotFoundError()

        if user.status in (UserStatus.INACTIVE, UserStatus.DELETED):
            raise UserInactiveError()

        security = await self.repo.get_security_by_user_id(data.user_id)
        if not security or not security.email_verified:
            raise EmailNotVerifiedError()

        if not verify_hash(data.current_password, user.password):
            raise InvalidCredentialsError()

        if verify_hash(data.new_password, user.password):
            raise SamePasswordError()

        new_hash = hash_string(data.new_password)
        updated = await self.repo.update_password(data.user_id, new_hash)
        if not updated:
            raise UserNotFoundError()

        token_repo = RefreshTokenRepository(self.db)
        await token_repo.revoke_all_for_user(data.user_id)


class DeleteAccountUseCase:
    """Schedules account deletion and enqueues the deferred finalization job.

    The HTTP request performs validation and persists the pending-deletion
    window synchronously so the caller receives an immediate, durable result.
    The irreversible transition is delegated to ARQ with a deferred job whose
    payload includes the original request timestamp and deadline.  When the
    worker later executes, it performs a compare-and-swap update against those
    exact values so stale jobs created before a recovery login or reschedule
    cannot finalize the wrong deletion request.

    Concurrency strategy:
        1. ``UserRepository.schedule_account_deletion`` uses a single
           conditional ``UPDATE`` guarded by ``deletion_requested_at IS NULL``.
           Concurrent self-service and administrator requests collapse to one
           winner and one conflict response without row-level deadlocks.
        2. The ARQ job is enqueued with a deterministic ``_job_id`` derived
           from the user ID and request timestamp, which prevents duplicate
           deferred jobs for the same scheduled request across retries.
        3. ``UserRepository.finalize_account_deletion`` matches both the
           original request timestamp and scheduled deadline before switching
           the account to ``DELETED``.  If the user logs in during the grace
           period and cancels the request, the deferred worker job naturally
           becomes a no-op.
    """

    grace_period = timedelta(days=30)

    def __init__(self, repo: IUserRepository, arq: ArqRedis) -> None:
        self.repo = repo
        self.arq = arq

    @staticmethod
    def _utcnow_naive() -> datetime:
        return datetime.now(UTC).replace(tzinfo=None)

    async def request_self_service_deletion(self, data: RequestAccountDeletionInput) -> RequestAccountDeletionOutput:
        """Validate the caller's password and schedule their own account deletion.

        Args:
            data: The authenticated user's ID, their current plaintext password,
                and an optional reason captured for auditability.

        Returns:
            A ``RequestAccountDeletionOutput`` describing the newly scheduled
            deletion window.

        Raises:
            UserNotFoundError: No account exists for the authenticated user ID.
            UserInactiveError: The account is already inactive or deleted.
            InvalidCredentialsError: The supplied current password is incorrect.
            AccountDeletionAlreadyScheduledError: A deletion window is already pending.
            AccountDeletionGracePeriodExpiredError: The grace period has already elapsed.
        """
        user = await self.repo.get_by_id(data.target_user_id)
        if not user:
            raise UserNotFoundError()

        if user.status in (UserStatus.INACTIVE, UserStatus.DELETED):
            raise UserInactiveError()

        if user.deletion_scheduled_for:
            if user.deletion_scheduled_for <= self._utcnow_naive():
                raise AccountDeletionGracePeriodExpiredError()
            raise AccountDeletionAlreadyScheduledError()

        if not data.current_password or not verify_hash(data.current_password, user.password):
            raise InvalidCredentialsError()

        return await self._schedule_deletion(data)

    async def request_admin_deletion(self, data: RequestAccountDeletionInput) -> RequestAccountDeletionOutput:
        """Schedule account deletion for a target user on behalf of an administrator.

        Args:
            data: The target user ID, the administrator's user ID, and an
                optional free-form reason describing why the deletion was requested.

        Returns:
            A ``RequestAccountDeletionOutput`` describing the newly scheduled
            deletion window.

        Raises:
            UserNotFoundError: No target account exists for the supplied ID.
            UserInactiveError: The target account is already inactive or deleted.
            AccountDeletionAlreadyScheduledError: A deletion window is already pending.
            AccountDeletionGracePeriodExpiredError: The grace period has already elapsed.
        """
        user = await self.repo.get_by_id(data.target_user_id)
        if not user:
            raise UserNotFoundError()

        if user.status in (UserStatus.INACTIVE, UserStatus.DELETED):
            raise UserInactiveError()

        if user.deletion_scheduled_for:
            if user.deletion_scheduled_for <= self._utcnow_naive():
                raise AccountDeletionGracePeriodExpiredError()
            raise AccountDeletionAlreadyScheduledError()

        return await self._schedule_deletion(data)

    async def _schedule_deletion(self, data: RequestAccountDeletionInput) -> RequestAccountDeletionOutput:
        """Persist a pending deletion window and enqueue its deferred finalization job.

        Args:
            data: Validated deletion-request input from either the self-service
                or administrator entry point.

        Returns:
            A ``RequestAccountDeletionOutput`` with the durable deletion window.

        Raises:
            AccountDeletionAlreadyScheduledError: Another request won the race
                and scheduled deletion for this account first.
            AccountDeletionGracePeriodExpiredError: The account passed its grace
                deadline between validation and persistence.
        """
        requested_at = self._utcnow_naive()
        scheduled_for = requested_at + self.grace_period
        scheduled_user = await self.repo.schedule_account_deletion(
            data.target_user_id,
            requested_by=data.requested_by,
            requested_at=requested_at,
            scheduled_for=scheduled_for,
            reason=data.reason,
        )
        if not scheduled_user:
            latest = await self.repo.get_by_id(data.target_user_id)
            if not latest:
                raise UserNotFoundError()
            if latest.status in (UserStatus.INACTIVE, UserStatus.DELETED):
                raise UserInactiveError()
            if latest and latest.deletion_scheduled_for:
                if latest.deletion_scheduled_for <= self._utcnow_naive():
                    raise AccountDeletionGracePeriodExpiredError()
                raise AccountDeletionAlreadyScheduledError()
            raise AccountDeletionAlreadyScheduledError()

        await self.arq.enqueue_job(
            "finalize_account_deletion_job",
            str(scheduled_user.id),
            scheduled_user.deletion_requested_at.isoformat(),
            scheduled_user.deletion_scheduled_for.isoformat(),
            _job_id=f"account-deletion:{scheduled_user.id}:{scheduled_user.deletion_requested_at.isoformat()}",
            _defer_until=scheduled_user.deletion_scheduled_for.replace(tzinfo=UTC),
            _expires=timedelta(days=2),
        )

        return RequestAccountDeletionOutput(
            user_id=scheduled_user.id,
            deletion_requested_at=scheduled_user.deletion_requested_at,
            deletion_scheduled_for=scheduled_user.deletion_scheduled_for,
            requested_by=scheduled_user.deletion_requested_by,
        )


class FinalizeAccountDeletionUseCase:
    """Executes the deferred end of the account-deletion lifecycle.

    This use case runs inside the ARQ worker after the 30-day grace period has
    elapsed.  It receives the exact request timestamp and deadline that were
    captured at scheduling time, then relies on the repository's conditional
    compare-and-swap update to ensure that only the still-pending deletion
    window is finalized.
    """

    def __init__(self, repo: IUserRepository) -> None:
        self.repo = repo

    async def execute(
        self,
        *,
        user_id: str,
        requested_at: str,
        scheduled_for: str,
    ) -> bool:
        """Finalize a scheduled account deletion if the original request is still valid.

        Args:
            user_id: The serialized UUID of the user to finalize.
            requested_at: The original UTC timestamp captured when the deletion
                request was scheduled.
            scheduled_for: The UTC deadline at which the deletion should become final.

        Returns:
            ``True`` when the account was transitioned to ``DELETED`` and
            ``False`` when the request had already been canceled, replaced, or
            finalized by another worker.
        """
        return await self.repo.finalize_account_deletion(
            user_id=uuid.UUID(user_id),
            expected_requested_at=datetime.fromisoformat(requested_at),
            expected_scheduled_for=datetime.fromisoformat(scheduled_for),
        )


class GetLoginHistoryUseCase:
    """Retrieves recent login history entries for the authenticated user."""

    def __init__(self, repo: IUserRepository) -> None:
        self.repo = repo

    async def execute(self, data: GetLoginHistoryInput) -> GetLoginHistoryOutput:
        entries = await self.repo.get_login_history(data.user_id, data.limit)
        return GetLoginHistoryOutput(entries=entries)
