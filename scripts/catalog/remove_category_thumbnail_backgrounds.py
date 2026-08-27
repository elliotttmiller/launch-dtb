#!/usr/bin/env python3
"""Bulk-remove category thumbnail backgrounds with rembg.

This is an operator/migration tool for category media, not a catalog authority.
It reuses one rembg inference session across the full batch, writes transparent
WebP output atomically, trims transparent exterior space, preserves the tool's
natural aspect ratio, and emits a machine-readable QA report.

Default behavior is deliberately non-destructive: files are written to a
sibling ``thumbnails-transparent`` directory. Use ``--in-place`` only after
reviewing a generated batch.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import tempfile
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Iterable

from PIL import Image

try:
    from rembg import new_session, remove
except ImportError as exc:  # pragma: no cover - runtime dependency guard
    raise SystemExit(
        "Missing rembg runtime. Install with: "
        "python -m pip install -r scripts/catalog/"
        "remove_category_thumbnail_backgrounds.requirements.txt"
    ) from exc


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_INPUT = ROOT / "products" / "launch" / "media" / "categories" / "thumbnails"
DEFAULT_OUTPUT = ROOT / "products" / "launch" / "media" / "categories" / "thumbnails-transparent"
DEFAULT_REPORT = ROOT / "products" / "dev" / "media" / "category-thumbnail-background-removal-report.json"

SUPPORTED_SUFFIXES = {".png", ".jpg", ".jpeg", ".webp"}
DEFAULT_MODEL = "isnet-general-use"
DEFAULT_WEBP_QUALITY = 90
DEFAULT_PADDING_RATIO = 0.05
MIN_PADDING = 6
MAX_PADDING = 48
ALPHA_VISIBLE_THRESHOLD = 16


@dataclass(frozen=True)
class Result:
    source: str
    output: str
    source_width: int
    source_height: int
    output_width: int
    output_height: int
    alpha_min: int
    alpha_max: int
    visible_fraction: float
    status: str
    warning: str | None = None


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Bulk-remove backgrounds from DTB category thumbnails using rembg."
    )
    parser.add_argument(
        "--input",
        type=Path,
        default=DEFAULT_INPUT,
        help=f"Input image directory (default: {DEFAULT_INPUT})",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_OUTPUT,
        help=f"Output directory (default: {DEFAULT_OUTPUT})",
    )
    parser.add_argument(
        "--in-place",
        action="store_true",
        help="Atomically replace WebP source images. Mutually exclusive with --output.",
    )
    parser.add_argument(
        "--recursive",
        action="store_true",
        help="Process supported images recursively below the input directory.",
    )
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="Replace existing output files in non-in-place mode.",
    )
    parser.add_argument(
        "--model",
        default=DEFAULT_MODEL,
        help=f"rembg model name (default: {DEFAULT_MODEL}).",
    )
    parser.add_argument(
        "--alpha-matting",
        action=argparse.BooleanOptionalAction,
        default=True,
        help="Use alpha matting for cleaner chrome/tool edges (default: enabled).",
    )
    parser.add_argument("--alpha-matting-foreground-threshold", type=int, default=240)
    parser.add_argument("--alpha-matting-background-threshold", type=int, default=10)
    parser.add_argument("--alpha-matting-erode-size", type=int, default=8)
    parser.add_argument(
        "--trim",
        action=argparse.BooleanOptionalAction,
        default=True,
        help="Trim fully transparent exterior space and add safety padding (default: enabled).",
    )
    parser.add_argument(
        "--padding-ratio",
        type=float,
        default=DEFAULT_PADDING_RATIO,
        help=f"Transparent safety padding after trim (default: {DEFAULT_PADDING_RATIO:.2f}).",
    )
    parser.add_argument(
        "--quality",
        type=int,
        default=DEFAULT_WEBP_QUALITY,
        help=f"Lossy WebP quality 1-100 (default: {DEFAULT_WEBP_QUALITY}).",
    )
    parser.add_argument(
        "--report",
        type=Path,
        default=DEFAULT_REPORT,
        help=f"JSON QA report path (default: {DEFAULT_REPORT}).",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="List planned work without loading the model or writing files.",
    )
    args = parser.parse_args()

    if args.in_place and "--output" in sys.argv:
        parser.error("--in-place and --output cannot be used together")
    if not 0 <= args.alpha_matting_background_threshold <= 255:
        parser.error("--alpha-matting-background-threshold must be 0..255")
    if not 0 <= args.alpha_matting_foreground_threshold <= 255:
        parser.error("--alpha-matting-foreground-threshold must be 0..255")
    if args.alpha_matting_background_threshold >= args.alpha_matting_foreground_threshold:
        parser.error("alpha-matting background threshold must be below foreground threshold")
    if args.alpha_matting_erode_size < 0:
        parser.error("--alpha-matting-erode-size must be >= 0")
    if not 0 <= args.padding_ratio <= 0.5:
        parser.error("--padding-ratio must be between 0 and 0.5")
    if not 1 <= args.quality <= 100:
        parser.error("--quality must be between 1 and 100")

    return args


def iter_images(root: Path, recursive: bool) -> list[Path]:
    pattern = "**/*" if recursive else "*"
    return sorted(
        path
        for path in root.glob(pattern)
        if path.is_file() and path.suffix.lower() in SUPPORTED_SUFFIXES
    )


def alpha_bounds(image: Image.Image) -> tuple[int, int, int, int]:
    alpha = image.getchannel("A")
    meaningful = alpha.point(
        lambda value: 255 if value >= ALPHA_VISIBLE_THRESHOLD else 0,
        mode="L",
    )
    bounds = meaningful.getbbox()
    if bounds is None:
        raise RuntimeError("background removal produced no visible foreground")
    return bounds


def trim_and_pad(image: Image.Image, padding_ratio: float) -> Image.Image:
    cropped = image.crop(alpha_bounds(image))
    longest_edge = max(cropped.size)
    padding = round(longest_edge * padding_ratio)
    padding = max(MIN_PADDING, min(MAX_PADDING, padding))

    canvas = Image.new(
        "RGBA",
        (cropped.width + padding * 2, cropped.height + padding * 2),
        (0, 0, 0, 0),
    )
    canvas.alpha_composite(cropped, (padding, padding))
    return canvas


def visible_fraction(image: Image.Image) -> float:
    alpha = image.getchannel("A")
    visible = alpha.point(
        lambda value: 255 if value >= ALPHA_VISIBLE_THRESHOLD else 0,
        mode="L",
    )
    histogram = visible.histogram()
    visible_pixels = histogram[255]
    return visible_pixels / max(1, image.width * image.height)


def qa_warning(image: Image.Image, fraction: float) -> str | None:
    alpha_min, alpha_max = image.getchannel("A").getextrema()
    if alpha_min != 0:
        return "output has no fully transparent pixels"
    if alpha_max == 0:
        return "output contains no visible foreground"
    if fraction < 0.08:
        return "foreground occupies less than 8% of output; inspect for over-trimming or tiny subject"
    if fraction > 0.92:
        return "foreground occupies more than 92% of output; inspect edge padding/background isolation"
    return None


def destination_for(source: Path, input_root: Path, output_root: Path, in_place: bool) -> Path:
    if in_place:
        return source
    relative = source.relative_to(input_root)
    return (output_root / relative).with_suffix(".webp")


def assert_no_output_collisions(
    sources: Iterable[Path], input_root: Path, output_root: Path, in_place: bool
) -> None:
    seen: dict[Path, Path] = {}
    for source in sources:
        if in_place and source.suffix.lower() != ".webp":
            raise RuntimeError(
                f"--in-place only accepts WebP sources because the category-media contract "
                f"requires WebP output: {source}"
            )

        target = destination_for(source, input_root, output_root, in_place)
        previous = seen.get(target)
        if previous is not None and previous != source:
            raise RuntimeError(
                f"Output collision: {previous} and {source} both map to {target}. "
                "Rename one source before processing."
            )
        seen[target] = source


def atomic_save_webp(image: Image.Image, destination: Path, quality: int) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    fd, temp_name = tempfile.mkstemp(
        prefix=f".{destination.stem}.", suffix=".webp.tmp", dir=destination.parent
    )
    os.close(fd)
    temp_path = Path(temp_name)
    try:
        image.save(
            temp_path,
            "WEBP",
            quality=quality,
            method=6,
            exact=True,
        )
        os.replace(temp_path, destination)
    finally:
        temp_path.unlink(missing_ok=True)


def process_one(
    source: Path,
    destination: Path,
    session: object,
    args: argparse.Namespace,
) -> Result:
    with Image.open(source) as original:
        original.load()
        source_width, source_height = original.size
        source_rgba = original.convert("RGBA")

    isolated = remove(
        source_rgba,
        session=session,
        alpha_matting=args.alpha_matting,
        alpha_matting_foreground_threshold=args.alpha_matting_foreground_threshold,
        alpha_matting_background_threshold=args.alpha_matting_background_threshold,
        alpha_matting_erode_size=args.alpha_matting_erode_size,
    ).convert("RGBA")

    if args.trim:
        isolated = trim_and_pad(isolated, args.padding_ratio)

    alpha_min, alpha_max = isolated.getchannel("A").getextrema()
    fraction = visible_fraction(isolated)
    warning = qa_warning(isolated, fraction)

    atomic_save_webp(isolated, destination, args.quality)

    return Result(
        source=str(source),
        output=str(destination),
        source_width=source_width,
        source_height=source_height,
        output_width=isolated.width,
        output_height=isolated.height,
        alpha_min=alpha_min,
        alpha_max=alpha_max,
        visible_fraction=round(fraction, 6),
        status="warning" if warning else "ok",
        warning=warning,
    )


def write_report(path: Path, *, args: argparse.Namespace, results: list[Result], failures: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "input": str(args.input.resolve()),
        "output": str((args.input if args.in_place else args.output).resolve()),
        "in_place": args.in_place,
        "model": args.model,
        "alpha_matting": args.alpha_matting,
        "trim": args.trim,
        "processed": len(results),
        "warnings": sum(result.status == "warning" for result in results),
        "failures": len(failures),
        "results": [asdict(result) for result in results],
        "errors": failures,
    }

    serialized = json.dumps(payload, indent=2, sort_keys=True) + "\n"
    fd, temp_name = tempfile.mkstemp(prefix=f".{path.name}.", suffix=".tmp", dir=path.parent)
    os.close(fd)
    temp_path = Path(temp_name)
    try:
        temp_path.write_text(serialized, encoding="utf-8")
        os.replace(temp_path, path)
    finally:
        temp_path.unlink(missing_ok=True)


def main() -> int:
    args = parse_args()
    input_root = args.input.resolve()
    output_root = (args.input if args.in_place else args.output).resolve()

    if not input_root.is_dir():
        raise SystemExit(f"Input directory does not exist: {input_root}")

    sources = iter_images(input_root, args.recursive)
    if not sources:
        raise SystemExit(f"No supported images found in: {input_root}")

    assert_no_output_collisions(sources, input_root, output_root, args.in_place)

    planned: list[tuple[Path, Path]] = []
    skipped = 0
    for source in sources:
        destination = destination_for(source, input_root, output_root, args.in_place)
        if destination.exists() and not args.in_place and not args.overwrite:
            skipped += 1
            continue
        planned.append((source, destination))

    print(
        f"found={len(sources)} planned={len(planned)} skipped={skipped} "
        f"model={args.model} in_place={str(args.in_place).lower()}"
    )

    if args.dry_run:
        for source, destination in planned:
            print(f"DRY-RUN {source} -> {destination}")
        return 0

    if not planned:
        print("Nothing to process. Use --overwrite to replace existing non-destructive outputs.")
        return 0

    # Reusing a single inference session is substantially faster than loading
    # the ONNX model once per image and avoids needless memory churn.
    session = new_session(args.model)

    results: list[Result] = []
    failures: list[dict] = []
    for index, (source, destination) in enumerate(planned, start=1):
        try:
            result = process_one(source, destination, session, args)
            results.append(result)
            suffix = f" warning={result.warning}" if result.warning else ""
            print(
                f"[{index}/{len(planned)}] OK {source.name} -> {destination.name} "
                f"{result.output_width}x{result.output_height}{suffix}"
            )
        except Exception as exc:  # continue batch but report a non-zero exit code
            failures.append({"source": str(source), "error": f"{type(exc).__name__}: {exc}"})
            print(f"[{index}/{len(planned)}] ERROR {source}: {exc}", file=sys.stderr)

    write_report(args.report.resolve(), args=args, results=results, failures=failures)
    print(
        f"processed={len(results)} warnings={sum(r.status == 'warning' for r in results)} "
        f"failures={len(failures)} report={args.report.resolve()}"
    )

    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
