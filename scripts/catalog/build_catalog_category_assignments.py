#!/usr/bin/env python3
"""Bootstrap and validate exact SKU-to-category assignments for the catalog rebuild."""

from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_CATALOG = ROOT / "products/launch/official/dtb_official_catalog.csv"
DEFAULT_TAXONOMY = ROOT / "products/catalog/source/taxonomy.json"
DEFAULT_OVERRIDES = ROOT / "products/catalog/source/product_category_overrides.csv"
DEFAULT_OUTPUT = ROOT / "products/catalog/source/product_categories.csv"
DEFAULT_COVERAGE = ROOT / "docs/_working/catalog-rebuild-brand-category-coverage.csv"

CURRENT_PATH_TO_TAXON = {
    "Drywall Finishing Tools > Automatic Taping Tools > Automatic Tapers": "automatic_tapers",
    "Drywall Finishing Tools > Automatic Taping Tools > Flat Boxes": "flat_boxes",
    "Drywall Finishing Tools > Automatic Taping Tools > Angle Heads": "automatic_angle_heads_corner_finishers",
    "Drywall Finishing Tools > Automatic Taping Tools > Angle Boxes": "automatic_angle_boxes_corner_applicators",
    "Drywall Finishing Tools > Automatic Taping Tools > Corner Rollers": "automatic_corner_rollers",
    "Drywall Finishing Tools > Automatic Taping Tools > Nail Spotters": "automatic_nail_spotters",
    "Drywall Finishing Tools > Automatic Taping Tools > Loading Pumps": "automatic_loading_pumps",
    "Drywall Finishing Tools > Automatic Taping Tools > Goosenecks": "automatic_goosenecks_box_fillers",
    "Drywall Finishing Tools > Automatic Taping Tools > Box Fillers": "automatic_goosenecks_box_fillers",
    "Drywall Finishing Tools > Automatic Taping Tools > Corner Tool Handles": "automatic_handles_extensions",
    "Drywall Finishing Tools > Automatic Taping Tools > Extendable Handles": "automatic_handles_extensions",
    "Drywall Finishing Tools > Automatic Taping Tools > Flat Box Handles": "automatic_handles_extensions",
    "Drywall Finishing Tools > Automatic Taping Tools > Automatic Taping Tool Sets": "automatic_tool_sets",
    "Drywall Finishing Tools > Semi-Automatic Tools > Semi-Automatic Tapers": "semi_automatic_tapers",
    "Drywall Finishing Tools > Semi-Automatic Tools > Compound Tubes": "semi_compound_tubes",
    "Drywall Finishing Tools > Semi-Automatic Tools > Compound Applicators": "semi_compound_applicators",
    "Drywall Finishing Tools > Semi-Automatic Tools > Corner Flushers": "semi_corner_flushers",
    "Drywall Finishing Tools > Semi-Automatic Tools > Semi-Automatic Taping Tool Sets": "semi_tool_sets",
    "Drywall Finishing Tools > Automatic Taping Tools > Tool Cases": "tool_storage_cases",
    "Drywall Finishing Tools > Parts": "replacement_parts",
    "Stilts & Accessories > Stilts": "stilts",
}
CURRENT_PATH_TO_TAXON.update({
    "Taping & Finishing Tools > Automatic Taping Tools > Automatic Tapers": "automatic_tapers",
    "Taping & Finishing Tools > Automatic Taping Tools > Flat Boxes": "flat_boxes",
    "Taping & Finishing Tools > Automatic Taping Tools > Angle Heads & Corner Finishers": "automatic_angle_heads_corner_finishers",
    "Taping & Finishing Tools > Automatic Taping Tools > Angle Boxes & Corner Applicators": "automatic_angle_boxes_corner_applicators",
    "Taping & Finishing Tools > Automatic Taping Tools > Corner Rollers": "automatic_corner_rollers",
    "Taping & Finishing Tools > Automatic Taping Tools > Nail Spotters": "automatic_nail_spotters",
    "Taping & Finishing Tools > Automatic Taping Tools > Loading Pumps": "automatic_loading_pumps",
    "Taping & Finishing Tools > Automatic Taping Tools > Goosenecks & Box Fillers": "automatic_goosenecks_box_fillers",
    "Taping & Finishing Tools > Automatic Taping Tools > Handles & Extensions": "automatic_handles_extensions",
    "Taping & Finishing Tools > Automatic Taping Tools > Tool Sets": "automatic_tool_sets",
    "Taping & Finishing Tools > Semi-Automatic Taping Tools > Semi-Automatic Tapers": "semi_automatic_tapers",
    "Taping & Finishing Tools > Semi-Automatic Taping Tools > Compound Tubes": "semi_compound_tubes",
    "Taping & Finishing Tools > Semi-Automatic Taping Tools > Compound Applicators": "semi_compound_applicators",
    "Taping & Finishing Tools > Semi-Automatic Taping Tools > Corner Flushers": "semi_corner_flushers",
    "Taping & Finishing Tools > Semi-Automatic Taping Tools > Handles & Extensions": "semi_handles_extensions",
    "Taping & Finishing Tools > Semi-Automatic Taping Tools > Tool Sets": "semi_tool_sets",
    "Taping & Finishing Tools > Tool Storage & Cases": "tool_storage_cases",
    "Replacement Parts": "replacement_parts",
})

FIELDS = ("sku", "taxon_key", "position", "evidence", "review_status")
OVERRIDE_FIELDS = ("sku", "taxon_key", "evidence", "review_status")


