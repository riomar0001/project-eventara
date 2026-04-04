from app.controller.schemas.auth_schema import ErrorResponse, ValidationErrorResponse


VALIDATION_ERROR = {
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
                            "type": "value_error",
                        }
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

EMAIL_NOT_VERIFIED = {
    403: {
        "description": "Email not verified",
        "model": ErrorResponse,
        "content": {
            "application/json": {
                "example": {
                    "success": False,
                    "message": "Email must be verified before completing onboarding",
                }
            }
        },
    }
}

ONBOARDING_ALREADY_COMPLETED = {
    409: {
        "description": "Onboarding already completed",
        "model": ErrorResponse,
        "content": {
            "application/json": {
                "example": {
                    "success": False,
                    "message": "Onboarding has already been completed",
                }
            }
        },
    }
}

ALIAS_CONFLICT = {
    409: {
        "description": "Alias already taken",
        "model": ErrorResponse,
        "content": {
            "application/json": {
                "example": {
                    "success": False,
                    "message": "Alias 'johndoe' is already taken",
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
