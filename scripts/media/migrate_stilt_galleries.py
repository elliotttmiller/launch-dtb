"""Replace catalog-referenced Stilt assets and map full galleries in the catalog.

This migration is deliberately limited to assets currently referenced by the
official Stilt parent/variation rows. It stages every removed asset before the
media mutation and writes the catalog atomically with a hash-verified backup.
"""

from __future__ import annotations

import csv
import hashlib
import os
import shutil
import tempfile
from datetime import datetime, timezone
from pathlib import Path


CATALOG = Path("products/launch/official/dtb_official_catalog.csv")
MEDIA = Path("products/launch/media/media")
NEW_IMAGES = Path("products/launch/media/new_images")
PUBLIC_BASE = "https://drywalltoolbox.com/wp/wp-content/uploads/2026/media"

# Catalog variable parent SKU -> normalized new-image token.
SURPRO_GALLERIES = {
    "SP-S1-A": "sp_s1_a",
    "SP-S1-M": "sp_s1_m",
    "SP-S1X-A": "sp_s1x_a",
    "SP-S1X-M": "sp_s1x_m",
    "SP-S2-A": "sp_s2_a",
    "SP-S2-M": "sp_s2_m",
    "SP-S2X-A": "sp_s2x_a",
    "SP-S2X-M": "sp_s2x_m",
}


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def webp_is_valid(path: Path) -> bool:
    data = path.read_bytes()
    return len(data) >= 12 and data[:4] == b"RIFF" and data[8:12] == b"WEBP"


def image_names(value: str) -> list[str]:
    return [Path(item.strip()).name for item in value.split(",") if item.strip()]


def gallery_urls(token: str) -> str:
    files = sorted(NEW_IMAGES.rglob(f"{token}_*.webp"))
    expected = [f"{token}_{index:02d}.webp" for index in range(1, len(files) + 1)]
    if not files or [file.name for file in files] != expected:
        raise RuntimeError(f"Invalid or non-contiguous gallery for {token}: {[file.name for file in files]}")
    return ", ".join(f"{PUBLIC_BASE}/{file.name}" for file in files)


