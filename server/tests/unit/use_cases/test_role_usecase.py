"""Unit tests for UserRoleUseCase and RoleManagementUseCase."""

import uuid
from unittest.mock import AsyncMock, MagicMock

import pytest
from sqlalchemy.exc import IntegrityError

from app.application.dto.roles_dto import (
    AssignRoleInput,
    CreateGrantsInput,
    CreateRoleInput,
    RolePermissionInput,
    UpdateAssignmentInput,
    UpdateRoleInput,
)
from app.application.use_cases.role_usecase import RoleManagementUseCase, UserRoleUseCase
from app.domain.entities.authorization_entities import GrantEffect, Role, RoleAction
from app.domain.exceptions.role_exceptions import (
    DuplicateUserGrantError,
    FeatureNotFoundError,
    ProtectedRoleDeletionError,
    RoleAlreadyAssignedError,
    RoleAlreadyExistsError,
    RoleAssignmentNotFoundError,
    RoleInUseError,
    RoleNotFoundError,
    UserGrantNotFoundError,
)
from app.domain.exceptions.user_exceptions import UserNotFoundError

USER_ID = uuid.uuid4()
ROLE_ID = uuid.uuid4()
FEATURE_ID = uuid.uuid4()
ASSIGNMENT_ID = uuid.uuid4()
GRANT_ID = uuid.uuid4()
ADMIN_ID = uuid.uuid4()


def _make_role(*, name="editor", is_system=False) -> Role:
    r = MagicMock(spec=Role)
    r.id = ROLE_ID
    r.name = name
    r.description = None
    r.is_default = False
    r.is_system = is_system
    return r


def _make_repo(**kwargs) -> MagicMock:
    repo = MagicMock()
    repo.user_exists = AsyncMock(return_value=kwargs.get("user_exists", True))
    repo.role_exists = AsyncMock(return_value=kwargs.get("role_exists", True))
    repo.feature_exists = AsyncMock(return_value=kwargs.get("feature_exists", True))
    repo.get_active_assignment = AsyncMock(return_value=kwargs.get("active_assignment"))
    repo.create_assignment = AsyncMock(return_value=MagicMock())
    repo.get_assignments_by_user = AsyncMock(return_value=kwargs.get("assignments", []))
    repo.get_assignment_by_id = AsyncMock(return_value=kwargs.get("assignment", MagicMock()))
    repo.update_assignment_expiry = AsyncMock(return_value=MagicMock())
    repo.delete_assignment = AsyncMock(return_value=kwargs.get("deleted_assignment", True))
    repo.get_existing_grants = AsyncMock(return_value=kwargs.get("existing_grants", []))
    repo.create_grants = AsyncMock(return_value=[MagicMock()])
    repo.list_features = AsyncMock(return_value=[])
    repo.get_grants_by_user = AsyncMock(return_value=[])
    repo.get_grant_by_id = AsyncMock(return_value=kwargs.get("grant", MagicMock()))
    repo.delete_grant = AsyncMock(return_value=kwargs.get("deleted_grant", True))
    repo.list_roles = AsyncMock(return_value=kwargs.get("roles", []))
    repo.list_role_permissions = AsyncMock(return_value={})
    repo.get_role_by_id = AsyncMock(return_value=kwargs.get("role", _make_role()))
    repo.get_role_permissions = AsyncMock(return_value=[])
    repo.create_role_definition = AsyncMock(return_value=_make_role())
    repo.replace_role_permissions = AsyncMock()
    repo.update_role_definition = AsyncMock(return_value=kwargs.get("updated_role", _make_role()))
    repo.delete_role_definition = AsyncMock(return_value=kwargs.get("deleted_role", True))
    repo.get_role_dependency_counts = AsyncMock(return_value=kwargs.get("dep_counts", (0, 0)))
    repo.get_features_by_ids = AsyncMock(return_value=kwargs.get("features", []))
    return repo


# ─── UserRoleUseCase ──────────────────────────────────────────────────────────


