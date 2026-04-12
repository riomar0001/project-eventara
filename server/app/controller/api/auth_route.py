from fastapi import APIRouter, Depends, HTTPException, Path, Response, status

from app.application.dto.auth_dto import (
    ForgotPasswordInput,
    LoginInput,
    LoginVerifyInput,
    LogoutInput,
    RefreshTokenInput,
    RegisterUserInput,
    ResendVerificationInput,
    ResetPasswordInput,
)
from app.application.use_cases.auth_usecase import AuthUseCase
from app.controller.dependencies import get_auth_use_case, login_rate_limit
from app.controller.docs.auth_docs import (
    EMAIL_ALREADY_VERIFIED,
    EMAIL_CONFLICT,
    EMAIL_NOT_VERIFIED,
    FORGOT_PASSWORD_VALIDATION_ERROR,
    INVALID_CREDENTIALS,
    INVALID_OTP,
    INVALID_TOKEN,
    LOGIN_INIT_VALIDATION_ERROR,
    LOGIN_RATE_LIMITED,
    LOGIN_VERIFY_VALIDATION_ERROR,
    LOGOUT_INVALID_TOKEN,
    LOGOUT_VALIDATION_ERROR,
    OTP_TOKEN_EXPIRED,
    OTP_TOKEN_INVALID,
    REFRESH_TOKEN_EXPIRED,
    REFRESH_TOKEN_INVALID,
    REFRESH_VALIDATION_ERROR,
    REGISTER_VALIDATION_ERROR,
    RESEND_VERIFICATION_VALIDATION_ERROR,
    RESET_PASSWORD_TOKEN_EXPIRED,
    RESET_PASSWORD_TOKEN_INVALID,
    RESET_PASSWORD_VALIDATION_ERROR,
    TOKEN_EXPIRED,
    USER_INACTIVE,
    USER_LOCKED,
    USER_NOT_FOUND,
    VERIFY_TOKEN_VALIDATION_ERROR,
)
from app.controller.schemas.auth_schema import (
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    LoginInitResponse,
    LoginRequest,
    LoginVerifyRequest,
    LoginVerifyResponse,
    LogoutRequest,
    LogoutResponse,
    RefreshTokenRequest,
    RefreshTokenResponse,
    RegisterRequest,
    RegisterResponse,
    ResendVerificationRequest,
    ResendVerificationResponse,
    ResetPasswordRequest,
    ResetPasswordResponse,
    VerifyEmailResponse,
)
from app.core.config import settings
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

router = APIRouter(prefix="/auth", tags=["Authentication"])


def _set_auth_cookies(response: Response, access_token: str, refresh_token: str) -> None:
    secure = not settings.DEBUG
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=secure,
        samesite="lax",
        max_age=int(settings.ACCESS_TOKEN_EXPIRATION.total_seconds()),
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=secure,
        samesite="lax",
        max_age=int(settings.REFRESH_TOKEN_EXPIRATION.total_seconds()),
    )


def _clear_auth_cookies(response: Response) -> None:
    response.delete_cookie(key="access_token")
    response.delete_cookie(key="refresh_token")


@router.post(
    "/register",
    response_model=RegisterResponse,
    status_code=status.HTTP_201_CREATED,
    responses={**EMAIL_CONFLICT, **REGISTER_VALIDATION_ERROR},
    summary="Register a new user",
    description=(
        "Create a new user account with an email and password. "
        "A verification email is sent immediately after registration. "
        "The account cannot be used until the email is verified."
    ),
)
async def register_user(
    body: RegisterRequest,
    use_case: AuthUseCase = Depends(get_auth_use_case),
) -> RegisterResponse:
    """Register a new user account.

    # Error mapping
    - **409 Conflict** — the email address is already registered.
    - **422 Unprocessable Entity** — request body failed schema validation
      (e.g. invalid email format or password shorter than 8 characters).
    """
    try:
        new_user = await use_case.register_user(
            RegisterUserInput(
                email=body.email,
                password=body.password,
            )
        )
    except EmailAlreadyTakenError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error))

    return RegisterResponse(
        user_id=new_user.user.id,
        email=new_user.user.email,
        verification_token=new_user.verification_token if settings.DEBUG else None,
    )


