#!/usr/bin/env python3
"""Normalize Columbia TCS/RC as simple products and remove synthetic parent."""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import os
import shutil
import tempfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_CATALOG = ROOT / "products/launch/official/dtb_official_catalog.csv"
PARENT = "COL-TOOL-CASE"
CHILDREN = {"TCS", "RC"}
VARIATION_FIELDS = (
    "Parent", "Attribute 1 name", "Attribute 1 value(s)", "Attribute 1 visible",
    "Attribute 1 global", "Attribute 1 default", "Meta: _dtb_parent_product_sku",
    "Meta: _dtb_variation_axis", "Meta: _dtb_variation_value",
    "Meta: _dtb_variation_label", "Meta: _dtb_default_variation_sku",
    "Meta: _dtb_variation_sort",
)


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load(path: Path) -> tuple[list[str], list[dict[str, str]]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        return list(reader.fieldnames or []), list(reader)


def normalize(rows: list[dict[str, str]]) -> tuple[list[dict[str, str]], list[dict[str, str]]]:
    by_sku = {row["SKU"]: row for row in rows}
    if PARENT not in by_sku and CHILDREN.issubset(by_sku):
        if all(by_sku[sku]["Type"] == "simple" and not by_sku[sku]["Parent"] for sku in CHILDREN):
            return rows, []
        raise ValueError("Columbia tool-case products exist in an unexpected post-migration state")
    if set(by_sku).isdisjoint({PARENT, *CHILDREN}):
        return rows, []
    if PARENT not in by_sku or not CHILDREN.issubset(by_sku):
        raise ValueError("Columbia tool-case family is partially present; refusing mutation")
    if by_sku[PARENT]["Type"] != "variable":
        raise ValueError("Unexpected COL-TOOL-CASE type")
    changes = [{"sku": PARENT, "field": "row", "before": "variable synthetic parent", "after": "removed"}]
    result = [row for row in rows if row["SKU"] != PARENT]
    names = {"TCS": "Columbia Semi-Automatic Tool Case", "RC": "Columbia Road Case"}
    slugs = {"TCS": "columbia-semi-automatic-tool-case-tcs", "RC": "columbia-road-case-rc"}
    for sku in sorted(CHILDREN):
        row = by_sku[sku]
        if row["Type"] != "variation" or row["Parent"] != PARENT:
            raise ValueError(f"Unexpected {sku} variation relationship")
        updates = {
            "Type": "simple",
            "Name": names[sku],
            "Meta: _dtb_product_kind": "accessory",
            "Meta: _dtb_commerce_mode": "purchasable",
            "Slug": slugs[sku],
            "Meta: _dtb_seo_canonical": "",
        }
        if sku == "TCS":
            updates.update({
                "Short description": "Protect and transport a complete Columbia semi-automatic tool set in a durable, foam-lined case designed for secure jobsite storage.",
                "Meta: _dtb_seo_title": "Columbia Semi-Automatic Tool Case | TCS",
                "Meta: _dtb_seo_description": "Store and transport Columbia semi-automatic tools in the durable TCS foam-lined case. Built for secure professional jobsite protection.",
                "Meta: _dtb_seo_focus_kw": "Columbia semi-automatic tool case",
            })
        else:
            updates.update({
                "Meta: _dtb_seo_title": "Columbia Road Case | Professional Tool Storage",
                "Meta: _dtb_seo_description": "Protect and organize a complete Columbia drywall finishing set in the rugged RC rolling road case for professional transport and storage.",
                "Meta: _dtb_seo_focus_kw": "Columbia road case",
            })
        for field in VARIATION_FIELDS:
            updates[field] = ""
        for field, after in updates.items():
            before = row.get(field, "")
            if before != after:
                row[field] = after
                changes.append({"sku": sku, "field": field, "before": before, "after": after})
    return result, changes


def write_atomic(path: Path, fields: list[str], rows: list[dict[str, str]], expected_hash: str) -> None:
    fd, temp_name = tempfile.mkstemp(prefix=f".{path.name}.", suffix=".tmp", dir=path.parent)
    try:
        with os.fdopen(fd, "w", encoding="utf-8-sig", newline="") as handle:
            writer = csv.DictWriter(handle, fieldnames=fields, extrasaction="raise", lineterminator="\r\n")
            writer.writeheader()
            writer.writerows(rows)
            handle.flush()
            os.fsync(handle.fileno())
        if digest(path) != expected_hash:
            raise RuntimeError("Catalog changed after load; refusing concurrent overwrite")
        os.replace(temp_name, path)
    except Exception:
        try:
            os.unlink(temp_name)
        except FileNotFoundError:
            pass
        raise


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--catalog", type=Path, default=DEFAULT_CATALOG)
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    catalog = args.catalog.resolve()
    before_hash = digest(catalog)
    fields, rows = load(catalog)
    normalized, changes = normalize(rows)
    report: dict[str, object] = {
        "mode": "apply" if args.apply else "preview", "before_sha256": before_hash,
        "rows_before": len(rows), "rows_after": len(normalized), "change_count": len(changes),
        "affected_skus": sorted({change["sku"] for change in changes}),
    }
    if args.apply and changes:
        backup = Path(f"{catalog}.bak")
        if backup.exists() and digest(backup) != before_hash:
            archive = backup.with_name(f"{catalog.name}.previous-{digest(backup)[:12]}.bak")
            if not archive.exists():
                shutil.copy2(backup, archive)
        shutil.copy2(catalog, backup)
        if digest(backup) != before_hash:
            raise RuntimeError("Pre-mutation backup verification failed")
        write_atomic(catalog, fields, normalized, before_hash)
        report.update({"backup": str(backup), "backup_sha256": digest(backup), "after_sha256": digest(catalog)})
    print(json.dumps(report, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
