#!/usr/bin/env python3
"""Launch Readiness Validation Suite — single-command entry point.

    python scripts/launch-readiness/main.py
    python scripts/launch-readiness

Runs the full pipeline end to end: environment validation, a website crawl,
a guest checkout simulation, a registered-customer simulation, and
WooCommerce/Veeqo/QuickBooks verification of whatever order the checkout
stages placed. Prints a live terminal summary and writes an HTML + JSON
report to `reports/output/`.

Exit code is 0 for PASS or PASS WITH WARNINGS, 1 for FAIL, so this can gate a
release pipeline without parsing terminal output.
"""

from __future__ import annotations

import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import tui  # noqa: E402
from browser import Browser  # noqa: E402
from config import Config, load_config  # noqa: E402
from reports.html_report import write_html_report  # noqa: E402
from reports.json_report import write_json_report  # noqa: E402
from reports.models import RunReport, Status  # noqa: E402
from workflows import (  # noqa: E402
    customer_checkout,
    environment,
    guest_checkout,
    verification,
    website_crawl,
)

TOTAL_STAGES = 7


def run(config: Config) -> RunReport:
    report = RunReport(environment=config.site_url)

    tui.print_banner(config.site_url, config.enable_checkout_simulation)

    tui.stage_header(environment.STAGE_NAME, 1, TOTAL_STAGES)
    env_stage = environment.run(config)
    tui.stage_footer(env_stage)
    report.stages.append(env_stage)

    if env_stage.status is Status.FAIL:
        tui.console.print(
            "\n[bold red]Aborting: environment validation failed. "
            "Fix the prerequisites above before running the full suite.[/bold red]"
        )
        report.finished_at = datetime.now(timezone.utc)
        return report

    screenshots_dir = config.reports_dir / "screenshots"

    with Browser(config, screenshots_dir) as browser:
        tui.stage_header(website_crawl.STAGE_NAME, 2, TOTAL_STAGES)
        crawl_stage = website_crawl.run(config, browser)
        tui.stage_footer(crawl_stage)
        report.stages.append(crawl_stage)

        tui.stage_header(guest_checkout.STAGE_NAME, 3, TOTAL_STAGES)
        browser.reset_session()
        guest_run = guest_checkout.run(config, browser)
        tui.stage_footer(guest_run.stage)
        report.stages.append(guest_run.stage)

        tui.stage_header(customer_checkout.STAGE_NAME, 4, TOTAL_STAGES)
        browser.reset_session()
        customer_run = customer_checkout.run(config, browser)
        tui.stage_footer(customer_run.stage)
        report.stages.append(customer_run.stage)

    # Prefer the registered-customer order for downstream verification since
    # that flow exercises more of the platform; fall back to the guest order.
    order = customer_run.order or guest_run.order
    email = customer_run.email if customer_run.order else guest_run.email

    tui.stage_header(verification.WOOCOMMERCE_STAGE, 5, TOTAL_STAGES)
    wc_stage, snapshot = verification.run_woocommerce(
        config,
        order.order_id if order else None,
        order.order_number if order else None,
        email,
        expect_registered_customer=bool(customer_run.order),
    )
    tui.stage_footer(wc_stage)
    report.stages.append(wc_stage)

    tui.stage_header(verification.VEEQO_STAGE, 6, TOTAL_STAGES)
    veeqo_stage = verification.run_veeqo(config, snapshot)
    tui.stage_footer(veeqo_stage)
    report.stages.append(veeqo_stage)

    tui.stage_header(verification.QUICKBOOKS_STAGE, 7, TOTAL_STAGES)
    qbo_stage = verification.run_quickbooks(config, snapshot)
    tui.stage_footer(qbo_stage)
    report.stages.append(qbo_stage)

    report.finished_at = datetime.now(timezone.utc)
    return report


def main() -> int:
    config = load_config()
    report = run(config)

    tui.print_summary(report)

    timestamp = report.started_at.strftime("%Y%m%d-%H%M%S")
    html_path = write_html_report(report, config.reports_dir / f"launch-readiness-{timestamp}.html")
    json_path = write_json_report(report, config.reports_dir / f"launch-readiness-{timestamp}.json")
    tui.console.print(f"\n[dim]HTML report:[/dim] {html_path}")
    tui.console.print(f"[dim]JSON report:[/dim] {json_path}")

    return 0 if report.overall_status in (Status.PASS, Status.WARN) else 1


if __name__ == "__main__":
    sys.exit(main())