@router.get(
    "/verify/{token}",
    response_model=VerifyEmailResponse,
    status_code=status.HTTP_200_OK,
    responses={
        **INVALID_TOKEN,
        **TOKEN_EXPIRED,
        **USER_NOT_FOUND,
        **EMAIL_ALREADY_VERIFIED,
        **VERIFY_TOKEN_VALIDATION_ERROR,
    },
    summary="Verify email address",
    description=(
        "Confirm a user's email address using the verification token sent after registration. "
        "On success, returns an access token and a refresh token so the user is "
        "immediately authenticated without a separate login step."
    ),
)
async def verify_email(
    response: Response,
    token: str = Path(..., min_length=1),
    use_case: AuthUseCase = Depends(get_auth_use_case),
) -> VerifyEmailResponse:
    """Verify a user's email address with a signed token.

    # Error mapping
    - **400 Bad Request** — token is malformed or has an invalid signature.
    - **401 Unauthorized** — token has expired; the user must request a new one.
    - **404 Not Found** — no user is associated with this token.
    - **409 Conflict** — the email address has already been verified.
    - **422 Unprocessable Entity** — the token path parameter is empty.
    """
    try:
        result = await use_case.verify_email(token)
    except TokenExpiredError as error:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(error))
    except InvalidTokenError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error))
    except UserNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error))
    except EmailAlreadyVerifiedError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error))

    _set_auth_cookies(response, result.access_token, result.refresh_token)
    return VerifyEmailResponse(
        access_token=result.access_token,
        refresh_token=result.refresh_token,
    )


@router.post(
    "/resend-verification",
    response_model=ResendVerificationResponse,
    status_code=status.HTTP_200_OK,
    responses={**RESEND_VERIFICATION_VALIDATION_ERROR},
    summary="Resend email confirmation link",
    description=(
        "Re-dispatch the email verification link for an unverified account. "
        "The response is always 200 OK regardless of whether the address is registered, "
        "the account is inactive, or the email is already verified — "
        "this prevents user enumeration. "
        "Each call issues a fresh signed token; previously sent links remain valid "
        "until they expire, but the verification endpoint's conditional UPDATE ensures "
        "only the first successful confirmation is ever applied."
    ),
)
async def resend_verification(
    body: ResendVerificationRequest,
    use_case: AuthUseCase = Depends(get_auth_use_case),
) -> ResendVerificationResponse:
    """Re-send the email verification link for an unverified account.

    # Error mapping
    - **422 Unprocessable Entity** — the ``email`` field is missing or not a
      valid email address.
    - All other failure conditions (unknown email, inactive account, already
      verified) return **200 OK** to prevent user enumeration.
    """
    await use_case.resend_verification(ResendVerificationInput(email=body.email))
    return ResendVerificationResponse()


@router.post(
    "/login",
    response_model=LoginInitResponse,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(login_rate_limit)],
    responses={
        **INVALID_CREDENTIALS,
        **USER_INACTIVE,
        **USER_LOCKED,
        **EMAIL_NOT_VERIFIED,
        **LOGIN_RATE_LIMITED,
        **LOGIN_INIT_VALIDATION_ERROR,
    },
    summary="Login and request OTP",
    description=(
        "First step of the two-step OTP login flow. "
        "Validates the supplied email and password against the same security checks "
        "as the direct login endpoint (account status, lock status, email verification). "
        "On success, a 6-digit one-time code is emailed to the account and a short-lived "
        "``verification_token`` is returned. "
        "That token must be submitted together with the code to ``POST /auth/login/verify`` "
        "to complete sign-in and obtain access and refresh tokens. "
        "The OTP expires in 10 minutes and is single-use — submitting a wrong code "
        "immediately invalidates it and a new one must be requested. "
        "Subject to the same rate limits as the direct login endpoint."
    ),
)
async def login(
    body: LoginRequest,
    use_case: AuthUseCase = Depends(get_auth_use_case),
) -> LoginInitResponse:
    """Validate credentials and dispatch a one-time passcode to the user's email.

    # Error mapping
    - **401 Unauthorized** — wrong email or wrong password (combined to prevent
      email enumeration).
    - **403 Forbidden** — account is inactive/deleted or email not yet verified.
    - **423 Locked** — account is temporarily locked after 5 consecutive failed
      credential attempts.
    - **429 Too Many Requests** — per-IP or per-account rate limit exceeded;
      check the ``Retry-After`` header.
    - **422 Unprocessable Entity** — request body failed schema validation.
    """
    try:
        result = await use_case.login(LoginInput(email=body.email, password=body.password))
    except InvalidCredentialsError as error:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(error))
    except UserInactiveError as error:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(error))
    except UserLockedError as error:
        raise HTTPException(status_code=status.HTTP_423_LOCKED, detail=str(error))
    except EmailNotVerifiedError as error:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(error))

    return LoginInitResponse(verification_token=result.verification_token)


