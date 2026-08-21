#!/usr/bin/env python3
"""Prepare evidence-backed compatibility proposals from existing schematic data.

This command is intentionally read-only. It reuses repository authorities to
propose `_dtb_compatible_tool_skus` relationships without mutating the catalog:

- products/launch/official/dtb_official_catalog.csv for canonical identity;
- products/launch/universal_parts/references/all_brands_schematic_parts_master.csv
  for part-to-schematic occurrence evidence;
- frontend/src/data/productSchematicLinks.generated.js for purchasable
  product-to-schematic identity.

Exact SKU and shared canonical schematic identity are required. No fuzzy name
matching is performed. Variation tool SKUs collapse to a valid canonical parent
SKU. Multi-tool schematic matches remain review-only.
"""

from __future__ import annotations

import argparse
import csv
import json
from collections import defaultdict
from pathlib import Path

from official_catalog_schema import CatalogValidationError, validate_catalog

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_CATALOG = ROOT / "products" / "launch" / "official" / "dtb_official_catalog.csv"
DEFAULT_GAPS = ROOT / "products" / "launch" / "official" / "dtb_official_catalog.include-gaps.json"
DEFAULT_MASTER = ROOT / "products" / "launch" / "universal_parts" / "references" / "all_brands_schematic_parts_master.csv"
DEFAULT_LINKS = ROOT / "frontend" / "src" / "data" / "productSchematicLinks.generated.js"
DEFAULT_OUTPUT = ROOT / "products" / "dev" / "catalog-enrichment" / "compatibility"

PRODUCT_KIND_FIELD = "Meta: _dtb_product_kind"
IS_PART_FIELD = "Meta: _dtb_is_parts"
PARENT_SKU_FIELD = "Meta: _dtb_parent_product_sku"
COMPATIBLE_FIELD = "Meta: _dtb_compatible_tool_skus"
REPLACEMENT_FIELD = "Meta: _dtb_replacement_part_for"
TRUTHY = {"1", "true", "yes", "y"}


def value(row: dict[str, str], field: str) -> str:
    return (row.get(field) or "").strip()


def is_part(row: dict[str, str]) -> bool:
    """Use the same canonical part contract as the enrichment audit."""
    return (
        value(row, PRODUCT_KIND_FIELD).casefold() == "part"
        or value(row, IS_PART_FIELD).casefold() in TRUTHY
    )


