#!/usr/bin/env python3
"""Complete recoverable regular/sale pairs from the verified pre-markup backup."""
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
            raise ValueError(f"No header in {path}")
        return list(reader.fieldnames), list(reader)


def money(value: str) -> Decimal:
    try:
        amount = Decimal(value.strip())
    except (InvalidOperation, AttributeError) as exc:
        raise ValueError(f"Expected positive numeric price, got {value!r}") from exc
    if amount <= 0:
        raise ValueError(f"Expected positive numeric price, got {value!r}")
    return amount


def markup(value: str) -> str:
    return format((money(value) * MARKUP).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP), ".2f")


def write_atomic(path: Path, fields: list[str], rows: list[dict[str, str]], expected_hash: str) -> None:
    fd, temp_name = tempfile.mkstemp(prefix=f".{path.name}.", suffix=".tmp", dir=path.parent)
    try:
        with os.fdopen(fd, "w", encoding="utf-8-sig", newline="") as handle:
            writer = csv.DictWriter(handle, fieldnames=fields, extrasaction="raise", lineterminator="\r\n")
            writer.writeheader(); writer.writerows(rows); handle.flush(); os.fsync(handle.fileno())
        if digest(path) != expected_hash:
            raise RuntimeError("Catalog changed after load; refusing concurrent overwrite")
        os.replace(temp_name, path)
    except Exception:
        try: os.unlink(temp_name)
        except FileNotFoundError: pass
        raise


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--catalog", type=Path, default=DEFAULT_CATALOG)
    parser.add_argument("--source", type=Path, help="Verified pre-markup catalog; defaults to <catalog>.bak")
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    catalog = args.catalog.resolve()
    source = (args.source or Path(f"{catalog}.bak")).resolve()
    before_hash = digest(catalog)
    fields, current = load(catalog)
    source_fields, original = load(source)
    if fields != source_fields or len(current) != len(original):
        raise ValueError("Current catalog and source backup schema/row count differ")
    original_by_sku = {row["SKU"]: row for row in original}
    if len(original_by_sku) != len(original):
        raise ValueError("Source backup has duplicate SKU values")
    changes: list[dict[str, str]] = []
    unresolved = 0
    for row in current:
        old = original_by_sku.get(row["SKU"])
        if old is None:
            raise ValueError(f"SKU missing from source backup: {row['SKU']!r}")
        regular, sale = row["Regular price"].strip(), row["Sale price"].strip()
        if not regular and not sale:
            unresolved += 1
            continue
        if regular and not sale:
            original_regular = old["Regular price"].strip()
            if not original_regular or regular != markup(original_regular):
                raise ValueError(f"{row['SKU']}: regular price is not the expected 10% markup of source price")
            row["Sale price"] = original_regular
            changes.append({"sku": row["SKU"], "field": "Sale price", "before": "", "after": original_regular})
        elif not regular and sale:
            row["Regular price"] = markup(sale)
            changes.append({"sku": row["SKU"], "field": "Regular price", "before": "", "after": row["Regular price"]})
    result: dict[str, object] = {
        "mode": "apply" if args.apply else "preview", "catalog": str(catalog), "source": str(source),
        "before_sha256": before_hash, "change_count": len(changes), "unresolved_both_price_fields_blank": unresolved,
        "changes_by_field": {field: sum(c["field"] == field for c in changes) for field in ("Regular price", "Sale price")},
    }
    if args.apply and changes:
        backup = Path(f"{catalog}.bak")
        if backup.exists() and digest(backup) != before_hash:
            archive = backup.with_name(f"{catalog.name}.previous-{digest(backup)[:12]}.bak")
            if not archive.exists(): shutil.copy2(backup, archive)
            result["previous_backup_archive"] = str(archive)
        shutil.copy2(catalog, backup)
        if digest(backup) != before_hash: raise RuntimeError("Backup hash does not match pre-mutation catalog")
        write_atomic(catalog, fields, current, before_hash)
        result["backup"] = str(backup); result["backup_sha256"] = digest(backup); result["after_sha256"] = digest(catalog)
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
