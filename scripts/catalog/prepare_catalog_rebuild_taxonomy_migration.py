#!/usr/bin/env python3
"""Generate the complete read-only taxonomy migration manifest for catalog rebuild."""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_CATALOG = ROOT / "products/launch/official/dtb_official_catalog.csv"
DEFAULT_CSV = ROOT / "docs/_working/catalog-rebuild-taxonomy-migration.csv"
DEFAULT_JSON = ROOT / "docs/_working/catalog-rebuild-taxonomy-migration-summary.json"

DEPARTMENT = "Taping & Finishing Tools"
AUTO = f"{DEPARTMENT} > Automatic Taping Tools"
SEMI = f"{DEPARTMENT} > Semi-Automatic Taping Tools"

DIRECT_MAP = {
    "Drywall Finishing Tools > Automatic Taping Tools > Automatic Tapers": f"{AUTO} > Automatic Tapers",
    "Drywall Finishing Tools > Automatic Taping Tools > Flat Boxes": f"{AUTO} > Flat Boxes",
    "Drywall Finishing Tools > Automatic Taping Tools > Angle Heads": f"{AUTO} > Angle Heads & Corner Finishers",
    "Drywall Finishing Tools > Automatic Taping Tools > Angle Boxes": f"{AUTO} > Angle Boxes & Corner Applicators",
    "Drywall Finishing Tools > Automatic Taping Tools > Corner Rollers": f"{AUTO} > Corner Rollers",
    "Drywall Finishing Tools > Automatic Taping Tools > Nail Spotters": f"{AUTO} > Nail Spotters",
    "Drywall Finishing Tools > Automatic Taping Tools > Loading Pumps": f"{AUTO} > Loading Pumps",
    "Drywall Finishing Tools > Automatic Taping Tools > Goosenecks": f"{AUTO} > Goosenecks & Box Fillers",
    "Drywall Finishing Tools > Automatic Taping Tools > Box Fillers": f"{AUTO} > Goosenecks & Box Fillers",
    "Drywall Finishing Tools > Automatic Taping Tools > Corner Tool Handles": f"{AUTO} > Handles & Extensions",
    "Drywall Finishing Tools > Automatic Taping Tools > Extendable Handles": f"{AUTO} > Handles & Extensions",
    "Drywall Finishing Tools > Automatic Taping Tools > Flat Box Handles": f"{AUTO} > Handles & Extensions",
    "Drywall Finishing Tools > Automatic Taping Tools > Automatic Taping Tool Sets": f"{AUTO} > Tool Sets",
    "Drywall Finishing Tools > Semi-Automatic Tools > Semi-Automatic Tapers": f"{SEMI} > Semi-Automatic Tapers",
    "Drywall Finishing Tools > Semi-Automatic Tools > Compound Tubes": f"{SEMI} > Compound Tubes",
    "Drywall Finishing Tools > Semi-Automatic Tools > Compound Applicators": f"{SEMI} > Compound Applicators",
    "Drywall Finishing Tools > Semi-Automatic Tools > Corner Flushers": f"{SEMI} > Corner Flushers",
    "Drywall Finishing Tools > Semi-Automatic Tools > Semi-Automatic Taping Tool Sets": f"{SEMI} > Tool Sets",
    "Drywall Finishing Tools > Automatic Taping Tools > Tool Cases": f"{DEPARTMENT} > Tool Storage & Cases",
}
DIRECT_MAP.update({
    f"{AUTO} > Automatic Tapers": f"{AUTO} > Automatic Tapers",
    f"{AUTO} > Flat Boxes": f"{AUTO} > Flat Boxes",
    f"{AUTO} > Angle Heads & Corner Finishers": f"{AUTO} > Angle Heads & Corner Finishers",
    f"{AUTO} > Angle Boxes & Corner Applicators": f"{AUTO} > Angle Boxes & Corner Applicators",
    f"{AUTO} > Corner Rollers": f"{AUTO} > Corner Rollers",
    f"{AUTO} > Nail Spotters": f"{AUTO} > Nail Spotters",
    f"{AUTO} > Loading Pumps": f"{AUTO} > Loading Pumps",
    f"{AUTO} > Goosenecks & Box Fillers": f"{AUTO} > Goosenecks & Box Fillers",
    f"{AUTO} > Handles & Extensions": f"{AUTO} > Handles & Extensions",
    f"{AUTO} > Tool Sets": f"{AUTO} > Tool Sets",
    f"{SEMI} > Semi-Automatic Tapers": f"{SEMI} > Semi-Automatic Tapers",
    f"{SEMI} > Compound Tubes": f"{SEMI} > Compound Tubes",
    f"{SEMI} > Compound Applicators": f"{SEMI} > Compound Applicators",
    f"{SEMI} > Corner Flushers": f"{SEMI} > Corner Flushers",
    f"{SEMI} > Tool Sets": f"{SEMI} > Tool Sets",
    f"{DEPARTMENT} > Tool Storage & Cases": f"{DEPARTMENT} > Tool Storage & Cases",
})

