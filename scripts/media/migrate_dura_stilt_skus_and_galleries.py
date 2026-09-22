"""Migrate Dura-III variation SKUs and give every variation a full gallery."""

from __future__ import annotations

import csv
import hashlib
import json
import os
import shutil
import tempfile
from datetime import datetime, timezone
from pathlib import Path


CATALOG = Path("products/launch/official/dtb_official_catalog.csv")
MEDIA = Path("products/launch/media/media")
PUBLIC_BASE = "https://drywalltoolbox.com/wp/wp-content/uploads/2026/media"
PARENT_SKU = "DS-DURA-III"
VARIATIONS = (
    ("D14-22", "DSS1422US", "14”-22”,", '14"-22"', "140"),
    ("D18-30", "DSS1830US", "18”-30”,", '18"-30"', "180"),
    ("D24-40", "DSS2440US", "24”-40”,", '24"-40"', "240"),
    (None, "DSS3864US", "38”-64”", '38"-64"', "380"),
)
SOURCE_TOKEN = "dss3864us"


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def webp_ok(path: Path) -> bool:
    data = path.read_bytes()
    return len(data) >= 12 and data[:4] == b"RIFF" and data[8:12] == b"WEBP"


def file_names(token: str) -> list[str]:
    return [f"{token}_{index:02d}.webp" for index in range(1, 5)]


def token(sku: str) -> str:
    return f"dura_stilts_{sku.lower()}"


def gallery(sku: str) -> str:
    return ", ".join(f"{PUBLIC_BASE}/{name}" for name in file_names(token(sku)))


def set_cell(row: dict[str, str], column: str, value: str) -> None:
    if column not in row:
        raise RuntimeError(f"Missing catalog column {column}")
    row[column] = value


def specs(sku: str, label: str) -> str:
    return json.dumps(
        [
            {"label": "Brand", "value": "Dura-Stilts"},
            {"label": "Part Number", "value": sku},
            {"label": "Model", "value": f"Dura-III Adjustable {label}"},
            {"label": "Height Range", "value": label},
        ],
        ensure_ascii=False,
    )


