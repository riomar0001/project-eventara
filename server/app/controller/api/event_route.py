"""Event management API routes.

Exposes endpoints for creating events, updating event metadata, updating
individual event sessions, manually transitioning event or session statuses,
and physically deleting events or sessions that are still in a deletable state.
Authentication is required; no RBAC feature gate is applied so any verified
user may create, update, or delete their own events.

Error mapping summary:
  - 400  date, business-rule, invalid status transition, or deletion-not-allowed
  - 401  missing, expired, or invalid Bearer token
  - 403  caller is not the event creator (update/delete only)
  - 404  event, session, or venue not found
  - 422  request body failed schema validation
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.application.dto.event_dto import (
    CreateEventInput,
    CreateEventSessionInput,
    DeleteEventInput,
    DeleteEventSessionInput,
    UpdateEventBannerInput,
    UpdateEventMetadataInput,
    UpdateEventSessionInput,
)
from app.application.dto.event_status_dto import UpdateEventSessionStatusInput, UpdateEventStatusInput
from app.application.use_cases.audit_log_usecase import AuditLogUseCase
from app.application.use_cases.event_deletion_usecase import EventDeletionUseCase
from app.application.use_cases.event_status_usecase import EventStatusUseCase
from app.application.use_cases.event_usecase import EventUseCase
from app.controller.api.audit_helpers import safe_audit_log, serialize_event, serialize_event_sessions
from app.controller.dependencies import get_audit_log_use_case, get_current_user_id
from app.controller.dependencies.storage_depends import get_storage_service
from app.controller.dependencies.use_cases_depends import get_event_deletion_use_case, get_event_status_use_case, get_event_use_case
from app.controller.docs.event_docs import (
    EVENT_BANNER_UPLOAD_OPENAPI_EXTRA,
    EVENT_BANNER_STORAGE_UNAVAILABLE,
    EVENT_CREATE_OPENAPI_EXTRA,
    EVENT_DATE_INVALID,
    EVENT_DELETION_NOT_ALLOWED,
    EVENT_METADATA_DATE_INVALID,
    EVENT_METADATA_NOT_FOUND,
    EVENT_NOT_FOUND,
    EVENT_SESSION_DATE_INVALID,
    EVENT_SESSION_DELETION_NOT_ALLOWED,
    EVENT_SESSION_NOT_FOUND,
    EVENT_SESSION_STATUS_INVALID_TRANSITION,
    EVENT_STATUS_INVALID_TRANSITION,
    EVENT_UNAUTHORIZED_OPERATION,
    EVENT_UPDATE_OPENAPI_EXTRA,
    EVENT_VALIDATION_ERROR,
    UNAUTHORIZED,
)
from app.controller.schemas.event_schema import (
    EventBannerUploadData,
    EventBannerUploadRequest,
    EventBannerUploadResponse,
    EventCreateRequest,
    EventDeletedResponse,
    EventMetadataUpdatedResponse,
    EventRecordResponse,
    EventSessionDeletedResponse,
    EventSessionRecordResponse,
    EventSessionStatusUpdatedResponse,
    EventSessionStatusUpdateRequest,
    EventSessionUpdatedResponse,
    EventSessionUpdateRequest,
    EventStatusUpdatedResponse,
    EventStatusUpdateRequest,
    EventUpdateRequest,
    EventWithSessionsResponse,
)
from app.domain.entities.audit_log import ActionType, AuditLogStatus
from app.domain.entities.event_entity import Event as EventEntity
from app.domain.entities.event_entity import EventSession as EventSessionEntity
from app.domain.exceptions.event_exceptions import (
    EventDateValidationError,
    EventDeletionNotAllowedError,
    EventNotFoundError,
    EventStatusTransitionError,
    EventValidationError,
    UnauthorizedEventOperationError,
)
from app.domain.exceptions.event_session_exceptions import (
    EventLastSessionError,
    EventSessionDeletionNotAllowedError,
    EventSessionExceedsEventBoundsError,
    EventSessionNotFoundError,
    EventSessionStatusTransitionError,
    InvalidEventSessionDateError,
)
from app.domain.exceptions.venue_exceptions import VenueNotFoundError
from app.infrastructure.storage.storage_service import StorageService

event_router = APIRouter(prefix="/events", tags=["Events"])


def _to_event_response(event: EventEntity) -> EventRecordResponse:
    return EventRecordResponse(
        id=event.id,
        title=event.title,
        description=event.description,
        start_date=event.start_date,
        end_date=event.end_date,
        status=event.status.value if hasattr(event.status, "value") else event.status,
        created_by=event.created_by,
        banner_url=StorageService.public_url_for_object_key(event.banner_url),
        created_at=event.created_at,
        updated_at=event.updated_at,
    )


def _to_session_response(session: EventSessionEntity) -> EventSessionRecordResponse:
    return EventSessionRecordResponse(
        id=session.id,
        event_id=session.event_id,
        venue_id=session.venue_id,
        title=session.title,
        description=session.description,
        start_datetime=session.start_datetime,
        end_datetime=session.end_datetime,
        status=session.status.value if hasattr(session.status, "value") else session.status,
        max_slots=session.max_slots,
        created_at=session.created_at,
        updated_at=session.updated_at,
    )


@event_router.post(
    "",
    response_model=EventWithSessionsResponse,
    status_code=status.HTTP_201_CREATED,
    responses={**UNAUTHORIZED, **EVENT_NOT_FOUND, **EVENT_DATE_INVALID, **EVENT_VALIDATION_ERROR},
    summary="Create a new event with sessions",
    description=(
        "Creates an event and its associated sessions atomically. "
        "At least one session is required. "
        "Session date windows must fall within the event date range. "
        "An optional ``banner_url`` may be supplied when the banner has already been uploaded through the feature-specific banner endpoint. "
        "The event description accepts raw HTML produced by a WYSIWYG editor."
    ),
    openapi_extra=EVENT_CREATE_OPENAPI_EXTRA,
)
async def create_event(
    request: Request,
    body: EventCreateRequest,
    user_id: uuid.UUID = Depends(get_current_user_id),
    use_case: EventUseCase = Depends(get_event_use_case),
    audit_use_case: AuditLogUseCase = Depends(get_audit_log_use_case),
) -> EventWithSessionsResponse:
    """Create an event together with all initial sessions in one transaction."""
    session_inputs = [
        CreateEventSessionInput(
            venue_id=s.venue_id,
            title=s.title,
            description=s.description,
            start_datetime=s.start_datetime,
            end_datetime=s.end_datetime,
            max_slots=s.max_slots,
        )
        for s in body.sessions
    ]

    try:
        result = await use_case.create_event(
            CreateEventInput(
                title=body.title,
                description=body.description,
                start_date=body.start_date,
                end_date=body.end_date,
                created_by=user_id,
                banner_url=StorageService.object_key_from_public_url(body.banner_url),
                sessions=session_inputs,
            )
        )
    except (EventDateValidationError, EventValidationError, InvalidEventSessionDateError, EventSessionExceedsEventBoundsError) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except VenueNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))

    await safe_audit_log(
        audit_use_case,
        request,
        user_id=user_id,
        action_type=ActionType.CREATE,
        resource_type="events",
        resource_id=str(result.event.id),
        status=AuditLogStatus.SUCCESS,
        new_values={
            **serialize_event(result.event),
            "sessions": serialize_event_sessions(result.sessions),
        },
        additional_context={"session_count": len(result.sessions)},
    )

    return EventWithSessionsResponse(
        data=_to_event_response(result.event),
        sessions=[_to_session_response(s) for s in result.sessions],
    )


@event_router.patch(
    "/{event_id}",
    response_model=EventMetadataUpdatedResponse,
    status_code=status.HTTP_200_OK,
    responses={
        **UNAUTHORIZED,
        **EVENT_UNAUTHORIZED_OPERATION,
        **EVENT_METADATA_NOT_FOUND,
        **EVENT_METADATA_DATE_INVALID,
        **EVENT_VALIDATION_ERROR,
    },
    summary="Update event metadata",
    description=(
        "Updates an event's title, description, date range, and optional banner object key. "
        "Only the event creator may perform this operation. "
        "The event description accepts raw HTML produced by a WYSIWYG editor."
    ),
    openapi_extra=EVENT_UPDATE_OPENAPI_EXTRA,
)
async def update_event_metadata(
    request: Request,
    event_id: uuid.UUID,
    body: EventUpdateRequest,
    user_id: uuid.UUID = Depends(get_current_user_id),
    use_case: EventUseCase = Depends(get_event_use_case),
    audit_use_case: AuditLogUseCase = Depends(get_audit_log_use_case),
) -> EventMetadataUpdatedResponse:
    """Update an event's metadata fields in a single atomic transaction."""
    try:
        result = await use_case.update_event_metadata(
            UpdateEventMetadataInput(
                event_id=event_id,
                updated_by=user_id,
                title=body.title,
                description=body.description,
                start_date=body.start_date,
                end_date=body.end_date,
                banner_url=StorageService.object_key_from_public_url(body.banner_url),
            )
        )
    except UnauthorizedEventOperationError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    except EventNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except EventDateValidationError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    await safe_audit_log(
        audit_use_case,
        request,
        user_id=user_id,
        action_type=ActionType.UPDATE,
        resource_type="events",
        resource_id=str(result.event.id),
        status=AuditLogStatus.SUCCESS,
        old_values=serialize_event(result.old_event),
        new_values=serialize_event(result.event),
    )

    return EventMetadataUpdatedResponse(data=_to_event_response(result.event))


