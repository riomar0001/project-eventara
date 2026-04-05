import uuid
from datetime import UTC, datetime

from arq.connections import ArqRedis
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.dto.auth_dto import (
    LoginInput,
    LoginOutput,
    LoginVerifyInput,
    LoginVerifyOutput,
    RegisteredUserOutput,
    RegisterUserInput,
    VerifiedEmailOutput,
)
from app.application.interfaces.user_interface import IUserRepository
from app.core.security.constants import LOCKOUT_DURATION, MAX_FAILED_LOGIN_ATTEMPTS
from app.core.security.hashing import hash_string, verify_hash
from app.core.security.token_service import (
    create_access_token,
    create_otp_token,
    create_refresh_token,
    verification_token,
    verify_otp_token,
    verify_verification_token,
)
from app.domain.entities.user_entity import (
    PublicUser,
    User,
    UserActivity,
    UserSecurity,
    UserStatus,
)
from app.domain.exceptions import (
    EmailAlreadyTakenError,
    EmailAlreadyVerifiedError,
    EmailNotVerifiedError,
    InvalidCredentialsError,
    InvalidOTPError,
    InvalidTokenError,
    TokenExpiredError,
    UserInactiveError,
    UserLockedError,
)
from app.domain.exceptions.user_exceptions import (
    CompletedOnboardingRequiredError,
    UserNotFoundError,
)
from app.infrastructure.cache.repositories.otp_repository import OTPRepository
from app.infrastructure.messaging.auth_email_templates import otp_email_html
from app.infrastructure.messaging.email import send_email, verification_email_html


