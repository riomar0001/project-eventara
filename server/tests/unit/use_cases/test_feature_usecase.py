"""Unit tests for FeatureManagementUseCase."""

import uuid
from unittest.mock import AsyncMock, MagicMock

import pytest
from sqlalchemy.exc import IntegrityError

from app.application.dto.features_dto import CreateFeatureInput, UpdateFeatureInput
from app.application.use_cases.feature_usecase import FeatureManagementUseCase
from app.domain.entities.authorization_entities import Feature
from app.domain.exceptions.role_exceptions import (
    FeatureAlreadyExistsError,
    FeatureInUseError,
    FeatureNotFoundError,
)

# ─── Helpers ──────────────────────────────────────────────────────────────────

FEATURE_ID = uuid.uuid4()


def _make_feature(*, slug="events", name="Events", is_enabled=True) -> Feature:
    return Feature(id=FEATURE_ID, slug=slug, name=name, is_enabled=is_enabled)


def _make_repo(
    *,
    feature=None,
    features=None,
    created=None,
    updated=None,
    deleted=True,
    dep_counts=(0, 0),
) -> MagicMock:
    repo = MagicMock()
    repo.list_all_features = AsyncMock(return_value=features or [])
    repo.get_feature_by_id = AsyncMock(return_value=feature)
    repo.create_feature_definition = AsyncMock(return_value=created or _make_feature())
    repo.update_feature_definition = AsyncMock(return_value=updated or _make_feature())
    repo.delete_feature_definition = AsyncMock(return_value=deleted)
    repo.get_feature_dependency_counts = AsyncMock(return_value=dep_counts)
    return repo


def _make_uc(repo=None) -> FeatureManagementUseCase:
    return FeatureManagementUseCase(repo=repo or _make_repo(), db=AsyncMock())


# ─── list_features ────────────────────────────────────────────────────────────

class TestListFeatures:
    @pytest.mark.asyncio
    async def test_returns_all_features(self):
        features = [_make_feature(slug="events"), _make_feature(slug="venues")]
        result = await _make_uc(_make_repo(features=features)).list_features()
        assert result.features == features

    @pytest.mark.asyncio
    async def test_returns_empty_list_when_none(self):
        result = await _make_uc(_make_repo(features=[])).list_features()
        assert result.features == []


# ─── get_feature ──────────────────────────────────────────────────────────────

class TestGetFeature:
    @pytest.mark.asyncio
    async def test_success(self):
        feature = _make_feature()
        result = await _make_uc(_make_repo(feature=feature)).get_feature(FEATURE_ID)
        assert result.feature is feature

    @pytest.mark.asyncio
    async def test_not_found(self):
        with pytest.raises(FeatureNotFoundError):
            await _make_uc(_make_repo(feature=None)).get_feature(FEATURE_ID)


# ─── create_feature ───────────────────────────────────────────────────────────

class TestCreateFeature:
    def _data(self, slug="events") -> CreateFeatureInput:
        return CreateFeatureInput(slug=slug, name="Events", description="Manage events", is_enabled=True)

    @pytest.mark.asyncio
    async def test_success(self):
        feature = _make_feature()
        repo = _make_repo(created=feature)
        db = AsyncMock()
        uc = FeatureManagementUseCase(repo=repo, db=db)
        result = await uc.create_feature(self._data())
        assert result.feature is feature
        db.commit.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_duplicate_slug_raises_already_exists(self):
        repo = _make_repo()
        repo.create_feature_definition = AsyncMock(
            side_effect=IntegrityError(None, None, Exception("unique_slug"))
        )
        db = AsyncMock()
        uc = FeatureManagementUseCase(repo=repo, db=db)
        with pytest.raises(FeatureAlreadyExistsError):
            await uc.create_feature(self._data())
        db.rollback.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_unexpected_error_rolls_back(self):
        repo = _make_repo()
        repo.create_feature_definition = AsyncMock(side_effect=RuntimeError("db error"))
        db = AsyncMock()
        uc = FeatureManagementUseCase(repo=repo, db=db)
        with pytest.raises(RuntimeError):
            await uc.create_feature(self._data())
        db.rollback.assert_awaited_once()


# ─── update_feature ───────────────────────────────────────────────────────────

