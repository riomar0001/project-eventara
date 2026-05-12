class DuplicateEventFeedbackError(Exception):
    def __init__(self, user_id: str = "", event_id: str = "") -> None:
        if user_id and event_id:
            msg = f"User {user_id} has already submitted feedback for event {event_id}"
        else:
            msg = "User has already submitted feedback for this event"
        super().__init__(msg)


class EventFeedbackEligibilityError(Exception):
    def __init__(self, event_id: str = "") -> None:
        msg = f"Only checked-in attendees can submit feedback for event {event_id}" if event_id else "Only checked-in attendees can submit feedback"
        super().__init__(msg)


class EventFeedbackNotOpenError(Exception):
    def __init__(self, event_id: str = "", current_status: str = "") -> None:
        if event_id and current_status:
            msg = f"Feedback is not open for event {event_id}: event status is {current_status}"
        else:
            msg = "Feedback is not open for this event"
        super().__init__(msg)
