"""Functional test cases for UserRoleUseCase and RoleManagementUseCase."""

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
    repo.get_active_assignment = AsyncMock(return_value=kwargs.get("active_assignment", None))
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


# ─── assign_role ──────────────────────────────────────────────────────────────

class TestAssignRole:
    def _data(self):
        return AssignRoleInput(user_id=USER_ID, role_id=ROLE_ID, assigned_by=ADMIN_ID)

    def _make_uc(self, repo):
        return UserRoleUseCase(repo=repo, db=AsyncMock())

    @pytest.mark.asyncio
    async def test_success(self):
        """Creates the role assignment, commits the transaction, and returns AssignRoleOutput"""
        result = await self._make_uc(_make_repo()).assign_role(self._data())
        assert result.assignment is not None

    @pytest.mark.asyncio
    async def test_user_not_found(self):
        """Raises UserNotFoundError when no account exists for the given user ID"""
        with pytest.raises(UserNotFoundError):
            await self._make_uc(_make_repo(user_exists=False)).assign_role(self._data())

    @pytest.mark.asyncio
    async def test_role_not_found(self):
        """Raises RoleNotFoundError when no role exists for the given role ID"""
        with pytest.raises(RoleNotFoundError):
            await self._make_uc(_make_repo(role_exists=False)).assign_role(self._data())

    @pytest.mark.asyncio
    async def test_already_assigned(self):
        """Raises RoleAlreadyAssignedError when the user already holds an active assignment for the role"""
        with pytest.raises(RoleAlreadyAssignedError):
            await self._make_uc(_make_repo(active_assignment=MagicMock())).assign_role(self._data())


# ─── get_user_roles ───────────────────────────────────────────────────────────

class TestGetUserRoles:
    @pytest.mark.asyncio
    async def test_success(self):
        """Returns all role assignments for the user wrapped in GetUserRolesOutput"""
        assignments = [MagicMock(), MagicMock()]
        result = await UserRoleUseCase(_make_repo(assignments=assignments), AsyncMock()).get_user_roles(USER_ID)
        assert result.assignments == assignments

    @pytest.mark.asyncio
    async def test_user_not_found(self):
        """Raises UserNotFoundError when no account exists for the given user ID"""
        with pytest.raises(UserNotFoundError):
            await UserRoleUseCase(_make_repo(user_exists=False), AsyncMock()).get_user_roles(USER_ID)


# ─── get_assignment ───────────────────────────────────────────────────────────

class TestGetAssignment:
    @pytest.mark.asyncio
    async def test_success(self):
        """Returns the matching UserRole entity for a valid assignment ID"""
        assignment = MagicMock()
        result = await UserRoleUseCase(_make_repo(assignment=assignment), AsyncMock()).get_assignment(ASSIGNMENT_ID)
        assert result is assignment

    @pytest.mark.asyncio
    async def test_not_found(self):
        """Raises RoleAssignmentNotFoundError when no assignment matches the given ID"""
        with pytest.raises(RoleAssignmentNotFoundError):
            await UserRoleUseCase(_make_repo(assignment=None), AsyncMock()).get_assignment(ASSIGNMENT_ID)


# ─── update_assignment ────────────────────────────────────────────────────────

class TestUpdateAssignment:
    @pytest.mark.asyncio
    async def test_success(self):
        """Updates the expiry date and commits the transaction"""
        db = AsyncMock()
        result = await UserRoleUseCase(_make_repo(), db).update_assignment(
            UpdateAssignmentInput(assignment_id=ASSIGNMENT_ID, expires_at=None)
        )
        assert result.assignment is not None
        db.commit.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_not_found(self):
        """Raises RoleAssignmentNotFoundError when no assignment matches the given ID"""
        with pytest.raises(RoleAssignmentNotFoundError):
            await UserRoleUseCase(_make_repo(assignment=None), AsyncMock()).update_assignment(
                UpdateAssignmentInput(assignment_id=ASSIGNMENT_ID, expires_at=None)
            )


# ─── revoke_assignment ────────────────────────────────────────────────────────

class TestRevokeAssignment:
    @pytest.mark.asyncio
    async def test_success(self):
        """Permanently removes the assignment and commits the transaction"""
        db = AsyncMock()
        await UserRoleUseCase(_make_repo(deleted_assignment=True), db).revoke_assignment(ASSIGNMENT_ID)
        db.commit.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_not_found(self):
        """Raises RoleAssignmentNotFoundError when the assignment does not exist"""
        with pytest.raises(RoleAssignmentNotFoundError):
            await UserRoleUseCase(_make_repo(deleted_assignment=False), AsyncMock()).revoke_assignment(ASSIGNMENT_ID)


