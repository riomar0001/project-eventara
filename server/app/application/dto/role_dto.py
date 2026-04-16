import uuid
from dataclasses import dataclass
from typing import Optional

from pydantic import AwareDatetime

from app.domain.entities.authorization_entities import GrantEffect, RoleAction
from app.domain.entities.authorization_entities import Feature as FeatureEntity
from app.domain.entities.authorization_entities import UserGrant as UserGrantEntity
from app.domain.entities.authorization_entities import UserRole as UserRoleEntity


@dataclass
class AssignRoleInput:
    user_id: uuid.UUID
    role_id: uuid.UUID
    assigned_by: uuid.UUID
    expires_at: Optional[AwareDatetime] = None


@dataclass
class AssignRoleOutput:
    assignment: UserRoleEntity


@dataclass
class GetUserRolesOutput:
    assignments: list[UserRoleEntity]


@dataclass
class UpdateAssignmentInput:
    assignment_id: uuid.UUID
    expires_at: Optional[AwareDatetime]


@dataclass
class UpdateAssignmentOutput:
    assignment: UserRoleEntity


@dataclass
class CreateGrantsInput:
    user_id: uuid.UUID
    role_id: uuid.UUID
    feature_id: uuid.UUID
    actions: list[RoleAction]
    effect: GrantEffect
    granted_by: uuid.UUID
    starts_at: Optional[AwareDatetime] = None
    expires_at: Optional[AwareDatetime] = None
    reason: str | None = None


@dataclass
class CreateGrantsOutput:
    grants: list[UserGrantEntity]


@dataclass
class GetUserGrantsOutput:
    grants: list[UserGrantEntity]


@dataclass
class ListGrantFeaturesOutput:
    features: list[FeatureEntity]
