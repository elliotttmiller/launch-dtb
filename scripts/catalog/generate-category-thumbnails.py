#!/usr/bin/env python3
"""Generate storefront category thumbnails from canonical product media."""

from pathlib import Path

from PIL import Image, ImageChops, ImageStat


ROOT = Path(__file__).resolve().parents[2]
SOURCE_ROOT = ROOT / "products" / "launch" / "media" / "media"
OUTPUT_ROOT = ROOT / "products" / "launch" / "media" / "categories" / "thumbnails"
SIZE = (348, 128)
CONTENT_SIZE = (332, 112)

# Category slugs mirror docs/reference/ui/hero exactly. The selected source is
# the strongest representative product composition in the canonical media set.
SELECTIONS = {
    "angle-heads": "columbia_tools_ah_all_sizes_02.webp",
    "automatic-tapers": "tapetech_07tt_07.webp",
    "automatic-taping-tool-cases": "columbia_tools_tcs_02.webp",
    "automatic-taping-tool-sets": "columbia_tools_pts_01.webp",
    "automatic-taping-tools": "columbia_tools_taper_02.webp",
    "box-fillers": "columbia_tools_tbbf_01.webp",
    "compound-applicators": "columbia_tools_ica41_01.webp",
    "compound-tubes": "columbia_tools_pcmt42_01.webp",
    "corner-boxes": "platinum_pt_ca8_01.webp",
    "corner-flushers": "columbia_tools_3sf_01.webp",
    "corner-rollers": "platinum_pt_cr_04.webp",
    "extendable-handles": "columbia_tools_pc1_handles_01.webp",
    "fixed-handles": "columbia_tools_pc1h_01.webp",
    "flat-box-handles": "columbia_tools_pmhs_02.webp",
    "flat-boxes": "columbia_tools_12ffb_01.webp",
    "goosenecks": "tapetech_85t_01.webp",
    "loading-pumps": "columbia_tools_hmp_01.webp",
    "nail-spotters": "level5_4_754_02.webp",
    "semi-automatic-accessories": "tapetech_fhtt_02.webp",
    "semi-automatic-tapers": "columbia_tools_sat_01.webp",
    "semi-automatic-taping-tool-sets": "columbia_tools_tcs_01.webp",
    "semi-automatic-taping-tools": "../semi.webp",
    "semi-automatic-tool-cases": "columbia_tools_sacs_01.webp",
}

def content_bounds(image: Image.Image) -> tuple[int, int, int, int]:
    """Trim only near-white studio margin while retaining shadows."""
    rgb = image.convert("RGB")
    corners = Image.new("RGB", (4, 1))
    corners.putdata([
        rgb.getpixel((0, 0)),
        rgb.getpixel((rgb.width - 1, 0)),
        rgb.getpixel((0, rgb.height - 1)),
        rgb.getpixel((rgb.width - 1, rgb.height - 1)),
    ])
    background = tuple(round(value) for value in ImageStat.Stat(corners).median)
    difference = ImageChops.difference(rgb, Image.new("RGB", rgb.size, background)).convert("L")
    mask = difference.point(lambda value: 255 if value > 10 else 0)
    bounds = mask.getbbox()
    if not bounds:
        return (0, 0, rgb.width, rgb.height)

    padding = max(4, round(min(rgb.size) * 0.015))
    left, top, right, bottom = bounds
    return (
        max(0, left - padding),
        max(0, top - padding),
        min(rgb.width, right + padding),
        min(rgb.height, bottom + padding),
    )


def generate(slug: str, source_name: str) -> None:
    source = SOURCE_ROOT / source_name
    if not source.is_file():
        raise FileNotFoundError(f"Missing canonical source for {slug}: {source}")

    with Image.open(source) as original:
        prepared = original.convert("RGB")
        product = prepared.crop(content_bounds(prepared))
        product.thumbnail(CONTENT_SIZE, Image.Resampling.LANCZOS, reducing_gap=3.0)

        canvas = Image.new("RGB", SIZE, "white")
        position = ((SIZE[0] - product.width) // 2, (SIZE[1] - product.height) // 2)
        canvas.paste(product, position)
        canvas.save(
            OUTPUT_ROOT / f"{slug}.webp",
            "WEBP",
            quality=82,
            method=6,
            exact=True,
        )


def main() -> None:
    mapped_categories = {path.name for path in (ROOT / "docs" / "reference" / "ui" / "hero").iterdir() if path.is_dir()}
    if mapped_categories != set(SELECTIONS):
        missing = sorted(mapped_categories - set(SELECTIONS))
        stale = sorted(set(SELECTIONS) - mapped_categories)
        raise RuntimeError(f"Category mapping mismatch; missing={missing}, stale={stale}")

    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
    for slug, source_name in sorted(SELECTIONS.items()):
        generate(slug, source_name)

    print(f"generated={len(SELECTIONS)} size={SIZE[0]}x{SIZE[1]} output={OUTPUT_ROOT}")


if __name__ == "__main__":
    main()
