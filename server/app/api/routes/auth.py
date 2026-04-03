from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.schemas.auth import LoginRequest, LoginResponse, RegisterRequest, RegisterResponse
from app.core.exceptions import EmailAlreadyTakenError
from app.core.use_cases.user import LoginUserInput, RegisterUserInput, UserUseCase
from app.infrastructure.database.repositories.user_repository import UserRepository
from app.infrastructure.database.session import get_db

router = APIRouter(prefix="/auth", tags=["Authentication"])


def get_user_use_case(db: AsyncSession = Depends(get_db)) -> UserUseCase:
    return UserUseCase(UserRepository(db))


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
                role=body.role,
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

    return RegisterResponse(user_id=user.id, email=user.email)


@router.post("/login", response_model=LoginResponse, status_code=status.HTTP_200_OK)
async def login(
    body: LoginRequest,
    use_case: UserUseCase = Depends(get_user_use_case),
) -> LoginResponse:
    user = await use_case.login(LoginUserInput(email=body.email, password=body.password))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    return LoginResponse(user_id=user.id, email=user.email)
