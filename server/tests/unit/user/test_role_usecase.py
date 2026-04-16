import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock

from app.application.dto.role_dto import CreateGrantsInput
from app.application.use_cases.role_usecase import UserRoleUseCase
from app.domain.entities.authorization_entities import Feature, GrantEffect, RoleAction, UserGrant


def make_use_case(*, repo: MagicMock | None = None, db: AsyncMock | None = None) -> UserRoleUseCase:
    return UserRoleUseCase(repo=repo or MagicMock(), db=db or AsyncMock())


class TestUserRoleUseCase:
    async def test_list_grant_features_returns_feature_catalog(self):
        feature = Feature(
            id=uuid.uuid4(),
            slug="user-accounts",
            name="User Accounts",
            description="Manage user accounts",
            is_enabled=True,
        )
        repo = MagicMock()
        repo.list_features = AsyncMock(return_value=[feature])

        use_case = make_use_case(repo=repo)

        result = await use_case.list_grant_features()

        assert result.features == [feature]

    async def test_create_grants_passes_starts_at_to_repository(self):
        user_id = uuid.uuid4()
        role_id = uuid.uuid4()
        feature_id = uuid.uuid4()
        granted_by = uuid.uuid4()
        starts_at = datetime.now(timezone.utc)
        repo = MagicMock()
        repo.user_exists = AsyncMock(return_value=True)
        repo.role_exists = AsyncMock(return_value=True)
        repo.feature_exists = AsyncMock(return_value=True)
        repo.get_existing_grants = AsyncMock(return_value=[])
        repo.create_grants = AsyncMock(
            return_value=[
                UserGrant(
                    user_id=user_id,
                    role_id=role_id,
                    feature_id=feature_id,
                    action=RoleAction.READ,
                    effect=GrantEffect.ALLOW,
                    starts_at=starts_at,
                    granted_by=granted_by,
                )
            ]
        )
        db = AsyncMock()

        use_case = make_use_case(repo=repo, db=db)

        result = await use_case.create_grants(
            CreateGrantsInput(
                user_id=user_id,
                role_id=role_id,
                feature_id=feature_id,
                actions=[RoleAction.READ],
                effect=GrantEffect.ALLOW,
                starts_at=starts_at,
                granted_by=granted_by,
            )
        )

        assert result.grants[0].starts_at == starts_at
        repo.create_grants.assert_awaited_once_with(
            user_id=user_id,
            role_id=role_id,
            feature_id=feature_id,
            actions=[RoleAction.READ],
            effect=GrantEffect.ALLOW,
            starts_at=starts_at,
            expires_at=None,
            reason=None,
            granted_by=granted_by,
        )
        db.commit.assert_awaited_once()
