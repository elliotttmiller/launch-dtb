#!/usr/bin/env python3
"""Normalize active catalog asset URLs to the HostGator production origin.

Preview is the default. ``--apply`` creates verified sibling backups and then
atomically updates only approved URL fields. CSV schema, row order, quoting,
UTF-8 BOM, CRLF line endings, SKUs, galleries, and all unrelated fields are
preserved. An identical second run must report zero changes.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import os
import shutil
import tempfile
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit


ROOT = Path(__file__).resolve().parents[2]
PRODUCTION_ORIGIN = "https://drywalltoolbox.com"
APPROVED_PATH_PREFIXES = (
    "/wp/wp-content/uploads/2026/media/",
    "/wp/wp-content/uploads/2026/schematics/",
)
DEFAULT_TARGETS = (
    (ROOT / "products/launch/official/dtb_official_catalog.csv", ("Images",)),
    (ROOT / "products/launch/official/veeqo_inventory.csv", ("image_url",)),
)


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def normalize_url(value: str) -> str:
    parsed = urlsplit(value.strip())
    if not parsed.scheme or not parsed.netloc:
        return value
    if not any(parsed.path.startswith(prefix) for prefix in APPROVED_PATH_PREFIXES):
        return value
    if parsed.netloc.lower() == "drywalltoolbox.com" and parsed.scheme.lower() == "https":
        return value
    return urlunsplit(("https", "drywalltoolbox.com", parsed.path, parsed.query, parsed.fragment))


def normalize_field(value: str) -> tuple[str, int]:
    parts = value.split(",")
    normalized = [normalize_url(part) for part in parts]
    return ",".join(normalized), sum(before != after for before, after in zip(parts, normalized))


def load(path: Path) -> tuple[list[str], list[dict[str, str]]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        if not reader.fieldnames:
            raise ValueError(f"CSV has no header: {path}")
        return list(reader.fieldnames), list(reader)


def write_atomic(path: Path, fields: list[str], rows: list[dict[str, str]], expected_hash: str) -> None:
    fd, temp_name = tempfile.mkstemp(prefix=f".{path.name}.", suffix=".tmp", dir=path.parent)
    try:
        with os.fdopen(fd, "w", encoding="utf-8-sig", newline="") as handle:
            writer = csv.DictWriter(handle, fieldnames=fields, extrasaction="raise", lineterminator="\r\n")
            writer.writeheader()
            writer.writerows(rows)
            handle.flush()
            os.fsync(handle.fileno())
        if digest(path) != expected_hash:
            raise RuntimeError(f"Concurrent change detected; refusing to overwrite {path}")
        os.replace(temp_name, path)
    except Exception:
        try:
            os.unlink(temp_name)
        except FileNotFoundError:
            pass
        raise


def process(path: Path, approved_fields: tuple[str, ...], apply: bool) -> dict[str, object]:
    before_hash = digest(path)
    fields, rows = load(path)
    missing = sorted(set(approved_fields) - set(fields))
    if missing:
        raise ValueError(f"Missing approved fields in {path}: {missing}")

    changed_rows = 0
    changed_urls = 0
    changes_by_field: dict[str, int] = {}
    for row in rows:
        row_changed = False
        for field in approved_fields:
            before = row.get(field, "")
            after, count = normalize_field(before)
            if count:
                row[field] = after
                row_changed = True
                changed_urls += count
                changes_by_field[field] = changes_by_field.get(field, 0) + count
        changed_rows += int(row_changed)

    result: dict[str, object] = {
        "file": str(path.relative_to(ROOT)).replace("\\", "/"),
        "rows": len(rows),
        "columns": len(fields),
        "before_sha256": before_hash,
        "changed_rows": changed_rows,
        "changed_urls": changed_urls,
        "changes_by_field": changes_by_field,
    }
    if apply and changed_urls:
        backup = Path(f"{path}.bak")
        if backup.exists() and digest(backup) != before_hash:
            archive = backup.with_name(f"{path.name}.previous-{digest(backup)[:12]}.bak")
            if not archive.exists():
                shutil.copy2(backup, archive)
            result["previous_backup_archive"] = str(archive.relative_to(ROOT)).replace("\\", "/")
        shutil.copy2(path, backup)
        if digest(backup) != before_hash:
            raise RuntimeError(f"Backup verification failed for {path}")
        write_atomic(path, fields, rows, before_hash)
        result["backup"] = str(backup.relative_to(ROOT)).replace("\\", "/")
        result["backup_sha256"] = digest(backup)
        result["after_sha256"] = digest(path)
    return result


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    files = [process(path, fields, args.apply) for path, fields in DEFAULT_TARGETS]
    result = {
        "mode": "apply" if args.apply else "preview",
        "production_origin": PRODUCTION_ORIGIN,
        "changed_files": sum(item["changed_urls"] > 0 for item in files),
        "changed_rows": sum(int(item["changed_rows"]) for item in files),
        "changed_urls": sum(int(item["changed_urls"]) for item in files),
        "files": files,
    }
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
