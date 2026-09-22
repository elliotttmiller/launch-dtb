"""Normalize Dura-III variation galleries and add the DSS3864US 38-64 variation."""

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

VARIATIONS = {
    "D14-22": {"token": "dura_stilts_d14_22", "label": "14”-22”", "value": '14"-22"', "sort": "140", "source": "dura_stilts_d_iii", "count": 3},
    "D18-30": {"token": "dura_stilts_d18_30", "label": "18”-30”", "value": '18"-30"', "sort": "180", "source": "dura_stilts_d_iii", "count": 3},
    "D24-40": {"token": "dura_stilts_d24_40", "label": "24”-40”", "value": '24"-40"', "sort": "240", "source": "dura_stilts_d_iii", "count": 3},
    "DSS3864US": {"token": "dura_stilts_dss3864us", "label": "38”-64”", "value": '38"-64"', "sort": "380", "source": "dss3864us", "count": 4},
}


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def valid_webp(path: Path) -> bool:
    data = path.read_bytes()
    return len(data) >= 12 and data[:4] == b"RIFF" and data[8:12] == b"WEBP"


def names(token: str, count: int) -> list[str]:
    return [f"{token}_{index:02d}.webp" for index in range(1, count + 1)]


def urls(token: str, count: int) -> str:
    return ", ".join(f"{PUBLIC_BASE}/{name}" for name in names(token, count))


def set_value(row: dict[str, str], key: str, value: str) -> None:
    if key not in row:
        raise RuntimeError(f"Missing catalog column: {key}")
    row[key] = value


