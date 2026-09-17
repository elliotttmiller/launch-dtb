#!/usr/bin/env python3
"""Cross-reference CSR Columbia repair part numbers against active DTB catalog SKUs.

This is a read-only reporting tool.  It does not alter either source CSV or
the canonical catalog.  A match is exact after trimming surrounding whitespace
and comparing SKU case-insensitively; no fuzzy or title matching is used.
"""
from __future__ import annotations

import csv
import json
import tempfile
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
CSR_PARTS = ROOT / "docs/catalog_prices/csrtools/csrtools_columbia_repair_parts.csv"
# The canonical commerce import/export is the sole authority for this match.
# Content/SEO and historical backup CSVs are intentionally excluded.
OFFICIAL_CATALOGS = (ROOT / "products/launch/official/dtb_official_catalog.csv",)
OUT = ROOT / "docs/catalog_prices/csrtools"


def normalized_sku(value: str) -> str:
    """Normalize only non-semantic SKU formatting for an exact identity match."""
    return (value or "").strip().casefold()


def read_csv(path: Path) -> tuple[list[str], list[dict[str, str]]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        if not reader.fieldnames:
            raise ValueError(f"{path} has no header row")
        return list(reader.fieldnames), list(reader)


def sku_column(fields: list[str]) -> str:
    """Return the catalog's SKU column even when export casing differs."""
    for field in fields:
        if field.strip().casefold() == "sku":
            return field
    raise ValueError("has no SKU column")


def catalog_value(row: dict[str, str], *candidate_fields: str) -> str:
    """Read equivalent fields from the commerce and content/SEO export shapes."""
    fields_by_name = {field.casefold(): field for field in row}
    for candidate in candidate_fields:
        field = fields_by_name.get(candidate.casefold())
        if field is not None:
            return row.get(field, "").strip()
    return ""


def write_csv_atomic(path: Path, fields: list[str], rows: list[dict[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(
        "w", encoding="utf-8", newline="", delete=False, dir=path.parent,
        prefix=f".{path.name}.", suffix=".tmp",
    ) as handle:
        temporary_path = Path(handle.name)
        writer = csv.DictWriter(handle, fieldnames=fields, extrasaction="raise", lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)
        handle.flush()
    temporary_path.replace(path)


def main() -> int:
    _, parts = read_csv(CSR_PARTS)
    catalog_index: dict[str, list[dict[str, str]]] = defaultdict(list)
    catalog_source_rows: dict[str, int] = {}

    for path in OFFICIAL_CATALOGS:
        fields, rows = read_csv(path)
        try:
            source_sku_column = sku_column(fields)
        except ValueError as error:
            raise ValueError(f"{path} {error}") from error
        catalog_source_rows[path.name] = len(rows)
        for row in rows:
            sku = row.get(source_sku_column, "")
            key = normalized_sku(sku)
            if key:
                catalog_index[key].append({
                    "catalog_csv": path.name,
                    "catalog_sku": sku.strip(),
                    "catalog_product_type": catalog_value(row, "Type", "product_type"),
                    "catalog_product_name": catalog_value(row, "Name"),
                    "catalog_brand": catalog_value(row, "Brands", "brand"),
                    "catalog_parent": catalog_value(row, "Parent", "parent_sku"),
                    "catalog_published": catalog_value(row, "Published"),
                })

    checked_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    output_rows: list[dict[str, str]] = []
    matched_source_rows = 0
    matched_part_numbers: set[str] = set()
    for part in parts:
        part_number = part.get("manufacturer_part_number", "").strip()
        matches = catalog_index.get(normalized_sku(part_number), [])
        if matches:
            matched_source_rows += 1
            matched_part_numbers.add(normalized_sku(part_number))
            for match in matches:
                output_rows.append({**part, "match_status": "EXACT_SKU_MATCH", **match, "cross_referenced_at": checked_at})
        else:
            output_rows.append({
                **part,
                "match_status": "NOT_FOUND_IN_OFFICIAL_CATALOGS",
                "catalog_csv": "",
                "catalog_sku": "",
                "catalog_product_type": "",
                "catalog_product_name": "",
                "catalog_brand": "",
                "catalog_parent": "",
                "catalog_published": "",
                "cross_referenced_at": checked_at,
            })

    part_fields = list(parts[0].keys()) if parts else []
    match_fields = [
        "match_status", "catalog_csv", "catalog_sku", "catalog_product_type",
        "catalog_product_name", "catalog_brand", "catalog_parent", "catalog_published",
        "cross_referenced_at",
    ]
    output_rows.sort(key=lambda row: (row["match_status"], row["manufacturer_part_number"], row["catalog_csv"]))
    write_csv_atomic(OUT / "csrtools_columbia_repair_parts_catalog_cross_reference.csv", part_fields + match_fields, output_rows)

    summary = {
        "checked_at": checked_at,
        "source_parts_csv": str(CSR_PARTS.relative_to(ROOT)).replace("\\", "/"),
        "official_catalogs": catalog_source_rows,
        "csr_part_source_rows": len(parts),
        "unique_manufacturer_part_numbers": len({normalized_sku(row.get("manufacturer_part_number", "")) for row in parts if normalized_sku(row.get("manufacturer_part_number", ""))}),
        "matched_csr_part_source_rows": matched_source_rows,
        "unmatched_csr_part_source_rows": len(parts) - matched_source_rows,
        "matched_unique_manufacturer_part_numbers": len(matched_part_numbers),
        "cross_reference_rows": len(output_rows),
        "match_method": "manufacturer_part_number equals official SKU after trim and case-insensitive comparison",
    }
    (OUT / "csrtools_columbia_repair_parts_catalog_cross_reference_summary.json").write_text(
        json.dumps(summary, indent=2) + "\n", encoding="utf-8"
    )
    print(json.dumps(summary, sort_keys=True), flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
