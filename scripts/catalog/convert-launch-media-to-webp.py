#!/usr/bin/env python3
"""Convert the launch media library to genuine, lossless WebP files.

The command is a dry run unless --apply is supplied. Original source files and
changed reference files are retained under the dated cleanup quarantine.
"""

from __future__ import annotations

import argparse
import csv
import json
import shutil
from pathlib import Path

from PIL import Image


TEXT_ROOTS = (
    "products/launch/official",
    "frontend/src",
    "drywalltoolbox/wp/wp-content/mu-plugins",
    "scripts",
    "docs",
)
TEXT_SUFFIXES = {".csv", ".json", ".php", ".js", ".jsx", ".cjs", ".mjs", ".ps1", ".md", ".txt"}


def read_utf8(path: Path) -> tuple[str, bool]:
    payload = path.read_bytes()
    has_bom = payload.startswith(b"\xef\xbb\xbf")
    return payload[3 if has_bom else 0 :].decode("utf-8"), has_bom


def write_utf8(path: Path, text: str, has_bom: bool) -> None:
    payload = text.encode("utf-8")
    path.write_bytes((b"\xef\xbb\xbf" if has_bom else b"") + payload)


def text_files(workspace: Path) -> list[Path]:
    result: list[Path] = []
    for relative_root in TEXT_ROOTS:
        root = workspace / relative_root
        if not root.exists():
            continue
        for path in root.rglob("*"):
            normalized = path.as_posix().lower()
            if (
                path.is_file()
                and path.suffix.lower() in TEXT_SUFFIXES
                and "/docs/_working/legacy-dist/" not in f"/{normalized}"
            ):
                result.append(path)
    return sorted(set(result))


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true")
    parser.add_argument("--resume", action="store_true", help="Resume an interrupted apply run")
    parser.add_argument("--media", default="products/launch/media/media")
    parser.add_argument(
        "--quarantine",
        default="products/launch/media/_quarantine/2026-08-09-media-cleanup",
    )
    args = parser.parse_args()

    workspace = Path(__file__).resolve().parents[2]
    media = (workspace / args.media).resolve()
    quarantine = (workspace / args.quarantine).resolve()
    if workspace not in media.parents or workspace not in quarantine.parents:
        raise SystemExit("Media and quarantine paths must remain inside the workspace")
    if media in quarantine.parents or quarantine in media.parents:
        raise SystemExit("Quarantine must be outside the active media directory")

    source_backup = quarantine / "format-sources"
    prior_sources = sorted(p for p in source_backup.iterdir() if p.is_file()) if source_backup.exists() else []
    sources = sorted(p for p in media.iterdir() if p.is_file() and p.suffix.lower() != ".webp")
    conversions: list[dict[str, object]] = []
    replacements: dict[str, str] = {}
    for source in sources:
        destination = source.with_suffix(".webp")
        if destination.exists() and not args.resume:
            raise SystemExit(f"Refusing to overwrite existing target: {destination.name}")
        with Image.open(source) as image:
            image.load()
            conversions.append(
                {
                    "source": source,
                    "destination": destination,
                    "source_format": image.format or "unknown",
                    "width": image.width,
                    "height": image.height,
                    "mode": image.mode,
                }
            )
        replacements[source.name] = destination.name
    for source in prior_sources:
        replacements[source.name] = source.with_suffix(".webp").name

    changed_references: list[tuple[Path, str, str, bool]] = []
    for path in text_files(workspace):
        original, has_bom = read_utf8(path)
        updated = original
        for old_name, new_name in replacements.items():
            updated = updated.replace(old_name, new_name)
        if updated != original:
            changed_references.append((path, original, updated, has_bom))

    summary = {
        "mode": "apply" if args.apply else "dry-run",
        "source_files": len(conversions),
        "previously_converted_files": len(prior_sources),
        "reference_files_changed": len(changed_references),
        "sources": [item["source"].name for item in conversions],
        "changed_reference_files": [str(item[0].relative_to(workspace)).replace("\\", "/") for item in changed_references],
    }
    if not args.apply:
        print(json.dumps(summary, indent=2))
        return 0

    reference_backup = quarantine / "format-reference-backups"
    source_backup.mkdir(parents=True, exist_ok=True)
    reference_backup.mkdir(parents=True, exist_ok=True)

    for item in conversions:
        source = item["source"]
        destination = item["destination"]
        if destination.exists() and args.resume:
            destination.unlink()
        with Image.open(source) as image:
            image.load()
            if image.mode not in {"RGB", "RGBA"}:
                image = image.convert("RGBA" if "transparency" in image.info else "RGB")
            save_options: dict[str, object] = {"lossless": True, "method": 6, "exact": True}
            if image.info.get("icc_profile"):
                save_options["icc_profile"] = image.info["icc_profile"]
            if image.info.get("exif"):
                save_options["exif"] = image.info["exif"]
            image.save(destination, format="WEBP", **save_options)
        with Image.open(destination) as check:
            check.load()
            if check.format != "WEBP" or check.size != (item["width"], item["height"]):
                destination.unlink(missing_ok=True)
                raise RuntimeError(f"WebP verification failed: {destination.name}")
        backup = source_backup / source.name
        if backup.exists():
            raise RuntimeError(f"Source backup already exists: {backup}")
        shutil.move(str(source), str(backup))

    for path, original, updated, has_bom in changed_references:
        backup = reference_backup / path.relative_to(workspace)
        backup.parent.mkdir(parents=True, exist_ok=True)
        if backup.exists():
            raise RuntimeError(f"Reference backup already exists: {backup}")
        write_utf8(backup, original, has_bom)
        write_utf8(path, updated, has_bom)

    manifest_path = quarantine / "webp-conversion-manifest.csv"
    with manifest_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=("source", "destination", "source_format", "width", "height", "mode"),
        )
        writer.writeheader()
        for item in conversions:
            writer.writerow({key: (value.name if isinstance(value, Path) else value) for key, value in item.items()})
    (quarantine / "webp-conversion-summary.json").write_text(
        json.dumps(summary, indent=2) + "\n", encoding="utf-8"
    )
    print(json.dumps(summary, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
