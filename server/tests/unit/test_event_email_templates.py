"""Unit tests: event email templates escape user-controlled text."""

from app.core.email_template.event import check_in_receipt_email_html

PAYLOAD = '<img src=x onerror="alert(1)">'


def test_check_in_receipt_escapes_titles_and_operator():
    html = check_in_receipt_email_html(event_title=PAYLOAD, session_title=PAYLOAD, checked_in_time=PAYLOAD, checked_in_by=PAYLOAD)
    assert "<img" not in html
    assert html.count("&lt;img") == 4
