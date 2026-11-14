"""Unit tests for settings parsing and the production CORS guard."""

from datetime import timedelta

import pytest
from pydantic import ValidationError

from app.core.config import Settings, _parse_duration


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        ("30s", timedelta(seconds=30)),
        ("15m", timedelta(minutes=15)),
        ("3h", timedelta(hours=3)),
        ("7d", timedelta(days=7)),
        ("60", timedelta(minutes=60)),
    ],
)
def test_parse_duration_accepts_supported_units(raw, expected):
    assert _parse_duration(raw) == expected


@pytest.mark.parametrize("raw", ["", "  ", "abc", "-5m", "0h", "1.5h", "h"])
def test_parse_duration_rejects_invalid_values(raw):
    with pytest.raises(ValueError):
        _parse_duration(raw)


def test_wildcard_origin_rejected_when_debug_off():
    with pytest.raises(ValidationError):
        Settings(DEBUG=False, ALLOWED_ORIGINS="https://a.com,*")


def test_wildcard_origin_allowed_in_debug():
    assert Settings(DEBUG=True, ALLOWED_ORIGINS="*").allowed_origins_list == ["*"]
