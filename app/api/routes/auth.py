from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.schemas.auth import RegisterRequest, RegisterResponse, LoginRequest, LoginResponse
from app.core.exceptions import EmailAlreadyTakenError
from app.core.use_cases.user import RegisterUserInput, register_user, LoginUserInput
from app.infrastructure.database.session import get_db

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=RegisterResponse,
    status_code=status.HTTP_201_CREATED,
)
async def register(
    body: RegisterRequest,
    db: AsyncSession = Depends(get_db),
) -> RegisterResponse:
    try:
        user = await register_user(
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
            ),
            db,
        )
    except EmailAlreadyTakenError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail=str(error))

    return RegisterResponse(user_id=user.id, email=user.email)


@router.post("/login", response_model=LoginResponse, status_code=status.HTTP_200_OK)
async def login(body: LoginRequest,
                db: AsyncSession = Depends(get_db),) -> RegisterResponse:
    try:
        pass
    except:
        pass
        
