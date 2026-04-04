from fastapi import APIRouter, Depends, HTTPException, Path, status

from app.controller.dependencies import get_auth_use_case
from app.controller.schemas.auth_schema import (
    LoginRequest,
    LoginResponse,
    VerifyEmailResponse,
    RegisterRequest,
    RegisterResponse,
)
from app.controller.docs.auth_docs import (
    EMAIL_ALREADY_VERIFIED,
    EMAIL_CONFLICT,
    EMAIL_NOT_VERIFIED,
    INVALID_CREDENTIALS,
    INVALID_TOKEN,
    LOGIN_VALIDATION_ERROR,
    REGISTER_VALIDATION_ERROR,
    TOKEN_EXPIRED,
    USER_INACTIVE,
    USER_LOCKED,
    USER_NOT_FOUND,
    VERIFY_TOKEN_VALIDATION_ERROR,
)


from app.application.use_cases.auth_usecase import AuthUseCase
from app.application.dto.auth_dto import RegisterUserInput
from app.domain.exceptions import (
    EmailAlreadyTakenError,
    EmailAlreadyVerifiedError,
    EmailNotVerifiedError,
    InvalidCredentialsError,
    InvalidTokenError,
    TokenExpiredError,
    UserInactiveError,
    UserLockedError,
)
from app.domain.exceptions.user_exceptions import UserNotFoundError
from app.application.dto.auth_dto import LoginUserInput
from app.core.config import settings


router = APIRouter(prefix="/auth", tags=["Authentication"])


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


@router.post(
    "/verify/{token}",
    response_model=VerifyEmailResponse,
    status_code=status.HTTP_200_OK,
    responses={**INVALID_TOKEN, **TOKEN_EXPIRED, **USER_NOT_FOUND, **EMAIL_ALREADY_VERIFIED, **VERIFY_TOKEN_VALIDATION_ERROR},
    summary="Verify email address",
    description=(
        "Confirm a user's email address using the verification token sent after registration. "
        "On success, returns an access token and a refresh token so the user is "
        "immediately authenticated without a separate login step."
    ),
)
async def verify_email(
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

    return VerifyEmailResponse(
        access_token=result.access_token,
        refresh_token=result.refresh_token,
    )


@router.post(
    "/login",
    response_model=LoginResponse,
    status_code=status.HTTP_200_OK,
    responses={
        **INVALID_CREDENTIALS,
        **USER_INACTIVE,
        **USER_LOCKED,
        **EMAIL_NOT_VERIFIED,
        **LOGIN_VALIDATION_ERROR,
    },
    summary="User login",
    description=(
        "Authenticate with a registered email and password. "
        "Returns a short-lived access token and a long-lived refresh token. "
        "Accounts are temporarily locked after 5 consecutive failed attempts."
    ),
)
async def login_user(
    body: LoginRequest,
    use_case: AuthUseCase = Depends(get_auth_use_case),
) -> LoginResponse:
    """Log in with email and password.

    # Error mapping
    - **401 Unauthorized** — wrong email or wrong password (combined to prevent
      email enumeration: callers cannot distinguish between the two cases).
    - **403 Forbidden** — account is inactive/deleted, or email not yet verified.
    - **423 Locked** — account is temporarily locked due to too many failed
      login attempts; the client should wait before retrying.
    - **422 Unprocessable Entity** — request body failed schema validation.
    """
    try:
        result = await use_case.login(
            LoginUserInput(email=body.email, password=body.password)
        )
    except InvalidCredentialsError as error:
        # 401: wrong credentials — same response for "not found" and "wrong password"
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(error))
    except UserInactiveError as error:
        # 403: account deactivated or soft-deleted
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(error))
    except UserLockedError as error:
        # 423: brute-force lockout — RFC 4918 "Locked"
        raise HTTPException(status_code=status.HTTP_423_LOCKED, detail=str(error))
    except EmailNotVerifiedError as error:
        # 403: email verification is a prerequisite for login
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(error))

    return LoginResponse(
        access_token=result.access_token,
        refresh_token=result.refresh_token,
    )
