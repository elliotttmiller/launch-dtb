#!/usr/bin/env python3
"""Remove the regular-price markup from catalog rows explicitly classified as parts."""
from __future__ import annotations

import csv
import hashlib
import io
import json
import shutil
import tempfile
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
CATALOG = ROOT / "products/launch/official/dtb_official_catalog.csv"
AUDIT = ROOT / "docs/catalog_prices/csrtools/official_catalog_part_price_equalization.csv"
SUMMARY = ROOT / "docs/catalog_prices/csrtools/official_catalog_part_price_equalization_summary.json"
PART_VALUES = {"1", "true", "yes"}
MISSING_PRICE = {"", "--"}


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def read_catalog(path: Path) -> tuple[list[str], list[dict[str, str]], bytes, str]:
    raw = path.read_bytes()
    bom = b"\xef\xbb\xbf" if raw.startswith(b"\xef\xbb\xbf") else b""
    newline = "\r\n" if b"\r\n" in raw else "\n"
    reader = csv.DictReader(io.StringIO(raw[len(bom):].decode("utf-8"), newline=""))
    if not reader.fieldnames:
        raise ValueError("Catalog has no header row")
    return list(reader.fieldnames), list(reader), bom, newline


def write_csv_atomic(path: Path, fields: list[str], rows: list[dict[str, str]], bom: bytes = b"", newline: str = "\n") -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile("wb", delete=False, dir=path.parent, prefix=f".{path.name}.", suffix=".tmp") as raw_handle:
        temporary_path = Path(raw_handle.name)
        raw_handle.write(bom)
        text_handle = io.TextIOWrapper(raw_handle, encoding="utf-8", newline="")
        writer = csv.DictWriter(text_handle, fieldnames=fields, extrasaction="raise", lineterminator=newline)
        writer.writeheader()
        writer.writerows(rows)
        text_handle.flush()
    temporary_path.replace(path)


def is_part(row: dict[str, str]) -> bool:
    return row.get("Meta: _dtb_is_parts", "").strip().casefold() in PART_VALUES


def usable_price(value: str) -> bool:
    return value.strip() not in MISSING_PRICE


def main() -> int:
    fields, rows, bom, newline = read_catalog(CATALOG)
    required = {"SKU", "Name", "Regular price", "Sale price", "Meta: _dtb_is_parts"}
    missing = required - set(fields)
    if missing:
        raise ValueError(f"Catalog is missing required fields: {sorted(missing)}")

    source_hash = sha256(CATALOG)
    backup = CATALOG.with_name(f"{CATALOG.name}.before-part-price-equalization-{source_hash[:12]}.bak")
    if backup.exists():
        if sha256(backup) != source_hash:
            raise ValueError(f"Existing backup does not match current catalog: {backup}")
    else:
        shutil.copy2(CATALOG, backup)
        if sha256(backup) != source_hash:
            raise RuntimeError("Catalog backup hash verification failed")

    applied_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    audit_rows: list[dict[str, str]] = []
    updated = already_equal = both_missing = 0
    for row in rows:
        if not is_part(row):
            continue
        old_regular = row["Regular price"]
        old_sale = row["Sale price"]
        # The sale field is the established customer-facing/source price. When
        # it is absent but regular is populated, preserve that only known price.
        selected_price = old_sale if usable_price(old_sale) else old_regular
        if not usable_price(selected_price):
            both_missing += 1
            status = "BOTH_PRICE_FIELDS_MISSING"
            new_regular = old_regular
            new_sale = old_sale
        else:
            new_regular = selected_price
            new_sale = selected_price
            status = "ALREADY_EQUAL" if old_regular == new_regular and old_sale == new_sale else "UPDATED"
            updated += int(status == "UPDATED")
            already_equal += int(status == "ALREADY_EQUAL")
            row["Regular price"] = new_regular
            row["Sale price"] = new_sale
        audit_rows.append({
            "catalog_sku": row["SKU"],
            "catalog_product_name": row["Name"],
            "catalog_product_type": row.get("Type", ""),
            "old_regular_price": old_regular,
            "old_sale_price": old_sale,
            "new_regular_price": new_regular,
            "new_sale_price": new_sale,
            "status": status,
            "applied_at": applied_at,
        })

    write_csv_atomic(CATALOG, fields, rows, bom, newline)
    audit_fields = list(audit_rows[0]) if audit_rows else ["catalog_sku"]
    write_csv_atomic(AUDIT, audit_fields, audit_rows)
    summary = {
        "applied_at": applied_at,
        "catalog": str(CATALOG.relative_to(ROOT)).replace("\\", "/"),
        "catalog_sha256_before": source_hash,
        "catalog_sha256_after": sha256(CATALOG),
        "backup": str(backup.relative_to(ROOT)).replace("\\", "/"),
        "part_rows_examined": len(audit_rows),
        "updated_part_rows": updated,
        "already_equal_part_rows": already_equal,
        "both_price_fields_missing_part_rows": both_missing,
        "rule": "For parts, regular price equals sale price; sale price is preferred when populated.",
    }
    SUMMARY.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(summary, sort_keys=True), flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