class TestAssignRole:
    def _data(self):
        return AssignRoleInput(user_id=USER_ID, role_id=ROLE_ID, assigned_by=ADMIN_ID)

    def _make_uc(self, repo):
        return UserRoleUseCase(repo=repo, db=AsyncMock())

    @pytest.mark.asyncio
    async def test_success(self):
        repo = _make_repo()
        result = await self._make_uc(repo).assign_role(self._data())
        repo.create_assignment.assert_awaited_once()
        assert result.assignment is repo.create_assignment.return_value

    @pytest.mark.asyncio
    async def test_user_not_found(self):
        with pytest.raises(UserNotFoundError):
            await self._make_uc(_make_repo(user_exists=False)).assign_role(self._data())

    @pytest.mark.asyncio
    async def test_role_not_found(self):
        with pytest.raises(RoleNotFoundError):
            await self._make_uc(_make_repo(role_exists=False)).assign_role(self._data())

    @pytest.mark.asyncio
    async def test_already_assigned(self):
        repo = _make_repo(active_assignment=MagicMock())
        with pytest.raises(RoleAlreadyAssignedError):
            await self._make_uc(repo).assign_role(self._data())


class TestGetUserRoles:
    @pytest.mark.asyncio
    async def test_success(self):
        assignments = [MagicMock(), MagicMock()]
        repo = _make_repo(assignments=assignments)
        result = await UserRoleUseCase(repo, AsyncMock()).get_user_roles(USER_ID)
        assert result.assignments == assignments

    @pytest.mark.asyncio
    async def test_user_not_found(self):
        with pytest.raises(UserNotFoundError):
            await UserRoleUseCase(_make_repo(user_exists=False), AsyncMock()).get_user_roles(USER_ID)


class TestGetAssignment:
    @pytest.mark.asyncio
    async def test_success(self):
        assignment = MagicMock()
        repo = _make_repo(assignment=assignment)
        result = await UserRoleUseCase(repo, AsyncMock()).get_assignment(ASSIGNMENT_ID)
        assert result is assignment

    @pytest.mark.asyncio
    async def test_not_found(self):
        repo = _make_repo(assignment=None)
        with pytest.raises(RoleAssignmentNotFoundError):
            await UserRoleUseCase(repo, AsyncMock()).get_assignment(ASSIGNMENT_ID)


class TestUpdateAssignment:
    @pytest.mark.asyncio
    async def test_success(self):
        repo = _make_repo()
        db = AsyncMock()
        result = await UserRoleUseCase(repo, db).update_assignment(UpdateAssignmentInput(assignment_id=ASSIGNMENT_ID, expires_at=None))
        assert result.assignment is repo.update_assignment_expiry.return_value
        db.commit.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_not_found(self):
        with pytest.raises(RoleAssignmentNotFoundError):
            await UserRoleUseCase(_make_repo(assignment=None), AsyncMock()).update_assignment(
                UpdateAssignmentInput(assignment_id=ASSIGNMENT_ID, expires_at=None)
            )


class TestRevokeAssignment:
    @pytest.mark.asyncio
    async def test_success(self):
        repo = _make_repo(deleted_assignment=True)
        db = AsyncMock()
        await UserRoleUseCase(repo, db).revoke_assignment(ASSIGNMENT_ID)
        repo.delete_assignment.assert_awaited_once_with(ASSIGNMENT_ID)
        db.commit.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_not_found(self):
        with pytest.raises(RoleAssignmentNotFoundError):
            await UserRoleUseCase(_make_repo(deleted_assignment=False), AsyncMock()).revoke_assignment(ASSIGNMENT_ID)


class TestCreateGrants:
    def _data(self):
        return CreateGrantsInput(
            user_id=USER_ID,
            role_id=ROLE_ID,
            feature_id=FEATURE_ID,
            actions=[RoleAction.READ],
            effect=GrantEffect.ALLOW,
            granted_by=ADMIN_ID,
        )

    @pytest.mark.asyncio
    async def test_success(self):
        repo = _make_repo()
        result = await UserRoleUseCase(repo, AsyncMock()).create_grants(self._data())
        assert len(result.grants) == 1

    @pytest.mark.asyncio
    async def test_user_not_found(self):
        with pytest.raises(UserNotFoundError):
            await UserRoleUseCase(_make_repo(user_exists=False), AsyncMock()).create_grants(self._data())

    @pytest.mark.asyncio
    async def test_role_not_found(self):
        with pytest.raises(RoleNotFoundError):
            await UserRoleUseCase(_make_repo(role_exists=False), AsyncMock()).create_grants(self._data())

    @pytest.mark.asyncio
    async def test_feature_not_found(self):
        with pytest.raises(FeatureNotFoundError):
            await UserRoleUseCase(_make_repo(feature_exists=False), AsyncMock()).create_grants(self._data())

    @pytest.mark.asyncio
    async def test_duplicate_grant(self):
        existing = [MagicMock()]
        existing[0].action = MagicMock()
        existing[0].action.value = "read"
        with pytest.raises(DuplicateUserGrantError):
            await UserRoleUseCase(_make_repo(existing_grants=existing), AsyncMock()).create_grants(self._data())


