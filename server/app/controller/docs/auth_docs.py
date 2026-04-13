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


# POST /auth/login
LOGIN_VALIDATION_ERROR = {
    422: {
        "description": "Validation error — missing or malformed fields",
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
                            "msg": "Field required",
                            "type": "missing",
                        },
                    ],
                }
            }
        },
    }
}

INVALID_CREDENTIALS = {
    401: {
        "description": "Invalid email or password",
        "model": ErrorResponse,
        "content": {
            "application/json": {
                "example": {
                    "success": False,
                    "message": "Invalid email or password",
                }
            }
        },
    }
}

USER_LOCKED = {
    423: {
        "description": "Account temporarily locked due to too many failed login attempts",
        "model": ErrorResponse,
        "content": {
            "application/json": {
                "example": {
                    "success": False,
                    "message": ("Account is temporarily locked due to too many failed login attempts"),
                }
            }
        },
    }
}

USER_INACTIVE = {
    403: {
        "description": "Account is inactive or has been deleted",
        "model": ErrorResponse,
        "content": {
            "application/json": {
                "example": {
                    "success": False,
                    "message": "Account is inactive or has been deleted",
                }
            }
        },
    }
}

EMAIL_NOT_VERIFIED = {
    403: {
        "description": "Email address has not been verified",
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

LOGIN_RATE_LIMITED = {
    429: {
        "description": ("Rate limit exceeded — either too many requests from this IP (20 / 60 s) or too many attempts for this account (10 / 60 s)"),
        "model": ErrorResponse,
        "content": {
            "application/json": {
                "example": {
                    "success": False,
                    "message": ("Too many login attempts for this account. Try again in 42 second(s)."),
                }
            }
        },
    }
}


# POST /auth/login/init
LOGIN_INIT_VALIDATION_ERROR = {
    422: {
        "description": "Validation error — missing or malformed fields",
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
                            "msg": "Field required",
                            "type": "missing",
                        },
                    ],
                }
            }
        },
    }
}


# POST /auth/login/verify
LOGIN_VERIFY_VALIDATION_ERROR = {
    422: {
        "description": "Validation error — token is empty or code is not exactly 6 digits",
        "model": ValidationErrorResponse,
        "content": {
            "application/json": {
                "example": {
                    "success": False,
                    "detail": [
                        {
                            "loc": ["body", "token"],
                            "msg": "String should have at least 1 character",
                            "type": "string_too_short",
                        },
                        {
                            "loc": ["body", "code"],
                            "msg": "String should match pattern '^\\d{6}$'",
                            "type": "string_pattern_mismatch",
                        },
                    ],
                }
            }
        },
    }
}

INVALID_OTP = {
    401: {
        "description": "OTP code is incorrect, already consumed, or has expired",
        "model": ErrorResponse,
        "content": {
            "application/json": {
                "example": {
                    "success": False,
                    "message": "Invalid or expired verification code",
                }
            }
        },
    }
}

OTP_TOKEN_EXPIRED = {
    401: {
        "description": "The OTP session token has expired — user must restart the login flow",
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

OTP_TOKEN_INVALID = {
    400: {
        "description": "The OTP session token is malformed or has an invalid signature",
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


# POST /auth/login/resend-otp
RESEND_OTP_VALIDATION_ERROR = {
    422: {
        "description": "Validation error — token field is missing or empty",
        "model": ValidationErrorResponse,
        "content": {
            "application/json": {
                "example": {
                    "success": False,
                    "detail": [
                        {
                            "loc": ["body", "token"],
                            "msg": "String should have at least 1 character",
                            "type": "string_too_short",
                        }
                    ],
                }
            }
        },
    }
}


# POST /auth/logout
LOGOUT_VALIDATION_ERROR = {
    422: {
        "description": "Validation error — refresh_token field is missing",
        "model": ValidationErrorResponse,
        "content": {
            "application/json": {
                "example": {
                    "success": False,
                    "detail": [
                        {
                            "loc": ["body", "refresh_token"],
                            "msg": "Field required",
                            "type": "missing",
                        }
                    ],
                }
            }
        },
    }
}

LOGOUT_INVALID_TOKEN = {
    400: {
        "description": (
            "The refresh token is structurally invalid — bad signature, wrong type, "
            "or unparseable JWT.  Expired and already-revoked tokens succeed silently."
        ),
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


# POST /auth/refresh
REFRESH_VALIDATION_ERROR = {
    422: {
        "description": "Validation error — refresh_token field is missing or empty",
        "model": ValidationErrorResponse,
        "content": {
            "application/json": {
                "example": {
                    "success": False,
                    "detail": [
                        {
                            "loc": ["body", "refresh_token"],
                            "msg": "Field required",
                            "type": "missing",
                        }
                    ],
                }
            }
        },
    }
}

REFRESH_TOKEN_EXPIRED = {
    401: {
        "description": "The refresh token has expired — the user must log in again",
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

REFRESH_TOKEN_INVALID = {
    401: {
        "description": ("The refresh token is invalid, revoked, not found, or was already rotated by a concurrent request"),
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


# POST /auth/resend-verification
RESEND_VERIFICATION_VALIDATION_ERROR = {
    422: {
        "description": "Validation error — email field is missing or not a valid email address",
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
                        }
                    ],
                }
            }
        },
    }
}


# POST /auth/forgot-password
FORGOT_PASSWORD_VALIDATION_ERROR = {
    422: {
        "description": "Validation error — email field is missing or not a valid email address",
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
                        }
                    ],
                }
            }
        },
    }
}


# POST /auth/reset-password/{token}
RESET_PASSWORD_VALIDATION_ERROR = {
    422: {
        "description": "Validation error — token path parameter is empty or new_password is shorter than 8 characters",
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
                        {
                            "loc": ["body", "new_password"],
                            "msg": "String should have at least 8 characters",
                            "type": "string_too_short",
                        },
                    ],
                }
            }
        },
    }
}

RESET_PASSWORD_TOKEN_EXPIRED = {
    401: {
        "description": "The password reset token has expired — the user must request a new reset link",
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

RESET_PASSWORD_TOKEN_INVALID = {
    400: {
        "description": (
            "The password reset token is malformed, has an invalid signature, "
            "has already been consumed, or was rejected by a concurrent reset request"
        ),
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
