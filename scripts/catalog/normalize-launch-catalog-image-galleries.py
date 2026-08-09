#!/usr/bin/env python3
"""Build deterministic product and variation galleries from the launch media library.

Variation-specific images are assigned to the variation. Shared imagery remains
on the variable parent. Variations with no distinct photography receive an
explicit copy of the parent's shared gallery, avoiding runtime inheritance.
"""

from __future__ import annotations

import argparse
import csv
import io
import json
import re
import shutil
from collections import defaultdict
from pathlib import Path
from urllib.parse import urlparse


BRAND_PREFIX = {
    "Columbia Tools": "columbia_tools_",
    "Dura-Stilts": "dura_stilts_",
    "LEVEL5": "level5_",
    "Platinum Drywall Tools": "platinum_",
    "SurPro": "surpro_",
    "TapeTech": "tapetech_",
}
CATALOG_URL = "https://elliottm4.sg-host.com/wp/wp-content/uploads/2026/media/"
VEEQO_URL = "https://drywalltoolbox.com/wp-content/uploads/2026/media/"


def normalized(value: str) -> str:
    return re.sub(r"[^a-z0-9]", "", value.lower())


def image_name(url: str) -> str:
    return Path(urlparse(url).path).name


def load_csv(path: Path) -> tuple[list[str], list[dict[str, str]], bool, str]:
    payload = path.read_bytes()
    bom = payload.startswith(b"\xef\xbb\xbf")
    text = payload[3 if bom else 0 :].decode("utf-8")
    newline = "\r\n" if text.count("\r\n") >= text.count("\n") / 2 else "\n"
    reader = csv.DictReader(io.StringIO(text, newline=""))
    return list(reader.fieldnames or []), list(reader), bom, newline


def csv_bytes(fields: list[str], rows: list[dict[str, str]], bom: bool, newline: str) -> bytes:
    buffer = io.StringIO(newline="")
    writer = csv.DictWriter(buffer, fieldnames=fields, lineterminator=newline, extrasaction="ignore")
    writer.writeheader()
    writer.writerows(rows)
    encoded = buffer.getvalue().encode("utf-8")
    return (b"\xef\xbb\xbf" if bom else b"") + encoded


def unique(values: list[str]) -> list[str]:
    return list(dict.fromkeys(value for value in values if value))


def candidate_owner(filename: str, children: list[dict[str, str]], brand: str) -> dict[str, str] | None:
    prefix = BRAND_PREFIX[brand]
    stem = Path(filename).stem
    core = re.sub(r"_\d\d$", "", stem[len(prefix) :] if stem.startswith(prefix) else stem)
    core_key = normalized(core)
    candidates = [child for child in children if normalized(child["SKU"]) in core_key]
    if not candidates:
        return None
    longest = max(len(normalized(child["SKU"])) for child in candidates)
    winners = [child for child in candidates if len(normalized(child["SKU"])) == longest]
    return winners[0] if len(winners) == 1 else None


