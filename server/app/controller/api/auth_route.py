import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.controller.dependencies import get_auth_use_case
from app.controller.schemas.auth_schema import (
    EmailVerifyRequest,
    EmailVerifyResponse,
    LoginInitResponse,
    LoginRequest,
    LoginResponse,
    LoginVerifyRequest,
    LogoutRequest,
    LogoutResponse,
    RegisterRequest,
    RegisterResponse,
)
from app.controller.schemas.responses import EMAIL_CONFLICT, VALIDATION_ERROR
from app.application.use_cases.auth_usecase import AuthUseCase, LoginUserInput, RegisterUserInput
from app.domain.exceptions import EmailAlreadyTakenError
from app.infrastructure.repositories.one_time_code_repository import OneTimeCodeRepository
from app.infrastructure.repositories.refresh_token_repository import RefreshTokenRepository
from app.infrastructure.repositories.user_repository import UserRepository
from app.infrastructure.database.session import get_db
from app.infrastructure.messaging.email import otp_email_html, send_email, verification_email_html
from app.core.security.hashing import verify_hash
from app.core.security.token_service import (
    issue_tokens,
    verification_token,
    verify_refresh_token,
    verify_verification_token,
)

from app.core.config import settings


router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=RegisterResponse,
    status_code=status.HTTP_201_CREATED,
    responses={**EMAIL_CONFLICT, **VALIDATION_ERROR},
)
async def register(
    body: RegisterRequest,
    use_case: AuthUseCase = Depends(get_auth_use_case),
) -> RegisterResponse:
    try:
        new_user = await use_case.register(
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
        verification_token=new_user.verification_token if settings.DEBUG else None
        )


# @router.post("/email/verify", response_model=EmailVerifyResponse, status_code=status.HTTP_200_OK)
# async def email_verify(
#     body: EmailVerifyRequest,
#     db: AsyncSession = Depends(get_db),
# ) -> EmailVerifyResponse:
#     try:
#         payload = verify_verification_token(body.token)
#     except ValueError as error:
#         raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error))

#     user_repo = UserRepository(db)
#     result = await user_repo.get_by_id_with_profile(uuid.UUID(payload.sub))
#     if not result:
#         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

#     user, profile = result
#     await user_repo.update_email_verified(user.id)
#     access_token, refresh_token = await issue_tokens(user.id, profile, db)

#     return EmailVerifyResponse(access_token=access_token, refresh_token=refresh_token)


# @router.post("/login", response_model=LoginInitResponse, status_code=status.HTTP_200_OK)
# async def login(
#     body: LoginRequest,
#     use_case: AuthUseCase = Depends(get_auth_use_case),
#     db: AsyncSession = Depends(get_db),
# ) -> LoginInitResponse:
#     user = await use_case.login(LoginUserInput(email=body.email, password=body.password))
#     if not user:
#         raise HTTPException(
#             status_code=status.HTTP_401_UNAUTHORIZED,
#             detail="Invalid email or password",
#         )

#     code = await OneTimeCodeRepository(db).create_for_user(user.id)
#     verify_tok = verification_token(user.id, user.email)
#     await send_email(
#         to=user.email,
#         subject="Your Eventara login code",
#         html=otp_email_html(code),
#     )

#     return LoginInitResponse(verification_token=verify_tok)


# @router.post("/login/verify", response_model=LoginResponse, status_code=status.HTTP_200_OK)
# async def login_verify(
#     body: LoginVerifyRequest,
#     db: AsyncSession = Depends(get_db),
# ) -> LoginResponse:
#     try:
#         payload = verify_verification_token(body.token)
#     except ValueError as error:
#         raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(error))

#     user_id = uuid.UUID(payload.sub)
#     otc_repo = OneTimeCodeRepository(db)
#     otc = await otc_repo.get_active_by_user(user_id)
#     if not otc or not verify_hash(body.code, otc.code_hash):
#         raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired OTP")

#     await otc_repo.mark_used(otc)

#     result = await UserRepository(db).get_by_id_with_profile(user_id)
#     if not result:
#         raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

#     user, profile = result
#     access_token, refresh_token = await issue_tokens(user.id, profile, db)

#     return LoginResponse(access_token=access_token, refresh_token=refresh_token)


# @router.post("/logout", response_model=LogoutResponse, status_code=status.HTTP_200_OK)
# async def logout(
#     body: LogoutRequest,
#     db: AsyncSession = Depends(get_db),
# ) -> LogoutResponse:
#     try:
#         _, token_record = await verify_refresh_token(body.refresh_token, db)
#     except ValueError:
#         raise HTTPException(
#             status_code=status.HTTP_401_UNAUTHORIZED,
#             detail="Invalid or expired refresh token",
#         )

#     await RefreshTokenRepository(db).revoke(token_record)

#     return LogoutResponse()
