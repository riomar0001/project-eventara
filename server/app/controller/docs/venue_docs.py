from app.controller.schemas.auth_schema import ErrorResponse, ValidationErrorResponse

# POST /venues
CREATE_VENUE_VALIDATION_ERROR = {
    422: {
        "description": "Validation error",
        "model": ValidationErrorResponse,
        "content": {
            "application/json": {
                "example": {
                    "success": False,
                    "detail": [
                        {
                            "loc": ["body", "name"],
                            "msg": "String should have at least 1 character",
                            "type": "string_too_short",
                        },
                        {
                            "loc": ["body", "capacity"],
                            "msg": "Input should be a valid integer",
                            "type": "int_type",
                        },
                        {
                            "loc": ["body", "venue_type"],
                            "msg": "Input should be one of the valid venue type values",
                            "type": "enum",
                        },
                    ],
                }
            }
        },
    }
}

# PATCH /venues/{venue_id}
UPDATE_VENUE_VALIDATION_ERROR = {
    422: {
        "description": "Validation error",
        "model": ValidationErrorResponse,
        "content": {
            "application/json": {
                "example": {
                    "success": False,
                    "detail": [
                        {
                            "loc": ["body", "capacity"],
                            "msg": "Input should be a valid integer",
                            "type": "int_type",
                        },
                        {
                            "loc": ["body", "venue_type"],
                            "msg": "Input should be one of the valid venue type values",
                            "type": "enum",
                        },
                    ],
                }
            }
        },
    }
}

UNAUTHORIZED = {
    401: {
        "description": "Unauthorized",
        "model": ErrorResponse,
        "content": {
            "application/json": {
                "example": {
                    "success": False,
                    "message": "Token has expired",
                }
            }
        },
    }
}

FORBIDDEN = {
    403: {
        "description": "Forbidden",
        "model": ErrorResponse,
        "content": {
            "application/json": {
                "example": {
                    "success": False,
                    "message": "You do not have permission to access this resource",
                }
            }
        },
    }
}

VENUE_NOT_FOUND = {
    404: {
        "description": "Venue not found",
        "model": ErrorResponse,
        "content": {
            "application/json": {
                "example": {
                    "success": False,
                    "message": "Venue not found: 550e8400-e29b-41d4-a716-446655440000",
                }
            }
        },
    }
}

VENUE_ALREADY_EXISTS = {
    409: {
        "description": "Venue already exists",
        "model": ErrorResponse,
        "content": {
            "application/json": {
                "example": {
                    "success": False,
                    "message": "Venue with this name already exists: Grand Ballroom",
                }
            }
        },
    }
}

VENUE_VALIDATION_ERROR = {
    400: {
        "description": "Venue validation failed",
        "model": ErrorResponse,
        "content": {
            "application/json": {
                "example": {
                    "success": False,
                    "message": "Venue validation failed: Capacity must be greater than 0",
                }
            }
        },
    }
}

INVALID_VENUE_TYPE = {
    400: {
        "description": "Invalid venue type",
        "model": ErrorResponse,
        "content": {
            "application/json": {
                "example": {
                    "success": False,
                    "message": "Invalid venue type: concert_hall",
                }
            }
        },
    }
}

UNAUTHORIZED_VENUE_OPERATION = {
    403: {
        "description": "Unauthorized venue operation",
        "model": ErrorResponse,
        "content": {
            "application/json": {
                "example": {
                    "success": False,
                    "message": "You do not have permission to access this venue: 550e8400-e29b-41d4-a716-446655440000",
                }
            }
        },
    }
}