def load_catalog(path: Path) -> tuple[list[dict[str, str]], dict[str, dict[str, str]]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        rows = list(csv.DictReader(handle))
    by_sku = {value(row, "SKU").upper(): row for row in rows if value(row, "SKU")}
    return rows, by_sku


def load_product_schematic_links(path: Path) -> dict[str, dict[str, object]]:
    source = path.read_text(encoding="utf-8")
    start = source.index("{")
    end = source.rindex("};")
    parsed = json.loads(source[start : end + 1])
    return {str(sku).upper(): entry for sku, entry in parsed.items()}


def canonical_tool_sku(sku: str, catalog: dict[str, dict[str, str]]) -> str | None:
    key = sku.upper()
    row = catalog.get(key)
    if row is None or is_part(row):
        return None
    parent = value(row, PARENT_SKU_FIELD).upper()
    if parent:
        parent_row = catalog.get(parent)
        if parent_row is not None and not is_part(parent_row):
            return parent
    return key


def build_tool_index(
    links: dict[str, dict[str, object]],
    catalog: dict[str, dict[str, str]],
) -> dict[str, list[str]]:
    tools: dict[str, set[str]] = defaultdict(set)
    for sku, entry in links.items():
        schematic_id = str(entry.get("schematicId") or "").strip()
        if not schematic_id:
            continue
        resolved = canonical_tool_sku(sku, catalog)
        if resolved:
            tools[schematic_id].add(resolved)
    return {schematic_id: sorted(skus) for schematic_id, skus in tools.items()}


def existing_relationships(row: dict[str, str]) -> bool:
    return bool(value(row, COMPATIBLE_FIELD) or value(row, REPLACEMENT_FIELD))


def prepare_proposals(
    *,
    catalog: dict[str, dict[str, str]],
    master_path: Path,
    tool_index: dict[str, list[str]],
    brand_filter: str,
) -> list[dict[str, str]]:
    proposals: list[dict[str, str]] = []
    seen: set[tuple[str, str]] = set()
    requested_brand = brand_filter.casefold().strip()

    with master_path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        for source_row in reader:
            brand = (source_row.get("brand") or "").strip()
            if requested_brand and requested_brand not in brand.casefold():
                continue

            part_sku = (source_row.get("product_sku") or "").strip().upper()
            schematic_id = (source_row.get("schematic_id") or "").strip()
            if not part_sku or not schematic_id:
                continue
            dedupe_key = (part_sku, schematic_id)
            if dedupe_key in seen:
                continue
            seen.add(dedupe_key)

            part = catalog.get(part_sku)
            if part is None or not is_part(part):
                continue

            targets = tool_index.get(schematic_id, [])
            existing = existing_relationships(part)
            if existing:
                status = "already_populated"
                reason = "canonical part already has compatibility/replacement metadata"
            elif len(targets) == 1:
                status = "proposal_exact"
                reason = "exact part SKU and one canonical tool family share schematic identity"
            elif len(targets) > 1:
                status = "review_multi_tool"
                reason = "exact part SKU shares schematic identity with multiple canonical tool families"
            else:
                status = "review_no_tool"
                reason = "part occurrence is known but no canonical non-part tool SKU resolves to this schematic"

            proposals.append(
                {
                    "brand": brand,
                    "schematic_id": schematic_id,
                    "source_file": (source_row.get("source_file_from_brands") or "").strip().replace("\\", "/"),
                    "part_sku": part_sku,
                    "part_name": value(part, "Name"),
                    "part_type": value(part, "Type"),
                    "part_parent_sku": value(part, PARENT_SKU_FIELD),
                    "target_tool_skus": json.dumps(targets, separators=(",", ":")),
                    "status": status,
                    "reason": reason,
                }
            )

    return sorted(proposals, key=lambda item: (item["status"], item["brand"], item["schematic_id"], item["part_sku"]))


def write_csv(path: Path, rows: list[dict[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fields = (
        "brand",
        "schematic_id",
        "source_file",
        "part_sku",
        "part_name",
        "part_type",
        "part_parent_sku",
        "target_tool_skus",
        "status",
        "reason",
    )
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--catalog", type=Path, default=DEFAULT_CATALOG)
    parser.add_argument("--include-gap-audit", type=Path, default=DEFAULT_GAPS)
    parser.add_argument("--schematic-master", type=Path, default=DEFAULT_MASTER)
    parser.add_argument("--product-links", type=Path, default=DEFAULT_LINKS)
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument(
        "--brand",
        default="",
        help="Optional case-insensitive brand substring. Default processes all brands.",
    )
    args = parser.parse_args()

    catalog_path = args.catalog.resolve()
    validate_catalog(catalog_path, args.include_gap_audit.resolve())
    _rows, catalog = load_catalog(catalog_path)
    links = load_product_schematic_links(args.product_links.resolve())
    tool_index = build_tool_index(links, catalog)
    proposals = prepare_proposals(
        catalog=catalog,
        master_path=args.schematic_master.resolve(),
        tool_index=tool_index,
        brand_filter=args.brand,
    )

    output = args.output_dir.resolve()
    proposal_path = output / "schematic-compatibility-proposals.csv"
    summary_path = output / "schematic-compatibility-summary.json"
    write_csv(proposal_path, proposals)

    counts: dict[str, int] = defaultdict(int)
    for proposal in proposals:
        counts[proposal["status"]] += 1
    summary = {
        "schema_version": 2,
        "brand_filter": args.brand or None,
        "mutates_catalog": False,
        "proposal_rows": len(proposals),
        "by_status": dict(sorted(counts.items())),
        "unique_parts": len({item["part_sku"] for item in proposals}),
        "unique_schematics": len({item["schematic_id"] for item in proposals}),
        "outputs": {
            "proposals": proposal_path.relative_to(ROOT).as_posix() if proposal_path.is_relative_to(ROOT) else str(proposal_path),
        },
    }
    summary_path.parent.mkdir(parents=True, exist_ok=True)
    summary_path.write_text(json.dumps(summary, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps(summary, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (CatalogValidationError, OSError, csv.Error, json.JSONDecodeError, ValueError) as exc:
        print(f"ERROR: {exc}")
        raise SystemExit(1)
