import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.user_entity import PublicUser, User, UserActivity, UserSecurity, UserStatus
from app.application.dto.auth_dto import (
    RegisterUserInput,
    LoginUserInput,
    RegisteredUserOutput,
    VerifiedEmailOutput,
    LoginOutput,
)
from app.domain.exceptions import (
    EmailAlreadyTakenError,
    EmailAlreadyVerifiedError,
    InvalidCredentialsError,
    InvalidTokenError,
    TokenExpiredError,
    UserInactiveError,
    UserLockedError,
    EmailNotVerifiedError,
)
from app.domain.exceptions.user_exceptions import UserNotFoundError
from app.application.interfaces.user_interface import IUserRepository
from app.core.security.hashing import hash_string, verify_hash
from app.core.security.token_service import (
    create_access_token,
    create_refresh_token,
    verification_token,
    verify_verification_token,
)

from app.infrastructure.messaging.email import send_email, verification_email_html


# ---------------------------------------------------------------------------
# Login brute-force constants
# ---------------------------------------------------------------------------

_MAX_FAILED_ATTEMPTS: int = 5
"""Consecutive wrong-password attempts before the account is temporarily locked."""

_LOCKOUT_DURATION: timedelta = timedelta(minutes=15)
"""How long an account stays locked once the failure threshold is reached."""


class AuthUseCase:
    def __init__(self, repo: IUserRepository, db: AsyncSession) -> None:
        self.repo = repo
        self.db = db

    async def register_user(self, data: RegisterUserInput) -> RegisteredUserOutput:
        existing = await self.repo.get_by_email(data.email)

        if existing:
            raise EmailAlreadyTakenError(data.email)

        user_id = uuid.uuid4()

        user = User(email=data.email, password=hash_string(data.password))
        security = UserSecurity(user_id=user_id)
        activity = UserActivity(user_id=user_id)

        try:
            new_user = await self.repo.create(user, security, activity)
        except IntegrityError:
            await self.db.rollback()
            raise EmailAlreadyTakenError(data.email)

        verify_token = verification_token(user_id, data.email)

        await send_email(
            to=user.email,
            subject="Verify your Eventara email",
            html=verification_email_html(verify_token),
        )

        return RegisteredUserOutput(
            user=PublicUser.model_validate(new_user),
            verification_token=verify_token,
        )

    async def verify_email(self, token: str) -> VerifiedEmailOutput:
        try:
            payload = verify_verification_token(token)
        except ValueError as exc:
            message = str(exc)
            if "expired" in message.lower():
                raise TokenExpiredError() from exc
            raise InvalidTokenError(message) from exc

        user_id = uuid.UUID(payload.sub)

        user = await self.repo.get_by_id(user_id)
        if not user:
            raise UserNotFoundError()

        updated = await self.repo.update_verification_status(user_id, verified=True)
        if not updated:
            raise EmailAlreadyVerifiedError()

        access_token = create_access_token(user_id, user.email)
        refresh_token = await create_refresh_token(user_id, self.db)

        return VerifiedEmailOutput(
            access_token=access_token,
            refresh_token=refresh_token,
        )

    async def login(self, data: LoginUserInput) -> LoginOutput:
        """Authenticate a user by email and password and return JWT tokens.

        Security note — email enumeration prevention:
            Both "email not found" and "wrong password" raise the same
            ``InvalidCredentialsError`` so an unauthenticated caller cannot
            determine whether a given email address is registered.

        Concurrency note — brute-force counter:
            Failed-login incrementing is performed with a single atomic SQL
            UPDATE (see ``UserRepository.record_failed_login``).  This prevents
            the TOCTOU race where two concurrent bad-password requests could
            both read failed_login_attempts = N, both write N+1, and agree on
            a total of N+1 instead of N+2.

        Login flow:
            1. Resolve the user by email.
            2. Reject inactive / deleted accounts.
            3. Reject currently-locked accounts.
            4. Verify the supplied password against the stored bcrypt hash.
               On failure: atomically increment the failure counter and lock
               the account if the threshold is reached.
            5. Reject unverified email addresses.
            6. Reset the failure counter and record the successful login.
            7. Issue and return an access token + refresh token pair.

        Args:
            data: A ``LoginUserInput`` carrying the candidate email and password.

        Returns:
            A ``LoginOutput`` containing ``access_token`` and ``refresh_token``.

        Raises:
            InvalidCredentialsError: The email was not found **or** the password
                did not match (combined deliberately to prevent enumeration).
            UserInactiveError: The account has been deactivated or soft-deleted.
            UserLockedError: Too many failed attempts; the account is locked.
            EmailNotVerifiedError: The user has not yet verified their email.
        """
        # --- Step 1: resolve user by email --------------------------------
        # Intentionally raise InvalidCredentialsError (not UserNotFoundError)
        # when the email is absent — this keeps the response identical to a
        # wrong-password reply, preventing email enumeration.
        user = await self.repo.get_by_email(data.email)
        if not user:
            raise InvalidCredentialsError()

        # --- Step 2: reject inactive / deleted accounts -------------------
        if user.status in (UserStatus.INACTIVE, UserStatus.DELETED):
            raise UserInactiveError()

        # --- Step 3: reject locked accounts --------------------------------
        security = await self.repo.get_security_by_user_id(user.id)
        now = datetime.now(timezone.utc)
        if security and security.locked_until:
            # locked_until is stored as a naive UTC datetime in the DB.
            locked_until_aware = security.locked_until.replace(tzinfo=timezone.utc)
            if locked_until_aware > now:
                raise UserLockedError()

        # --- Step 4: verify password ---------------------------------------
        # On mismatch, atomically increment the failure counter.  If the new
        # count reaches _MAX_FAILED_ATTEMPTS the account is locked until
        # now + _LOCKOUT_DURATION in the same SQL statement.
        if not verify_hash(data.password, user.password):
            lockout_until = now + _LOCKOUT_DURATION
            await self.repo.record_failed_login(user.id, _MAX_FAILED_ATTEMPTS, lockout_until)
            raise InvalidCredentialsError()

        # --- Step 5: require verified email --------------------------------
        if not security or not security.email_verified:
            raise EmailNotVerifiedError()

        # --- Step 6: post-auth cleanup & activity recording ---------------
        # Reset counter first so a crash between these two calls does not
        # leave the account in a partially-reset state that blocks the user.
        await self.repo.reset_failed_login(user.id)
        await self.repo.record_login(user.id)

        # --- Step 7: issue tokens ------------------------------------------
        access_token = create_access_token(user.id, user.email)
        refresh_token = await create_refresh_token(user.id, self.db)

        return LoginOutput(
            access_token=access_token,
            refresh_token=refresh_token,
        )
