import uuid
from datetime import datetime, timezone

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
from app.domain.exceptions.user_exceptions import CompletedOnboardingRequiredError, UserNotFoundError
from app.application.interfaces.user_interface import IUserRepository
from app.core.security.constants import LOCKOUT_DURATION, MAX_FAILED_LOGIN_ATTEMPTS
from app.core.security.hashing import hash_string, verify_hash
from app.core.security.token_service import (
    create_access_token,
    create_refresh_token,
    verification_token,
    verify_verification_token,
)

from app.infrastructure.messaging.email import send_email, verification_email_html



class AuthUseCase:
    """Handles all authentication flows: registration, email verification, and login."""

    def __init__(self, repo: IUserRepository, db: AsyncSession) -> None:
        self.repo = repo
        self.db = db

    async def register_user(self, data: RegisterUserInput) -> RegisteredUserOutput:
        """Create a new user account and dispatch a verification email.

        The password is bcrypt-hashed before storage.  A signed verification
        token is generated and emailed to the user; the account cannot be used
        until ``verify_email`` is called with that token.

        An ``IntegrityError`` is caught as a fallback for the rare race where
        two requests register the same email simultaneously — both pass the
        initial ``get_by_email`` check but only one INSERT succeeds.

        Args:
            data: A ``RegisterUserInput`` with the candidate email and plaintext password.

        Returns:
            A ``RegisteredUserOutput`` with the new public user record and the
            plaintext verification token (exposed in DEBUG mode only).

        Raises:
            EmailAlreadyTakenError: The email address is already registered.
        """
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
        """Confirm a user's email address using a signed verification token.

        The token is decoded and validated first; the email_verified flag is
        then set via a conditional UPDATE (``WHERE email_verified != TRUE``) so
        concurrent calls for the same token cannot both succeed.  On success the
        user is issued an access token and a refresh token so they are
        immediately authenticated without a separate login step.

        Args:
            token: The plaintext signed JWT that was emailed to the user.

        Returns:
            A ``VerifiedEmailOutput`` containing a fresh access token and
            refresh token.

        Raises:
            TokenExpiredError: The verification token has passed its expiry time.
            InvalidTokenError: The token is malformed or has an invalid signature.
            UserNotFoundError: No user is associated with the token's subject claim.
            EmailAlreadyVerifiedError: The email address was already verified
                (guards against double-submission or replay).
        """
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
            UPDATE (see ``UserRepository.record_failed_login``). This prevents
            the TOCTOU race where two concurrent bad-password requests could
            both read failed_login_attempts = N, both write N + 1, and end up
            with a total of N + 1 instead of N + 2.

        Login flow:
            1. Resolve the user by email.
            2. Reject if onboarding is not completed.
            3. Reject inactive / deleted accounts.
            4. Reject currently locked accounts.
            5. Verify the supplied password against the stored bcrypt hash.
               On failure: atomically increment the failure counter and lock
               the account if the threshold is reached.
            6. Reject unverified email addresses.
            7. Reset the failure counter and record the successful login.
            8. Issue and return an access token + refresh token pair.

        Args:
            data: A ``LoginUserInput`` carrying the candidate email and password.

        Returns:
            A ``LoginOutput`` containing ``access_token`` and ``refresh_token``.

        Raises:
            InvalidCredentialsError: The email was not found or the password
            did not match (combined deliberately to prevent enumeration).
            CompletedOnboardingRequiredError: The user has not completed onboarding.
            UserInactiveError: The account has been deactivated or soft-deleted.
            UserLockedError: Too many failed attempts; the account is locked.
            EmailNotVerifiedError: The user has not yet verified their email.
        """

        user = await self.repo.get_by_email(data.email)
        if not user:
            raise InvalidCredentialsError()
        
        if not user.onboarding_completed:
            raise CompletedOnboardingRequiredError()

        if user.status in (UserStatus.INACTIVE, UserStatus.DELETED):
            raise UserInactiveError()

        security = await self.repo.get_security_by_user_id(user.id)
        now = datetime.now(timezone.utc)
        if security and security.locked_until:
            locked_until_aware = security.locked_until.replace(tzinfo=timezone.utc)
            if locked_until_aware > now:
                raise UserLockedError()

        if not verify_hash(data.password, user.password):
            lockout_until = now + LOCKOUT_DURATION
            await self.repo.record_failed_login(user.id, MAX_FAILED_LOGIN_ATTEMPTS, lockout_until)
            raise InvalidCredentialsError()

        if not security or not security.email_verified:
            raise EmailNotVerifiedError()

        await self.repo.reset_failed_login(user.id)
        await self.repo.record_login(user.id)

        access_token = create_access_token(user.id, user.email)
        refresh_token = await create_refresh_token(user.id, self.db)

        return LoginOutput(
            access_token=access_token,
            refresh_token=refresh_token,
        )