class TestGetUserGrants:
    @pytest.mark.asyncio
    async def test_success(self):
        grants = [MagicMock()]
        repo = _make_repo()
        repo.get_grants_by_user = AsyncMock(return_value=grants)
        result = await UserRoleUseCase(repo, AsyncMock()).get_user_grants(USER_ID)
        assert result.grants == grants

    @pytest.mark.asyncio
    async def test_user_not_found(self):
        with pytest.raises(UserNotFoundError):
            await UserRoleUseCase(_make_repo(user_exists=False), AsyncMock()).get_user_grants(USER_ID)


class TestGetGrant:
    @pytest.mark.asyncio
    async def test_success(self):
        grant = MagicMock()
        repo = _make_repo(grant=grant)
        result = await UserRoleUseCase(repo, AsyncMock()).get_grant(GRANT_ID)
        assert result is grant

    @pytest.mark.asyncio
    async def test_not_found(self):
        with pytest.raises(UserGrantNotFoundError):
            await UserRoleUseCase(_make_repo(grant=None), AsyncMock()).get_grant(GRANT_ID)


class TestRevokeGrant:
    @pytest.mark.asyncio
    async def test_success(self):
        repo = _make_repo(deleted_grant=True)
        db = AsyncMock()
        await UserRoleUseCase(repo, db).revoke_grant(GRANT_ID)
        repo.delete_grant.assert_awaited_once_with(GRANT_ID)
        db.commit.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_not_found(self):
        with pytest.raises(UserGrantNotFoundError):
            await UserRoleUseCase(_make_repo(deleted_grant=False), AsyncMock()).revoke_grant(GRANT_ID)


# ─── RoleManagementUseCase ────────────────────────────────────────────────────


class TestListRoles:
    @pytest.mark.asyncio
    async def test_returns_roles_with_permissions(self):
        role = _make_role()
        repo = _make_repo(roles=[role])
        repo.list_role_permissions = AsyncMock(return_value={role.id: []})
        result = await RoleManagementUseCase(repo, AsyncMock()).list_roles()
        assert len(result.roles) == 1

    @pytest.mark.asyncio
    async def test_empty(self):
        result = await RoleManagementUseCase(_make_repo(roles=[]), AsyncMock()).list_roles()
        assert result.roles == []


class TestGetRole:
    @pytest.mark.asyncio
    async def test_success(self):
        result = await RoleManagementUseCase(_make_repo(), AsyncMock()).get_role(ROLE_ID)
        assert result.role.id == ROLE_ID

    @pytest.mark.asyncio
    async def test_not_found(self):
        with pytest.raises(RoleNotFoundError):
            await RoleManagementUseCase(_make_repo(role=None), AsyncMock()).get_role(ROLE_ID)


class TestCreateRole:
    def _data(self, name="editor") -> CreateRoleInput:
        return CreateRoleInput(name=name, permissions=[])

    @pytest.mark.asyncio
    async def test_success(self):
        repo = _make_repo()
        db = AsyncMock()
        result = await RoleManagementUseCase(repo, db).create_role(self._data())
        db.commit.assert_awaited_once()
        assert result.role.name == "editor"

    @pytest.mark.asyncio
    async def test_duplicate_name_raises_already_exists(self):
        repo = _make_repo()
        repo.create_role_definition = AsyncMock(side_effect=IntegrityError(None, None, Exception("unique_name")))
        db = AsyncMock()
        with pytest.raises(RoleAlreadyExistsError):
            await RoleManagementUseCase(repo, db).create_role(self._data())
        db.rollback.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_feature_not_found_rolls_back(self):
        repo = _make_repo()
        repo.get_features_by_ids = AsyncMock(return_value=[])
        data = CreateRoleInput(name="editor", permissions=[RolePermissionInput(feature_id=FEATURE_ID, actions=[RoleAction.READ])])
        db = AsyncMock()
        with pytest.raises(FeatureNotFoundError):
            await RoleManagementUseCase(repo, db).create_role(data)
        db.rollback.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_unexpected_error_rolls_back(self):
        repo = _make_repo()
        repo.create_role_definition = AsyncMock(side_effect=RuntimeError("db error"))
        db = AsyncMock()
        with pytest.raises(RuntimeError):
            await RoleManagementUseCase(repo, db).create_role(self._data())
        db.rollback.assert_awaited_once()


