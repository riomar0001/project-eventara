"""Helpers to make seed scripts executable both as modules and files."""

from __future__ import annotations

import sys
from pathlib import Path


def ensure_server_on_path() -> None:
    """Add the server directory to sys.path for direct script execution."""
    server_dir = Path(__file__).resolve().parent.parent
    server_dir_str = str(server_dir)
    if server_dir_str not in sys.path:
        sys.path.insert(0, server_dir_str)
