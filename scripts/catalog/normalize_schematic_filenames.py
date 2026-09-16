"""Normalize products/launch/media/schematics images to {brand}_{sku}_sch-page-{NNN}.webp.

The script is dry-run by default. Pass --apply to rename files and migrate exact
filename references in JSON, CSV, PHP, and other repository text sources.
"""

from __future__ import annotations

import argparse
import csv
import json
import os
import re
from pathlib import Path


REPO = Path(__file__).resolve().parents[2]
IMAGE_DIR = REPO / "products" / "launch" / "media" / "schematics"
CATALOG = REPO / "products" / "launch" / "official" / "dtb_official_catalog.csv"
PRODUCT_LINKS = REPO / "frontend" / "src" / "data" / "productSchematicLinks.generated.js"
SCHEMATIC_MAP = REPO / "drywalltoolbox" / "wp" / "wp-content" / "mu-plugins" / "dtb-schematics" / "Data" / "SkuSchematicMap.php"
MANIFEST = IMAGE_DIR / "schematic_filename_migration.csv"
SOURCE_MANIFEST = IMAGE_DIR / "schematic_source_manifest.csv"
SCHEMATIC_PARTS_MASTER = (
    REPO / "products" / "launch" / "universal_parts" / "references"
    / "all_brands_schematic_parts_master.csv"
)

TEXT_SUFFIXES = {".csv", ".json", ".js", ".jsx", ".md", ".php", ".py", ".txt"}
SKIP_PARTS = {
    ".git", ".venv", ".cache", "node_modules", "vendor", "dist", "dist-staging",
    "launch-wp",
}

ASGARD_SCHEMATIC_SKUS = {
    "ah25-ad", "ah30-ad", "ah35-ad", "at01-ad", "bbh-ad", "bbhe-ad",
    "ca08-ad", "cfa-ad", "cr01-ad", "ehc07-ad", "ehc10-ad", "ehc12-ad",
    "ez07-ad", "ez10-ad", "ez12-ad", "fa01-ad", "fbhe-ad", "fh-ad",
    "gn01-ad", "lp01-ad", "ns03-ad", "pa07-ad", "pa10-ad", "pa12-ad",
    "xh-ad",
}

PREFERRED_SKU = {
    "columbia-2-way-internal-corner": "ICATW",
    "columbia-angle-head": "COL-ANGLE-HEAD",
    "columbia-automatic-flat-box": "COL-AUTOMATIC-FLAT-BOX",
    "columbia-box-filler": "COL-BOX-FILLER",
    "columbia-cam-lock-tube": "COL-CAM-LOCK-TUBE",
    "columbia-closet-monster-flat-box-handle": "CMH",
    "columbia-combo-flusher": "COL-COMBO-FLUSHER",
    "columbia-compound-tube": "COL-COMPOUND-TUBE",
    "columbia-corner-cobra": "CC",
    "columbia-direct-corner-flusher": "COL-DIRECT-FLUSHER",
    "columbia-external-corner-applicator": "CEXT90",
    "columbia-fat-boy-box": "COL-AUTOMATIC-FAT-BOY-BOX",
    "columbia-flat-box": "COL-FLAT-FINISHER-BOX",
    "columbia-flat-box-handle": "COL-180-GRIP-FLAT-BOX-HANDLE",
    "columbia-gooseneck-adapter": "COL-GOOSENECK",
    "columbia-inside-corner-roller": "CR",
    "columbia-long-extendable-handle": "CHXL",
    "columbia-matrix": "COL-PREDATOR-MATRIX-HANDLE",
    "columbia-mud-pump": "HMP",
    "columbia-nailspotter": "3NS",
    "columbia-one": "COL-ONE-HANDLE",
    "columbia-predator-taper": "PTAPER",
    "columbia-semi-automatic-taper": "SAT",
    "columbia-standard-corner-flusher": "COL-STANDARD-FLUSHER",
    "columbia-standard-outside-corner-roller": "COBCR",
    "columbia-tall-boy-mud-pump": "TBMP",
    "columbia-throttle-box": "COL-THROTTLE-CORNER-FLUSHER-BOX",
    "columbia-sander-head": "COL-SANDER-HEAD",
    "columbia-tomahawk-smoothing-blades": "TOMAHAWK",
    "platinum-compound-pump": "PT-CP",
    "platinum-corner-applicator-handle": "PT-CAH50",
    "platinum-corner-finisher": "PT-CF",
    "platinum-corner-finisher-handle": "PT-CFH50",
    "platinum-corner-roller-handle": "PT-CRH50",
    "platinum-flat-box": "PT-FB",
    "platinum-flat-box-handle": "PT-BH",
    "platinum-outside-corner-roller": "PT-OCR",
    "tapetech-07tt": "07TT",
    "tapetech-17tt": "17TT",
    "tapetech-42tt": "42TT",
    "tapetech-48tt": "48TT",
}


def filename_token(value: str) -> str:
    value = value.strip().lower().replace("_", "-")
    value = re.sub(r"[^a-z0-9.-]+", "-", value)
    return re.sub(r"-+", "-", value).strip("-")


