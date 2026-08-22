#!/usr/bin/env python3
"""Validate the canonical DTB WooCommerce catalog without modifying it."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from official_catalog_schema import CatalogValidationError, validate_catalog, validate_catalog_taxonomy


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_CATALOG = ROOT / "products" / "launch" / "official" / "dtb_official_catalog.csv"
DEFAULT_GAPS = ROOT / "products" / "launch" / "official" / "dtb_official_catalog.include-gaps.json"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--catalog", type=Path, default=DEFAULT_CATALOG)
    parser.add_argument("--include-gap-audit", type=Path, default=DEFAULT_GAPS)
    args = parser.parse_args()
    summary = validate_catalog(args.catalog.resolve(), args.include_gap_audit.resolve())
    summary["taxonomy"] = validate_catalog_taxonomy(args.catalog.resolve())
    print(json.dumps(summary, sort_keys=True))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except CatalogValidationError as exc:
        print(f"ERROR: {exc}")
        raise SystemExit(1)
