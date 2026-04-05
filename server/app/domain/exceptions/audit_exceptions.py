class AuditLogWriteError(Exception):
    def __init__(self, message: str = "Failed to write audit log") -> None:
        super().__init__(message)


class UnauthorizedAuditAccessError(Exception):
    def __init__(self) -> None:
        super().__init__("Access to audit logs requires Admin or Auditor role")
