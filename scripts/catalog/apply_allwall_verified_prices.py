#!/usr/bin/env python3
"""Apply approved All-Wall exact-MPN prices to the official WooCommerce CSV.

Only HIGH-confidence EXACT_MPN rows with a numeric current price are eligible.
WooCommerce `Sale price` receives that current advertised price. `Regular price`
receives a 10 percent markup over the verified All-Wall price, rounded to cents
with ROUND_HALF_UP. The canonical catalog is backed up and replaced atomically on apply.
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import json
import os
import re
import shutil
import tempfile
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_CATALOG = ROOT / "products/launch/official/dtb_official_catalog.csv"
DEFAULT_EVIDENCE = ROOT / "docs/catalog_prices/allwall/allwall_pricing_master.csv"
SALE_FIELD = "Sale price"
REGULAR_FIELD = "Regular price"
MARKUP = Decimal("1.10")


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def normalized(value: str) -> str:
    return re.sub(r"[^A-Z0-9]", "", (value or "").upper())


def numeric_price(value: str) -> str:
    value = (value or "").strip()
    if not re.fullmatch(r"\d+(?:\.\d{1,2})?", value) or float(value) <= 0:
        raise ValueError(f"Invalid approved All-Wall price: {value!r}")
    return value


def regular_price(value: str) -> str:
    return format((Decimal(value) * MARKUP).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP), ".2f")


def load_csv(path: Path) -> tuple[list[str], list[dict[str, str]]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        if not reader.fieldnames:
            raise ValueError(f"No header in {path}")
        return list(reader.fieldnames), list(reader)


def approved_prices(path: Path) -> dict[str, str]:
    with path.open("r", encoding="utf-8", newline="") as handle:
        rows = list(csv.DictReader(handle))
    prices: dict[str, str] = {}
    for row in rows:
        if not (
            row.get("match_status") == "VERIFIED_PRODUCT"
            and row.get("match_confidence") == "HIGH"
            and row.get("match_method") == "EXACT_MPN"
        ):
            continue
        sku = row.get("dtb_sku", "").strip()
        allwall_mpn_as_sku = row.get("allwall_sku", "").strip()
        if not sku or normalized(sku) != normalized(allwall_mpn_as_sku):
            raise ValueError(f"Approved evidence has non-exact MPN/SKU identity: {sku!r} / {allwall_mpn_as_sku!r}")
        price = numeric_price(row.get("allwall_current_price", ""))
        if sku in prices and prices[sku] != price:
            raise ValueError(f"Conflicting approved All-Wall prices for {sku}: {prices[sku]} / {price}")
        prices[sku] = price
    if not prices:
        raise ValueError("No approved EXACT_MPN All-Wall prices found")
    return prices


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
            raise RuntimeError("Catalog changed after it was loaded; refusing to overwrite concurrent changes")
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
    parser.add_argument("--evidence", type=Path, default=DEFAULT_EVIDENCE)
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    catalog, evidence = args.catalog.resolve(), args.evidence.resolve()
    before_hash = digest(catalog)
    fields, rows = load_csv(catalog)
    if SALE_FIELD not in fields or REGULAR_FIELD not in fields:
        raise ValueError("Official catalog does not contain WooCommerce Sale price and Regular price fields")
    prices = approved_prices(evidence)
    catalog_skus = {row.get("SKU", "") for row in rows}
    missing = sorted(set(prices) - catalog_skus)
    if missing:
        raise ValueError(f"Approved evidence SKUs missing from official catalog: {missing[:10]}")

    changes = []
    for row in rows:
        price = prices.get(row.get("SKU", ""))
        if price is None:
            continue
        regular = regular_price(price)
        if row[SALE_FIELD] != price:
            changes.append({"sku": row["SKU"], "field": SALE_FIELD, "before": row[SALE_FIELD], "after": price})
            row[SALE_FIELD] = price
        if row[REGULAR_FIELD] != regular:
            changes.append({"sku": row["SKU"], "field": REGULAR_FIELD, "before": row[REGULAR_FIELD], "after": regular})
            row[REGULAR_FIELD] = regular

    result: dict[str, object] = {
        "mode": "apply" if args.apply else "preview",
        "catalog": str(catalog),
        "evidence": str(evidence),
        "before_sha256": before_hash,
        "approved_sku_count": len(prices),
        "change_count": len(changes),
        "changes_by_field": {field: sum(change["field"] == field for change in changes) for field in (SALE_FIELD, REGULAR_FIELD)},
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