class TestUpdateRole:
    def _data(self, name="editor") -> UpdateRoleInput:
        return UpdateRoleInput(role_id=ROLE_ID, name=name, permissions=[])

    @pytest.mark.asyncio
    async def test_success_same_name(self):
        db = AsyncMock()
        result = await RoleManagementUseCase(_make_repo(), db).update_role(self._data(name="editor"))
        db.commit.assert_awaited_once()
        assert result.role.name == "editor"

    @pytest.mark.asyncio
    async def test_name_change_with_dependencies_raises_in_use(self):
        repo = _make_repo(dep_counts=(1, 0))
        with pytest.raises(RoleInUseError):
            await RoleManagementUseCase(repo, AsyncMock()).update_role(self._data(name="new-name"))

    @pytest.mark.asyncio
    async def test_not_found(self):
        with pytest.raises(RoleNotFoundError):
            await RoleManagementUseCase(_make_repo(role=None), AsyncMock()).update_role(self._data())

    @pytest.mark.asyncio
    async def test_update_returns_none_raises_not_found(self):
        repo = _make_repo(updated_role=None)
        repo.update_role_definition = AsyncMock(return_value=None)
        db = AsyncMock()
        with pytest.raises(RoleNotFoundError):
            await RoleManagementUseCase(repo, db).update_role(self._data())
        db.rollback.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_integrity_error_raises_already_exists(self):
        repo = _make_repo()
        repo.update_role_definition = AsyncMock(side_effect=IntegrityError(None, None, Exception("unique_name")))
        db = AsyncMock()
        with pytest.raises(RoleAlreadyExistsError):
            await RoleManagementUseCase(repo, db).update_role(self._data())
        db.rollback.assert_awaited_once()


class TestDeleteRole:
    @pytest.mark.asyncio
    async def test_success(self):
        repo = _make_repo()
        db = AsyncMock()
        await RoleManagementUseCase(repo, db).delete_role(ROLE_ID)
        repo.delete_role_definition.assert_awaited_once_with(ROLE_ID)
        db.commit.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_not_found(self):
        with pytest.raises(RoleNotFoundError):
            await RoleManagementUseCase(_make_repo(role=None), AsyncMock()).delete_role(ROLE_ID)

    @pytest.mark.asyncio
    async def test_protected_role_raises(self):
        role = _make_role(name="system_administrator", is_system=True)
        with pytest.raises(ProtectedRoleDeletionError):
            await RoleManagementUseCase(_make_repo(role=role), AsyncMock()).delete_role(ROLE_ID)

    @pytest.mark.asyncio
    async def test_has_user_assignments_raises_in_use(self):
        with pytest.raises(RoleInUseError):
            await RoleManagementUseCase(_make_repo(dep_counts=(3, 0)), AsyncMock()).delete_role(ROLE_ID)

    @pytest.mark.asyncio
    async def test_has_user_grants_raises_in_use(self):
        with pytest.raises(RoleInUseError):
            await RoleManagementUseCase(_make_repo(dep_counts=(0, 1)), AsyncMock()).delete_role(ROLE_ID)

    @pytest.mark.asyncio
    async def test_delete_returns_false_raises_not_found(self):
        with pytest.raises(RoleNotFoundError):
            await RoleManagementUseCase(_make_repo(deleted_role=False), AsyncMock()).delete_role(ROLE_ID)

    @pytest.mark.asyncio
    async def test_unexpected_error_rolls_back(self):
        repo = _make_repo()
        repo.delete_role_definition = AsyncMock(side_effect=RuntimeError("db error"))
        db = AsyncMock()
        with pytest.raises(RuntimeError):
            await RoleManagementUseCase(repo, db).delete_role(ROLE_ID)
        db.rollback.assert_awaited_once()


class TestFlattenPermissions:
    def test_deduplicates_same_feature_action_effect(self):
        perms = [
            RolePermissionInput(feature_id=FEATURE_ID, actions=[RoleAction.READ, RoleAction.READ]),
        ]
        result = RoleManagementUseCase._flatten_permissions(perms)
        assert len(result) == 1

    def test_expands_multiple_actions(self):
        perms = [
            RolePermissionInput(feature_id=FEATURE_ID, actions=[RoleAction.READ, RoleAction.CREATE]),
        ]
        result = RoleManagementUseCase._flatten_permissions(perms)
        assert len(result) == 2

    def test_empty_permissions(self):
        assert RoleManagementUseCase._flatten_permissions([]) == []