@event_router.patch(
    "/{event_id}/session/{session_id}",
    response_model=EventSessionUpdatedResponse,
    status_code=status.HTTP_200_OK,
    responses={
        **UNAUTHORIZED,
        **EVENT_UNAUTHORIZED_OPERATION,
        **EVENT_SESSION_NOT_FOUND,
        **EVENT_SESSION_DATE_INVALID,
        **EVENT_VALIDATION_ERROR,
    },
    summary="Update an event session",
    description=(
        "Updates a single event session by its ID. "
        "Only the creator of the parent event may perform this operation. "
        "The session date window must fall within the parent event's date range."
    ),
)
async def update_event_session(
    request: Request,
    event_id: uuid.UUID,
    session_id: uuid.UUID,
    body: EventSessionUpdateRequest,
    user_id: uuid.UUID = Depends(get_current_user_id),
    use_case: EventUseCase = Depends(get_event_use_case),
    audit_use_case: AuditLogUseCase = Depends(get_audit_log_use_case),
) -> EventSessionUpdatedResponse:
    """Update an event session's fields in a single atomic transaction."""
    try:
        result = await use_case.update_event_session(
            UpdateEventSessionInput(
                session_id=session_id,
                updated_by=user_id,
                venue_id=body.venue_id,
                title=body.title,
                description=body.description,
                start_datetime=body.start_datetime,
                end_datetime=body.end_datetime,
                max_slots=body.max_slots,
            )
        )
    except UnauthorizedEventOperationError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    except (EventSessionNotFoundError, VenueNotFoundError) as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except (InvalidEventSessionDateError, EventSessionExceedsEventBoundsError) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    await safe_audit_log(
        audit_use_case,
        request,
        user_id=user_id,
        action_type=ActionType.UPDATE,
        resource_type="event_sessions",
        resource_id=str(result.session.id),
        status=AuditLogStatus.SUCCESS,
        old_values=serialize_event_sessions([result.old_session])[0],
        new_values=serialize_event_sessions([result.session])[0],
    )

    return EventSessionUpdatedResponse(data=_to_session_response(result.session))


