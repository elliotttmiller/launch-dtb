#!/usr/bin/env python3
"""Resolve reviewed below-cost catalog prices at the DTB margin floor.

The current supplier/Veeqo cost evidence remains unchanged. Preview is the
default. ``--apply`` creates verified sibling backups and atomically updates
only WooCommerce ``Regular price`` and the matching Veeqo ``sales_price``.
"""

from __future__ import annotations

import argparse
import csv
from decimal import Decimal, ROUND_CEILING
import hashlib
import json
import os
import shutil
import tempfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
CATALOG = ROOT / "products/launch/official/dtb_official_catalog.csv"
VEEQO = ROOT / "products/launch/official/veeqo_inventory.csv"
TARGET_MARGIN = Decimal("0.30")
EXPECTED = {
    "5.5FBB": (Decimal("269.07"), Decimal("189.95")),
    "BH1": (Decimal("37.15"), Decimal("30.00")),
    "COBCRE": (Decimal("52.97"), Decimal("1.00")),
    "CR1": (Decimal("93.08"), Decimal("39.00")),
    "CT120": (Decimal("15.51"), Decimal("14.50")),
    "CT77": (Decimal("38.77"), Decimal("26.50")),
}


def money(value: Decimal) -> Decimal:
    return value.quantize(Decimal("0.01"), rounding=ROUND_CEILING)


def target_price(cost: Decimal) -> Decimal:
    return money(cost / (Decimal("1") - TARGET_MARGIN))


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load(path: Path) -> tuple[list[str], list[dict[str, str]]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        if not reader.fieldnames:
            raise ValueError(f"CSV has no header: {path}")
        return list(reader.fieldnames), list(reader)


def write_atomic(path: Path, fields: list[str], rows: list[dict[str, str]], expected_hash: str) -> None:
    fd, name = tempfile.mkstemp(prefix=f".{path.name}.", suffix=".tmp", dir=path.parent)
    try:
        with os.fdopen(fd, "w", encoding="utf-8-sig", newline="") as handle:
            writer = csv.DictWriter(handle, fieldnames=fields, extrasaction="raise", lineterminator="\r\n")
            writer.writeheader()
            writer.writerows(rows)
            handle.flush()
            os.fsync(handle.fileno())
        if digest(path) != expected_hash:
            raise RuntimeError(f"Concurrent change detected; refusing to overwrite {path}")
        os.replace(name, path)
    except Exception:
        try:
            os.unlink(name)
        except FileNotFoundError:
            pass
        raise


def backup(path: Path, before_hash: str) -> tuple[Path, Path | None]:
    destination = Path(f"{path}.bak")
    archive = None
    if destination.exists() and digest(destination) != before_hash:
        archive = destination.with_name(f"{path.name}.previous-{digest(destination)[:12]}.bak")
        if not archive.exists():
            shutil.copy2(destination, archive)
    shutil.copy2(path, destination)
    if digest(destination) != before_hash:
        raise RuntimeError(f"Backup verification failed for {path}")
    return destination, archive


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    catalog_hash = digest(CATALOG)
    veeqo_hash = digest(VEEQO)
    catalog_fields, catalog_rows = load(CATALOG)
    veeqo_fields, veeqo_rows = load(VEEQO)
    catalog_by_sku = {row["SKU"].strip(): row for row in catalog_rows}
    veeqo_by_sku = {row["sku_code"].strip(): row for row in veeqo_rows}

    changes: list[dict[str, str]] = []
    for sku, (expected_cost, expected_price) in EXPECTED.items():
        catalog_row = catalog_by_sku.get(sku)
        veeqo_row = veeqo_by_sku.get(sku)
        if catalog_row is None or veeqo_row is None:
            raise ValueError(f"Missing catalog or Veeqo row for {sku}")
        catalog_cost = Decimal(catalog_row["Cost of goods"])
        catalog_price = Decimal(catalog_row["Regular price"])
        veeqo_cost = Decimal(veeqo_row["cost_price"])
        veeqo_price = Decimal(veeqo_row["sales_price"])
        new_price = target_price(expected_cost)
        if catalog_cost != expected_cost or veeqo_cost != expected_cost:
            raise ValueError(f"Unexpected current cost for {sku}: catalog={catalog_cost}, veeqo={veeqo_cost}")
        allowed_prices = {expected_price, new_price}
        if catalog_price not in allowed_prices or veeqo_price not in allowed_prices:
            raise ValueError(f"Unexpected current price for {sku}: catalog={catalog_price}, veeqo={veeqo_price}")
        if catalog_price != new_price:
            changes.append({"file": "catalog", "sku": sku, "field": "Regular price", "before": f"{catalog_price:.2f}", "after": f"{new_price:.2f}"})
        if veeqo_price != new_price:
            changes.append({"file": "veeqo", "sku": sku, "field": "sales_price", "before": f"{veeqo_price:.2f}", "after": f"{new_price:.2f}"})

    result: dict[str, object] = {
        "mode": "apply" if args.apply else "preview",
        "target_gross_margin_pct": "30.00",
        "change_count": len(changes),
        "changed_skus": len({change["sku"] for change in changes}),
        "prices": {
            sku: {"cost": f"{cost:.2f}", "before": f"{before:.2f}", "after": f"{target_price(cost):.2f}"}
            for sku, (cost, before) in EXPECTED.items()
        },
    }
    if args.apply and changes:
        catalog_backup, catalog_archive = backup(CATALOG, catalog_hash)
        veeqo_backup, veeqo_archive = backup(VEEQO, veeqo_hash)
        for sku, (cost, _) in EXPECTED.items():
            new_price = f"{target_price(cost):.2f}"
            catalog_by_sku[sku]["Regular price"] = new_price
            veeqo_by_sku[sku]["sales_price"] = new_price
        write_atomic(CATALOG, catalog_fields, catalog_rows, catalog_hash)
        write_atomic(VEEQO, veeqo_fields, veeqo_rows, veeqo_hash)
        result.update({
            "catalog_backup": str(catalog_backup.relative_to(ROOT)).replace("\\", "/"),
            "veeqo_backup": str(veeqo_backup.relative_to(ROOT)).replace("\\", "/"),
            "catalog_after_sha256": digest(CATALOG),
            "veeqo_after_sha256": digest(VEEQO),
        })
        if catalog_archive:
            result["catalog_previous_backup_archive"] = str(catalog_archive.relative_to(ROOT)).replace("\\", "/")
        if veeqo_archive:
            result["veeqo_previous_backup_archive"] = str(veeqo_archive.relative_to(ROOT)).replace("\\", "/")
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
