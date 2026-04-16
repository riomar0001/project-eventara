import uuid
from unittest.mock import AsyncMock, MagicMock

import pytest
from sqlalchemy.exc import IntegrityError

from app.application.dto.admin_user_account_dto import RolePermissionSummary
from app.application.dto.feature_management_dto import (
    CreateFeatureInput,
    UpdateFeatureInput,
)
from app.application.dto.role_management_dto import (
    CreateRoleInput,
    RolePermissionInput,
)
from app.application.use_cases.feature_usecase import FeatureManagementUseCase
from app.application.use_cases.role_usecase import RoleManagementUseCase
from app.domain.entities.authorization_entities import Feature, GrantEffect, RoleAction
from app.domain.entities.authorization_entities import Role as RoleEntity
from app.domain.exceptions.role_exceptions import (
    FeatureAlreadyExistsError,
    FeatureInUseError,
    ProtectedRoleDeletionError,
    RoleInUseError,
)


def make_feature_use_case(*, repo: MagicMock | None = None, db: AsyncMock | None = None) -> FeatureManagementUseCase:
    return FeatureManagementUseCase(repo=repo or MagicMock(), db=db or AsyncMock())


def make_role_use_case(*, repo: MagicMock | None = None, db: AsyncMock | None = None) -> RoleManagementUseCase:
    return RoleManagementUseCase(repo=repo or MagicMock(), db=db or AsyncMock())


class TestFeatureManagementUseCase:
    async def test_create_feature_maps_unique_constraint_to_custom_error(self):
        repo = MagicMock()
        repo.create_feature_definition = AsyncMock(side_effect=IntegrityError("stmt", "params", Exception("duplicate key")))
        db = AsyncMock()

        use_case = make_feature_use_case(repo=repo, db=db)

        with pytest.raises(FeatureAlreadyExistsError):
            await use_case.create_feature(
                CreateFeatureInput(
                    slug="roles",
                    name="Roles",
                    description="Manage RBAC roles",
                    is_enabled=True,
                )
            )

        db.rollback.assert_awaited_once()

    async def test_update_feature_blocks_slug_change_when_dependencies_exist(self):
        feature_id = uuid.uuid4()
        repo = MagicMock()
        repo.get_feature_by_id = AsyncMock(
            return_value=Feature(
                id=feature_id,
                slug="roles",
                name="Roles",
                description="Manage roles",
                is_enabled=True,
            )
        )
        repo.get_feature_dependency_counts = AsyncMock(return_value=(2, 0))
        db = AsyncMock()

        use_case = make_feature_use_case(repo=repo, db=db)

        with pytest.raises(FeatureInUseError):
            await use_case.update_feature(
                UpdateFeatureInput(
                    feature_id=feature_id,
                    slug="role-catalog",
                    name="Roles",
                    description="Updated",
                    is_enabled=True,
                )
            )

        db.rollback.assert_awaited_once()


class TestRoleManagementUseCase:
    async def test_create_role_replaces_permissions_using_flattened_actions(self):
        role_id = uuid.uuid4()
        feature_id = uuid.uuid4()
        repo = MagicMock()
        repo.get_features_by_ids = AsyncMock(
            return_value=[
                Feature(
                    id=feature_id,
                    slug="features",
                    name="Features",
                    description="Manage features",
                    is_enabled=True,
                )
            ]
        )
        repo.create_role_definition = AsyncMock(
            return_value=RoleEntity(
                id=role_id,
                name="rbac_manager",
                description="Can manage RBAC",
                is_default=False,
                is_system=False,
            )
        )
        repo.replace_role_permissions = AsyncMock()
        repo.get_role_by_id = AsyncMock(
            return_value=RoleEntity(
                id=role_id,
                name="rbac_manager",
                description="Can manage RBAC",
                is_default=False,
                is_system=False,
            )
        )
        repo.get_role_permissions = AsyncMock(
            return_value=[
                RolePermissionSummary(
                    feature_id=feature_id,
                    feature_slug="features",
                    feature_name="Features",
                    action=RoleAction.READ,
                    effect=GrantEffect.ALLOW,
                ),
                RolePermissionSummary(
                    feature_id=feature_id,
                    feature_slug="features",
                    feature_name="Features",
                    action=RoleAction.UPDATE,
                    effect=GrantEffect.ALLOW,
                ),
            ]
        )
        db = AsyncMock()

        use_case = make_role_use_case(repo=repo, db=db)

        result = await use_case.create_role(
            CreateRoleInput(
                name="rbac_manager",
                description="Can manage RBAC",
                permissions=[
                    RolePermissionInput(
                        feature_id=feature_id,
                        actions=[RoleAction.UPDATE, RoleAction.READ, RoleAction.READ],
                        effect=GrantEffect.ALLOW,
                    )
                ],
            )
        )

        assert result.role.permissions[0].feature_slug == "features"
        repo.replace_role_permissions.assert_awaited_once_with(
            role_id,
            [
                (feature_id, RoleAction.READ, GrantEffect.ALLOW),
                (feature_id, RoleAction.UPDATE, GrantEffect.ALLOW),
            ],
        )
        db.commit.assert_awaited_once()

    async def test_delete_role_blocks_when_assignments_exist(self):
        role_id = uuid.uuid4()
        repo = MagicMock()
        repo.get_role_by_id = AsyncMock(
            return_value=RoleEntity(
                id=role_id,
                name="system_administrator",
                description="Full access",
                is_default=False,
                is_system=True,
            )
        )
        repo.get_role_dependency_counts = AsyncMock(return_value=(1, 0))
        db = AsyncMock()

        use_case = make_role_use_case(repo=repo, db=db)

        with pytest.raises(RoleInUseError):
            await use_case.delete_role(role_id)

        db.rollback.assert_awaited_once()

    async def test_delete_role_blocks_system_administrator_role(self):
        role_id = uuid.uuid4()
        repo = MagicMock()
        repo.get_role_by_id = AsyncMock(
            return_value=RoleEntity(
                id=role_id,
                name="system_administrator",
                description="Full access",
                is_default=False,
                is_system=True,
            )
        )
        repo.get_role_dependency_counts = AsyncMock()
        repo.delete_role_definition = AsyncMock()
        db = AsyncMock()

        use_case = make_role_use_case(repo=repo, db=db)

        with pytest.raises(ProtectedRoleDeletionError):
            await use_case.delete_role(role_id)

        repo.get_role_dependency_counts.assert_not_awaited()
        repo.delete_role_definition.assert_not_awaited()
        db.rollback.assert_awaited_once()