@event_router.patch(
    "/{event_id}/status",
    response_model=EventStatusUpdatedResponse,
    status_code=status.HTTP_200_OK,
    responses={
        **UNAUTHORIZED,
        **EVENT_UNAUTHORIZED_OPERATION,
        **EVENT_METADATA_NOT_FOUND,
        **EVENT_STATUS_INVALID_TRANSITION,
        **EVENT_VALIDATION_ERROR,
    },
    summary="Update event status",
    description=(
        "Manually transitions an event to a new status. "
        "Only the event creator may perform this operation. "
        "Allowed transitions: DRAFT → POSTED | CANCELLED; "
        "POSTED → STARTED | CANCELLED | POSTPONED; "
        "STARTED → ENDED | CANCELLED; "
        "POSTPONED → POSTED | CANCELLED. "
        "ENDED and CANCELLED are terminal states with no further transitions."
    ),
)
async def update_event_status(
    request: Request,
    event_id: uuid.UUID,
    body: EventStatusUpdateRequest,
    user_id: uuid.UUID = Depends(get_current_user_id),
    use_case: EventStatusUseCase = Depends(get_event_status_use_case),
    audit_use_case: AuditLogUseCase = Depends(get_audit_log_use_case),
) -> EventStatusUpdatedResponse:
    """Transition an event status through the allowed state machine in one atomic transaction."""
    try:
        result = await use_case.update_event_status(
            UpdateEventStatusInput(
                event_id=event_id,
                updated_by=user_id,
                new_status=body.new_status,
            )
        )
    except UnauthorizedEventOperationError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    except EventNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except EventStatusTransitionError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    await safe_audit_log(
        audit_use_case,
        request,
        user_id=user_id,
        action_type=ActionType.UPDATE,
        resource_type="events",
        resource_id=str(result.event.id),
        status=AuditLogStatus.SUCCESS,
        old_values=serialize_event(result.old_event),
        new_values=serialize_event(result.event),
        additional_context={"status_transition": f"{result.old_event.status} → {result.event.status}"},
    )

    return EventStatusUpdatedResponse(data=_to_event_response(result.event))


