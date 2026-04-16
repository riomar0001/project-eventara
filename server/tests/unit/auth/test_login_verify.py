import uuid
from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.application.dto.auth_dto import LoginVerifyInput
from app.domain.entities.user_entity import AgeGroup, EducationLevel, Gender, UserProfile
from app.domain.exceptions import (
    AccountDeletionGracePeriodExpiredError,
    InvalidOTPError,
    InvalidTokenError,
    TokenExpiredError,
    UserNotFoundError,
)

from .conftest import MODULE, make_token_payload, make_use_case, make_user


class TestLoginVerify:
    async def test_success(self):
        user = make_user()
        user.onboarding_completed = True
        payload = make_token_payload(user.id)
        profile = UserProfile(
            user_id=user.id,
            email=user.email,
            alias="eventara_user",
            first_name="Event",
            last_name="Ara",
            age_group=AgeGroup.ADULT,
            gender=Gender.FEMALE,
            education_level=EducationLevel.BACHELORS_DEGREE,
            occupation="Organizer",
            bio="Loves community events.",
        )

        repo = MagicMock()
        repo.get_by_id = AsyncMock(return_value=user)
        repo.get_active_role_name_by_user_id = AsyncMock(return_value=None)
        repo.get_profile_by_user_id = AsyncMock(return_value=profile)
        repo.reset_failed_login = AsyncMock()
        repo.record_login = AsyncMock()
        repo.cancel_pending_account_deletion = AsyncMock(return_value=True)

        otp_repo = AsyncMock()
        otp_repo.verify_and_consume = AsyncMock(return_value=True)

        uc = make_use_case(repo=repo, otp_repo=otp_repo)

        with (
            patch(f"{MODULE}.verify_otp_token", return_value=payload),
            patch(f"{MODULE}.create_access_token", return_value="access"),
            patch(f"{MODULE}.create_refresh_token", new_callable=AsyncMock, return_value="refresh"),
        ):
            result = await uc.login_verify(LoginVerifyInput(token="jwt", code="123456"))

        assert result.access_token == "access"
        assert result.refresh_token == "refresh"
        repo.get_profile_by_user_id.assert_awaited_once_with(user.id)
        repo.reset_failed_login.assert_awaited_once()
        repo.record_login.assert_awaited_once()
        repo.cancel_pending_account_deletion.assert_awaited_once_with(user.id)

    async def test_raises_token_expired(self):
        uc = make_use_case(otp_repo=AsyncMock())

        with (
            patch(f"{MODULE}.verify_otp_token", side_effect=ValueError("token expired")),
            pytest.raises(TokenExpiredError),
        ):
            await uc.login_verify(LoginVerifyInput(token="jwt", code="000000"))

    async def test_raises_invalid_token(self):
        uc = make_use_case(otp_repo=AsyncMock())

        with (
            patch(f"{MODULE}.verify_otp_token", side_effect=ValueError("bad signature")),
            pytest.raises(InvalidTokenError),
        ):
            await uc.login_verify(LoginVerifyInput(token="bad", code="000000"))

    async def test_raises_invalid_otp(self):
        payload = make_token_payload(uuid.uuid4())

        otp_repo = AsyncMock()
        otp_repo.verify_and_consume = AsyncMock(return_value=False)

        uc = make_use_case(otp_repo=otp_repo)

        with (
            patch(f"{MODULE}.verify_otp_token", return_value=payload),
            pytest.raises(InvalidOTPError),
        ):
            await uc.login_verify(LoginVerifyInput(token="jwt", code="999999"))

    async def test_raises_user_not_found(self):
        payload = make_token_payload(uuid.uuid4())

        repo = MagicMock()
        repo.get_by_id = AsyncMock(return_value=None)

        otp_repo = AsyncMock()
        otp_repo.verify_and_consume = AsyncMock(return_value=True)

        uc = make_use_case(repo=repo, otp_repo=otp_repo)

        with (
            patch(f"{MODULE}.verify_otp_token", return_value=payload),
            pytest.raises(UserNotFoundError),
        ):
            await uc.login_verify(LoginVerifyInput(token="jwt", code="123456"))

    async def test_raises_when_deletion_grace_period_expired(self):
        user = make_user(
            deletion_requested_at=datetime.now(UTC) - timedelta(days=31),
            deletion_scheduled_for=datetime.now(UTC) - timedelta(days=1),
        )
        payload = make_token_payload(user.id)

        repo = MagicMock()
        repo.get_by_id = AsyncMock(return_value=user)

        otp_repo = AsyncMock()
        otp_repo.verify_and_consume = AsyncMock(return_value=True)

        uc = make_use_case(repo=repo, otp_repo=otp_repo)

        with (
            patch(f"{MODULE}.verify_otp_token", return_value=payload),
            pytest.raises(AccountDeletionGracePeriodExpiredError),
        ):
            await uc.login_verify(LoginVerifyInput(token="jwt", code="123456"))
