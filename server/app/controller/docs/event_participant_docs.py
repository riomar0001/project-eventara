from app.controller.schemas.auth_schema import ErrorResponse, ValidationErrorResponse

PARTICIPANT_UNAUTHORIZED = {
    401: {
        "description": "Missing or invalid Bearer token",
        "model": ErrorResponse,
        "content": {"application/json": {"example": {"success": False, "message": "Token has expired"}}},
    }
}

PARTICIPANT_SESSION_NOT_FOUND = {
    404: {
        "description": "Event session not found",
        "model": ErrorResponse,
        "content": {"application/json": {"example": {"success": False, "message": "Event session not found"}}},
    }
}

PARTICIPANT_REGISTRATION_NOT_OPEN = {
    400: {
        "description": "Session is not open for registration",
        "model": ErrorResponse,
        "content": {
            "application/json": {
                "example": {
                    "success": False,
                    "message": "Registration is not open for this session: session status is draft",
                }
            }
        },
    }
}

PARTICIPANT_SLOTS_FULL = {
    409: {
        "description": "All available slots for the session are taken",
        "model": ErrorResponse,
        "content": {"application/json": {"example": {"success": False, "message": "Session is full — no slots remaining"}}},
    }
}

PARTICIPANT_ALREADY_REGISTERED = {
    409: {
        "description": "User is already registered for this session",
        "model": ErrorResponse,
        "content": {"application/json": {"example": {"success": False, "message": "User is already registered for this event session"}}},
    }
}

PARTICIPANT_NOT_FOUND = {
    404: {
        "description": "Participant record not found",
        "model": ErrorResponse,
        "content": {"application/json": {"example": {"success": False, "message": "Event participant not found"}}},
    }
}

PARTICIPANT_UNAUTHORIZED_OPERATION = {
    403: {
        "description": "Caller is not the event creator",
        "model": ErrorResponse,
        "content": {
            "application/json": {
                "example": {
                    "success": False,
                    "message": "You do not have permission to manage participants for this event",
                }
            }
        },
    }
}

PARTICIPANT_INVALID_STATUS_TRANSITION = {
    400: {
        "description": "Requested status transition is not allowed from the current participant state",
        "model": ErrorResponse,
        "content": {
            "application/json": {
                "example": {
                    "success": False,
                    "message": "Cannot transition participant from attended to registered",
                }
            }
        },
    }
}

PARTICIPANT_VALIDATION_ERROR = {
    422: {
        "description": "Request body failed schema validation",
        "model": ValidationErrorResponse,
        "content": {
            "application/json": {
                "example": {
                    "success": False,
                    "detail": [
                        {
                            "loc": ["body", "new_status"],
                            "msg": "Input should be 'registered', 'attended', 'cancelled' or 'no_show'",
                            "type": "enum",
                        }
                    ],
                }
            }
        },
    }
}