def main() -> None:
    raw = CATALOG.read_bytes()
    encoding = "utf-8-sig" if raw.startswith(b"\xef\xbb\xbf") else "utf-8"
    newline = "\r\n" if b"\r\n" in raw else "\n"
    with CATALOG.open("r", newline="", encoding=encoding) as handle:
        reader = csv.DictReader(handle)
        fieldnames = reader.fieldnames
        rows = list(reader)
    if not fieldnames:
        raise RuntimeError("Missing catalog header")
    by_sku = {row["SKU"]: row for row in rows}
    if len(by_sku) != len(rows) or PARENT_SKU not in by_sku:
        raise RuntimeError("Catalog SKU identity is invalid")
    if "DSS3864US" in by_sku:
        raise RuntimeError("DSS3864US already exists; refusing duplicate product identity")

    parent = by_sku[PARENT_SKU]
    if parent["Type"] != "variable":
        raise RuntimeError("Dura-III parent is not variable")
    for sku in ("D14-22", "D18-30", "D24-40"):
        row = by_sku.get(sku)
        if not row or row["Type"] != "variation" or row.get("Parent") != PARENT_SKU:
            raise RuntimeError(f"Unexpected existing Dura variation: {sku}")

    source_files: dict[str, Path] = {}
    for details in VARIATIONS.values():
        for source_name in names(details["source"], details["count"]):
            source = MEDIA / source_name
            if not source.is_file() or not valid_webp(source):
                raise RuntimeError(f"Missing or invalid Dura source: {source}")
        for output_name, source_name in zip(
            names(details["token"], details["count"]), names(details["source"], details["count"])
        ):
            source_files[output_name] = MEDIA / source_name

    # The default parent gallery follows its default D14-22 variation.
    set_value(parent, "Images", urls(VARIATIONS["D14-22"]["token"], 3))
    parent_range = "14”-22”, 18”-30”, 24”-40”, 38”-64”"
    set_value(parent, "Attribute 1 value(s)", parent_range)
    set_value(
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

    for sku, details in VARIATIONS.items():
        if sku == "DSS3864US":
            continue
        row = by_sku[sku]
        set_value(row, "Images", urls(details["token"], details["count"]))
        set_value(row, "Meta: _dtb_inherit_parent_image", "0")

    # Clone the structurally closest existing Dura variation, then replace all
    # identity, variation, media, and customer-facing fields explicitly.
    new_row = by_sku["D24-40"].copy()
    details = VARIATIONS["DSS3864US"]
    for key, value in {
        "SKU": "DSS3864US",
        "Name": "Dura-III Adjustable - 38”-64”",
        "Short description": "Dura-III Adjustable 38”-64” stilts are engineered for specialized extra-tall applications and high-ceiling environments.",
        "Description": "<p>Dura-III Adjustable 38”-64” stilts are engineered for specialized extra-tall applications and high-ceiling environments. Their adjustable aluminum construction gives drywall and painting professionals the elevated reach needed for demanding overhead work.</p>",
        "Regular price": "",
        "Sale price": "",
        "Cost of goods": "",
        "In stock?": "0",
        "Stock": "",
        "Low stock amount": "",
        "Images": urls(details["token"], details["count"]),
        "Parent": PARENT_SKU,
        "Position": "1076",
        "Attribute 1 value(s)": details["label"],
        "Meta: schema_mpn": "DSS3864US",
        "Meta: _dtb_manufacturer_sku": "DSS3864US",
        "Meta: _dtb_mpn": "DSS3864US",
        "Meta: _dtb_parent_product_sku": PARENT_SKU,
        "Meta: _dtb_variation_axis": "Height Range",
        "Meta: _dtb_variation_value": details["value"],
        "Meta: _dtb_variation_label": details["label"],
        "Meta: _dtb_variation_sort": details["sort"],
        "Meta: _dtb_inherit_parent_image": "0",
        "Meta: _dtb_schematic_page": "",
        "Meta: _dtb_schematic_url": "/schematics?brand=dura-stilts&category=Stilts&schematic=dura-stilts-dura-iii",
        "Meta: _dtb_specs_json": json.dumps(
            [
                {"label": "Brand", "value": "Dura-Stilts"},
                {"label": "Part Number", "value": "DSS3864US"},
                {"label": "Model", "value": "Dura-III Adjustable 38”-64”"},
                {"label": "Height Range", "value": "38”-64”"},
            ],
            ensure_ascii=False,
        ),
        "Meta: _dtb_seo_title": "Dura-Stilts Dura-III 38–64 in. | Extra-Tall Drywall Stilts",
        "Meta: _dtb_seo_description": "Shop Dura-Stilts Dura-III 38–64 in. adjustable stilts for specialized extra-tall drywall, painting, and high-ceiling work.",
        "Meta: _dtb_seo_focus_kw": "Dura-III 38-64 drywall stilts",
        "Meta: _dtb_seo_canonical": "/product/dura-stilts-dura-iii-adjustable-38-64/",
        "Meta: product_family": "Dura-Stilts",
        "Meta: series": "Dura-III",
        "Meta: model": "Dura-III Adjustable 38-64",
    }.items():
        set_value(new_row, key, value)
    rows.append(new_row)

    # Stage new gallery files and the exact stale Dura files before mutation.
    stale_names = set(names("dura_stilts_d_iii", 3) + names("dss3864us", 4))
    if any(not (MEDIA / name).is_file() for name in stale_names):
        raise RuntimeError("Expected stale Dura media is missing")
    with tempfile.TemporaryDirectory(prefix="dtb-dura-media-") as temporary:
        stage = Path(temporary)
        staged_output = stage / "output"
        staged_removed = stage / "removed"
        staged_output.mkdir()
        staged_removed.mkdir()
        for name, source in source_files.items():
            shutil.copy2(source, staged_output / name)
        if len(list(staged_output.iterdir())) != 13 or any(not valid_webp(path) for path in staged_output.iterdir()):
            raise RuntimeError("Dura staged media is incomplete")
        for name in stale_names:
            shutil.copy2(MEDIA / name, staged_removed / name)

        descriptor, temp_name = tempfile.mkstemp(prefix=f".{CATALOG.name}.", suffix=".tmp", dir=CATALOG.parent)
        os.close(descriptor)
        temp_catalog = Path(temp_name)
        with temp_catalog.open("w", newline="", encoding=encoding) as handle:
            writer = csv.DictWriter(handle, fieldnames=fieldnames, lineterminator=newline)
            writer.writeheader()
            writer.writerows(rows)

        with temp_catalog.open("r", newline="", encoding=encoding) as handle:
            output_rows = list(csv.DictReader(handle))
        output_by_sku = {row["SKU"]: row for row in output_rows}
        if len(output_rows) != len(rows) or set(VARIATIONS) - set(output_by_sku):
            raise RuntimeError("Dura catalog output identity validation failed")
        for sku, variation in VARIATIONS.items():
            row = output_by_sku[sku]
            if row["Type"] != "variation" or row["Parent"] != PARENT_SKU:
                raise RuntimeError(f"Invalid Dura parent link for {sku}")
            if [Path(url.strip()).name for url in row["Images"].split(",") if url.strip()] != names(variation["token"], variation["count"]):
                raise RuntimeError(f"Invalid Dura gallery mapping for {sku}")

        deleted = False
        copied: list[str] = []
        try:
            for name in stale_names:
                (MEDIA / name).unlink()
            deleted = True
            for name in sorted(source_files):
                shutil.copy2(staged_output / name, MEDIA / name)
                copied.append(name)
            timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
            backup = CATALOG.with_name(f"{CATALOG.name}.pre-dura-variation-{timestamp}.bak")
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
                for name in stale_names:
                    shutil.copy2(staged_removed / name, MEDIA / name)
            raise

    print("dura_variations=4")
    print("dura_gallery_assets=13")
    print(f"backup={backup}")


if __name__ == "__main__":
    main()
