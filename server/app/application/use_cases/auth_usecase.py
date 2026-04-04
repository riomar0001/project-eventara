import uuid

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.user_entity import PublicUser, User, UserActivity, UserSecurity
from app.application.dto.auth_dto import (
    RegisterUserInput,
    LoginUserInput,
    RegisteredUserOutput,
    VerifiedEmailOutput,
)
from app.domain.exceptions import (
    EmailAlreadyTakenError,
    EmailAlreadyVerifiedError,
    InvalidTokenError,
    TokenExpiredError,
)
from app.domain.exceptions.user_exceptions import UserNotFoundError
from app.application.interfaces.user_interface import IUserRepository
from app.core.security.hashing import hash_string
from app.core.security.token_service import (
    create_access_token,
    create_refresh_token,
    verification_token,
    verify_verification_token,
)

from app.infrastructure.messaging.email import send_email, verification_email_html


class AuthUseCase:
    def __init__(self, repo: IUserRepository, db: AsyncSession) -> None:
        self.repo = repo
        self.db = db

    async def register_user(self, data: RegisterUserInput) -> RegisteredUserOutput:
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
            to=user.email,
            subject="Verify your Eventara email",
            html=verification_email_html(verify_token),
        )

        return RegisteredUserOutput(
            user=PublicUser.model_validate(new_user),
            verification_token=verify_token,
        )

    async def verify_email(self, token: str) -> VerifiedEmailOutput:
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

        access_token = create_access_token(user_id, user.email)
        refresh_token = await create_refresh_token(user_id, self.db)

        return VerifiedEmailOutput(
            access_token=access_token,
            refresh_token=refresh_token,
        )
