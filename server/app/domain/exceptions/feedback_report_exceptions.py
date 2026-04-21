class FeedbackReportNotFoundError(Exception):
    def __init__(self, feedback_id: str = "") -> None:
        msg = f"Feedback report not found: {feedback_id}" if feedback_id else "Feedback report not found"
        super().__init__(msg)


class FeedbackReportValidationError(Exception):
    def __init__(self, message: str) -> None:
        super().__init__(f"Feedback report validation failed: {message}")


class DuplicateFeedbackReportError(Exception):
    def __init__(self, entity_type: str = "", entity_id: str = "") -> None:
        if entity_type and entity_id:
            msg = f"A similar feedback report already exists for {entity_type} {entity_id}"
        else:
            msg = "A similar feedback report already exists"
        super().__init__(msg)


class UnauthorizedFeedbackReportOperationError(Exception):
    def __init__(self, feedback_id: str = "") -> None:
        msg = (
            f"You do not have permission to perform this operation on feedback report: {feedback_id}"
            if feedback_id
            else "You do not have permission to perform this operation on this feedback report"
        )
        super().__init__(msg)


class InvalidFeedbackStatusTransitionError(Exception):
    def __init__(self, feedback_id: str = "", from_status: str = "", to_status: str = "") -> None:
        if feedback_id and from_status and to_status:
            msg = f"Cannot transition feedback report {feedback_id} from {from_status} to {to_status}"
        else:
            msg = "Invalid feedback report status transition"
        super().__init__(msg)
