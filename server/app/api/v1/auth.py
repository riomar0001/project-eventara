import random
import string
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.schemas.auth import (
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
from app.domain.entities.user import AgeGroup, EducationLevel, Gender, UserProfile as UserProfileEntity
from app.domain.exceptions import EmailAlreadyTakenError
from app.infrastructure.security.hashing import hash_string, verify_hash
from app.infrastructure.security.token_service import (
    create_access_token,
    create_refresh_token,
    verification_token,
    verify_refresh_token,
    verify_verification_token,
)
from app.application.use_cases.user import LoginUserInput, RegisterUserInput, UserUseCase
from app.infrastructure.database.models.user import UserOneTimeCode
from app.infrastructure.database.repositories.one_time_code_repository import OneTimeCodeRepository
from app.infrastructure.database.repositories.refresh_token_repository import RefreshTokenRepository
from app.infrastructure.database.repositories.user_repository import UserRepository
from app.infrastructure.database.session import get_db
from app.infrastructure.messaging.email import otp_email_html, send_email, verification_email_html

router = APIRouter(prefix="/auth", tags=["Authentication"])

_OTP_TTL_MINUTES = 10


def get_user_use_case(db: AsyncSession = Depends(get_db)) -> UserUseCase:
    return UserUseCase(UserRepository(db))


def _build_profile_entity(user) -> UserProfileEntity:
    return UserProfileEntity(
        user_id=user.id,
        email=user.email,
        alias=user.profile.alias,
        first_name=user.profile.first_name,
        last_name=user.profile.last_name,
        age_group=AgeGroup(user.profile.age_group),
        gender=Gender(user.profile.gender),
        education_level=EducationLevel(user.profile.education_level),
        occupation=user.profile.occupation,
        bio=user.profile.bio,
    )


def _generate_otp(length: int = 6) -> str:
    return "".join(random.choices(string.digits, k=length))


async def _issue_tokens(user, db: AsyncSession) -> tuple[str, str]:
    profile_entity = _build_profile_entity(user)
    access_token = create_access_token(user.id, "", profile_entity)
    refresh_token = await create_refresh_token(user.id, db)
    return access_token, refresh_token


@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
async def register(
    body: RegisterRequest,
    use_case: UserUseCase = Depends(get_user_use_case),
) -> RegisterResponse:
    try:
        user = await use_case.register(
            RegisterUserInput(
                email=body.email,
                password=body.password,
                alias=body.alias,
                first_name=body.first_name,
                last_name=body.last_name,
                age_group=body.age_group,
                gender=body.gender,
                education_level=body.education_level,
                occupation=body.occupation,
                bio=body.bio,
            )
        )
    except EmailAlreadyTakenError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error))

    verify_token = verification_token(user.id, user.email)
    await send_email(
        to=user.email,
        subject="Verify your Eventara email",
        html=verification_email_html(verify_token),
    )

    return RegisterResponse(user_id=user.id, email=user.email)


@router.post("/email/verify", response_model=EmailVerifyResponse, status_code=status.HTTP_200_OK)
async def email_verify(
    body: EmailVerifyRequest,
    db: AsyncSession = Depends(get_db),
) -> EmailVerifyResponse:
    try:
        payload = verify_verification_token(body.token)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error))

    user_repo = UserRepository(db)
    user = await user_repo.get_by_id_with_profile(uuid.UUID(payload.sub))
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    await user_repo.update_email_verified(user.id)

    access_token, refresh_token = await _issue_tokens(user, db)

    return EmailVerifyResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/login", response_model=LoginInitResponse, status_code=status.HTTP_200_OK)
async def login(
    body: LoginRequest,
    use_case: UserUseCase = Depends(get_user_use_case),
    db: AsyncSession = Depends(get_db),
) -> LoginInitResponse:
    user = await use_case.login(LoginUserInput(email=body.email, password=body.password))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    code = _generate_otp()
    otc_repo = OneTimeCodeRepository(db)
    await otc_repo.delete_for_user(user.id)
    await otc_repo.create(UserOneTimeCode(
        user_id=user.id,
        code_hash=hash_string(code),
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=_OTP_TTL_MINUTES),
    ))

    verify_token = verification_token(user.id, user.email)
    await send_email(
        to=user.email,
        subject="Your Eventara login code",
        html=otp_email_html(code),
    )

    return LoginInitResponse(verification_token=verify_token)


@router.post("/login/verify", response_model=LoginResponse, status_code=status.HTTP_200_OK)
async def login_verify(
    body: LoginVerifyRequest,
    db: AsyncSession = Depends(get_db),
) -> LoginResponse:
    try:
        payload = verify_verification_token(body.token)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(error))

    user_id = uuid.UUID(payload.sub)

    otc_repo = OneTimeCodeRepository(db)
    otc = await otc_repo.get_active_by_user(user_id)
    if not otc or not verify_hash(body.code, otc.code_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired OTP")

    await otc_repo.mark_used(otc)

    user_repo = UserRepository(db)
    user = await user_repo.get_by_id_with_profile(user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    access_token, refresh_token = await _issue_tokens(user, db)

    return LoginResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/logout", response_model=LogoutResponse, status_code=status.HTTP_200_OK)
async def logout(
    body: LogoutRequest,
    db: AsyncSession = Depends(get_db),
) -> LogoutResponse:
    try:
        _, token_record = await verify_refresh_token(body.refresh_token, db)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    token_repo = RefreshTokenRepository(db)
    await token_repo.revoke(token_record)

    return LogoutResponse()