# ─── create_grants ────────────────────────────────────────────────────────────

class TestCreateGrants:
    def _data(self):
        return CreateGrantsInput(
            user_id=USER_ID, role_id=ROLE_ID, feature_id=FEATURE_ID,
            actions=[RoleAction.READ], effect=GrantEffect.ALLOW, granted_by=ADMIN_ID,
        )

    @pytest.mark.asyncio
    async def test_success(self):
        """Creates one UserGrant row per action and returns CreateGrantsOutput"""
        result = await UserRoleUseCase(_make_repo(), AsyncMock()).create_grants(self._data())
        assert len(result.grants) == 1

    @pytest.mark.asyncio
    async def test_user_not_found(self):
        """Raises UserNotFoundError when no account exists for the given user ID"""
        with pytest.raises(UserNotFoundError):
            await UserRoleUseCase(_make_repo(user_exists=False), AsyncMock()).create_grants(self._data())

    @pytest.mark.asyncio
    async def test_role_not_found(self):
        """Raises RoleNotFoundError when no role exists for the given role ID"""
        with pytest.raises(RoleNotFoundError):
            await UserRoleUseCase(_make_repo(role_exists=False), AsyncMock()).create_grants(self._data())

    @pytest.mark.asyncio
    async def test_feature_not_found(self):
        """Raises FeatureNotFoundError when no feature exists for the given feature ID"""
        with pytest.raises(FeatureNotFoundError):
            await UserRoleUseCase(_make_repo(feature_exists=False), AsyncMock()).create_grants(self._data())

    @pytest.mark.asyncio
    async def test_duplicate_grant(self):
        """Raises DuplicateUserGrantError when one or more actions already have an active grant"""
        existing = [MagicMock()]
        existing[0].action = MagicMock()
        existing[0].action.value = "read"
        with pytest.raises(DuplicateUserGrantError):
            await UserRoleUseCase(_make_repo(existing_grants=existing), AsyncMock()).create_grants(self._data())


# ─── revoke_grant ─────────────────────────────────────────────────────────────

class TestRevokeGrant:
    @pytest.mark.asyncio
    async def test_success(self):
        """Permanently removes the grant and commits the transaction"""
        db = AsyncMock()
        await UserRoleUseCase(_make_repo(deleted_grant=True), db).revoke_grant(GRANT_ID)
        db.commit.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_not_found(self):
        """Raises UserGrantNotFoundError when no grant matches the given ID"""
        with pytest.raises(UserGrantNotFoundError):
            await UserRoleUseCase(_make_repo(deleted_grant=False), AsyncMock()).revoke_grant(GRANT_ID)


# ─── RoleManagementUseCase — create_role ──────────────────────────────────────

class TestCreateRole:
    def _data(self, name="editor") -> CreateRoleInput:
        return CreateRoleInput(name=name, permissions=[])

    @pytest.mark.asyncio
    async def test_success(self):
        """Creates the role, attaches permissions, commits, and returns the enriched RoleOutput"""
        db = AsyncMock()
        result = await RoleManagementUseCase(_make_repo(), db).create_role(self._data())
        db.commit.assert_awaited_once()
        assert result.role.name == "editor"

    @pytest.mark.asyncio
    async def test_duplicate_name_raises_already_exists(self):
        """Raises RoleAlreadyExistsError and rolls back when the role name is already taken"""
        repo = _make_repo()
        repo.create_role_definition = AsyncMock(
            side_effect=IntegrityError(None, None, Exception("unique_name"))
        )
        db = AsyncMock()
        with pytest.raises(RoleAlreadyExistsError):
            await RoleManagementUseCase(repo, db).create_role(self._data())
        db.rollback.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_feature_not_found_rolls_back(self):
        """Raises FeatureNotFoundError and rolls back when a referenced feature does not exist"""
        repo = _make_repo()
        repo.get_features_by_ids = AsyncMock(return_value=[])
        data = CreateRoleInput(
            name="editor",
            permissions=[RolePermissionInput(feature_id=FEATURE_ID, actions=[RoleAction.READ])]
        )
        db = AsyncMock()
        with pytest.raises(FeatureNotFoundError):
            await RoleManagementUseCase(repo, db).create_role(data)
        db.rollback.assert_awaited_once()


