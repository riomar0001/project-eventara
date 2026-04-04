from fastapi import APIRouter, Depends, HTTPException, Path, status

from app.controller.dependencies import get_auth_use_case
from app.controller.schemas.auth_schema import (
    EmailVerifyResponse,
    RegisterRequest,
    RegisterResponse,
)
from app.controller.docs.auth_docs import (
    EMAIL_ALREADY_VERIFIED,
    EMAIL_CONFLICT,
    INVALID_TOKEN,
    REGISTER_VALIDATION_ERROR,
    TOKEN_EXPIRED,
    USER_NOT_FOUND,
    VERIFY_TOKEN_VALIDATION_ERROR,
)


from app.application.use_cases.auth_usecase import AuthUseCase
from app.application.dto.auth_dto import RegisterUserInput
from app.domain.exceptions import (
    EmailAlreadyTakenError,
    EmailAlreadyVerifiedError,
    InvalidTokenError,
    TokenExpiredError,
)
from app.domain.exceptions.user_exceptions import UserNotFoundError
from app.core.config import settings


router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=RegisterResponse,
    status_code=status.HTTP_201_CREATED,
    responses={**EMAIL_CONFLICT, **REGISTER_VALIDATION_ERROR},
)
async def register(
    body: RegisterRequest,
    use_case: AuthUseCase = Depends(get_auth_use_case),
) -> RegisterResponse:
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
    response_model=EmailVerifyResponse,
    status_code=status.HTTP_200_OK,
    responses={**INVALID_TOKEN, **TOKEN_EXPIRED, **USER_NOT_FOUND, **EMAIL_ALREADY_VERIFIED, **VERIFY_TOKEN_VALIDATION_ERROR},
)
async def email_verify(
    token: str = Path(..., min_length=1),
    use_case: AuthUseCase = Depends(get_auth_use_case),
) -> EmailVerifyResponse:
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

    return EmailVerifyResponse(
        access_token=result.access_token,
        refresh_token=result.refresh_token,
    )
