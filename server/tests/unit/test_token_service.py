import os
import uuid

import jwt

os.environ["DEBUG"] = "false"
os.environ["STORAGE_PUBLIC_URL"] = "https://cdn.example.com"

from app.core.config import settings
from app.core.security.token_service import create_access_token
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