@router.post(
    "/login/verify",
    response_model=LoginVerifyResponse,
    status_code=status.HTTP_200_OK,
    responses={
        **OTP_TOKEN_INVALID,
        **OTP_TOKEN_EXPIRED,
        **INVALID_OTP,
        **USER_NOT_FOUND,
        **LOGIN_VERIFY_VALIDATION_ERROR,
    },
    summary="Verify OTP and complete login",
    description=(
        "Second and final step of the two-step OTP login flow. "
        "Accepts the ``verification_token`` returned by ``POST /auth/login`` "
        "and the 6-digit one-time code delivered to the user's email address. "
        "The OTP is consumed atomically — submitting any code (correct or incorrect) "
        "invalidates it immediately, making replay attacks impossible. "
        "On success, returns a short-lived access token and a long-lived refresh token "
        "identical in format to the direct login response."
    ),
)
async def login_verify(
    response: Response,
    body: LoginVerifyRequest,
    use_case: AuthUseCase = Depends(get_auth_use_case),
) -> LoginVerifyResponse:
    """Verify the OTP code and return JWT tokens to complete the OTP login flow.

    # Error mapping
    - **400 Bad Request** — ``token`` is malformed or has an invalid signature.
    - **401 Unauthorized** — ``token`` has expired (restart the flow via
      ``/login/init``), or the OTP code is wrong, already consumed, or expired
      (all combined into one response to avoid leaking internal OTP state).
    - **404 Not Found** — no user found for the token's subject claim (should
      not occur in normal operation; guard against stale tokens from deleted accounts).
    - **422 Unprocessable Entity** — ``token`` is empty or ``code`` is not exactly
      6 digits.
    """
    try:
        result = await use_case.login_verify(LoginVerifyInput(token=body.token, code=body.code))
    except TokenExpiredError as error:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(error))
    except InvalidTokenError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error))
    except InvalidOTPError as error:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(error))
    except UserNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error))

    _set_auth_cookies(response, result.access_token, result.refresh_token)
    return LoginVerifyResponse(
        access_token=result.access_token,
        refresh_token=result.refresh_token,
    )


@router.post(
    "/logout",
    response_model=LogoutResponse,
    status_code=status.HTTP_200_OK,
    responses={
        **LOGOUT_INVALID_TOKEN,
        **LOGOUT_VALIDATION_ERROR,
    },
    summary="Log out",
    description=(
        "Revoke a refresh token, ending the associated session. "
        "The refresh token authenticates the request — no access token is required, "
        "so clients can log out even after the access token has expired. "
        "Logout is idempotent: already-expired and already-revoked tokens return "
        "200 OK, because the session is effectively dead regardless. "
        "Only a structurally invalid token (bad signature, wrong type) returns an error."
    ),
)
async def logout(
    response: Response,
    body: LogoutRequest,
    use_case: AuthUseCase = Depends(get_auth_use_case),
) -> LogoutResponse:
    """Revoke a refresh token to end the user's session.

    # Error mapping
    - **400 Bad Request** — the refresh token is structurally invalid (bad
      signature, wrong JWT type, or unparseable format).  This is the only
      error case; expired and already-revoked tokens succeed silently.
    - **422 Unprocessable Entity** — the ``refresh_token`` field is missing.
    """
    try:
        await use_case.logout(LogoutInput(refresh_token=body.refresh_token))
    except InvalidTokenError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error))

    _clear_auth_cookies(response)
    return LogoutResponse()


