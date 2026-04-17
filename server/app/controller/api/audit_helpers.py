from __future__ import annotations

from datetime import datetime

from fastapi import Request

from app.application.dto.admin_user_account_dto import AdminUserAccountDetail, RolePermissionSummary
from app.application.dto.audit_log_dto import CreateAuditLogInput
from app.application.dto.role_management_dto import ManagedRoleDetail
from app.application.use_cases.audit_log_usecase import CreateAuditLogUseCase
from app.domain.entities.audit_log import ActionType, AuditLogStatus
from app.domain.entities.authorization_entities import Feature, UserGrant, UserRole


def _isoformat_or_none(value: datetime | None) -> str | None:
    return value.isoformat() if value else None


def _serialize_permissions(permissions: list[RolePermissionSummary]) -> list[dict]:
    return [
        {
            "feature_id": str(permission.feature_id) if permission.feature_id else None,
            "feature_slug": permission.feature_slug,
            "feature_name": permission.feature_name,
            "action": permission.action.value,
            "effect": permission.effect.value,
        }
        for permission in permissions
    ]


def serialize_feature(feature: Feature) -> dict:
    return {
        "id": str(feature.id),
        "slug": feature.slug,
        "name": feature.name,
        "description": feature.description,
        "is_enabled": feature.is_enabled,
    }


def serialize_role(role: ManagedRoleDetail) -> dict:
    return {
        "id": str(role.id),
        "name": role.name,
        "description": role.description,
        "is_default": role.is_default,
        "is_system": role.is_system,
        "permissions": _serialize_permissions(role.permissions),
        "permission_count": len(role.permissions),
    }


def serialize_assignment(assignment: UserRole) -> dict:
    return {
        "id": str(assignment.id),
        "user_id": str(assignment.user_id),
        "role_id": str(assignment.role_id),
        "expires_at": _isoformat_or_none(assignment.expires_at),
        "assigned_by": str(assignment.assigned_by) if assignment.assigned_by else None,
        "assigned_at": _isoformat_or_none(assignment.assigned_at),
    }


def serialize_grant(grant: UserGrant) -> dict:
    return {
        "id": str(grant.id),
        "user_id": str(grant.user_id),
        "feature_id": str(grant.feature_id),
        "role_id": str(grant.role_id),
        "action": grant.action.value,
        "effect": grant.effect.value,
        "reason": grant.reason,
        "starts_at": _isoformat_or_none(grant.starts_at),
        "expires_at": _isoformat_or_none(grant.expires_at),
        "granted_by": str(grant.granted_by) if grant.granted_by else None,
    }


def serialize_admin_user_account(detail: AdminUserAccountDetail) -> dict:
    return {
        "user_id": str(detail.user_id),
        "name": detail.name,
        "alias": detail.alias,
        "email": detail.email,
        "status": detail.status.value,
        "role_id": str(detail.role_id) if detail.role_id else None,
        "role_name": detail.role_name,
        "email_verified": detail.email_verified,
        "role_permissions": _serialize_permissions(detail.role_permissions),
    }


def get_client_ip(request: Request) -> str | None:
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()

    real_ip = request.headers.get("x-real-ip")
    if real_ip:
        return real_ip.strip()

    if request.client and request.client.host:
        return request.client.host

    return None


async def safe_audit_log(
    audit_use_case: CreateAuditLogUseCase,
    request: Request,
    *,
    user_id,
    action_type: ActionType,
    resource_type: str,
    resource_id: str | None,
    status: AuditLogStatus,
    old_values: dict | None = None,
    new_values: dict | None = None,
    additional_context: dict | None = None,
) -> None:
    context = {
        "method": request.method,
        "path": request.url.path,
    }

    if additional_context:
        context.update(additional_context)

    try:
        await audit_use_case.execute(
            CreateAuditLogInput(
                user_id=user_id,
                ip_address=get_client_ip(request),
                user_agent=request.headers.get("user-agent"),
                action_type=action_type,
                resource_type=resource_type,
                resource_id=resource_id,
                status=status,
                old_values=old_values,
                new_values=new_values,
                additional_context=context,
            )
        )
    except Exception:
        # Audit logging must never block the main request lifecycle.
        return
