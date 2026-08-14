#!/usr/bin/env python3
"""Remove redundant Columbia brand prefixes from canonical part titles.

The rewrite is deliberately byte-level so CSV encoding, quoting, field order,
and CRLF line endings remain unchanged. Product identities and descriptive/SEO
content are not modified.
"""

from __future__ import annotations

import argparse
import csv
import io
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
TARGETS = (
    ROOT / "products/launch/official/dtb_official_catalog.csv",
    ROOT / "products/launch/official/dtb_woocommerce_official_catalog_wc_export.csv",
    ROOT / "products/launch/official/veeqo_inventory_import.csv",
    ROOT / "products/launch/official/dtb_pricing_research.csv",
)

TITLE_CHANGES = {
    "AHA": ("Columbia Angle Head Adapter", "Angle Head Adapter"),
    "CT86": ("Columbia CT86 – Toe Kicker Cable", "CT86 – Toe Kicker Cable"),
    "FA259": ('Columbia FA259 8-32 X 5/16" Binder Slot', 'FA259 8-32 X 5/16" Binder Slot'),
    "FA292": ("Columbia FA292 1/4-20 Nyloc Jam Nut", "FA292 1/4-20 Nyloc Jam Nut"),
    "FA311": ('Columbia FA311 1/4-28 X 1/2" Socket Head', 'FA311 1/4-28 X 1/2" Socket Head'),
    "FA315": ('Columbia FA315 10-32 X 3/8" Flat Socket Head', 'FA315 10-32 X 3/8" Flat Socket Head'),
}


def parse_rows(payload: bytes) -> list[dict[str, str]]:
    text = payload.decode("utf-8-sig")
    return list(csv.DictReader(io.StringIO(text, newline="")))


def encode_field(value: str) -> bytes:
    buffer = io.StringIO(newline="")
    csv.writer(buffer, lineterminator="").writerow([value])
    return buffer.getvalue().encode("utf-8")


def normalize(path: Path, *, check: bool) -> int:
    original = path.read_bytes()
    updated = original
    rows = parse_rows(original)
    sku_column = "SKU" if rows and "SKU" in rows[0] else "sku" if rows and "sku" in rows[0] else "sku_code"
    title_column = "Name" if rows and "Name" in rows[0] else "product_title" if rows and "product_title" in rows[0] else "name"
    indexed = {row.get(sku_column, ""): row for row in rows}

    changed = 0
    for sku, (old_title, new_title) in TITLE_CHANGES.items():
        row = indexed.get(sku)
        if not row:
            continue
        current = row.get(title_column, "")
        if current == new_title:
            continue
        if current != old_title:
            raise RuntimeError(f"{path}: unexpected title for {sku}: {current!r}")
        old_bytes = encode_field(old_title)
        new_bytes = encode_field(new_title)
        if updated.count(old_bytes) < 1:
            raise RuntimeError(f"{path}: title bytes not found for {sku}")
        # Replace the first occurrence only: descriptions and SEO metadata retain
        # useful brand wording even when the storefront product title is shorter.
        updated = updated.replace(old_bytes, new_bytes, 1)
        changed += 1

    if updated.startswith(b"\xef\xbb\xbf") != original.startswith(b"\xef\xbb\xbf"):
        raise RuntimeError(f"{path}: BOM changed")
    if updated.count(b"\r\n") != original.count(b"\r\n"):
        raise RuntimeError(f"{path}: CRLF row count changed")

    verified = parse_rows(updated)
    verified_index = {row.get(sku_column, ""): row for row in verified}
    for sku, (_, new_title) in TITLE_CHANGES.items():
        if sku in indexed and verified_index[sku].get(title_column) != new_title:
            raise RuntimeError(f"{path}: verification failed for {sku}")

    if changed and not check:
        path.write_bytes(updated)
    print(f"{path.relative_to(ROOT)}: changes={changed} mode={'check' if check else 'write'}")
    return changed


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true", help="fail when normalization is still required")
    args = parser.parse_args()
    changes = sum(normalize(path, check=args.check) for path in TARGETS)
    if args.check and changes:
        print(f"normalization required: {changes} title(s)")
        return 1
    print(f"normalization complete: {changes} title(s) changed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