@router.post(
    "/refresh",
    response_model=RefreshTokenResponse,
    status_code=status.HTTP_200_OK,
    responses={
        **REFRESH_TOKEN_EXPIRED,
        **REFRESH_TOKEN_INVALID,
        **USER_NOT_FOUND,
        **REFRESH_VALIDATION_ERROR,
    },
    summary="Refresh access token",
    description=(
        "Exchange a valid refresh token for a new access token and a rotated refresh token. "
        "The submitted refresh token is immediately revoked and replaced — clients must "
        "store the new refresh token from the response. "
        "If two requests arrive simultaneously with the same token, only one will succeed; "
        "the other receives 401, preventing parallel rotation races. "
        "Presenting an already-revoked token also returns 401 with the same opaque error "
        "to avoid leaking rotation state to potential attackers."
    ),
)
async def refresh_token(
    response: Response,
    body: RefreshTokenRequest,
    use_case: AuthUseCase = Depends(get_auth_use_case),
) -> RefreshTokenResponse:
    """Rotate a refresh token and return a new access and refresh token pair.

    # Error mapping
    - **401 Unauthorized** — token is expired, invalid, revoked, not found,
      or was already rotated by a concurrent request (all cases return the
      same opaque response to avoid leaking rotation state).
    - **404 Not Found** — no user matches the token's subject claim.
    - **422 Unprocessable Entity** — ``refresh_token`` field is missing or empty.
    """
    try:
        result = await use_case.refresh(RefreshTokenInput(refresh_token=body.refresh_token))
    except TokenExpiredError as error:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(error))
    except InvalidTokenError as error:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(error))
    except UserNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error))

    _set_auth_cookies(response, result.access_token, result.refresh_token)
    return RefreshTokenResponse(
        access_token=result.access_token,
        refresh_token=result.refresh_token,
    )


@router.post(
    "/forgot-password",
    response_model=ForgotPasswordResponse,
    status_code=status.HTTP_200_OK,
    responses={**FORGOT_PASSWORD_VALIDATION_ERROR},
    summary="Request a password reset email",
    description=(
        "Send a password reset link to the given email address. "
        "The response is always 200 OK regardless of whether the address is registered — "
        "this prevents user enumeration attacks. "
        "If the account is eligible (active, email verified), a signed single-use reset "
        "token is stored in Redis and emailed as a link. "
        "Any previously pending reset token for the same account is atomically overwritten, "
        "so only the most recently requested link is valid. "
        "The link expires in 1 hour and can only be used once."
    ),
)
async def forgot_password(
    body: ForgotPasswordRequest,
    use_case: AuthUseCase = Depends(get_auth_use_case),
) -> ForgotPasswordResponse:
    """Dispatch a password reset email for the given address.

    # Error mapping
    - **422 Unprocessable Entity** — the ``email`` field is missing or not a
      valid email address.
    - All other failure conditions (unknown email, inactive account, unverified
      email) return **200 OK** to prevent user enumeration.
    """
    await use_case.forgot_password(ForgotPasswordInput(email=body.email))
    return ForgotPasswordResponse()


@router.post(
    "/reset-password/{token}",
    response_model=ResetPasswordResponse,
    status_code=status.HTTP_200_OK,
    responses={
        **RESET_PASSWORD_TOKEN_EXPIRED,
        **RESET_PASSWORD_TOKEN_INVALID,
        **USER_NOT_FOUND,
        **RESET_PASSWORD_VALIDATION_ERROR,
    },
    summary="Reset password using a reset token",
    description=(
        "Consume a single-use password reset token and replace the account password. "
        "The token is taken from the URL path and validated in two stages: the JWT "
        "signature and expiry are verified first, then the token's SHA-256 hash is "
        "atomically retrieved and deleted from Redis (``GETDEL``), making replay attacks "
        "impossible. "
        "If two requests arrive simultaneously with the same token only one will succeed; "
        "the second receives 400 with the same opaque error as an invalid token to avoid "
        "leaking whether the token was consumed by a concurrent request. "
        "On success the new password is persisted and the reset timestamp is updated."
    ),
)
async def reset_password(
    body: ResetPasswordRequest,
    token: str = Path(..., min_length=1),
    use_case: AuthUseCase = Depends(get_auth_use_case),
) -> ResetPasswordResponse:
    """Validate a reset token from the URL path and update the account password.

    # Error mapping
    - **400 Bad Request** — the token is malformed, has an invalid signature,
      has already been consumed, or was rejected by a concurrent reset request.
    - **401 Unauthorized** — the reset token JWT has expired; the user must
      request a new reset link via ``POST /auth/forgot-password``.
    - **404 Not Found** — no user is associated with the token's subject claim
      (guard against stale tokens from deleted accounts).
    - **422 Unprocessable Entity** — ``token`` path parameter is empty or
      ``new_password`` is shorter than 8 characters.
    """
    try:
        await use_case.reset_password(ResetPasswordInput(token=token, new_password=body.new_password))
    except TokenExpiredError as error:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(error))
    except InvalidTokenError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error))
    except UserNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error))

    return ResetPasswordResponse()
