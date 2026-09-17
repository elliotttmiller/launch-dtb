#!/usr/bin/env python3
"""Apply a decimal 10% markup to populated official-catalog regular prices only."""
from __future__ import annotations

import argparse
import csv
import hashlib
import json
import os
import shutil
import tempfile
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_CATALOG = ROOT / "products/launch/official/dtb_official_catalog.csv"
MARKUP = Decimal("1.10")


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load(path: Path) -> tuple[list[str], list[dict[str, str]]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        if not reader.fieldnames:
            raise ValueError("Catalog has no header")
        return list(reader.fieldnames), list(reader)


def marked_up(value: str) -> str:
    try:
        price = Decimal(value.strip())
    except (InvalidOperation, AttributeError) as exc:
        raise ValueError(f"Regular price is not numeric: {value!r}") from exc
    if price <= 0:
        raise ValueError(f"Regular price must be positive: {value!r}")
    return format((price * MARKUP).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP), ".2f")


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
            raise RuntimeError("Catalog changed after load; refusing to overwrite concurrent work")
        os.replace(temp_name, path)
    except Exception:
        try:
            os.unlink(temp_name)
        except FileNotFoundError:
            pass
        raise


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--catalog", type=Path, default=DEFAULT_CATALOG)
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    catalog = args.catalog.resolve()
    before_hash = digest(catalog)
    fields, rows = load(catalog)
    if "Regular price" not in fields or "Sale price" not in fields:
        raise ValueError("Expected WooCommerce Regular price and Sale price columns")
    sales_before = [row["Sale price"] for row in rows]
    changes = []
    for row in rows:
        before = row["Regular price"]
        if not before.strip():
            continue
        after = marked_up(before)
        changes.append({"sku": row.get("SKU", ""), "before": before, "after": after})
        row["Regular price"] = after
    if [row["Sale price"] for row in rows] != sales_before:
        raise RuntimeError("Sale prices changed in memory; refusing to proceed")
    result: dict[str, object] = {
        "mode": "apply" if args.apply else "preview",
        "catalog": str(catalog),
        "before_sha256": before_hash,
        "markup_percent": "10",
        "regular_price_change_count": len(changes),
        "sale_price_change_count": 0,
        "blank_regular_prices_retained": len(rows) - len(changes),
    }
    if args.apply and changes:
        backup = Path(f"{catalog}.bak")
        if backup.exists() and digest(backup) != before_hash:
            archived = backup.with_name(f"{catalog.name}.previous-{digest(backup)[:12]}.bak")
            if not archived.exists():
                shutil.copy2(backup, archived)
            result["previous_backup_archive"] = str(archived)
        shutil.copy2(catalog, backup)
        if digest(backup) != before_hash:
            raise RuntimeError("Backup hash does not match pre-mutation catalog")
        write_atomic(catalog, fields, rows, before_hash)
        result["backup"] = str(backup)
        result["backup_sha256"] = digest(backup)
        result["after_sha256"] = digest(catalog)
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
