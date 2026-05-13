from fastapi import status

DASHBOARD_UNAUTHORIZED = {
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

DASHBOARD_FORBIDDEN = {
    status.HTTP_403_FORBIDDEN: {
        "description": "Insufficient permissions — requires Dashboard READ permission",
        "content": {
            "application/json": {
                "example": {
                    "success": False,
                    "message": "You do not have permission to access dashboard data",
                }
            }
        },
    }
}

DASHBOARD_SERVER_ERROR = {
    status.HTTP_500_INTERNAL_SERVER_ERROR: {
        "description": "Unexpected failure while aggregating dashboard metrics",
        "content": {
            "application/json": {
                "example": {
                    "success": False,
                    "message": "Failed to fetch dashboard data",
                }
            }
        },
    }
}
