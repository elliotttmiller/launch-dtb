"""Terminal UI for the Launch Readiness Validation Suite.

A single shared `rich.Console` plus a handful of free functions that every
workflow calls: `stage_header` / `stage_footer` bracket a stage, `run_step`
executes one check with a live spinner and prints a colored result line. No
Textual app, no custom widgets — a linear pipeline gets a linear terminal
view.
"""

from __future__ import annotations

import time
from collections.abc import Callable
from typing import Any

from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.text import Text

from reports.models import RunReport, StageResult, Status, StepResult
from utils.timing import format_duration

console = Console()

_STATUS_STYLE = {
    Status.PASS: "bold green",
    Status.WARN: "bold yellow",
    Status.FAIL: "bold red",
    Status.SKIP: "dim",
}

BANNER = r"""
[bold cyan] ____                        _ _   _____           _ _
|  _ \ _ __ _   ___      ____ _| | | |_   _|__   ___ | | |__   _____  __
| | | | '__| | | \ \ /\ / / _` | | |   | |/ _ \ / _ \| | '_ \ / _ \ \/ /
| |_| | |  | |_| |\ V  V / (_| | | |   | | (_) | (_) | | |_) | (_) >  <
|____/|_|   \__, | \_/\_/ \__,_|_|_|   |_|\___/ \___/|_|_.__/ \___/_/\_\
            |___/
[/bold cyan][bold white]  Launch Readiness Validation Suite — Drywall Toolbox[/bold white]
"""


def print_banner(site_url: str, simulation_enabled: bool) -> None:
    console.print(BANNER)
    mode = "[bold yellow]ENABLED[/bold yellow]" if simulation_enabled else "[dim]disabled (read-only run)[/dim]"
    console.print(
        Panel.fit(
            f"[bold]Target:[/bold] {site_url}\n"
            f"[bold]Checkout simulation:[/bold] {mode}\n"
            f"[bold]Started:[/bold] {time.strftime('%Y-%m-%d %H:%M:%S %Z')}",
            title="Run configuration",
            border_style="cyan",
        )
    )


def stage_header(name: str, index: int, total: int) -> None:
    console.print()
    console.rule(f"[bold cyan]Stage {index}/{total} — {name}[/bold cyan]", style="cyan")


def stage_footer(stage: StageResult) -> None:
    style = _STATUS_STYLE[stage.status]
    console.print(
        f"[{style}]{stage.status.symbol} {stage.name} — {stage.status.value.upper()}[/{style}] "
        f"[dim]({format_duration(stage.duration_s)})[/dim]"
    )


def run_step(
    stage: StageResult,
    name: str,
    fn: Callable[[], tuple[Status, str] | tuple[Status, str, dict[str, Any]]],
) -> StepResult:
    """Execute one check, show a spinner while it runs, print the outcome.

    `fn` returns `(status, detail)` or `(status, detail, evidence)`. Any
    exception raised by `fn` is captured as a FAIL with the exception text as
    detail rather than crashing the run — a single broken check should not
    abort the rest of the suite.
    """

    start = time.monotonic()
    with console.status(f"[cyan]{name}...[/cyan]", spinner="dots"):
        try:
            result = fn()
        except Exception as exc:  # noqa: BLE001 - convert any failure into a reported step
            duration = time.monotonic() - start
            detail = f"{type(exc).__name__}: {exc}"
            step = StepResult(name=name, status=Status.FAIL, detail=detail, duration_s=duration)
            _print_step(step)
            stage.steps.append(step)
            return step

    duration = time.monotonic() - start
    if len(result) == 3:
        status, detail, evidence = result
    else:
        status, detail = result
        evidence = {}

    step = StepResult(name=name, status=status, detail=detail, duration_s=duration, evidence=evidence)
    _print_step(step)
    stage.steps.append(step)
    return step


def _print_step(step: StepResult) -> None:
    style = _STATUS_STYLE[step.status]
    line = Text()
    line.append(f"  {step.status.symbol} ", style=style)
    line.append(step.name, style="bold" if step.status is not Status.SKIP else "dim")
    line.append(f"  [{format_duration(step.duration_s)}]", style="dim")
    console.print(line)
    if step.detail:
        console.print(f"      [dim]{step.detail}[/dim]")


def print_summary(report: RunReport) -> None:
    console.print()
    console.rule("[bold]Launch Readiness Summary[/bold]")

    table = Table(show_header=True, header_style="bold", expand=True)
    table.add_column("Stage")
    table.add_column("Status", justify="center")
    table.add_column("Duration", justify="right")
    table.add_column("Steps", justify="right")

    for stage in report.stages:
        style = _STATUS_STYLE[stage.status]
        passed = sum(1 for s in stage.steps if s.status is Status.PASS)
        table.add_row(
            stage.name,
            f"[{style}]{stage.status.symbol} {stage.status.value.upper()}[/{style}]",
            format_duration(stage.duration_s),
            f"{passed}/{len(stage.steps)} passed",
        )
    console.print(table)

    overall_style = _STATUS_STYLE[report.overall_status]
    console.print()
    console.print(
        Panel.fit(
            f"[{overall_style}]{report.readiness_label}[/{overall_style}]\n"
            f"[bold]Readiness score:[/bold] {report.score}%\n"
            f"[bold]Total duration:[/bold] {format_duration(report.duration_s)}",
            title="Result",
            border_style=overall_style.split()[-1],
        )
    )

    failures = report.failures()
    if failures:
        console.print("\n[bold red]Failures:[/bold red]")
        for stage_name, step in failures:
            console.print(f"  [red]✖ {stage_name} → {step.name}[/red]")
            console.print(f"      [dim]{step.detail}[/dim]")

    warnings = report.warnings()
    if warnings:
        console.print("\n[bold yellow]Warnings:[/bold yellow]")
        for stage_name, step in warnings:
            console.print(f"  [yellow]⚠ {stage_name} → {step.name}[/yellow]")
            console.print(f"      [dim]{step.detail}[/dim]")
