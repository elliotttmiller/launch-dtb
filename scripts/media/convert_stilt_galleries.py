"""Convert the supplied Stilt gallery PNGs to canonical high-quality WebP files.

The source PNGs are intentionally retained. Outputs are written beside their
source galleries and ordered by source creation time so the first image remains
the gallery primary image.
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image


SOURCE_ROOT = Path("products/launch/media/new_images")

# Source folder -> authoritative variable-parent SKU. DSS3864US has no current
# catalog parent; retain its stable supplier SKU rather than misassign it.
PARENT_SKUS = {
    "DSS3864US": "DSS3864US",
    "S1-M": "SP-S1-M",
    "S2-M": "SP-S2-M",
    "S2X-A": "SP-S2X-A",
    "SP-S1-A": "SP-S1-A",
    "SP-S1X-A": "SP-S1X-A",
    "SP-S1X-M": "SP-S1X-M",
    "SP-S2-A": "SP-S2-A",
    "SP-S2X": "SP-S2X-M",
}


def output_token(parent_sku: str) -> str:
    return parent_sku.lower().replace("-", "_")


def convert_gallery(source_dir: Path, parent_sku: str) -> None:
    sources = sorted(
        source_dir.glob("*.png"), key=lambda path: (path.stat().st_ctime_ns, path.name)
    )
    if not sources:
        raise RuntimeError(f"No PNG source files found in {source_dir}")

    for index, source in enumerate(sources, start=1):
        destination = source_dir / f"{output_token(parent_sku)}_{index:02d}.webp"
        if destination.exists():
            raise FileExistsError(f"Refusing to overwrite existing output: {destination}")

        with Image.open(source) as image:
            image.load()
            image.save(
                destination,
                format="WEBP",
                quality=90,
                method=6,
                exact=True,
            )


def main() -> None:
    expected_folders = set(PARENT_SKUS)
    actual_folders = {path.name for path in SOURCE_ROOT.iterdir() if path.is_dir()}
    if actual_folders != expected_folders:
        raise RuntimeError(
            f"Unexpected gallery folders. Expected {sorted(expected_folders)}, "
            f"found {sorted(actual_folders)}"
        )

    for folder, parent_sku in PARENT_SKUS.items():
        convert_gallery(SOURCE_ROOT / folder, parent_sku)


if __name__ == "__main__":
    main()
