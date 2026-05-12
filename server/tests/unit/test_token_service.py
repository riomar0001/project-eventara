import os
import uuid
from datetime import UTC, datetime, timedelta

import jwt
import pytest

os.environ["DEBUG"] = "false"
os.environ["STORAGE_PUBLIC_URL"] = "https://cdn.example.com"

from app.core.config import settings
from app.core.security.token_service import create_access_token, create_event_qr_token, verify_event_qr_token
from app.domain.entities.user_entity import AgeGroup, EducationLevel, Gender, UserProfile


def test_create_access_token_includes_profile_image_url():
    """Embeds the profile image link as image, not image_file_id."""
    user_id = uuid.uuid4()
    profile = UserProfile(
        user_id=user_id,
        email="user@example.com",
        alias="testuser",
        first_name="Test",
        last_name="User",
        image_file_id="user-profile/avatar.png",
        age_group=AgeGroup.ADULT,
        gender=Gender.MALE,
        education_level=EducationLevel.COLLEGE_LEVEL_UNDERGRADUATE,
    )

    token = create_access_token(
        user_id=user_id,
        email="user@example.com",
        done_onboarding=True,
        role="participant",
        user=profile,
    )

    payload = jwt.decode(token, settings.JWT_ACCESS_TOKEN_SECRET, algorithms=[settings.JWT_ALGORITHM])
    assert payload["image"] == f"{settings.STORAGE_PUBLIC_URL.rstrip('/')}/user-profile/avatar.png"
    assert "image_file_id" not in payload


def test_event_qr_token_uses_admission_token_secret():
    settings.ADMISSION_TOKEN_SECRET = "admission-test-secret"
    user_id = uuid.uuid4()
    participant_id = uuid.uuid4()
    event_id = uuid.uuid4()
    session_id = uuid.uuid4()

    token = create_event_qr_token(
        user_id=user_id,
        participant_id=participant_id,
        event_id=event_id,
        event_name="Community Health Fair",
        event_session_id=session_id,
        event_session_name="Morning Admission",
        expires_at=datetime.now(UTC) + timedelta(hours=1),
    )

    payload = verify_event_qr_token(token)
    assert payload["sub"] == str(user_id)
    assert payload["event_id"] == str(event_id)
    with pytest.raises(jwt.InvalidTokenError):
        jwt.decode(token, settings.JWT_VERIFICATION_TOKEN_SECRET, algorithms=[settings.JWT_ALGORITHM])
