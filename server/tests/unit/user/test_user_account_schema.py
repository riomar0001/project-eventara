from datetime import datetime, timezone
from uuid import uuid4

from app.controller.schemas.user_account_schema import (
    AdminUserAccountDetailResponse,
    AdminUserAccountSummaryResponse,
)
from app.domain.entities.user_entity import UserStatus


class TestUserAccountSchema:
    def test_summary_serializes_naive_datetime_as_utc_z(self):
        payload = AdminUserAccountSummaryResponse(
            user_id=uuid4(),
            name="Jane Doe",
            email="jane@example.com",
            status=UserStatus.ACTIVE,
            deletion_scheduled_for=datetime(2026, 4, 16, 12, 30, 45),
        ).model_dump(mode="json")

        assert payload["deletion_scheduled_for"] == "2026-04-16T12:30:45Z"

    def test_detail_serializes_aware_datetime_as_utc_z(self):
        payload = AdminUserAccountDetailResponse(
            user_id=uuid4(),
            name="Jane Doe",
            email="jane@example.com",
            status=UserStatus.ACTIVE,
            onboarding_completed=False,
            email_verified=True,
            failed_login_attempts=0,
            login_count=0,
            deletion_requested_at=datetime(2026, 4, 16, 12, 30, 45, tzinfo=timezone.utc),
        ).model_dump(mode="json")

        assert payload["deletion_requested_at"] == "2026-04-16T12:30:45Z"