def exact_sku_file(filename: str, row: dict[str, str]) -> bool:
    prefix = BRAND_PREFIX[row["Brands"]]
    stem = Path(filename).stem
    if not stem.startswith(prefix):
        return False
    core = re.sub(r"_\d\d$", "", stem[len(prefix) :])
    return normalized(core) == normalized(row["SKU"])


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true")
    parser.add_argument("--keep-unmapped", action="store_true")
    args = parser.parse_args()

    workspace = Path(__file__).resolve().parents[2]
    official = workspace / "products/launch/official/dtb_woocommerce_official_catalog.csv"
    export = workspace / "products/launch/official/dtb_woocommerce_official_catalog_wc_export.csv"
    veeqo = workspace / "products/launch/official/veeqo_inventory_import.csv"
    media = workspace / "products/launch/media/media"
    audit = workspace / "products/launch/media/audit"
    quarantine = workspace / "products/launch/media/_quarantine/2026-08-09-media-cleanup"

    fields, rows, bom, newline = load_csv(official)
    by_sku = {row["SKU"]: row for row in rows}
    children: dict[str, list[dict[str, str]]] = defaultdict(list)
    for row in rows:
        if row["Type"] == "variation":
            children[row["Parent"]].append(row)

    original = {
        row["SKU"]: [image_name(url) for url in row["Images"].split(", ") if url]
        for row in rows
    }
    galleries = {sku: list(images) for sku, images in original.items()}
    reasons: dict[tuple[str, str], str] = {}

    for parent_sku, variants in children.items():
        parent = by_sku[parent_sku]
        combined = unique(
            original[parent_sku]
            + [filename for variant in variants for filename in original[variant["SKU"]]]
        )
        usage = {
            filename: [variant for variant in variants if filename in original[variant["SKU"]]]
            for filename in combined
        }
        owned: dict[str, list[str]] = {variant["SKU"]: [] for variant in variants}
        shared: list[str] = []
        for filename in combined:
            owner = candidate_owner(filename, variants, parent["Brands"])
            if owner is None and len(usage[filename]) == 1:
                owner = usage[filename][0]
            if owner is not None:
                owned[owner["SKU"]].append(filename)
                reasons[(owner["SKU"], filename)] = "variation_specific"
            else:
                shared.append(filename)
                reasons[(parent_sku, filename)] = "parent_shared"
        galleries[parent_sku] = shared
        for variant in variants:
            galleries[variant["SKU"]] = owned[variant["SKU"]]

    media_files = sorted(path.name for path in media.glob("*.webp"))
    for filename in media_files:
        for row in rows:
            if row["Type"] == "variable" or not exact_sku_file(filename, row):
                continue
            if filename not in galleries[row["SKU"]]:
                galleries[row["SKU"]].append(filename)
                reasons[(row["SKU"], filename)] = "exact_sku_media"

    explicit_fallbacks: list[str] = []
    parent_representatives: list[str] = []
    for parent_sku, variants in children.items():
        parent = by_sku[parent_sku]
        if not galleries[parent_sku]:
            default_sku = parent.get("Meta: _dtb_default_variation_sku", "")
            default_gallery = galleries.get(default_sku, [])
            if not default_gallery:
                default_gallery = next((galleries[v["SKU"]] for v in variants if galleries[v["SKU"]]), [])
            if default_gallery:
                galleries[parent_sku] = [default_gallery[0]]
                reasons[(parent_sku, default_gallery[0])] = "parent_representative"
                parent_representatives.append(parent_sku)
        for variant in variants:
            sku = variant["SKU"]
            if galleries[sku]:
                continue
            fallback = galleries[parent_sku]
            if fallback:
                galleries[sku] = list(fallback)
                explicit_fallbacks.append(sku)
                for filename in fallback:
                    reasons[(sku, filename)] = "explicit_parent_fallback"

    missing_variations = [
        row["SKU"] for row in rows if row["Type"] == "variation" and not galleries[row["SKU"]]
    ]
    if missing_variations:
        raise SystemExit("Variations remain without images: " + ", ".join(missing_variations))

    for row in rows:
        row["Images"] = ", ".join(CATALOG_URL + name for name in unique(galleries[row["SKU"]]))
        if row["Type"] == "variation":
            row["Meta: _dtb_inherit_parent_image"] = "0"

    official_output = csv_bytes(fields, rows, bom, newline)

    export_fields, export_rows, export_bom, export_newline = load_csv(export)
    official_images = {row["SKU"]: row["Images"] for row in rows}
    official_skus = [row["SKU"] for row in rows]
    export_by_sku = {row["SKU"]: row for row in export_rows}
    if len(export_by_sku) != len(export_rows):
        raise SystemExit("Woo export contains blank or duplicate SKU identities")
    missing_export_skus = [sku for sku in official_skus if sku not in export_by_sku]
    extra_export_skus = [sku for sku in export_by_sku if sku not in official_images]
    if missing_export_skus or extra_export_skus:
        raise SystemExit(
            "Woo export SKU set differs from official catalog; missing="
            + ",".join(missing_export_skus)
            + "; extra="
            + ",".join(extra_export_skus)
        )
    export_had_id = "ID" in export_fields
    export_fields = [field for field in export_fields if field != "ID"]
    export_rows = [export_by_sku[sku] for sku in official_skus]
    for row in export_rows:
        row.pop("ID", None)
        if row["SKU"] in official_images:
            row["Images"] = official_images[row["SKU"]]
            if row["Type"] == "variation":
                row["Meta: _dtb_inherit_parent_image"] = "0"
    export_output = csv_bytes(export_fields, export_rows, export_bom, export_newline)

    veeqo_fields, veeqo_rows, veeqo_bom, veeqo_newline = load_csv(veeqo)
    for row in veeqo_rows:
        gallery = galleries.get(row["sku_code"], [])
        if gallery:
            row["image_url"] = VEEQO_URL + gallery[0]
    veeqo_output = csv_bytes(veeqo_fields, veeqo_rows, veeqo_bom, veeqo_newline)

    referenced = {filename for gallery in galleries.values() for filename in gallery}
    unmapped = sorted(set(media_files) - referenced)
    changed_rows = [row["SKU"] for row in rows if original[row["SKU"]] != galleries[row["SKU"]]]
    summary = {
        "mode": "apply" if args.apply else "dry-run",
        "catalog_rows": len(rows),
        "changed_catalog_rows": len(changed_rows),
        "variation_rows": sum(row["Type"] == "variation" for row in rows),
        "variation_rows_with_explicit_galleries": sum(bool(galleries[row["SKU"]]) for row in rows if row["Type"] == "variation"),
        "variation_explicit_parent_fallbacks": len(explicit_fallbacks),
        "variable_parent_representatives": len(parent_representatives),
        "media_files": len(media_files),
        "mapped_media_files": len(referenced),
        "unmapped_media_files": len(unmapped),
        "catalog_image_assignments_before": sum(map(len, original.values())),
        "catalog_image_assignments_after": sum(map(len, galleries.values())),
        "missing_variations": missing_variations,
        "wc_export_rows": len(export_rows),
        "wc_export_columns_after": len(export_fields),
        "wc_export_id_removed": export_had_id,
        "wc_export_order_matches_official": [row["SKU"] for row in export_rows] == official_skus,
    }
    print(json.dumps(summary, indent=2))
    if not args.apply:
        return 0

    backup_root = quarantine / "catalog-mapping-backups"
    for path, output in ((official, official_output), (export, export_output), (veeqo, veeqo_output)):
        backup = backup_root / path.relative_to(workspace)
        backup.parent.mkdir(parents=True, exist_ok=True)
        if not backup.exists():
            shutil.copy2(path, backup)
        path.write_bytes(output)

    audit.mkdir(parents=True, exist_ok=True)
    with (audit / "catalog-image-mapping-manifest.csv").open("w", encoding="utf-8", newline="") as handle:
        writer = csv.writer(handle, lineterminator="\n")
        writer.writerow(("sku", "type", "parent_sku", "gallery_position", "filename", "url", "mapping_reason"))
        for row in rows:
            for position, filename in enumerate(galleries[row["SKU"]], 1):
                writer.writerow((row["SKU"], row["Type"], row["Parent"], position, filename, CATALOG_URL + filename, reasons.get((row["SKU"], filename), "existing_assignment")))
    with (audit / "unmapped-media-manifest.csv").open("w", encoding="utf-8", newline="") as handle:
        writer = csv.writer(handle, lineterminator="\n")
        writer.writerow(("filename", "status", "reason"))
        for filename in unmapped:
            writer.writerow((filename, "quarantined" if not args.keep_unmapped else "retained", "no_unambiguous_catalog_sku_owner"))
    (audit / "catalog-image-mapping-summary.json").write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")

    if not args.keep_unmapped:
        unmapped_root = quarantine / "unmapped-canonical"
        unmapped_root.mkdir(parents=True, exist_ok=True)
        for filename in unmapped:
            source = media / filename
            destination = unmapped_root / filename
            if destination.exists():
                raise RuntimeError(f"Unmapped quarantine target already exists: {destination}")
            shutil.move(str(source), str(destination))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
