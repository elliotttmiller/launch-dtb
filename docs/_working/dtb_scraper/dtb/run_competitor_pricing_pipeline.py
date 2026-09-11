#!/usr/bin/env python3
"""Deterministic composition root for DTB competitor pricing intelligence."""
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
    "match_official_catalog_to_competitors.py",
    "create_friendly_match_report.py",
)


def run_step(script: str, extra: list[str] | None = None) -> None:
    cmd = [sys.executable, str(ROOT / script), *(extra or [])]
    print("+", " ".join(cmd), flush=True)
    subprocess.run(cmd, cwd=ROOT, check=True)


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description="Rebuild all DTB competitor pricing intelligence reports from existing scrape outputs.")
    parser.add_argument("--refresh-all-wall-manual-evidence", action="store_true", help="Perform a public All-Wall API refresh to retain price/title for MPN-less products as manual-only evidence.")
    args = parser.parse_args(argv)

    finalize_args = ["--refresh-all-wall-manual-evidence"] if args.refresh_all_wall_manual_evidence else []
    run_step(STEPS[0], finalize_args)
    for script in STEPS[1:]:
        run_step(script)
    print("Competitor pricing intelligence rebuild complete.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
