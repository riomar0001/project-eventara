from __future__ import annotations

from datetime import datetime

from fastapi import Request

from app.application.dto.audit_log_dto import CreateAuditLogInput
from app.application.dto.roles_dto import ManagedRoleDetail, RolePermissionSummary
from app.application.dto.users_dto import AdminUserAccountDetail
from app.application.use_cases.audit_log_usecase import AuditLogUseCase
from app.domain.entities.audit_log import ActionType, AuditLogStatus
from app.domain.entities.authorization_entities import Feature, UserGrant, UserRole
from app.domain.entities.event_entity import Event, EventSession
from app.domain.entities.user_entity import UserProfile
from app.domain.entities.venue_entities import Venue, VenueRating


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


def serialize_profile(profile: UserProfile) -> dict:
    return {
        "user_id": str(profile.user_id),
        "alias": profile.alias,
        "first_name": profile.first_name,
        "last_name": profile.last_name,
        "age_group": profile.age_group.value if profile.age_group else None,
        "gender": profile.gender.value if profile.gender else None,
        "education_level": profile.education_level.value if profile.education_level else None,
        "occupation": profile.occupation,
        "bio": profile.bio,
    }


def serialize_venue_rating(rating: VenueRating) -> dict:
    return {
        "id": str(rating.id),
        "user_id": str(rating.user_id),
        "venue_id": str(rating.venue_id),
        "rating": rating.rating,
        "comment": rating.comment,
    }


def serialize_venue(venue: Venue) -> dict:
    return {
        "id": str(venue.id),
        "creator_id": str(venue.creator_id),
        "name": venue.name,
        "description": venue.description,
        "address_line": venue.address_line,
        "city": venue.city,
        "province": venue.province,
        "postal_code": venue.postal_code,
        "region": venue.region,
        "country": venue.country,
        "capacity": venue.capacity,
        "venue_type": venue.venue_type.value,
        "is_partner": venue.is_partner,
        "amenities": venue.amenities,
        "contact_name": venue.contact_name,
        "contact_phone": venue.contact_phone,
        "contact_email": venue.contact_email,
    }


def serialize_event_participant(participant) -> dict:
    return {
        "id": str(participant.id),
        "user_id": str(participant.user_id),
        "event_session_id": str(participant.event_session_id),
        "status": participant.status.value if hasattr(participant.status, "value") else participant.status,
    }


def serialize_event(event: Event) -> dict:
    return {
        "id": str(event.id),
        "title": event.title,
        "description": event.description,
        "start_date": event.start_date.isoformat() if event.start_date else None,
        "end_date": event.end_date.isoformat() if event.end_date else None,
        "status": event.status.value if hasattr(event.status, "value") else event.status,
        "created_by": str(event.created_by),
    }


def serialize_event_sessions(sessions: list[EventSession]) -> list[dict]:
    return [
        {
            "id": str(s.id),
            "event_id": str(s.event_id),
            "venue_id": str(s.venue_id),
            "title": s.title,
            "start_datetime": s.start_datetime.isoformat() if s.start_datetime else None,
            "end_datetime": s.end_datetime.isoformat() if s.end_datetime else None,
            "status": s.status.value if hasattr(s.status, "value") else s.status,
        }
        for s in sessions
    ]


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
    audit_use_case: AuditLogUseCase,
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
        await audit_use_case.create(
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
