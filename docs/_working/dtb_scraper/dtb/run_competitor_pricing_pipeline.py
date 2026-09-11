#!/usr/bin/env python3
"""Rebuild the DTB competition-price catalog from existing scrape outputs."""
from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
STEPS = (
    "match_official_catalog_to_competitors.py",
    "create_competition_catalog.py",
)


def run_command(cmd: list[str]) -> None:
    print("+", " ".join(cmd), flush=True)
    subprocess.run(cmd, cwd=ROOT, check=True)


def run_step(script: str) -> None:
    run_command([sys.executable, str(ROOT / script)])


def run_contract_tests() -> None:
    run_command([sys.executable, "-m", "unittest", "discover", "-s", "tests", "-v"])


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(
        description="Rebuild the simple DTB competition-price CSV from existing competitor scrape outputs."
    )
    parser.add_argument(
        "--skip-tests",
        action="store_true",
        help="Skip regression tests. Intended only for controlled debugging.",
    )
    args = parser.parse_args(argv)

    if not args.skip_tests:
        run_contract_tests()

    for script in STEPS:
        run_step(script)

    print("DTB competition-price catalog rebuild complete.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
