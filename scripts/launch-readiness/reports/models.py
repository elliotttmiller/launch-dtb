"""Result data model for the Launch Readiness Validation Suite.

Every workflow produces `StepResult`s grouped into a `StageResult`. The full
run is captured in a single `RunReport`, which is the only object the report
renderers (`html_report.py`, `json_report.py`) and the TUI (`tui.py`) consume.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum


class Status(str, Enum):
    """Outcome of a single check."""

    PASS = "pass"
    WARN = "warn"
    FAIL = "fail"
    SKIP = "skip"

    @property
    def symbol(self) -> str:
        return {
            Status.PASS: "✔",  # ✔
            Status.WARN: "⚠",  # ⚠
            Status.FAIL: "✖",  # ✖
            Status.SKIP: "•",  # •
        }[self]


@dataclass(slots=True)
class StepResult:
    """The outcome of one atomic check within a stage."""

    name: str
    status: Status
    detail: str = ""
    duration_s: float = 0.0
    evidence: dict = field(default_factory=dict)


@dataclass(slots=True)
class StageResult:
    """A named group of steps, e.g. 'Guest Checkout Simulation'."""

    name: str
    steps: list[StepResult] = field(default_factory=list)
    started_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    finished_at: datetime | None = None

    @property
    def status(self) -> Status:
        if not self.steps:
            return Status.SKIP
        statuses = {s.status for s in self.steps}
        if Status.FAIL in statuses:
            return Status.FAIL
        if Status.WARN in statuses:
            return Status.WARN
        if statuses == {Status.SKIP}:
            return Status.SKIP
        return Status.PASS

    @property
    def duration_s(self) -> float:
        return sum(s.duration_s for s in self.steps)


@dataclass(slots=True)
class RunReport:
    """The full launch readiness run."""

    environment: str
    started_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    finished_at: datetime | None = None
    stages: list[StageResult] = field(default_factory=list)

    @property
    def duration_s(self) -> float:
        if self.finished_at is None:
            return 0.0
        return (self.finished_at - self.started_at).total_seconds()

    @property
    def overall_status(self) -> Status:
        if not self.stages:
            return Status.FAIL
        statuses = {stage.status for stage in self.stages}
        if Status.FAIL in statuses:
            return Status.FAIL
        if Status.WARN in statuses:
            return Status.WARN
        return Status.PASS

    @property
    def readiness_label(self) -> str:
        return {
            Status.PASS: "PASS",
            Status.WARN: "PASS WITH WARNINGS",
            Status.FAIL: "FAIL",
            Status.SKIP: "FAIL",
        }[self.overall_status]

    @property
    def score(self) -> int:
        """Percentage of non-skipped steps that passed."""

        total = 0
        earned = 0.0
        for stage in self.stages:
            for step in stage.steps:
                if step.status is Status.SKIP:
                    continue
                total += 1
                if step.status is Status.PASS:
                    earned += 1.0
                elif step.status is Status.WARN:
                    earned += 0.5
        if total == 0:
            return 0
        return round((earned / total) * 100)

    def all_steps(self) -> list[tuple[str, StepResult]]:
        return [(stage.name, step) for stage in self.stages for step in stage.steps]

    def failures(self) -> list[tuple[str, StepResult]]:
        return [(s, r) for s, r in self.all_steps() if r.status is Status.FAIL]

    def warnings(self) -> list[tuple[str, StepResult]]:
        return [(s, r) for s, r in self.all_steps() if r.status is Status.WARN]