class AuthUseCase:
    """Handles all authentication flows: registration, email verification, and login.

    Supports two login modes:
    - **Direct login** (``login``): single-step credential validation returning tokens.
    - **OTP login** (``login_init`` + ``login_verify``): two-step flow where
      credentials are validated first and an OTP is sent, then the OTP is verified
      before tokens are issued.
    """

    def __init__(
        self,
        repo: IUserRepository,
        db: AsyncSession,
        arq: ArqRedis,
        otp_repo: OTPRepository | None = None,
    ) -> None:
        self.repo = repo
        self.db = db
        self.arq = arq
        self.otp_repo = otp_repo

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
            self.arq,
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

        access_token = create_access_token(user_id, user.email, user.onboarding_completed)
        refresh_token = await create_refresh_token(user_id, self.db)

        return VerifiedEmailOutput(
            access_token=access_token,
            refresh_token=refresh_token,
        )

    async def _authenticate_user(self, email: str, password: str) -> User:
        """Validate email and password and return the corresponding user entity.

        This private helper centralises the credential-checking logic shared
        by ``login`` and ``login_init``, keeping both callers DRY while
        preserving a single place to update security policy.

        Concurrency note — brute-force counter:
            Failed-login incrementing is performed with a single atomic SQL
            UPDATE (``UserRepository.record_failed_login``).  This prevents
            the TOCTOU race where two concurrent bad-password requests both
            read ``failed_login_attempts = N``, both write ``N + 1``, and end
            up with ``N + 1`` instead of ``N + 2``.

        Security note — email enumeration prevention:
            Both "email not found" and "wrong password" raise the same
            ``InvalidCredentialsError`` so an unauthenticated caller cannot
            determine whether a given address is registered.

        Args:
            email:    The candidate email address.
            password: The candidate plaintext password.

        Returns:
            The authenticated ``User`` entity on success.

        Raises:
            InvalidCredentialsError: Email not registered or password incorrect.
            CompletedOnboardingRequiredError: User has not completed onboarding.
            UserInactiveError: Account is deactivated or soft-deleted.
            UserLockedError: Account is temporarily locked after too many failures.
            EmailNotVerifiedError: Email address has not been verified.
        """
        user = await self.repo.get_by_email(email)
        if not user:
            raise InvalidCredentialsError()

        if not user.onboarding_completed:
            raise CompletedOnboardingRequiredError()

        if user.status in (UserStatus.INACTIVE, UserStatus.DELETED):
            raise UserInactiveError()

        security = await self.repo.get_security_by_user_id(user.id)
        now = datetime.now(UTC)
        if security and security.locked_until:
            locked_until_aware = security.locked_until.replace(tzinfo=UTC)
            if locked_until_aware > now:
                raise UserLockedError()

        if not verify_hash(password, user.password):
            lockout_until = now + LOCKOUT_DURATION
            await self.repo.record_failed_login(user.id, MAX_FAILED_LOGIN_ATTEMPTS, lockout_until)
            raise InvalidCredentialsError()

        if not security or not security.email_verified:
            raise EmailNotVerifiedError()

        return user

    async def login(self, data: LoginInput) -> LoginOutput:
        """Validate credentials, generate an OTP, and return an OTP session token.

        This is the first step of the two-step OTP login flow.  On success a
        6-digit code is emailed to the user and a short-lived ``verification_token``
        (JWT) is returned.  The client must submit that token together with the
        code to ``login_verify`` to complete sign-in.

        Concurrency note:
            OTP creation uses Redis ``SET``, which atomically overwrites any
            previously active code for the same user.  At most one valid OTP
            exists per user at any point in time.

        Security note:
            The brute-force failure counter is NOT reset here — it is only reset
            after the full two-step flow completes in ``login_verify``.  This
            prevents an attacker who knows the password from resetting the counter
            without completing MFA.

        Args:
            data: A ``LoginInitInput`` with the candidate email and password.

        Returns:
            A ``LoginInitOutput`` containing the ``verification_token`` to submit
            to ``login_verify``.

        Raises:
            InvalidCredentialsError: Email not found or password incorrect.
            CompletedOnboardingRequiredError: User has not completed onboarding.
            UserInactiveError: Account is deactivated or soft-deleted.
            UserLockedError: Account locked after too many failed attempts.
            EmailNotVerifiedError: Email address has not been verified.
        """
        user = await self._authenticate_user(data.email, data.password)

        otp_repo = self.otp_repo
        if otp_repo is None:
            raise RuntimeError("OTP repository is not configured.")

        code = await otp_repo.create_for_user(user.id)

        await send_email(
            self.arq,
            to=user.email,
            subject="Your Eventara login code",
            html=otp_email_html(code),
        )

        token = create_otp_token(user.id, user.email)

        return LoginOutput(verification_token=token)

    async def login_verify(self, data: LoginVerifyInput) -> LoginVerifyOutput:
        """Verify the OTP code and issue JWT tokens to complete the OTP login flow.

        This is the second step of the two-step OTP login flow.  The client
        must supply the ``verification_token`` obtained from ``login_init`` plus
        the 6-digit code delivered to the user's email.

        Concurrency note:
            OTP verification uses Redis ``GETDEL``, which atomically retrieves
            and deletes the stored hash in a single round-trip.  If two requests
            arrive simultaneously with the same code only one can succeed — the
            second call receives ``None`` from ``GETDEL`` and is rejected.  This
            makes the OTP single-use by design and prevents replay attacks.

        Security note — unified error response:
            A wrong code, an already-consumed code, and an expired code all raise
            the same ``InvalidOTPError``.  Distinguishing these cases would let an
            attacker probe the internal OTP state; a uniform response prevents that.

        Args:
            data: A ``LoginVerifyInput`` carrying the ``token`` (from
                ``login_init``) and the plaintext 6-digit ``code``.

        Returns:
            A ``LoginVerifyOutput`` containing ``access_token`` and
            ``refresh_token`` for the authenticated session.

        Raises:
            TokenExpiredError: The OTP session token has passed its expiry.
            InvalidTokenError: The token is malformed or has an invalid signature.
            InvalidOTPError: The code is wrong, expired, or already consumed.
            UserNotFoundError: No user matches the token's subject claim.
        """
        # Decode and validate the OTP session token.
        try:
            payload = verify_otp_token(data.token)
        except ValueError as exc:
            message = str(exc)
            if "expired" in message.lower():
                raise TokenExpiredError() from exc
            raise InvalidTokenError(message) from exc

        user_id = uuid.UUID(payload.sub)

        otp_repo = self.otp_repo
        if otp_repo is None:
            raise RuntimeError("OTP repository is not configured.")

        valid = await otp_repo.verify_and_consume(user_id, data.code)
        if not valid:
            raise InvalidOTPError()

        user = await self.repo.get_by_id(user_id)
        if not user:
            raise UserNotFoundError()

        await self.repo.reset_failed_login(user_id)
        await self.repo.record_login(user_id)

        access_token = create_access_token(user.id, user.email, user.onboarding_completed)
        refresh_token = await create_refresh_token(user.id, self.db)

        return LoginVerifyOutput(
            access_token=access_token,
            refresh_token=refresh_token,
        )
