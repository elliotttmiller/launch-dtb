"""Small timing helpers shared by workflows and the TUI."""

from __future__ import annotations

import time
from contextlib import contextmanager
from dataclasses import dataclass


@dataclass(slots=True)
class Stopwatch:
    started_at: float = 0.0
    elapsed_s: float = 0.0

    def start(self) -> "Stopwatch":
        self.started_at = time.monotonic()
        return self

    def stop(self) -> float:
        self.elapsed_s = time.monotonic() - self.started_at
        return self.elapsed_s


@contextmanager
def timed():
    """Context manager yielding a callable that returns elapsed seconds."""

    start = time.monotonic()
    yield lambda: time.monotonic() - start


def format_duration(seconds: float) -> str:
    if seconds < 1:
        return f"{seconds * 1000:.0f}ms"
    if seconds < 60:
        return f"{seconds:.1f}s"
    minutes, secs = divmod(int(seconds), 60)
    return f"{minutes}m {secs}s"
