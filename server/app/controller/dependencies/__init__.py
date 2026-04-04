from typing import Any, cast

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.use_cases import auth_usecase
from app.application.use_cases.auth_usecase import AuthUseCase
from app.infrastructure.repositories.user_repository import UserRepository
from app.infrastructure.database.session import get_db


def get_auth_use_case(db: AsyncSession = Depends(get_db)) -> AuthUseCase:
    return AuthUseCase(UserRepository(db))
