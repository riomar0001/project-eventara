import uuid
from dataclasses import dataclass, field

from pydantic import AwareDatetime

from app.domain.entities.authorization_entities import Feature as FeatureEntity
from app.domain.entities.authorization_entities import GrantEffect, RoleAction
from app.domain.entities.authorization_entities import UserGrant as UserGrantEntity
from app.domain.entities.authorization_entities import UserRole as UserRoleEntity


# ─── Shared ───────────────────────────────────────────────────────────────────

@dataclass
class RolePermissionSummary:
    feature_slug: str
    feature_name: str
    action: RoleAction
    effect: GrantEffect
    feature_id: uuid.UUID | None = None


# ─── Role assignments ─────────────────────────────────────────────────────────

@dataclass
class AssignRoleInput:
    user_id: uuid.UUID
    role_id: uuid.UUID
    assigned_by: uuid.UUID
    expires_at: AwareDatetime | None = None


@dataclass
class AssignRoleOutput:
    assignment: UserRoleEntity


@dataclass
class GetUserRolesOutput:
    assignments: list[UserRoleEntity]


@dataclass
class UpdateAssignmentInput:
    assignment_id: uuid.UUID
    expires_at: AwareDatetime | None


@dataclass
class UpdateAssignmentOutput:
    assignment: UserRoleEntity


# ─── User grants ──────────────────────────────────────────────────────────────

@dataclass
class CreateGrantsInput:
    user_id: uuid.UUID
    role_id: uuid.UUID
    feature_id: uuid.UUID
    actions: list[RoleAction]
    effect: GrantEffect
    granted_by: uuid.UUID
    starts_at: AwareDatetime | None = None
    expires_at: AwareDatetime | None = None
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


# ─── Role management ──────────────────────────────────────────────────────────

@dataclass
class RolePermissionInput:
    feature_id: uuid.UUID
    actions: list[RoleAction]
    effect: GrantEffect = GrantEffect.ALLOW


@dataclass
class ManagedRoleDetail:
    id: uuid.UUID
    name: str
    description: str | None = None
    is_default: bool = False
    is_system: bool = False
    permissions: list[RolePermissionSummary] = field(default_factory=list)


@dataclass
class CreateRoleInput:
    name: str
    description: str | None = None
    is_default: bool = False
    is_system: bool = False
    permissions: list[RolePermissionInput] = field(default_factory=list)


@dataclass
class UpdateRoleInput:
    role_id: uuid.UUID
    name: str
    description: str | None = None
    is_default: bool = False
    is_system: bool = False
    permissions: list[RolePermissionInput] = field(default_factory=list)


@dataclass
class RoleOutput:
    role: ManagedRoleDetail


@dataclass
class ListRolesOutput:
    roles: list[ManagedRoleDetail]