def main() -> None:
    raw = CATALOG.read_bytes()
    encoding = "utf-8-sig" if raw.startswith(b"\xef\xbb\xbf") else "utf-8"
    line_end = "\r\n" if b"\r\n" in raw else "\n"
    with CATALOG.open("r", newline="", encoding=encoding) as handle:
        reader = csv.DictReader(handle)
        fieldnames = reader.fieldnames
        rows = list(reader)
    if not fieldnames:
        raise RuntimeError("Catalog header is missing")
    by_sku = {row["SKU"]: row for row in rows}
    old_skus = {old for old, *_ in VARIATIONS if old}
    new_skus = {new for _, new, *_ in VARIATIONS}
    if len(by_sku) != len(rows) or PARENT_SKU not in by_sku or any(old not in by_sku for old in old_skus):
        raise RuntimeError("Expected Dura catalog identities are missing")
    if any(new in by_sku for new in new_skus):
        raise RuntimeError("A target Dura SKU already exists")

    source_names = file_names(SOURCE_TOKEN)
    if any(not (MEDIA / name).is_file() or not webp_ok(MEDIA / name) for name in source_names):
        raise RuntimeError("The normalized DSS3864US gallery is unavailable")

    parent = by_sku[PARENT_SKU]
    parent_range = "14”-22”, 18”-30”, 24”-40”, 38”-64”"
    set_cell(parent, "Images", gallery("DSS1422US"))
    set_cell(parent, "Attribute 1 value(s)", parent_range)
    set_cell(parent, "Attribute 1 default", "14”-22”")
    set_cell(parent, "Meta: _dtb_default_variation_sku", "DSS1422US")
    set_cell(
        parent,
        "Meta: _dtb_specs_json",
        json.dumps(
            [
                {"label": "Brand", "value": "Dura-Stilts"},
                {"label": "Part Number", "value": PARENT_SKU},
                {"label": "Model", "value": "Dura-III Adjustable"},
                {"label": "Height Range", "value": parent_range},
            ],
            ensure_ascii=False,
        ),
    )

    final_variation_rows: list[dict[str, str]] = []
    for old_sku, new_sku, label, value, sort in VARIATIONS:
        row = by_sku[old_sku].copy() if old_sku else by_sku["D24-40"].copy()
        short = (
            f"Dura-III Adjustable {label} stilts are {description}"
            if (description := {
                "14”-22”": "optimized for low-ceiling residential work and detailed finishing tasks.",
                "18”-30”": "the versatile choice for standard ceiling heights and general painting applications.",
                "24”-40”": "ideal for commercial projects and high-reach drywall installations.",
                "38”-64”": "engineered for specialized extra-tall applications and high-ceiling environments.",
            }[label.rstrip(",")])
            else ""
        )
        # The four size products intentionally use the same supplied four-image
        # gallery, but each owns a normalized SKU-specific filename set.
        updates = {
            "SKU": new_sku,
            "Name": f"Dura-III Adjustable - {label.rstrip(',')}",
            "Short description": short,
            "Images": gallery(new_sku),
            "Parent": PARENT_SKU,
            "Attribute 1 value(s)": label.rstrip(","),
            "Meta: schema_mpn": new_sku,
            "Meta: _dtb_manufacturer_sku": new_sku,
            "Meta: _dtb_mpn": new_sku,
            "Meta: _dtb_parent_product_sku": PARENT_SKU,
            "Meta: _dtb_variation_axis": "Height Range",
            "Meta: _dtb_variation_value": value,
            "Meta: _dtb_variation_label": label.rstrip(","),
            "Meta: _dtb_variation_sort": sort,
            "Meta: _dtb_inherit_parent_image": "0",
            "Meta: _dtb_specs_json": specs(new_sku, label.rstrip(",")),
            "Meta: model": f"Dura-III Adjustable {label.rstrip(',')}",
        }
        if new_sku == "DSS3864US":
            updates.update(
                {
                    "Description": "<p>Dura-III Adjustable 38”-64” stilts are engineered for specialized extra-tall applications and high-ceiling environments.</p>",
                    "Regular price": "",
                    "Sale price": "",
                    "Cost of goods": "",
                    "In stock?": "0",
                    "Stock": "",
                    "Low stock amount": "",
                    "Position": "1076",
                    "Meta: _dtb_schematic_page": "",
                    "Meta: _dtb_schematic_url": "/schematics?brand=dura-stilts&category=Stilts&schematic=dura-stilts-dura-iii",
                    "Meta: _dtb_seo_title": "Dura-Stilts Dura-III 38–64 in. | Extra-Tall Drywall Stilts",
                    "Meta: _dtb_seo_description": "Dura-III Adjustable 38–64 in. stilts for specialized extra-tall drywall, painting, and high-ceiling work.",
                    "Meta: _dtb_seo_focus_kw": "Dura-III 38-64 drywall stilts",
                    "Meta: _dtb_seo_canonical": "/product/dura-stilts-dura-iii-adjustable-38-64/",
                }
            )
        for column, value_to_set in updates.items():
            set_cell(row, column, value_to_set)
        final_variation_rows.append(row)

    rows = [row for row in rows if row["SKU"] not in old_skus] + final_variation_rows
    if len({row["SKU"] for row in rows}) != len(rows):
        raise RuntimeError("SKU migration introduced a duplicate")

    output_sources = {
        output: MEDIA / source
        for _, new_sku, *_ in VARIATIONS
        for output, source in zip(file_names(token(new_sku)), source_names)
    }
    stale = set(source_names + [f"dura_stilts_d_iii_{index:02d}.webp" for index in range(1, 4)])
    if len(output_sources) != 16 or any(not (MEDIA / name).is_file() for name in stale):
        raise RuntimeError("Dura media replacement inventory is incomplete")

    with tempfile.TemporaryDirectory(prefix="dtb-dura-sku-") as temporary:
        stage = Path(temporary)
        staged_out = stage / "out"
        staged_old = stage / "old"
        staged_out.mkdir()
        staged_old.mkdir()
        for output, source in output_sources.items():
            shutil.copy2(source, staged_out / output)
        for name in stale:
            shutil.copy2(MEDIA / name, staged_old / name)
        if len(list(staged_out.iterdir())) != 16 or any(not webp_ok(path) for path in staged_out.iterdir()):
            raise RuntimeError("Dura media staging failed")

        descriptor, temp_name = tempfile.mkstemp(prefix=f".{CATALOG.name}.", suffix=".tmp", dir=CATALOG.parent)
        os.close(descriptor)
        temp_catalog = Path(temp_name)
        with temp_catalog.open("w", newline="", encoding=encoding) as handle:
            writer = csv.DictWriter(handle, fieldnames=fieldnames, lineterminator=line_end)
            writer.writeheader()
            writer.writerows(rows)
        with temp_catalog.open("r", newline="", encoding=encoding) as handle:
            output_rows = list(csv.DictReader(handle))
        output_by_sku = {row["SKU"]: row for row in output_rows}
        if len(output_rows) != len(rows) or not new_skus <= output_by_sku.keys():
            raise RuntimeError("Dura CSV output validation failed")
        for _, new_sku, _, _, _ in VARIATIONS:
            row = output_by_sku[new_sku]
            if row["Type"] != "variation" or row["Parent"] != PARENT_SKU:
                raise RuntimeError(f"Invalid parent link for {new_sku}")
            if [Path(url.strip()).name for url in row["Images"].split(",") if url.strip()] != file_names(token(new_sku)):
                raise RuntimeError(f"Invalid gallery for {new_sku}")

        deleted = False
        copied: list[str] = []
        try:
            for name in stale:
                (MEDIA / name).unlink()
            deleted = True
            for name in sorted(output_sources):
                shutil.copy2(staged_out / name, MEDIA / name)
                copied.append(name)
            timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
            backup = CATALOG.with_name(f"{CATALOG.name}.pre-dura-sku-migration-{timestamp}.bak")
            shutil.copy2(CATALOG, backup)
            if sha256(CATALOG) != sha256(backup):
                raise RuntimeError("Catalog backup hash mismatch")
            os.replace(temp_catalog, CATALOG)
        except Exception:
            if temp_catalog.exists():
                temp_catalog.unlink()
            if deleted:
                for name in copied:
                    candidate = MEDIA / name
                    if candidate.exists():
                        candidate.unlink()
                for name in stale:
                    shutil.copy2(staged_old / name, MEDIA / name)
            raise

    print("dura_variations=4")
    print("dura_gallery_files=16")
    print(f"backup={backup}")


if __name__ == "__main__":
    main()