@event_router.patch(
    "/{event_id}/session/{session_id}/status",
    response_model=EventSessionStatusUpdatedResponse,
    status_code=status.HTTP_200_OK,
    responses={
        **UNAUTHORIZED,
        **EVENT_UNAUTHORIZED_OPERATION,
        **EVENT_SESSION_NOT_FOUND,
        **EVENT_SESSION_STATUS_INVALID_TRANSITION,
        **EVENT_VALIDATION_ERROR,
    },
    summary="Update event session status",
    description=(
        "Manually transitions an event session to a new status. "
        "Only the creator of the parent event may perform this operation. "
        "Allowed transitions: DRAFT → POSTED | CANCELLED; "
        "POSTED → STARTED | CANCELLED | POSTPONED; "
        "STARTED → ENDED | CANCELLED; "
        "POSTPONED → POSTED | CANCELLED. "
        "ENDED and CANCELLED are terminal states with no further transitions."
    ),
)
async def update_event_session_status(
    request: Request,
    event_id: uuid.UUID,
    session_id: uuid.UUID,
    body: EventSessionStatusUpdateRequest,
    user_id: uuid.UUID = Depends(get_current_user_id),
    use_case: EventStatusUseCase = Depends(get_event_status_use_case),
    audit_use_case: AuditLogUseCase = Depends(get_audit_log_use_case),
) -> EventSessionStatusUpdatedResponse:
    """Transition an event session status through the allowed state machine in one atomic transaction."""
    try:
        result = await use_case.update_event_session_status(
            UpdateEventSessionStatusInput(
                session_id=session_id,
                updated_by=user_id,
                new_status=body.new_status,
            )
        )
    except UnauthorizedEventOperationError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    except (EventSessionNotFoundError, EventNotFoundError) as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except EventSessionStatusTransitionError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    await safe_audit_log(
        audit_use_case,
        request,
        user_id=user_id,
        action_type=ActionType.UPDATE,
        resource_type="event_sessions",
        resource_id=str(result.session.id),
        status=AuditLogStatus.SUCCESS,
        old_values=serialize_event_sessions([result.old_session])[0],
        new_values=serialize_event_sessions([result.session])[0],
        additional_context={"status_transition": f"{result.old_session.status} → {result.session.status}"},
    )

    return EventSessionStatusUpdatedResponse(data=_to_session_response(result.session))


@event_router.delete(
    "/{event_id}",
    response_model=EventDeletedResponse,
    status_code=status.HTTP_200_OK,
    responses={
        **UNAUTHORIZED,
        **EVENT_UNAUTHORIZED_OPERATION,
        **EVENT_METADATA_NOT_FOUND,
        **EVENT_DELETION_NOT_ALLOWED,
    },
    summary="Delete an event",
    description=(
        "Permanently deletes an event and all its sessions. "
        "Only the event creator may perform this operation. "
        "Deletion is only permitted when the event status is DRAFT or CANCELLED. "
        "All child sessions and participant records are removed via database cascade."
    ),
)
async def delete_event(
    request: Request,
    event_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id),
    use_case: EventDeletionUseCase = Depends(get_event_deletion_use_case),
    audit_use_case: AuditLogUseCase = Depends(get_audit_log_use_case),
) -> EventDeletedResponse:
    """Delete an event in one atomic transaction; cascades to all child sessions."""
    try:
        result = await use_case.delete_event(DeleteEventInput(event_id=event_id, deleted_by=user_id))
    except UnauthorizedEventOperationError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    except EventNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except EventDeletionNotAllowedError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    await safe_audit_log(
        audit_use_case,
        request,
        user_id=user_id,
        action_type=ActionType.DELETE,
        resource_type="events",
        resource_id=str(result.event.id),
        status=AuditLogStatus.SUCCESS,
        old_values=serialize_event(result.event),
        additional_context={"deleted_status": result.event.status.value if hasattr(result.event.status, "value") else result.event.status},
    )

    return EventDeletedResponse(data=_to_event_response(result.event))


