#!/usr/bin/env python3
"""Preserve Woo export gallery order while normalizing media filenames.

The Woo export is the merchandising-order authority. Existing optimized images
from the canonical catalog may only be appended; they may never reorder the
export's existing first-occurrence sequence.
"""

from __future__ import annotations

import argparse
import csv
import io
import json
import re
import shutil
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse


CATALOG_URL = "https://elliottm4.sg-host.com/wp/wp-content/uploads/2026/media/"
VEEQO_URL = "https://drywalltoolbox.com/wp-content/uploads/2026/media/"
KNOWN_RENAMES = {"surpro_s2x_a_2131_01.webp": "surpro_s2x_a_3852_01.webp"}
GALLERY_OVERRIDES = {
    "CR": [
        "columbia_tools_cr_04.webp",
        "columbia_tools_cr_05.webp",
        "columbia_tools_cr_01.webp",
    ],
}
LOCKED_FILENAME_FAMILIES = {"columbia_tools_cr"}


def load_csv(path: Path) -> tuple[list[str], list[dict[str, str]], bool, str]:
    payload = path.read_bytes()
    bom = payload.startswith(b"\xef\xbb\xbf")
    text = payload[3 if bom else 0 :].decode("utf-8")
    newline = "\r\n" if text.count("\r\n") >= text.count("\n") / 2 else "\n"
    reader = csv.DictReader(io.StringIO(text, newline=""))
    return list(reader.fieldnames or []), list(reader), bom, newline


def encode_csv(fields: list[str], rows: list[dict[str, str]], bom: bool, newline: str) -> bytes:
    output = io.StringIO(newline="")
    writer = csv.DictWriter(output, fieldnames=fields, lineterminator=newline, extrasaction="ignore")
    writer.writeheader()
    writer.writerows(rows)
    return (b"\xef\xbb\xbf" if bom else b"") + output.getvalue().encode("utf-8")


def canonical_name(name: str) -> str:
    name = re.sub(r"-scaled(?:-\d+x\d+)?(?=\.webp$)", "", name, flags=re.I)
    name = re.sub(r"-\d+x\d+(?=\.webp$)", "", name, flags=re.I)
    return KNOWN_RENAMES.get(name, name)


def names_from_images(value: str) -> list[str]:
    names: list[str] = []
    for url in value.split(", "):
        if not url:
            continue
        name = canonical_name(Path(urlparse(url).path).name)
        if name and name not in names:
            names.append(name)
    return names


def build_url_list(names: list[str], base: str = CATALOG_URL) -> str:
    return ", ".join(base + name for name in names)


def text_files(workspace: Path, excluded: set[Path]) -> list[Path]:
    roots = ("frontend/src", "drywalltoolbox/wp/wp-content/mu-plugins", "scripts", "docs")
    suffixes = {".csv", ".json", ".php", ".js", ".jsx", ".cjs", ".mjs", ".ps1", ".md", ".txt"}
    result: list[Path] = []
    for relative in roots:
        root = workspace / relative
        if not root.exists():
            continue
        for path in root.rglob("*"):
            normalized = path.as_posix().lower()
            if (
                path.is_file()
                and path.suffix.lower() in suffixes
                and path.resolve() not in excluded
                and "/docs/_working/legacy-dist/" not in f"/{normalized}"
            ):
                result.append(path)
    return sorted(set(result))


def read_utf8(path: Path) -> tuple[str, bool]:
    payload = path.read_bytes()
    bom = payload.startswith(b"\xef\xbb\xbf")
    return payload[3 if bom else 0 :].decode("utf-8"), bom


