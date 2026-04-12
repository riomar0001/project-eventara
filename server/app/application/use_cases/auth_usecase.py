import uuid
from datetime import UTC, datetime

from arq.connections import ArqRedis
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.dto.auth_dto import (
    ForgotPasswordInput,
    LoginInput,
    LoginOutput,
    LoginVerifyInput,
    LoginVerifyOutput,
    LogoutInput,
    RefreshTokenInput,
    RefreshTokenOutput,
    RegisteredUserOutput,
    RegisterUserInput,
    ResendVerificationInput,
    ResetPasswordInput,
    VerifiedEmailOutput,
)
from app.application.interfaces.user_interface import IUserRepository
from app.core.security.constants import LOCKOUT_DURATION, MAX_FAILED_LOGIN_ATTEMPTS
from app.core.security.hashing import hash_string, verify_hash
from app.core.security.token_service import (
    create_access_token,
    create_otp_token,
    create_password_reset_token,
    create_refresh_token,
    verification_token,
    verify_otp_token,
    verify_password_reset_token,
    verify_refresh_token,
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
from app.domain.exceptions.user_exceptions import UserNotFoundError
from app.infrastructure.cache.repositories.otp_repository import OTPRepository
from app.infrastructure.cache.repositories.password_reset_repository import PasswordResetRepository
from app.infrastructure.database.repositories.refresh_token_repository import (
    RefreshTokenRepository,
)
from app.infrastructure.messaging.auth_email_templates import otp_email_html, reset_password_email_html
from app.infrastructure.messaging.email import email_verified_html, send_email, verification_email_html


class AuthUseCase:
    """Handles all authentication flows: registration, email verification, login, logout,
    and password reset.

    Login is exclusively OTP-based and spans two steps:
    - ``login``: validates credentials, sends a 6-digit code, returns an OTP session token.
    - ``login_verify``: consumes the OTP, issues access and refresh tokens.

    Password reset spans two steps:
    - ``forgot_password``: locates the account, stores a single-use reset token in Redis,
      and emails a reset link.  Always returns successfully to prevent user enumeration.
    - ``reset_password``: validates the JWT, atomically consumes the Redis token, and
      updates the password hash in the database.

    ``logout`` revokes a single refresh token, ending the associated session.
    """

    def __init__(
        self,
        repo: IUserRepository,
        db: AsyncSession,
        arq: ArqRedis,
        otp_repo: OTPRepository | None = None,
        password_reset_repo: PasswordResetRepository | None = None,
    ) -> None:
        self.repo = repo
        self.db = db
        self.arq = arq
        self.otp_repo = otp_repo
        self.password_reset_repo = password_reset_repo

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

        now = datetime.now(UTC)
        user = User(
            email=data.email,
            password=hash_string(data.password),
            accepted_terms=data.accepted_terms,
            accepted_terms_at=now if data.accepted_terms else None,
            accepted_privacy_policy=data.accepted_privacy_policy,
            accepted_privacy_policy_at=now if data.accepted_privacy_policy else None,
        )
        security = UserSecurity(user_id=user.id)
        activity = UserActivity(user_id=user.id)

        try:
            new_user = await self.repo.create(user, security, activity)
        except IntegrityError:
            await self.db.rollback()
            raise EmailAlreadyTakenError(data.email)

        verify_token = verification_token(new_user.id, data.email)

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

        await send_email(
            self.arq,
            to=user.email,
            subject="Your Eventara email is verified",
            html=email_verified_html(user.email),
        )

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
            UserInactiveError: Account is deactivated or soft-deleted.
            UserLockedError: Account is temporarily locked after too many failures.
            EmailNotVerifiedError: Email address has not been verified.
        """
        user = await self.repo.get_by_email(email)
        if not user:
            raise InvalidCredentialsError()

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

    async def logout(self, data: LogoutInput) -> None:
        """Revoke a refresh token, terminating the associated session.

        The refresh token itself authenticates the logout request — no access
        token is required.  This allows clients to log out even when the access
        token has already expired, which is the common case for a "logout on
        next open" flow.

        Concurrency note:
            ``RefreshTokenRepository.revoke`` executes a single atomic
            ``UPDATE … WHERE is_active = TRUE``, so two simultaneous logout
            requests for the same token are both safe — whichever arrives second
            sees ``rowcount = 0`` and effectively becomes a no-op.  No additional
            locking is needed.

        Silent-success policy:
            Expired tokens and tokens that are no longer active in the database
            (already revoked or belonging to a deleted account) are treated as
            already-logged-out and return successfully.  This keeps logout
            idempotent and prevents confusing error responses when a client
            retries.  Only a structurally invalid token — one with a bad
            signature, wrong type, or unparseable format — raises an exception,
            because that can never represent a legitimate session.

        Args:
            data: A ``LogoutInput`` carrying the raw refresh token JWT.

        Raises:
            InvalidTokenError: The token is malformed, has an invalid signature,
                or is not a refresh token.  Expired and already-revoked tokens
                do NOT raise; they succeed silently.
        """
        try:
            _, token_record = await verify_refresh_token(data.refresh_token, self.db)
        except ValueError as exc:
            message = str(exc).lower()
            if "invalid token" in message or "invalid refresh token" == message:
                raise InvalidTokenError(str(exc)) from exc
            return

        repo = RefreshTokenRepository(self.db)
        await repo.revoke(token_record)

    async def refresh(self, data: RefreshTokenInput) -> RefreshTokenOutput:
        """Rotate a refresh token and issue a fresh access token.

        Implements refresh token rotation: the submitted token is revoked and
        replaced with a newly generated pair.  Clients must store the new
        refresh token and discard the old one after each successful call.

        Concurrency note — rotation race:
            ``RefreshTokenRepository.revoke`` executes a single atomic
            ``UPDATE … WHERE is_active = TRUE``.  If two requests carry the
            same refresh token simultaneously, only one will see ``rowcount = 1``
            and proceed; the other will see ``rowcount = 0`` — meaning the token
            was already rotated by the first request — and raises
            ``InvalidTokenError``.  This also acts as a reuse-detection signal:
            a revoked token being presented again may indicate theft, so the
            caller receives the same opaque error rather than a hint about what
            happened.

        Args:
            data: A ``RefreshTokenInput`` carrying the raw refresh token JWT.

        Returns:
            A ``RefreshTokenOutput`` with a fresh ``access_token`` and a new
            ``refresh_token`` to replace the submitted one.

        Raises:
            TokenExpiredError: The refresh token JWT has passed its expiry.
            InvalidTokenError: The token is malformed, has an invalid signature,
                is not found in the database, is already revoked, or was
                consumed by a concurrent rotation request.
            UserNotFoundError: No user matches the token's subject claim.
        """
        try:
            payload, token_record = await verify_refresh_token(data.refresh_token, self.db)
        except ValueError as exc:
            message = str(exc)
            if "expired" in message.lower():
                raise TokenExpiredError() from exc
            raise InvalidTokenError(message) from exc

        repo = RefreshTokenRepository(self.db)
        revoked = await repo.revoke(token_record)
        if not revoked:
            raise InvalidTokenError()

        user_id = uuid.UUID(payload.sub)
        user = await self.repo.get_by_id(user_id)
        if not user:
            raise UserNotFoundError()

        access_token = create_access_token(user.id, user.email, user.onboarding_completed)
        new_refresh_token = await create_refresh_token(user.id, self.db)

        return RefreshTokenOutput(
            access_token=access_token,
            refresh_token=new_refresh_token,
        )

    async def resend_verification(self, data: ResendVerificationInput) -> None:
        """Re-dispatch the email verification link for an unverified account.

        Silent-success policy:
            The method always returns ``None`` regardless of whether the address
            is registered, the account is inactive/deleted, or the email is
            already verified.  This prevents user enumeration — a caller cannot
            infer from the API response whether a given address exists or what
            state it is in.

        Concurrency note:
            Verification tokens are stateless JWTs.  Each call issues a fresh
            token with a new ``jti`` and a 24-hour expiry.  Previously issued
            tokens remain structurally valid until they expire, but
            ``verify_email`` guards against double-verification with an atomic
            conditional UPDATE (``WHERE email_verified != TRUE``), so at most
            one verification attempt can ever succeed regardless of how many
            tokens are in circulation.

        Args:
            data: A ``ResendVerificationInput`` with the candidate email address.
        """
        user = await self.repo.get_by_email(data.email)
        if not user or user.status in (UserStatus.INACTIVE, UserStatus.DELETED):
            return

        security = await self.repo.get_security_by_user_id(user.id)
        if security and security.email_verified:
            return

        verify_token = verification_token(user.id, user.email)

        await send_email(
            self.arq,
            to=user.email,
            subject="Verify your Eventara email",
            html=verification_email_html(verify_token),
        )

    async def forgot_password(self, data: ForgotPasswordInput) -> None:
        """Dispatch a password reset email if the address belongs to an eligible account.

        Silent-success policy:
            The method returns ``None`` regardless of whether the email address is
            registered, the account is inactive, or the email has not been verified.
            This prevents user enumeration — a caller cannot infer from the API
            response whether a given address exists in the system.

        Eligibility checks (all silent on failure):
            1. The email must belong to a registered user.
            2. The account must not be inactive or deleted.
            3. The email address must already be verified.

        Concurrency note:
            ``PasswordResetRepository.store`` executes a Redis ``SET`` which
            atomically overwrites any previously pending reset token for the same
            user.  At most one valid reset token exists per user at any time; a
            second ``forgot-password`` request immediately invalidates the first
            link that was emailed.

        Args:
            data: A ``ForgotPasswordInput`` with the candidate email address.
        """
        user = await self.repo.get_by_email(data.email)
        if not user or user.status in (UserStatus.INACTIVE, UserStatus.DELETED):
            return

        security = await self.repo.get_security_by_user_id(user.id)
        if not security or not security.email_verified:
            return

        reset_repo = self.password_reset_repo
        if reset_repo is None:
            raise RuntimeError("Password reset repository is not configured.")

        reset_token = create_password_reset_token(user.id, user.email)
        await reset_repo.store(user.id, reset_token)

        await send_email(
            self.arq,
            to=user.email,
            subject="Reset your Eventara password",
            html=reset_password_email_html(reset_token),
        )

    async def reset_password(self, data: ResetPasswordInput) -> None:
        """Validate the reset token and replace the user's password.

        The flow enforces two independent guards before writing the new password:
        1. The JWT signature and expiry are verified first.
        2. The token's SHA-256 hash must match the value stored in Redis and is
           atomically consumed (``GETDEL``) so the same token cannot be used twice.

        Concurrency note:
            Token consumption uses Redis ``GETDEL``, which atomically retrieves
            and deletes the stored hash in a single round-trip.  If two reset
            requests arrive simultaneously with the same token only one receives
            the stored hash; the other receives ``None`` and is rejected with
            ``InvalidTokenError`` without any additional locking or coordination.

        Security note — unified error response:
            An expired token, a malformed token, an already-consumed token, and
            a hash-mismatch all raise the same class of exception (either
            ``TokenExpiredError`` or ``InvalidTokenError``).  Distinguishing the
            "already used" case from the "invalid signature" case would leak
            internal Redis state to a potential attacker.

        Args:
            data: A ``ResetPasswordInput`` with the plaintext reset token JWT and
                the new plaintext password.

        Raises:
            TokenExpiredError: The reset token JWT has passed its expiry time.
            InvalidTokenError: The token is malformed, has an invalid signature,
                has already been consumed, or its hash does not match the stored value.
            UserNotFoundError: No user is associated with the token's subject claim.
        """
        try:
            payload = verify_password_reset_token(data.token)
        except ValueError as exc:
            message = str(exc)
            if "expired" in message.lower():
                raise TokenExpiredError() from exc
            raise InvalidTokenError(message) from exc

        user_id = uuid.UUID(payload.sub)

        reset_repo = self.password_reset_repo
        if reset_repo is None:
            raise RuntimeError("Password reset repository is not configured.")

        consumed = await reset_repo.verify_and_consume(user_id, data.token)
        if not consumed:
            raise InvalidTokenError("Password reset token has already been used or is invalid")

        user = await self.repo.get_by_id(user_id)
        if not user:
            raise UserNotFoundError()

        updated = await self.repo.update_password(user_id, hash_string(data.new_password))
        if not updated:
            raise UserNotFoundError()
