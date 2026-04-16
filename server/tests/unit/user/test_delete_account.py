import uuid
from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.application.dto.user_dto import RequestAccountDeletionInput
from app.application.use_cases.user_usecase import DeleteAccountUseCase, FinalizeAccountDeletionUseCase
from app.domain.entities.user_entity import User, UserStatus
from app.domain.exceptions import (
    AccountDeletionAlreadyScheduledError,
    AccountDeletionGracePeriodExpiredError,
)

MODULE = "app.application.use_cases.user_usecase"


def make_user(
    *,
    status: UserStatus = UserStatus.ACTIVE,
    deletion_requested_at: datetime | None = None,
    deletion_scheduled_for: datetime | None = None,
    deletion_requested_by: uuid.UUID | None = None,
    deletion_reason: str | None = None,
) -> User:
    return User(
        id=uuid.uuid4(),
        email="user@example.com",
        password="hashed_password",
        status=status,
        deletion_requested_at=deletion_requested_at,
        deletion_scheduled_for=deletion_scheduled_for,
        deletion_requested_by=deletion_requested_by,
        deletion_reason=deletion_reason,
    )


class TestDeleteAccountUseCase:
    async def test_self_service_success_enqueues_deferred_job(self):
        user = make_user()
        requested_at = datetime.now(UTC).replace(tzinfo=None)
        scheduled_for = requested_at + timedelta(days=30)
        scheduled_user = make_user(
            deletion_requested_at=requested_at,
            deletion_scheduled_for=scheduled_for,
            deletion_requested_by=user.id,
            deletion_reason="user requested deletion",
        )
        scheduled_user.id = user.id

        repo = MagicMock()
        repo.get_by_id = AsyncMock(return_value=user)
        repo.schedule_account_deletion = AsyncMock(return_value=scheduled_user)

        arq = AsyncMock()
        arq.enqueue_job = AsyncMock(return_value=MagicMock())

        use_case = DeleteAccountUseCase(repo, arq)

        with patch(f"{MODULE}.verify_hash", return_value=True):
            result = await use_case.request_self_service_deletion(
                RequestAccountDeletionInput(
                    target_user_id=user.id,
                    requested_by=user.id,
                    current_password="correct-password",
                    reason="user requested deletion",
                )
            )

        assert result.user_id == user.id
        repo.schedule_account_deletion.assert_awaited_once()
        arq.enqueue_job.assert_awaited_once()
        assert arq.enqueue_job.await_args.kwargs["_defer_until"] == scheduled_for.replace(tzinfo=UTC)

    async def test_raises_conflict_when_deletion_already_scheduled(self):
        future = datetime.now(UTC).replace(tzinfo=None) + timedelta(days=5)
        user = make_user(
            deletion_requested_at=datetime.now(UTC).replace(tzinfo=None),
            deletion_scheduled_for=future,
        )

        repo = MagicMock()
        repo.get_by_id = AsyncMock(return_value=user)

        use_case = DeleteAccountUseCase(repo, AsyncMock())

        with pytest.raises(AccountDeletionAlreadyScheduledError):
            await use_case.request_admin_deletion(
                RequestAccountDeletionInput(
                    target_user_id=user.id,
                    requested_by=uuid.uuid4(),
                    reason="admin requested deletion",
                )
            )

    async def test_raises_when_grace_period_has_already_elapsed(self):
        user = make_user(
            deletion_requested_at=datetime.now(UTC).replace(tzinfo=None) - timedelta(days=31),
            deletion_scheduled_for=datetime.now(UTC).replace(tzinfo=None) - timedelta(days=1),
        )

        repo = MagicMock()
        repo.get_by_id = AsyncMock(return_value=user)

        use_case = DeleteAccountUseCase(repo, AsyncMock())

        with pytest.raises(AccountDeletionGracePeriodExpiredError):
            await use_case.request_admin_deletion(
                RequestAccountDeletionInput(
                    target_user_id=user.id,
                    requested_by=uuid.uuid4(),
                    reason="admin requested deletion",
                )
            )


class TestFinalizeAccountDeletionUseCase:
    async def test_execute_delegates_to_repository_with_parsed_values(self):
        repo = MagicMock()
        repo.finalize_account_deletion = AsyncMock(return_value=True)

        use_case = FinalizeAccountDeletionUseCase(repo)
        user_id = str(uuid.uuid4())
        requested_at = "2026-04-16T12:00:00"
        scheduled_for = "2026-05-16T12:00:00"

        result = await use_case.execute(
            user_id=user_id,
            requested_at=requested_at,
            scheduled_for=scheduled_for,
        )

        assert result is True
        repo.finalize_account_deletion.assert_awaited_once_with(
            user_id=uuid.UUID(user_id),
            expected_requested_at=datetime.fromisoformat(requested_at),
            expected_scheduled_for=datetime.fromisoformat(scheduled_for),
        )
