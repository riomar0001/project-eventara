from app.controller.schemas.auth_schema import ErrorResponse, ValidationErrorResponse

UNAUTHORIZED = {
    401: {
        "description": "Missing or invalid Bearer token",
        "model": ErrorResponse,
        "content": {"application/json": {"example": {"success": False, "message": "Token has expired"}}},
    }
}

EVENT_NOT_FOUND = {
    404: {
        "description": "Referenced venue not found",
        "model": ErrorResponse,
        "content": {"application/json": {"example": {"success": False, "message": "Venue not found"}}},
    }
}

EVENT_DATE_INVALID = {
    400: {
        "description": "Event or session date constraints violated",
        "model": ErrorResponse,
        "content": {
            "application/json": {
                "examples": {
                    "event_date_range": {
                        "summary": "Event end before start",
                        "value": {"success": False, "message": "Event end_date must be after start_date"},
                    },
                    "no_sessions": {
                        "summary": "Empty sessions list",
                        "value": {"success": False, "message": "At least one session is required"},
                    },
                    "session_date_range": {
                        "summary": "Session end before start",
                        "value": {
                            "success": False,
                            "message": "Invalid session dates: end_datetime cannot be before start_datetime",
                        },
                    },
                    "session_exceeds_bounds": {
                        "summary": "Session outside event window",
                        "value": {"success": False, "message": "Session dates must fall within the event date range"},
                    },
                }
            }
        },
    }
}

EVENT_VALIDATION_ERROR = {
    422: {
        "description": "Request body failed schema validation",
        "model": ValidationErrorResponse,
        "content": {
            "application/json": {
                "example": {
                    "success": False,
                    "detail": [
                        {
                            "loc": ["body", "sessions"],
                            "msg": "List should have at least 1 item after validation, not 0",
                            "type": "too_short",
                        }
                    ],
                }
            }
        },
    }
}

EVENT_UNAUTHORIZED_OPERATION = {
    403: {
        "description": "Caller is not the event creator",
        "model": ErrorResponse,
        "content": {
            "application/json": {
                "example": {
                    "success": False,
                    "message": "You do not have permission to perform this operation on this event",
                }
            }
        },
    }
}

EVENT_METADATA_DATE_INVALID = {
    400: {
        "description": "Event date range constraint violated",
        "model": ErrorResponse,
        "content": {
            "application/json": {
                "example": {"success": False, "message": "Event end_date must be after start_date"},
            }
        },
    }
}

EVENT_METADATA_NOT_FOUND = {
    404: {
        "description": "Event not found",
        "model": ErrorResponse,
        "content": {"application/json": {"example": {"success": False, "message": "Event not found"}}},
    }
}

EVENT_SESSION_DATE_INVALID = {
    400: {
        "description": "Session date constraints violated",
        "model": ErrorResponse,
        "content": {
            "application/json": {
                "examples": {
                    "session_date_range": {
                        "summary": "Session end before start",
                        "value": {
                            "success": False,
                            "message": "Invalid session dates: end_datetime cannot be before start_datetime",
                        },
                    },
                    "session_exceeds_bounds": {
                        "summary": "Session outside event window",
                        "value": {"success": False, "message": "Session dates must fall within the event date range"},
                    },
                }
            }
        },
    }
}

EVENT_SESSION_NOT_FOUND = {
    404: {
        "description": "Session or venue not found",
        "model": ErrorResponse,
        "content": {
            "application/json": {
                "examples": {
                    "session_not_found": {
                        "summary": "Session not found",
                        "value": {"success": False, "message": "Event session not found"},
                    },
                    "venue_not_found": {
                        "summary": "Venue not found",
                        "value": {"success": False, "message": "Venue not found"},
                    },
                }
            }
        },
    }
}

EVENT_STATUS_INVALID_TRANSITION = {
    400: {
        "description": "Requested status transition is not allowed from the current state",
        "model": ErrorResponse,
        "content": {
            "application/json": {
                "example": {
                    "success": False,
                    "message": "Cannot transition event from ended to posted",
                }
            }
        },
    }
}

EVENT_SESSION_STATUS_INVALID_TRANSITION = {
    400: {
        "description": "Requested session status transition is not allowed from the current state",
        "model": ErrorResponse,
        "content": {
            "application/json": {
                "example": {
                    "success": False,
                    "message": "Cannot transition event session from ended to posted",
                }
            }
        },
    }
}