# ─── RoleManagementUseCase — update_role ──────────────────────────────────────

class TestUpdateRole:
    def _data(self, name="editor") -> UpdateRoleInput:
        return UpdateRoleInput(role_id=ROLE_ID, name=name, permissions=[])

    @pytest.mark.asyncio
    async def test_success_same_name(self):
        """Updates the role and replaces its permission matrix without checking dependencies"""
        db = AsyncMock()
        result = await RoleManagementUseCase(_make_repo(), db).update_role(self._data(name="editor"))
        db.commit.assert_awaited_once()
        assert result is not None

    @pytest.mark.asyncio
    async def test_name_change_with_dependencies_raises_in_use(self):
        """Raises RoleInUseError when user assignments or grants depend on the current role name"""
        with pytest.raises(RoleInUseError):
            await RoleManagementUseCase(_make_repo(dep_counts=(1, 0)), AsyncMock()).update_role(self._data(name="new-name"))

    @pytest.mark.asyncio
    async def test_not_found(self):
        """Raises RoleNotFoundError when no role matches the given ID"""
        with pytest.raises(RoleNotFoundError):
            await RoleManagementUseCase(_make_repo(role=None), AsyncMock()).update_role(self._data())

    @pytest.mark.asyncio
    async def test_integrity_error_raises_already_exists(self):
        """Raises RoleAlreadyExistsError and rolls back when the new name conflicts with an existing role"""
        repo = _make_repo()
        repo.update_role_definition = AsyncMock(
            side_effect=IntegrityError(None, None, Exception("unique_name"))
        )
        db = AsyncMock()
        with pytest.raises(RoleAlreadyExistsError):
            await RoleManagementUseCase(repo, db).update_role(self._data())
        db.rollback.assert_awaited_once()


# ─── RoleManagementUseCase — delete_role ──────────────────────────────────────

class TestDeleteRole:
    @pytest.mark.asyncio
    async def test_success(self):
        """Deletes the role and commits when no assignments or grants reference it"""
        db = AsyncMock()
        await RoleManagementUseCase(_make_repo(), db).delete_role(ROLE_ID)
        db.commit.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_not_found(self):
        """Raises RoleNotFoundError when no role matches the given ID"""
        with pytest.raises(RoleNotFoundError):
            await RoleManagementUseCase(_make_repo(role=None), AsyncMock()).delete_role(ROLE_ID)

    @pytest.mark.asyncio
    async def test_protected_system_role_raises(self):
        """Raises ProtectedRoleDeletionError when attempting to delete the system_administrator role"""
        role = _make_role(name="system_administrator", is_system=True)
        with pytest.raises(ProtectedRoleDeletionError):
            await RoleManagementUseCase(_make_repo(role=role), AsyncMock()).delete_role(ROLE_ID)

    @pytest.mark.asyncio
    async def test_has_user_assignments_raises_in_use(self):
        """Raises RoleInUseError when active user role assignments still reference the role"""
        with pytest.raises(RoleInUseError):
            await RoleManagementUseCase(_make_repo(dep_counts=(3, 0)), AsyncMock()).delete_role(ROLE_ID)

    @pytest.mark.asyncio
    async def test_has_user_grants_raises_in_use(self):
        """Raises RoleInUseError when active user grants still reference the role"""
        with pytest.raises(RoleInUseError):
            await RoleManagementUseCase(_make_repo(dep_counts=(0, 1)), AsyncMock()).delete_role(ROLE_ID)

    @pytest.mark.asyncio
    async def test_delete_returns_false_raises_not_found(self):
        """Raises RoleNotFoundError when the repository delete finds no matching row"""
        with pytest.raises(RoleNotFoundError):
            await RoleManagementUseCase(_make_repo(deleted_role=False), AsyncMock()).delete_role(ROLE_ID)

    @pytest.mark.asyncio
    async def test_unexpected_error_rolls_back(self):
        """Rolls back the transaction and re-raises on any unexpected database error"""
        repo = _make_repo()
        repo.delete_role_definition = AsyncMock(side_effect=RuntimeError("db error"))
        db = AsyncMock()
        with pytest.raises(RuntimeError):
            await RoleManagementUseCase(repo, db).delete_role(ROLE_ID)
        db.rollback.assert_awaited_once()