def main() -> None:
    raw_catalog = CATALOG.read_bytes()
    newline = "\r\n" if b"\r\n" in raw_catalog else "\n"
    encoding = "utf-8-sig" if raw_catalog.startswith(b"\xef\xbb\xbf") else "utf-8"
    with CATALOG.open("r", newline="", encoding=encoding) as handle:
        reader = csv.DictReader(handle)
        fieldnames = reader.fieldnames
        rows = list(reader)
    if not fieldnames:
        raise RuntimeError("Catalog header is missing")

    stilt_parents = {
        row["SKU"]
        for row in rows
        if row["Type"] == "variable" and "stilts" in row.get("Categories", "").lower()
    }
    stilt_rows = [row for row in rows if row["SKU"] in stilt_parents or row.get("Parent") in stilt_parents]
    if stilt_parents != {"DS-DURA-III", *SURPRO_GALLERIES, "USG-MAGNESIUM-STILTS"}:
        raise RuntimeError(f"Unexpected Stilt parent set: {sorted(stilt_parents)}")

    removable_names = {
        name for row in stilt_rows for name in image_names(row.get("Images", ""))
    }
    if len(removable_names) != 41 or any(not (MEDIA / name).is_file() for name in removable_names):
        raise RuntimeError("Catalog-referenced Stilt media inventory is incomplete")

    gallery_by_parent = {parent: gallery_urls(token) for parent, token in SURPRO_GALLERIES.items()}
    for row in stilt_rows:
        parent = row["SKU"] if row["Type"] == "variable" else row.get("Parent", "")
        if parent in gallery_by_parent:
            row["Images"] = gallery_by_parent[parent]
            if row["Type"] == "variation":
                row["Meta: _dtb_inherit_parent_image"] = "0"

    # Every current Dura/USG gallery remains valid, while all newly generated
    # WebPs (including unlinked DSS3864US) are copied into the media authority.
    continuity_names = sorted(
        name for name in removable_names if name.startswith(("dura_stilts_", "usg_sheetrock_tools_"))
    )
    new_files = sorted(NEW_IMAGES.rglob("*.webp"))
    if len(new_files) != 35:
        raise RuntimeError(f"Expected 35 new WebPs, found {len(new_files)}")
    if any(not webp_is_valid(path) for path in new_files):
        raise RuntimeError("A new WebP source is invalid")

    target_sources: dict[str, Path] = {name: MEDIA / name for name in continuity_names}
    for source in new_files:
        if source.name in target_sources:
            raise RuntimeError(f"Target filename collision: {source.name}")
        target_sources[source.name] = source
    if len(target_sources) != 56:
        raise RuntimeError(f"Expected 56 destination assets, found {len(target_sources)}")

    # Stage all delete targets and staged result candidates before mutation.
    with tempfile.TemporaryDirectory(prefix="dtb-stilt-media-") as temporary:
        stage = Path(temporary)
        removed_stage = stage / "removed"
        output_stage = stage / "output"
        removed_stage.mkdir()
        output_stage.mkdir()
        for name in removable_names:
            shutil.copy2(MEDIA / name, removed_stage / name)
        for name, source in target_sources.items():
            shutil.copy2(source, output_stage / name)
        if any(not webp_is_valid(path) for path in output_stage.iterdir()):
            raise RuntimeError("Staged output contains an invalid WebP")

        # The temporary CSV must be on the catalog volume for Windows atomic
        # replacement; media staging remains in the OS temp directory.
        descriptor, temp_catalog_name = tempfile.mkstemp(
            prefix=f".{CATALOG.name}.", suffix=".tmp", dir=CATALOG.parent
        )
        os.close(descriptor)
        temp_catalog = Path(temp_catalog_name)
        with temp_catalog.open("w", newline="", encoding=encoding) as handle:
            writer = csv.DictWriter(handle, fieldnames=fieldnames, lineterminator=newline)
            writer.writeheader()
            writer.writerows(rows)

        # Validate intended catalog projection before removing any media.
        with temp_catalog.open("r", newline="", encoding=encoding) as handle:
            output_rows = list(csv.DictReader(handle))
        if len(output_rows) != len(rows):
            raise RuntimeError("Catalog row count changed")
        output_by_sku = {row["SKU"]: row for row in output_rows}
        for row in stilt_rows:
            parent = row["SKU"] if row["Type"] == "variable" else row.get("Parent", "")
            names = image_names(output_by_sku[row["SKU"]]["Images"])
            if parent in SURPRO_GALLERIES and not names:
                raise RuntimeError(f"Missing mapped gallery for {row['SKU']}")
            if any(name not in target_sources for name in names):
                raise RuntimeError(f"Catalog references a missing staged asset for {row['SKU']}")

        deleted = False
        copied_names: list[str] = []
        try:
            for name in removable_names:
                (MEDIA / name).unlink()
            deleted = True
            for name in sorted(target_sources):
                shutil.copy2(output_stage / name, MEDIA / name)
                copied_names.append(name)

            timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
            backup = CATALOG.with_name(f"{CATALOG.name}.pre-stilt-media-{timestamp}.bak")
            shutil.copy2(CATALOG, backup)
            if sha256(CATALOG) != sha256(backup):
                raise RuntimeError("Catalog backup hash mismatch")
            os.replace(temp_catalog, CATALOG)
        except Exception:
            if temp_catalog.exists():
                temp_catalog.unlink()
            if deleted:
                for name in copied_names:
                    candidate = MEDIA / name
                    if candidate.exists():
                        candidate.unlink()
                for name in removable_names:
                    shutil.copy2(removed_stage / name, MEDIA / name)
            raise

    print(f"removed_assets={len(removable_names)}")
    print(f"copied_assets={len(target_sources)}")
    print(f"catalog_stilt_rows={len(stilt_rows)}")
    print(f"catalog_updated_surpro_rows={sum(1 for row in stilt_rows if (row['SKU'] if row['Type'] == 'variable' else row.get('Parent', '')) in SURPRO_GALLERIES)}")
    print(f"backup={backup}")


if __name__ == "__main__":
    main()
