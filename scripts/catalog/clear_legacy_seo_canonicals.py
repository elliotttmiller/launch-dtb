#!/usr/bin/env python3
"""Preview or clear explicit PDP canonical overrides from the official catalog.

The React storefront owns the deterministic canonical PDP route `/products/:slug`.
For published, indexable, non-variation products an explicit canonical override is
therefore unnecessary and can become stale. This command clears only
`Meta: _dtb_seo_canonical`; it never modifies slug, identity, taxonomy, or copy.

Preview is the default. Standalone --apply creates a rollback snapshot. The
unified catalog runner supplies --no-backup because it owns one run-level
pre-mutation snapshot for all bounded safe fixes.
"""

from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path
from urllib.parse import urlsplit

from official_catalog_schema import (
    CatalogValidationError,
    create_catalog_backup,
    validate_catalog,
    write_catalog_atomic,
)

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_CATALOG = ROOT / "products" / "launch" / "official" / "dtb_official_catalog.csv"
DEFAULT_GAPS = ROOT / "products" / "launch" / "official" / "dtb_official_catalog.include-gaps.json"
FIELD = "Meta: _dtb_seo_canonical"
TRUTHY = {"1", "true", "yes", "y", "on"}


def value(row: dict[str, str], field: str) -> str:
    return (row.get(field) or "").strip()


def truthy(raw: str) -> bool:
    return raw.strip().lower() in TRUTHY


def eligible(row: dict[str, str]) -> bool:
    return (
        value(row, "Type").lower() != "variation"
        and truthy(value(row, "Published"))
        and not truthy(value(row, "Meta: _dtb_seo_noindex"))
        and bool(value(row, "Slug"))
    )


def canonical_path(raw: str) -> str:
    raw = raw.strip()
    if not raw:
        return ""
    parsed = urlsplit(
        raw if "://" in raw else f"https://placeholder.invalid{raw if raw.startswith('/') else '/' + raw}"
    )
    return parsed.path.rstrip("/") or "/"


def expected_path(row: dict[str, str]) -> str:
    return f"/products/{value(row, 'Slug')}"


def read_catalog(path: Path) -> tuple[list[str], list[dict[str, str]]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        return list(reader.fieldnames or []), list(reader)


def plan(rows: list[dict[str, str]]) -> list[dict[str, str]]:
    changes: list[dict[str, str]] = []
    for row in rows:
        current = value(row, FIELD)
        if not eligible(row) or not current:
            continue
        changes.append(
            {
                "sku": value(row, "SKU"),
                "slug": value(row, "Slug"),
                "current": current,
                "current_path": canonical_path(current),
                "expected_runtime_path": expected_path(row),
                "classification": (
                    "redundant" if canonical_path(current) == expected_path(row) else "conflicting"
                ),
            }
        )
    return changes


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--catalog", type=Path, default=DEFAULT_CATALOG)
    parser.add_argument("--include-gap-audit", type=Path, default=DEFAULT_GAPS)
    parser.add_argument("--report", type=Path)
    parser.add_argument("--apply", action="store_true", help="Apply the reviewed cleanup. Default is preview-only.")
    parser.add_argument(
        "--no-backup",
        action="store_true",
        help="Skip the standalone rollback snapshot. Intended only for an orchestrator that already created one.",
    )
    args = parser.parse_args()

    catalog = args.catalog.resolve()
    gaps = args.include_gap_audit.resolve()
    validate_catalog(catalog, gaps)
    fieldnames, rows = read_catalog(catalog)
    if FIELD not in fieldnames:
        raise CatalogValidationError(f"Required field missing: {FIELD}")

    changes = plan(rows)
    report = {
        "schema_version": 2,
        "catalog": catalog.relative_to(ROOT).as_posix() if catalog.is_relative_to(ROOT) else str(catalog),
        "field": FIELD,
        "eligible_overrides": len(changes),
        "conflicting": sum(item["classification"] == "conflicting" for item in changes),
        "redundant": sum(item["classification"] == "redundant" for item in changes),
        "applied": bool(args.apply),
        "backup_created": bool(args.apply and changes and not args.no_backup),
        "changes": changes,
    }

    if args.apply and changes:
        if not args.no_backup:
            create_catalog_backup(catalog)
        change_skus = {item["sku"] for item in changes}
        for row in rows:
            if value(row, "SKU") in change_skus and eligible(row):
                row[FIELD] = ""
        write_catalog_atomic(catalog, fieldnames, rows)
        validate_catalog(catalog, gaps)

    payload = json.dumps(report, indent=2, sort_keys=True) + "\n"
    if args.report:
        report_path = args.report.resolve()
        report_path.parent.mkdir(parents=True, exist_ok=True)
        report_path.write_text(payload, encoding="utf-8")
    print(payload, end="")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (CatalogValidationError, OSError, csv.Error) as exc:
        print(f"ERROR: {exc}")
        raise SystemExit(1)