class TestUpdateFeature:
    def _data(self, slug="events") -> UpdateFeatureInput:
        return UpdateFeatureInput(
            feature_id=FEATURE_ID, slug=slug, name="Events Updated",
            description="Updated", is_enabled=True,
        )

    @pytest.mark.asyncio
    async def test_success_same_slug(self):
        feature = _make_feature(slug="events")
        repo = _make_repo(feature=feature, updated=feature)
        db = AsyncMock()
        uc = FeatureManagementUseCase(repo=repo, db=db)
        result = await uc.update_feature(self._data(slug="events"))
        assert result.feature is feature
        repo.get_feature_dependency_counts.assert_not_awaited()
        db.commit.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_success_slug_change_no_dependents(self):
        feature = _make_feature(slug="events")
        updated = _make_feature(slug="events-v2")
        repo = _make_repo(feature=feature, updated=updated, dep_counts=(0, 0))
        db = AsyncMock()
        result = await FeatureManagementUseCase(repo=repo, db=db).update_feature(self._data(slug="events-v2"))
        assert result.feature is updated
        db.commit.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_slug_change_with_role_permissions_raises_in_use(self):
        feature = _make_feature(slug="events")
        repo = _make_repo(feature=feature, dep_counts=(2, 0))
        with pytest.raises(FeatureInUseError):
            await _make_uc(repo).update_feature(self._data(slug="events-v2"))

    @pytest.mark.asyncio
    async def test_slug_change_with_user_grants_raises_in_use(self):
        feature = _make_feature(slug="events")
        repo = _make_repo(feature=feature, dep_counts=(0, 1))
        with pytest.raises(FeatureInUseError):
            await _make_uc(repo).update_feature(self._data(slug="events-v2"))

    @pytest.mark.asyncio
    async def test_feature_not_found(self):
        repo = _make_repo(feature=None)
        with pytest.raises(FeatureNotFoundError):
            await _make_uc(repo).update_feature(self._data())

    @pytest.mark.asyncio
    async def test_update_returns_none_raises_not_found(self):
        feature = _make_feature(slug="events")
        repo = _make_repo(feature=feature, updated=None)
        repo.update_feature_definition = AsyncMock(return_value=None)
        with pytest.raises(FeatureNotFoundError):
            await _make_uc(repo).update_feature(self._data())

    @pytest.mark.asyncio
    async def test_integrity_error_raises_already_exists(self):
        feature = _make_feature(slug="events")
        repo = _make_repo(feature=feature)
        repo.update_feature_definition = AsyncMock(
            side_effect=IntegrityError(None, None, Exception("unique_slug"))
        )
        db = AsyncMock()
        uc = FeatureManagementUseCase(repo=repo, db=db)
        with pytest.raises(FeatureAlreadyExistsError):
            await uc.update_feature(self._data(slug="events"))
        db.rollback.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_unexpected_error_rolls_back(self):
        feature = _make_feature(slug="events")
        repo = _make_repo(feature=feature)
        repo.update_feature_definition = AsyncMock(side_effect=RuntimeError("db error"))
        db = AsyncMock()
        uc = FeatureManagementUseCase(repo=repo, db=db)
        with pytest.raises(RuntimeError):
            await uc.update_feature(self._data())
        db.rollback.assert_awaited_once()


# ─── delete_feature ───────────────────────────────────────────────────────────

class TestDeleteFeature:
    @pytest.mark.asyncio
    async def test_success(self):
        repo = _make_repo(feature=_make_feature(), deleted=True, dep_counts=(0, 0))
        db = AsyncMock()
        await FeatureManagementUseCase(repo=repo, db=db).delete_feature(FEATURE_ID)
        repo.delete_feature_definition.assert_awaited_once_with(FEATURE_ID)
        db.commit.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_not_found(self):
        repo = _make_repo(feature=None)
        with pytest.raises(FeatureNotFoundError):
            await _make_uc(repo).delete_feature(FEATURE_ID)

    @pytest.mark.asyncio
    async def test_has_role_permissions_raises_in_use(self):
        repo = _make_repo(feature=_make_feature(), dep_counts=(3, 0))
        with pytest.raises(FeatureInUseError):
            await _make_uc(repo).delete_feature(FEATURE_ID)

    @pytest.mark.asyncio
    async def test_has_user_grants_raises_in_use(self):
        repo = _make_repo(feature=_make_feature(), dep_counts=(0, 2))
        with pytest.raises(FeatureInUseError):
            await _make_uc(repo).delete_feature(FEATURE_ID)

    @pytest.mark.asyncio
    async def test_delete_returns_false_raises_not_found(self):
        repo = _make_repo(feature=_make_feature(), deleted=False, dep_counts=(0, 0))
        with pytest.raises(FeatureNotFoundError):
            await _make_uc(repo).delete_feature(FEATURE_ID)

    @pytest.mark.asyncio
    async def test_unexpected_error_rolls_back(self):
        repo = _make_repo(feature=_make_feature(), dep_counts=(0, 0))
        repo.delete_feature_definition = AsyncMock(side_effect=RuntimeError("db error"))
        db = AsyncMock()
        uc = FeatureManagementUseCase(repo=repo, db=db)
        with pytest.raises(RuntimeError):
            await uc.delete_feature(FEATURE_ID)
        db.rollback.assert_awaited_once()
