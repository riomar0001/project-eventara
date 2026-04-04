from app.controller.schemas.auth_schema import ErrorResponse, ValidationErrorResponse


# POST /auth/register
REGISTER_VALIDATION_ERROR = {
    422: {
        "description": "Validation error",
        "model": ValidationErrorResponse,
        "content": {
            "application/json": {
                "example": {
                    "success": False,
                    "detail": [
                        {
                            "loc": ["body", "email"],
                            "msg": "value is not a valid email address",
                            "type": "value_error.email",
                        },
                        {
                            "loc": ["body", "password"],
                            "msg": "String should have at least 8 characters",
                            "type": "string_too_short",
                        },
                    ],
                }
            }
        },
    }
}

EMAIL_CONFLICT = {
    409: {
        "description": "Email already taken",
        "model": ErrorResponse,
        "content": {
            "application/json": {
                "example": {
                    "success": False,
                    "message": "Email 'user@example.com' is already registered",
                }
            }
        },
    }
}


# POST /auth/verify/{token}
VERIFY_TOKEN_VALIDATION_ERROR = {
    422: {
        "description": "Validation error",
        "model": ValidationErrorResponse,
        "content": {
            "application/json": {
                "example": {
                    "success": False,
                    "detail": [
                        {
                            "loc": ["path", "token"],
                            "msg": "String should have at least 1 character",
                            "type": "string_too_short",
                        },
                    ],
                }
            }
        },
    }
}

INVALID_TOKEN = {
    400: {
        "description": "Invalid or malformed token",
        "model": ErrorResponse,
        "content": {
            "application/json": {
                "example": {
                    "success": False,
                    "message": "Invalid or malformed token",
                }
            }
        },
    }
}

TOKEN_EXPIRED = {
    401: {
        "description": "Token has expired",
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

USER_NOT_FOUND = {
    404: {
        "description": "User not found",
        "model": ErrorResponse,
        "content": {
            "application/json": {
                "example": {
                    "success": False,
                    "message": "User not found",
                }
            }
        },
    }
}

EMAIL_ALREADY_VERIFIED = {
    409: {
        "description": "Email is already verified",
        "model": ErrorResponse,
        "content": {
            "application/json": {
                "example": {
                    "success": False,
                    "message": "Email is already verified",
                }
            }
        },
    }
}
