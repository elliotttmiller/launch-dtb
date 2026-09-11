#!/usr/bin/env python3
"""Deterministic composition root for DTB competitor market-pricing intelligence."""
from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
STEPS = (
    "finalize_scrape_outputs.py",
    "filter_current_dtb_brands.py",
    "create_competitor_price_comparison.py",
    "analyze_identifier_collision_evidence.py",
    "analyze_competitor_price_conflicts.py",
    "analyze_two_source_price_conflicts.py",
    "analyze_price_provenance.py",
    "analyze_commercial_offer_equivalence.py",
    "match_official_catalog_to_competitors.py",
    "create_friendly_match_report.py",
)


def run_command(cmd: list[str]) -> None:
    print("+", " ".join(cmd), flush=True)
    subprocess.run(cmd, cwd=ROOT, check=True)


def run_step(script: str, extra: list[str] | None = None) -> None:
    run_command([sys.executable, str(ROOT / script), *(extra or [])])


def run_contract_tests() -> None:
    run_command([sys.executable, "-m", "unittest", "discover", "-s", "tests", "-v"])


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(
        description="Validate and rebuild DTB competitor market-price reports from existing scrape outputs."
    )
    parser.add_argument(
        "--refresh-all-wall-manual-evidence",
        action="store_true",
        help="Refresh public All-Wall data for MPN-less products as manual-only evidence.",
    )
    parser.add_argument(
        "--skip-tests",
        action="store_true",
        help="Skip pricing-contract regression tests. Intended only for controlled debugging.",
    )
    args = parser.parse_args(argv)

    if not args.skip_tests:
        run_contract_tests()

    finalize_args = ["--refresh-all-wall-manual-evidence"] if args.refresh_all_wall_manual_evidence else []
    run_step(STEPS[0], finalize_args)
    for script in STEPS[1:]:
        run_step(script)

    print("Competitor market-pricing intelligence rebuild complete.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