def brand_token(value: str) -> str:
    lowered = value.lower()
    aliases = {
        "columbia taping tools": "columbia",
        "platinum drywall tools": "platinum",
        "dura-stilts": "dura-stilts",
        "level 5": "level5",
    }
    return aliases.get(lowered, filename_token(value))


def load_catalog() -> dict[str, dict[str, str]]:
    with CATALOG.open("r", encoding="utf-8-sig", newline="") as handle:
        return {row["SKU"].upper(): row for row in csv.DictReader(handle) if row.get("SKU")}


def load_product_links() -> dict[str, dict]:
    source = PRODUCT_LINKS.read_text(encoding="utf-8")
    return json.loads(source[source.index("{") : source.rindex("};") + 1])


def load_verbose_map() -> dict[str, tuple[str, int | None]]:
    source = SCHEMATIC_MAP.read_text(encoding="utf-8")
    block = source.split("const DTB_VERBOSE_SCHEMATIC_ID_MAP = [", 1)[1].split("];", 1)[0]
    result = {}
    pattern = re.compile(
        r"'([^']+)'\s*=>\s*\[\s*'schematic_id'\s*=>\s*'([^']+)',\s*'page'\s*=>\s*(null|\d+)\s*\]"
    )
    for key, schematic_id, page in pattern.findall(block):
        result[key] = (schematic_id, None if page == "null" else int(page))
    return result


def verbose_key(stem: str) -> tuple[str, int] | None:
    match = re.match(r"^(.+?)(?:-schematic)?-page-([0-9]+)$", stem, re.I)
    if not match:
        return None
    key = re.sub(r"[^a-z0-9]+", "", match.group(1).lower())
    return key, int(match.group(2))


def resolve(path: Path, catalog: dict, product_links: dict, verbose_map: dict) -> tuple[str, str, int, str]:
    stem = path.stem

    canonical = re.match(r"^([a-z0-9-]+)_(.+?)_sch-page-(\d{3})$", stem)
    if canonical:
        brand = canonical.group(1)
        sku = canonical.group(2)
        if sku in ASGARD_SCHEMATIC_SKUS:
            brand = "asgard"
        return brand, sku, int(canonical.group(3)), "canonical filename"

    retired = re.match(r"^(.+?-ad)_sch-page-(\d+)$", stem, re.I)
    if retired:
        sku = retired.group(1)
        brand = "asgard" if sku.lower() in ASGARD_SCHEMATIC_SKUS else "columbia"
        return brand, sku, int(retired.group(2)), "legacy brand architecture"

    model = re.match(r"^model-4-(\d+-\d+)$", stem, re.I)
    if model:
        return "dura-stilts", "D" + model.group(1), 1, "Dura-Stilts model range"

    legacy = {
        "mud-pump-sub-assemblies-2022-enhanced": ("columbia", "HMP-2022", 1),
        "tall-boy-mud-pump-sub-assemblies-2022-enhanced": ("columbia", "TBMP-2022", 1),
    }
    if stem.lower() in legacy:
        brand, sku, page = legacy[stem.lower()]
        return brand, sku, page, "legacy exact mapping"

    verbose = verbose_key(stem)
    if verbose and verbose[0] in verbose_map:
        schematic_id, pinned_page = verbose_map[verbose[0]]
        special_sku = {
            ("columbia-inside-corner-applicator", 1): "ICA2-1",
            ("columbia-inside-corner-applicator", 2): "ICA4-1",
        }
        page = pinned_page if pinned_page is not None else verbose[1]
        sku = special_sku.get((schematic_id, page), PREFERRED_SKU.get(schematic_id))
        if not sku:
            raise ValueError(f"No preferred canonical SKU for {path.name} -> {schematic_id}")
        return schematic_id.split("-", 1)[0], sku, page, f"schematic map: {schematic_id}"

    patterns = (
        r"^(.+?)_sch(?:_v\d+)?[_-](?:page[_-]?)?(\d+)$",
        r"^(.+?)--page-(\d+)$",
        r"^(.+?)-page[_-]?(\d+)$",
    )
    for pattern in patterns:
        match = re.match(pattern, stem, re.I)
        if not match:
            continue
        sku, page = match.group(1), int(match.group(2))
        if sku.lower().startswith("tapetech-"):
            sku = sku[len("tapetech-") :]
        row = catalog.get(sku.upper())
        if row:
            return brand_token(row.get("Brands") or row.get("Brand") or ""), sku, page, "catalog SKU"
        link = product_links.get(sku.upper())
        if link:
            return brand_token(link["brand"]), sku, page, "product schematic link"
        if sku.isdigit():
            return "level5", sku, page, "Level5 spare-part schematic SKU"
        raise ValueError(f"SKU {sku!r} from {path.name} is absent from catalog and schematic links")

    raise ValueError(f"Unsupported schematic filename: {path.name}")