@event_router.delete(
    "/{event_id}/session/{session_id}",
    response_model=EventSessionDeletedResponse,
    status_code=status.HTTP_200_OK,
    responses={
        **UNAUTHORIZED,
        **EVENT_UNAUTHORIZED_OPERATION,
        **EVENT_METADATA_NOT_FOUND,
        **EVENT_SESSION_NOT_FOUND,
        **EVENT_SESSION_DELETION_NOT_ALLOWED,
    },
    summary="Delete an event session",
    description=(
        "Permanently deletes a single event session. "
        "Only the event creator may perform this operation. "
        "Deletion is only permitted when the session status is DRAFT or CANCELLED. "
        "The event must have at least one other session remaining after deletion. "
        "All participant records for the session are removed via database cascade."
    ),
)
async def delete_event_session(
    request: Request,
    event_id: uuid.UUID,
    session_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id),
    use_case: EventDeletionUseCase = Depends(get_event_deletion_use_case),
    audit_use_case: AuditLogUseCase = Depends(get_audit_log_use_case),
) -> EventSessionDeletedResponse:
    """Delete a single event session in one atomic transaction."""
    try:
        result = await use_case.delete_event_session(DeleteEventSessionInput(session_id=session_id, event_id=event_id, deleted_by=user_id))
    except UnauthorizedEventOperationError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    except EventNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except EventSessionNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except (EventSessionDeletionNotAllowedError, EventLastSessionError) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    await safe_audit_log(
        audit_use_case,
        request,
        user_id=user_id,
        action_type=ActionType.DELETE,
        resource_type="event_sessions",
        resource_id=str(result.session.id),
        status=AuditLogStatus.SUCCESS,
        old_values=serialize_event_sessions([result.session])[0],
        additional_context={
            "event_id": str(event_id),
            "deleted_status": result.session.status.value if hasattr(result.session.status, "value") else result.session.status,
        },
    )

    return EventSessionDeletedResponse(data=_to_session_response(result.session))


@event_router.post(
    "/{event_id}/banner",
    response_model=EventBannerUploadResponse,
    status_code=status.HTTP_200_OK,
    responses={
        **UNAUTHORIZED,
        **EVENT_UNAUTHORIZED_OPERATION,
        **EVENT_METADATA_NOT_FOUND,
        **EVENT_BANNER_STORAGE_UNAVAILABLE,
        **EVENT_VALIDATION_ERROR,
    },
    summary="Generate a presigned URL to upload the event banner",
    description=(
        "Generates a short-lived presigned PUT URL for uploading an event banner image directly to object storage, "
        "bypassing the API server for the binary transfer. "
        "The banner's object key is stored on the event immediately; the caller must PUT the image to ``upload_url`` "
        "within the expiry window (3600 s). "
        "Only the event creator may perform this operation. "
        "Allowed content types: ``image/jpeg``, ``image/png``, ``image/webp``, ``image/gif``."
    ),
    openapi_extra=EVENT_BANNER_UPLOAD_OPENAPI_EXTRA,
)
async def upload_event_banner(
    request: Request,
    event_id: uuid.UUID,
    body: EventBannerUploadRequest,
    user_id: uuid.UUID = Depends(get_current_user_id),
    use_case: EventUseCase = Depends(get_event_use_case),
    audit_use_case: AuditLogUseCase = Depends(get_audit_log_use_case),
    storage: StorageService = Depends(get_storage_service),
) -> EventBannerUploadResponse:
    """Generate a presigned banner upload URL and persist the resulting object key on the event."""
    try:
        upload_url, object_key, public_url, expires_in = storage.generate_presigned_upload(
            resource_type="event-cover-banner",
            content_type=body.content_type,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc))

    try:
        result = await use_case.update_event_banner(
            UpdateEventBannerInput(
                event_id=event_id,
                updated_by=user_id,
                banner_url=object_key,
            )
        )
    except UnauthorizedEventOperationError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    except EventNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))

    await safe_audit_log(
        audit_use_case,
        request,
        user_id=user_id,
        action_type=ActionType.UPDATE,
        resource_type="events",
        resource_id=str(event_id),
        status=AuditLogStatus.SUCCESS,
        old_values={"banner_file": result.old_banner_url},
        new_values={"banner_file": object_key},
        additional_context={"public_url": public_url},
    )

    return EventBannerUploadResponse(
        data=_to_event_response(result.event),
        upload=EventBannerUploadData(
            upload_url=upload_url,
            object_key=object_key,
            public_url=public_url,
            expires_in=expires_in,
        ),
    )