def load_catalog(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def load_taxa(path: Path) -> dict[str, dict[str, object]]:
    data = json.loads(path.read_text(encoding="utf-8"))
    taxa = {str(item["key"]): item for item in data["taxa"]}
    if len(taxa) != len(data["taxa"]):
        raise ValueError("taxonomy contains duplicate keys")
    slugs = [str(item["slug"]) for item in data["taxa"]]
    if len(set(slugs)) != len(slugs):
        raise ValueError("taxonomy contains duplicate slugs")
    for key, item in taxa.items():
        parent = item.get("parent_key")
        if parent is not None and parent not in taxa:
            raise ValueError(f"taxon {key} references missing parent {parent}")
    return taxa


def load_overrides(path: Path, taxa: dict[str, dict[str, object]]) -> dict[str, dict[str, str]]:
    if not path.exists():
        return {}
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        if tuple(reader.fieldnames or ()) != OVERRIDE_FIELDS:
            raise ValueError(f"override schema must be exactly {OVERRIDE_FIELDS}")
        overrides: dict[str, dict[str, str]] = {}
        for row in reader:
            sku = row["sku"].strip()
            taxon_key = row["taxon_key"].strip()
            evidence = row["evidence"].strip()
            review_status = row["review_status"].strip()
            if not sku:
                raise ValueError("category override has no SKU")
            if sku in overrides:
                raise ValueError(f"duplicate category override for {sku}")
            if taxon_key not in taxa:
                raise ValueError(f"{sku}: override references unknown taxon {taxon_key}")
            if review_status != "approved":
                raise ValueError(f"{sku}: category override is not approved")
            if not evidence:
                raise ValueError(f"{sku}: category override requires evidence")
            overrides[sku] = {
                "taxon_key": taxon_key,
                "evidence": evidence,
                "review_status": review_status,
            }
        return overrides


def build(
    rows: list[dict[str, str]],
    taxa: dict[str, dict[str, object]],
    overrides: dict[str, dict[str, str]],
) -> list[dict[str, str]]:
    assignments: list[dict[str, str]] = []
    owners = [row for row in rows if row.get("Type") != "variation"]
    owner_skus = {row.get("SKU", "").strip() for row in owners}
    unknown_overrides = sorted(set(overrides) - owner_skus)
    if unknown_overrides:
        raise ValueError(f"category overrides reference unknown owner SKUs: {unknown_overrides[:10]}")

    for row in owners:
        sku = row.get("SKU", "").strip()
        current = row.get("Categories", "").strip()
        if not sku:
            raise ValueError("owner row has no SKU")

        override = overrides.get(sku)
        if override:
            taxon_key = override["taxon_key"]
            evidence = override["evidence"]
        else:
            taxon_key = CURRENT_PATH_TO_TAXON.get(current)
            if not taxon_key:
                raise ValueError(f"no exact mapping for {sku}: {current}")
            evidence = f"approved migration from exact path: {current}"

        if taxon_key not in taxa:
            raise ValueError(f"mapping references missing taxon {taxon_key}")
        assignments.append({
            "sku": sku,
            "taxon_key": taxon_key,
            "position": "10",
            "evidence": evidence,
            "review_status": "approved",
        })
    if len({row["sku"] for row in assignments}) != len(owners):
        raise ValueError("every owner must have exactly one bootstrapped assignment")
    return assignments


def write(path: Path, rows: list[dict[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_suffix(path.suffix + ".tmp")
    with temp.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=FIELDS, lineterminator="\r\n")
        writer.writeheader()
        writer.writerows(rows)
    temp.replace(path)


def write_brand_coverage(path: Path, catalog: list[dict[str, str]], assignments: list[dict[str, str]]) -> None:
    taxon_by_sku = {row["sku"]: row["taxon_key"] for row in assignments}
    counts: dict[tuple[str, str], int] = {}
    for row in catalog:
        if row.get("Type") == "variation":
            continue
        brand = row.get("Brands", "").strip() or "(unassigned)"
        taxon = taxon_by_sku[row["SKU"].strip()]
        counts[(brand, taxon)] = counts.get((brand, taxon), 0) + 1
    output = [
        {"brand": brand, "taxon_key": taxon, "owner_product_count": str(count)}
        for (brand, taxon), count in sorted(counts.items())
    ]
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_suffix(path.suffix + ".tmp")
    with temp.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=("brand", "taxon_key", "owner_product_count"), lineterminator="\r\n")
        writer.writeheader()
        writer.writerows(output)
    temp.replace(path)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--catalog", type=Path, default=DEFAULT_CATALOG)
    parser.add_argument("--taxonomy", type=Path, default=DEFAULT_TAXONOMY)
    parser.add_argument("--overrides", type=Path, default=DEFAULT_OVERRIDES)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--coverage", type=Path, default=DEFAULT_COVERAGE)
    args = parser.parse_args()
    rows = load_catalog(args.catalog.resolve())
    taxa = load_taxa(args.taxonomy.resolve())
    overrides = load_overrides(args.overrides.resolve(), taxa)
    assignments = build(rows, taxa, overrides)
    write(args.output.resolve(), assignments)
    write_brand_coverage(args.coverage.resolve(), rows, assignments)
    print(json.dumps({"catalog_rows": len(rows), "owner_assignments": len(assignments), "overrides": len(overrides), "taxa": len(taxa)}, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