def build_manifest() -> list[dict[str, str]]:
    catalog = load_catalog()
    links = load_product_links()
    verbose_map = load_verbose_map()
    rows = []
    targets = {}
    for path in sorted(IMAGE_DIR.glob("*.webp"), key=lambda item: item.name.lower()):
        brand, sku, page, source = resolve(path, catalog, links, verbose_map)
        canonical = f"{filename_token(brand)}_{filename_token(sku)}_sch-page-{page:03d}.webp"
        if canonical in targets:
            raise ValueError(f"Collision: {path.name} and {targets[canonical]} -> {canonical}")
        targets[canonical] = path.name
        rows.append({"old_filename": path.name, "new_filename": canonical, "brand": filename_token(brand), "sku": sku, "page": str(page), "resolution_source": source})
    return rows


def repository_text_files() -> list[Path]:
    result = []
    for root, dirs, files in os.walk(REPO):
        dirs[:] = [name for name in dirs if name not in SKIP_PARTS]
        root_path = Path(root)
        for name in files:
            path = root_path / name
            if path.suffix.lower() in TEXT_SUFFIXES and path != MANIFEST:
                result.append(path)
    return result


def write_manifest(rows: list[dict[str, str]]) -> None:
    existing = {}
    existing_order = {}
    if MANIFEST.exists():
        with MANIFEST.open("r", encoding="utf-8-sig", newline="") as handle:
            for index, row in enumerate(csv.DictReader(handle)):
                key = (filename_token(row["sku"]), row["page"])
                existing[key] = row
                existing_order[key] = index

    output_rows = []
    for row in rows:
        historical = existing.get((filename_token(row["sku"]), row["page"]))
        if historical:
            row = {
                **row,
                "old_filename": historical["old_filename"],
                "sku": historical["sku"],
                "resolution_source": historical["resolution_source"],
            }
        output_rows.append(row)

    output_rows.sort(
        key=lambda row: existing_order.get(
            (filename_token(row["sku"]), row["page"]),
            len(existing_order),
        )
    )

    with MANIFEST.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(output_rows[0]))
        writer.writeheader()
        writer.writerows(output_rows)


def rebuild_source_manifest(rows: list[dict[str, str]]) -> None:
    asgard_ids = load_asgard_schematic_ids()
    source_rows = []
    for row in rows:
        path = IMAGE_DIR / row["new_filename"]
        brand = row["brand"]
        sku = filename_token(row["sku"])
        schematic_id = asgard_ids.get(sku) if brand == "asgard" else None
        source_rows.append({
            "schematic_id": schematic_id or f"{brand}_{sku}",
            "brand": brand,
            "sku_or_alias": sku,
            "page": row["page"],
            "filename": row["new_filename"],
            "checksum_sha256": file_sha256(path),
            "size_bytes": str(path.stat().st_size),
        })

    with SOURCE_MANIFEST.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(source_rows[0]))
        writer.writeheader()
        writer.writerows(source_rows)


def load_asgard_schematic_ids() -> dict[str, str]:
    result = {}
    with SCHEMATIC_PARTS_MASTER.open("r", encoding="utf-8-sig", newline="") as handle:
        for row in csv.DictReader(handle):
            if row.get("brand", "").strip().lower() != "asgard":
                continue
            sku = filename_token(row.get("product_sku", ""))
            schematic_id = row.get("schematic_id", "").strip().lower()
            if not sku or not schematic_id:
                continue
            existing = result.get(sku)
            if existing and existing != schematic_id:
                raise ValueError(f"Conflicting Asgard schematic ids for {sku}: {existing}, {schematic_id}")
            result[sku] = schematic_id
    missing = sorted(ASGARD_SCHEMATIC_SKUS - result.keys())
    if missing:
        raise ValueError(f"Missing Asgard schematic identities for: {', '.join(missing)}")
    return result


def file_sha256(path: Path) -> str:
    import hashlib

    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def apply(rows: list[dict[str, str]]) -> tuple[int, int]:
    replacements = {row["old_filename"]: row["new_filename"] for row in rows if row["old_filename"] != row["new_filename"]}
    changed_refs = 0
    for path in repository_text_files():
        raw = path.read_bytes()
        bom = raw.startswith(b"\xef\xbb\xbf")
        text = raw.decode("utf-8-sig")
        updated = text
        for old, new in replacements.items():
            updated = updated.replace(old, new)
        if updated != text:
            path.write_bytes((b"\xef\xbb\xbf" if bom else b"") + updated.encode("utf-8"))
            changed_refs += 1

    # Two-stage moves make case-only renames reliable on Windows.
    staged = []
    for index, row in enumerate(rows):
        old = IMAGE_DIR / row["old_filename"]
        new = IMAGE_DIR / row["new_filename"]
        if old == new:
            continue
        temporary = IMAGE_DIR / f".__dtb_schematic_rename_{index:03d}.webp"
        old.rename(temporary)
        staged.append((temporary, new))
    for temporary, new in staged:
        temporary.rename(new)
    write_manifest(rows)
    rebuild_source_manifest(rows)
    return len(staged), changed_refs


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    rows = build_manifest()
    changed = sum(row["old_filename"] != row["new_filename"] for row in rows)
    print(f"resolved={len(rows)} renames={changed} collisions=0")
    if args.apply:
        renamed, reference_files = apply(rows)
        print(f"applied_renames={renamed} updated_reference_files={reference_files} manifest={MANIFEST.relative_to(REPO)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
