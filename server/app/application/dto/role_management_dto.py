import uuid
from dataclasses import dataclass, field

from app.application.dto.admin_user_account_dto import RolePermissionSummary
from app.domain.entities.authorization_entities import GrantEffect, RoleAction


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