SEPARATE_DOMAINS = {
    "Drywall Finishing Tools > Parts": "Replacement Parts",
    "Replacement Parts": "Replacement Parts",
    "Stilts & Accessories > Stilts": "Stilts & Accessories > Stilts",
}

FIELDS = [
    "row_number", "sku", "type", "name", "parent_sku", "current_categories",
    "proposed_categories", "disposition", "evidence_basis", "requires_review", "notes",
]


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def build_manifest(rows: list[dict[str, str]]) -> list[dict[str, str]]:
    owners = {row["SKU"]: row for row in rows if row["Type"] != "variation"}
    owner_targets: dict[str, tuple[str, str, str, str]] = {}
    for sku, row in owners.items():
        current = row["Categories"].strip()
        if current in DIRECT_MAP:
            owner_targets[sku] = (DIRECT_MAP[current], "deterministic_mapping", "approved target taxonomy + current functional leaf", "")
        elif current in SEPARATE_DOMAINS:
            owner_targets[sku] = (SEPARATE_DOMAINS[current], "preserved_separate_domain", "approved separation from tool-shopping taxonomy", "")
        else:
            owner_targets[sku] = ("", "unresolved_current_path", "no approved exact mapping", "Requires explicit taxonomy decision.")

    manifest: list[dict[str, str]] = []
    for index, row in enumerate(rows, start=2):
        if row["Type"] == "variation":
            parent_sku = row["Parent"].strip()
            target = owner_targets.get(parent_sku)
            if target:
                proposed, parent_disposition, basis, notes = target
                disposition = "inherited_from_parent" if proposed else "inherited_parent_review"
                basis = f"exact parent SKU {parent_sku}; {basis}"
            else:
                proposed, disposition, basis, notes = "", "missing_parent_mapping", f"parent SKU {parent_sku} not resolved", ""
        else:
            parent_sku = ""
            proposed, disposition, basis, notes = owner_targets[row["SKU"]]

        requires_review = disposition in {
            "outside_target_review", "unresolved_current_path", "inherited_parent_review", "missing_parent_mapping"
        }
        manifest.append({
            "row_number": str(index),
            "sku": row["SKU"],
            "type": row["Type"],
            "name": row["Name"],
            "parent_sku": parent_sku,
            "current_categories": row["Categories"],
            "proposed_categories": proposed,
            "disposition": disposition,
            "evidence_basis": basis,
            "requires_review": "1" if requires_review else "0",
            "notes": notes,
        })
    return manifest


def write_csv(path: Path, rows: list[dict[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=FIELDS, lineterminator="\r\n")
        writer.writeheader()
        writer.writerows(rows)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--catalog", type=Path, default=DEFAULT_CATALOG)
    parser.add_argument("--output", type=Path, default=DEFAULT_CSV)
    parser.add_argument("--summary", type=Path, default=DEFAULT_JSON)
    args = parser.parse_args()
    catalog = args.catalog.resolve()
    rows = load(catalog)
    manifest = build_manifest(rows)
    write_csv(args.output.resolve(), manifest)
    by_disposition = Counter(row["disposition"] for row in manifest)
    summary = {
        "schema_version": 1,
        "source_catalog": str(catalog.relative_to(ROOT)).replace("\\", "/"),
        "source_sha256": sha256(catalog),
        "source_rows": len(rows),
        "manifest_rows": len(manifest),
        "approved_target_department": DEPARTMENT,
        "dispositions": dict(sorted(by_disposition.items())),
        "requires_review_rows": sum(row["requires_review"] == "1" for row in manifest),
        "unique_proposed_paths": sorted({row["proposed_categories"] for row in manifest if row["proposed_categories"]}),
        "source_mutated": False,
    }
    args.summary.resolve().write_text(json.dumps(summary, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps(summary, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
