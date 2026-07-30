"""Small text/formatting helpers shared across the suite."""

from __future__ import annotations

import re
import secrets
import string


def slugify(value: str) -> str:
    value = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return value or "step"


def unique_suffix(length: int = 8) -> str:
    """Short, URL-safe random suffix used to build unique test-run emails."""

    alphabet = string.ascii_lowercase + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


def truncate(value: str, limit: int = 300) -> str:
    value = value.strip()
    if len(value) <= limit:
        return value
    return value[: limit - 1].rstrip() + "…"


def money(amount: float | str | None, currency: str = "USD") -> str:
    try:
        return f"{float(amount):.2f} {currency}"
    except (TypeError, ValueError):
        return "n/a"
