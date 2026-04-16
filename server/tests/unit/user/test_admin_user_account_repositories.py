import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock

from app.domain.entities.user_entity import UserStatus
from app.infrastructure.database.models.user_models import User, UserSecurity
from app.infrastructure.database.repositories.role_repository import RoleRepository
from app.infrastructure.database.repositories.user_repository import UserRepository


class TestRoleRepositoryAdminFlows:
    async def test_replace_active_assignments_adds_single_new_assignment(self):
        db = MagicMock()
        db.execute = AsyncMock()
        db.flush = AsyncMock()

        def add_assignment(assignment):
            assignment.id = uuid.uuid4()
            assignment.assigned_at = datetime.now(timezone.utc)

        db.add = MagicMock(side_effect=add_assignment)
        repository = RoleRepository(db)
        user_id = uuid.uuid4()
        role_id = uuid.uuid4()
        assigned_by = uuid.uuid4()

        result = await repository.replace_active_assignments(
            user_id=user_id,
            role_id=role_id,
            assigned_by=assigned_by,
        )

        db.execute.assert_awaited_once()
        db.add.assert_called_once()
        db.flush.assert_awaited_once()
        assert result.user_id == user_id
        assert result.role_id == role_id
        assert result.assigned_by == assigned_by


class TestUserRepositoryAdminFlows:
    async def test_update_email_and_clear_verification_resets_security_state(self):
        user = User(email="old@example.com", password="hashed_password", status=UserStatus.ACTIVE)
        user.id = uuid.uuid4()
        user.onboarding_completed = False
        security = UserSecurity(user_id=user.id, email_verified=True, email_verified_at=datetime.now(timezone.utc))
        execute_result = MagicMock()
        execute_result.scalar_one_or_none.return_value = security
        db = MagicMock()
        db.get = AsyncMock(return_value=user)
        db.execute = AsyncMock(return_value=execute_result)
        db.flush = AsyncMock()
        db.add = MagicMock()
        repository = UserRepository(db)

        result = await repository.update_email_and_clear_verification(user.id, "new@example.com")

        assert result is not None
        assert result.email == "new@example.com"
        assert security.email_verified is False
        assert security.email_verified_at is None
        db.flush.assert_awaited_once()