def write_utf8(path: Path, text: str, bom: bool) -> None:
    path.write_bytes((b"\xef\xbb\xbf" if bom else b"") + text.encode("utf-8"))


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()

    workspace = Path(__file__).resolve().parents[2]
    official_path = workspace / "products/launch/official/dtb_woocommerce_official_catalog.csv"
    export_path = workspace / "products/launch/official/dtb_woocommerce_official_catalog_wc_export.csv"
    veeqo_path = workspace / "products/launch/official/veeqo_inventory_import.csv"
    media = workspace / "products/launch/media/media"
    audit = workspace / "products/launch/media/audit"
    run_stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    quarantine = workspace / "products/launch/media/_quarantine/2026-08-09-media-cleanup/wc-gallery-order-runs" / run_stamp

    export_fields, export_rows, export_bom, export_newline = load_csv(export_path)
    official_fields, official_rows, official_bom, official_newline = load_csv(official_path)
    veeqo_fields, veeqo_rows, veeqo_bom, veeqo_newline = load_csv(veeqo_path)
    official_by_sku = {row["SKU"]: row for row in official_rows}
    export_skus = [row["SKU"] for row in export_rows]
    if len(set(export_skus)) != len(export_skus) or set(export_skus) != set(official_by_sku):
        raise SystemExit("Woo export and official catalog must contain the same unique SKU identities")

    # Preserve every current Woo-export position. Optimized catalog additions
    # are appended only when absent, never inserted or sorted.
    source_galleries: dict[str, list[str]] = {}
    export_existing_counts: dict[str, int] = {}
    duplicate_occurrences_removed = 0
    derivative_references_normalized = 0
    for row in export_rows:
        raw_names = [Path(urlparse(url).path).name for url in row["Images"].split(", ") if url]
        normalized_export = names_from_images(row["Images"])
        duplicate_occurrences_removed += len(raw_names) - len(dict.fromkeys(canonical_name(name) for name in raw_names))
        derivative_references_normalized += sum(name != canonical_name(name) for name in raw_names)
        if row["SKU"] in GALLERY_OVERRIDES:
            gallery = list(GALLERY_OVERRIDES[row["SKU"]])
            export_existing_counts[row["SKU"]] = len(gallery)
            source_galleries[row["SKU"]] = gallery
            continue
        export_existing_counts[row["SKU"]] = len(normalized_export)
        gallery = list(normalized_export)
        for name in names_from_images(official_by_sku[row["SKU"]]["Images"]):
            if name not in gallery:
                gallery.append(name)
        source_galleries[row["SKU"]] = gallery

    media_files = {path.name: path for path in media.glob("*.webp")}
    referenced = {name for gallery in source_galleries.values() for name in gallery}
    missing = sorted(referenced - set(media_files))
    if missing:
        raise SystemExit("Referenced canonical media files are missing: " + ", ".join(missing))

    # Derive one physical order per filename family. Variation galleries have
    # priority over simple products, which have priority over composite parents.
    family_entries: dict[str, list[tuple[int, int, str, str, tuple[str, ...]]]] = defaultdict(list)
    family_pattern = re.compile(r"^(.*)_([0-9]{2})\.webp$")
    for row_index, row in enumerate(export_rows):
        grouped: dict[str, list[str]] = defaultdict(list)
        for name in source_galleries[row["SKU"]]:
            match = family_pattern.fullmatch(name)
            if not match:
                raise SystemExit(f"Filename violates canonical ordinal contract: {name}")
            grouped[match.group(1)].append(name)
        priority = 0 if row["Type"] == "variation" else 1 if row["Type"] == "simple" else 2
        for family, sequence in grouped.items():
            family_entries[family].append((priority, row_index, row["Type"], row["SKU"], tuple(sequence)))

    rename_map: dict[str, str] = {}
    family_conflicts: list[dict[str, object]] = []
    for family, entries in family_entries.items():
        entries.sort(key=lambda item: (item[0], -len(item[4]), item[1]))
        chosen = entries[0]
        ordered = list(chosen[4])
        chosen_positions = {name: index for index, name in enumerate(chosen[4])}
        conflicts: list[str] = []
        for entry in entries[1:]:
            common = [name for name in entry[4] if name in chosen_positions]
            if common != sorted(common, key=lambda name: chosen_positions[name]):
                conflicts.append(entry[3])
            for name in entry[4]:
                if name not in ordered:
                    ordered.append(name)
        if conflicts:
            family_conflicts.append(
                {"family": family, "authoritative_sku": chosen[3], "lower_priority_conflicting_skus": conflicts}
            )
        for position, old_name in enumerate(ordered, 1):
            rename_map[old_name] = old_name if family in LOCKED_FILENAME_FAMILIES else f"{family}_{position:02d}.webp"

    destinations: dict[str, list[str]] = defaultdict(list)
    for old_name, new_name in rename_map.items():
        destinations[new_name].append(old_name)
    duplicate_destinations = {name: sources for name, sources in destinations.items() if len(sources) > 1}
    if duplicate_destinations:
        raise SystemExit("Multiple source files resolve to the same destination: " + repr(duplicate_destinations))

    changed_renames = {old: new for old, new in rename_map.items() if old != new}
    changed_sources = set(changed_renames)
    occupied = sorted(
        new for new in changed_renames.values() if new in media_files and new not in changed_sources
    )
    if occupied:
        raise SystemExit("Rename targets are occupied by non-moving files: " + ", ".join(occupied))

    final_galleries = {
        sku: [rename_map.get(name, name) for name in gallery]
        for sku, gallery in source_galleries.items()
    }
    final_referenced = {name for gallery in final_galleries.values() for name in gallery}
    if len(final_referenced) != len(referenced):
        raise SystemExit("Filename normalization unexpectedly merged distinct media identities")

    # Build the order-authoritative Woo export without database IDs.
    export_fields = [field for field in export_fields if field != "ID"]
    for row in export_rows:
        row.pop("ID", None)
        gallery = final_galleries[row["SKU"]]
        row["Images"] = build_url_list(gallery)
        if row["Type"] == "variation" and gallery:
            row["Meta: _dtb_inherit_parent_image"] = "0"
    export_output = encode_csv(export_fields, export_rows, export_bom, export_newline)

    # Project the preserved Woo order into the canonical catalog by SKU.
    for row in official_rows:
        gallery = final_galleries[row["SKU"]]
        row["Images"] = build_url_list(gallery)
        if row["Type"] == "variation" and gallery:
            row["Meta: _dtb_inherit_parent_image"] = "0"
    official_output = encode_csv(official_fields, official_rows, official_bom, official_newline)

    for row in veeqo_rows:
        gallery = final_galleries.get(row["sku_code"], [])
        if gallery:
            row["image_url"] = VEEQO_URL + gallery[0]
    veeqo_output = encode_csv(veeqo_fields, veeqo_rows, veeqo_bom, veeqo_newline)

    # Update filename references outside the three structured catalogs.
    reference_replacements = dict(KNOWN_RENAMES)
    for old_name in referenced:
        canonical = canonical_name(old_name)
        if old_name != canonical:
            reference_replacements[old_name] = canonical
    reference_replacements.update(changed_renames)
    excluded = {official_path.resolve(), export_path.resolve(), veeqo_path.resolve()}
    changed_text: list[tuple[Path, str, str, bool]] = []
    for path in text_files(workspace, excluded):
        original, bom = read_utf8(path)
        updated = original
        for old_name, new_name in reference_replacements.items():
            updated = updated.replace(old_name, new_name)
        if updated != original:
            changed_text.append((path, original, updated, bom))

    optimized_appends = sum(
        len(source_galleries[row["SKU"]]) - export_existing_counts[row["SKU"]]
        for row in export_rows
    )
    summary = {
        "mode": "apply" if args.apply else "dry-run",
        "catalog_rows": len(export_rows),
        "wc_export_columns_after": len(export_fields),
        "wc_export_id_removed": "ID" not in export_fields,
        "gallery_assignments_after": sum(len(gallery) for gallery in final_galleries.values()),
        "unique_media_referenced": len(final_referenced),
        "optimized_images_appended_after_existing_order": optimized_appends,
        "duplicate_occurrences_removed": duplicate_occurrences_removed,
        "derivative_references_normalized": derivative_references_normalized,
        "physical_files_renamed": len(changed_renames),
        "filename_families": len(family_entries),
        "variation_priority_family_conflicts": len(family_conflicts),
        "explicit_gallery_overrides": len(GALLERY_OVERRIDES),
        "reference_files_changed": len(changed_text),
        "missing_media": missing,
    }
    print(json.dumps(summary, indent=2))
    if not args.apply:
        return 0

    backup_root = quarantine / "catalog-backups"
    for path in (official_path, export_path, veeqo_path):
        backup = backup_root / path.relative_to(workspace)
        backup.parent.mkdir(parents=True, exist_ok=True)
        if backup.exists():
            raise RuntimeError(f"Refusing to overwrite catalog backup: {backup}")
        shutil.copy2(path, backup)

    rename_backup = quarantine / "renamed-file-backups"
    stage = quarantine / "rename-staging"
    if stage.exists():
        raise RuntimeError(f"Rename staging directory already exists: {stage}")
    rename_backup.mkdir(parents=True, exist_ok=True)
    stage.mkdir(parents=True)
    for old_name in changed_renames:
        shutil.copy2(media / old_name, rename_backup / old_name)
        shutil.move(str(media / old_name), str(stage / old_name))
    for old_name, new_name in changed_renames.items():
        shutil.move(str(stage / old_name), str(media / new_name))
    stage.rmdir()

    reference_backup = quarantine / "reference-backups"
    for path, original, updated, bom in changed_text:
        backup = reference_backup / path.relative_to(workspace)
        backup.parent.mkdir(parents=True, exist_ok=True)
        if backup.exists():
            raise RuntimeError(f"Refusing to overwrite reference backup: {backup}")
        write_utf8(backup, original, bom)
        write_utf8(path, updated, bom)

    official_path.write_bytes(official_output)
    export_path.write_bytes(export_output)
    veeqo_path.write_bytes(veeqo_output)

    audit.mkdir(parents=True, exist_ok=True)
    with (audit / "catalog-image-mapping-manifest.csv").open("w", encoding="utf-8", newline="") as handle:
        writer = csv.writer(handle, lineterminator="\n")
        writer.writerow(("sku", "type", "parent_sku", "gallery_position", "filename", "url", "mapping_reason"))
        for row in export_rows:
            preserved = export_existing_counts[row["SKU"]]
            for position, filename in enumerate(final_galleries[row["SKU"]], 1):
                reason = "explicit_gallery_override" if row["SKU"] in GALLERY_OVERRIDES else ("wc_export_order_preserved" if position <= preserved else "optimized_append")
                writer.writerow((row["SKU"], row["Type"], row["Parent"], position, filename, CATALOG_URL + filename, reason))
    with (audit / "wc-gallery-file-rename-manifest.csv").open("w", encoding="utf-8", newline="") as handle:
        writer = csv.writer(handle, lineterminator="\n")
        writer.writerow(("old_filename", "new_filename"))
        writer.writerows(sorted(changed_renames.items()))
    (audit / "catalog-image-mapping-summary.json").write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    (audit / "wc-gallery-order-conflicts.json").write_text(json.dumps(family_conflicts, indent=2) + "\n", encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
