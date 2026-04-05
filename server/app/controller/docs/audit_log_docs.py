from fastapi import status

AUDIT_LOG_VALIDATION_ERROR = {
    status.HTTP_422_UNPROCESSABLE_ENTITY: {
        "description": "Request validation failed",
        "content": {
            "application/json": {
                "example": {
                    "success": False,
                    "detail": [
                        {
                            "loc": ["query", "limit"],
                            "msg": "Input should be less than or equal to 1000",
                            "type": "less_than_equal",
                        }
                    ],
                }
            }
        },
    }
}

AUDIT_LOG_UNAUTHORIZED = {
    status.HTTP_401_UNAUTHORIZED: {
        "description": "Invalid or expired token",
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

AUDIT_LOG_FORBIDDEN = {
    status.HTTP_403_FORBIDDEN: {
        "description": "Insufficient permissions - requires Admin or Auditor role",
        "content": {
            "application/json": {
                "example": {
                    "success": False,
                    "message": "Access to audit logs requires Admin or Auditor role",
                }
            }
        },
    }
}
