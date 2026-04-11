from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.application.dto.auth_dto import RegisterUserInput
from app.domain.entities.user_entity import PublicUser
from app.domain.exceptions import EmailAlreadyTakenError

from .conftest import MODULE, make_use_case, make_user


class TestRegisterUser:
    async def test_success(self):
        user = make_user()
        public_user = PublicUser(id=user.id, email=user.email, status=user.status)

        repo = MagicMock()
        repo.get_by_email = AsyncMock(return_value=None)
        repo.create = AsyncMock(return_value=user)

        uc = make_use_case(repo=repo)

        with (
            patch(f"{MODULE}.hash_string", return_value="hashed"),
            patch(f"{MODULE}.verification_token", return_value="tok123"),
            patch(f"{MODULE}.send_email", new_callable=AsyncMock),
            patch(f"{MODULE}.PublicUser") as mock_public_user,
        ):
            mock_public_user.model_validate.return_value = public_user
            result = await uc.register_user(RegisterUserInput(email=user.email, password="secret"))

        assert result.verification_token == "tok123"
        repo.create.assert_awaited_once()

    async def test_raises_when_email_taken(self):
        repo = MagicMock()
        repo.get_by_email = AsyncMock(return_value=make_user())

        uc = make_use_case(repo=repo)

        with pytest.raises(EmailAlreadyTakenError):
            await uc.register_user(RegisterUserInput(email="user@example.com", password="secret"))

    async def test_raises_on_integrity_error(self):
        from sqlalchemy.exc import IntegrityError

        repo = MagicMock()
        repo.get_by_email = AsyncMock(return_value=None)
        repo.create = AsyncMock(side_effect=IntegrityError("", {}, Exception()))

        uc = make_use_case(repo=repo)

        with (
            patch(f"{MODULE}.hash_string", return_value="hashed"),
            pytest.raises(EmailAlreadyTakenError),
        ):
            await uc.register_user(RegisterUserInput(email="user@example.com", password="secret"))
