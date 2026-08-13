#!/usr/bin/env python3
"""Normalize TSW supplier costs and reconcile them to the canonical DTB catalog.

The raw authenticated TSW export remains immutable supplier evidence. This tool
creates a deterministic, production-safe derivative keyed to DTB catalog
identifiers without changing product identity, pricing, or WooCommerce data.
"""

from __future__ import annotations

import argparse
import csv
import json
import os
import re
import tempfile
import unicodedata
from collections import Counter, defaultdict
from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from pathlib import Path


HERE = Path(__file__).resolve().parent
DEFAULT_INPUT = HERE / "results" / "tsw-costs.csv"
DEFAULT_CATALOG = HERE.parents[1] / "products" / "launch" / "official" / "dtb_woocommerce_official_catalog.csv"
DEFAULT_OUTPUT = HERE / "results" / "tsw-costs-normalized.csv"
DEFAULT_REPORT = HERE / "results" / "tsw-costs-normalization-report.json"

REQUIRED_TSW_FIELDS = {
    "source_name",
    "brand",
    "sku",
    "product_name",
    "supplier_cost",
    "currency",
    "price_display",
    "price_unit",
    "product_url",
    "scraped_at_utc",
}

# TSW prepends distributor-specific namespace prefixes to manufacturer part
# numbers. These mappings are intentionally explicit; unknown prefixes are never
# guessed or stripped.
BRAND_RULES = {
    "Columbia Tools": {"catalog_brand": "Columbia Taping Tools", "prefix": "CTT"},
    "TapeTech": {"catalog_brand": "TapeTech", "prefix": "TTT"},
    "Dura-Stilts": {"catalog_brand": "Dura-Stilts", "prefix": "DSS"},
    "SurPro": {"catalog_brand": "SurPro", "prefix": "SUR"},
}

OUTPUT_FIELDS = [
    "match_status",
    "catalog_sku",
    "catalog_mpn",
    "catalog_name",
    "catalog_brand",
    "normalized_part_number",
    "supplier_sku",
    "supplier_cost",
    "currency",
    "price_unit",
    "supplier_product_name",
    "source_name",
    "supplier_product_url",
    "scraped_at_utc",
]

SPACE_RE = re.compile(r"\s+")
IDENTIFIER_PUNCT_RE = re.compile(r"[\s\-_./]+")


class NormalizeError(RuntimeError):
    pass


@dataclass(frozen=True)
class CatalogRecord:
    sku: str
    mpn: str
    name: str
    brand: str


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT, help="raw TSW supplier CSV")
    parser.add_argument("--catalog", type=Path, default=DEFAULT_CATALOG, help="canonical production catalog CSV")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT, help="normalized reconciliation CSV")
    parser.add_argument("--report", type=Path, default=DEFAULT_REPORT, help="normalization audit report JSON")
    parser.add_argument(
        "--allow-unmatched",
        action="store_true",
        help="exit successfully when supplier rows do not match a catalog SKU/MPN",
    )
    return parser.parse_args()


def clean_text(value: object) -> str:
    text = unicodedata.normalize("NFKC", str(value or "")).replace("\ufeff", "")
    return SPACE_RE.sub(" ", text).strip()


def canonical_identifier(value: object) -> str:
    """Comparison-only identifier; never written back as a business identifier."""
    return IDENTIFIER_PUNCT_RE.sub("", clean_text(value)).upper()


def parse_money(value: str, *, sku: str) -> str:
    raw = clean_text(value).replace(",", "")
    if not raw:
        raise NormalizeError(f"{sku}: supplier_cost is blank/non-numeric")
    try:
        amount = Decimal(raw)
    except InvalidOperation as exc:
        raise NormalizeError(f"{sku}: invalid supplier_cost {value!r}") from exc
    if not amount.is_finite() or amount <= 0:
        raise NormalizeError(f"{sku}: supplier_cost must be a positive finite amount")
    return format(amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP), ".2f")


def parse_timestamp(value: str, *, sku: str) -> str:
    text = clean_text(value)
    try:
        parsed = datetime.fromisoformat(text.replace("Z", "+00:00"))
    except ValueError as exc:
        raise NormalizeError(f"{sku}: invalid scraped_at_utc {value!r}") from exc
    if parsed.tzinfo is None:
        raise NormalizeError(f"{sku}: scraped_at_utc must include a timezone")
    return parsed.isoformat(timespec="seconds")


def normalize_unit(value: str) -> str:
    text = clean_text(value).upper()
    if not text:
        return ""
    text = re.sub(r"\s+OF\s+1$", "", text)
    aliases = {"EA": "EACH", "EACH OF 1": "EACH"}
    return aliases.get(text, text)


def strip_tsw_prefix(brand: str, supplier_sku: str) -> str:
    rule = BRAND_RULES.get(brand)
    if rule is None:
        raise NormalizeError(f"Unsupported TSW brand {brand!r}; add an explicit BRAND_RULES entry")
    prefix = rule["prefix"]
    if not supplier_sku.upper().startswith(prefix):
        raise NormalizeError(f"{supplier_sku}: expected explicit TSW prefix {prefix!r} for {brand}")
    stripped = supplier_sku[len(prefix):].strip()
    if not stripped:
        raise NormalizeError(f"{supplier_sku}: prefix removal produced an empty manufacturer identifier")
    return stripped


def read_csv(path: Path) -> tuple[list[str], list[dict[str, str]]]:
    try:
        with path.open("r", encoding="utf-8-sig", newline="") as handle:
            reader = csv.DictReader(handle)
            if reader.fieldnames is None:
                raise NormalizeError(f"{path}: missing CSV header")
            fields = [clean_text(field) for field in reader.fieldnames]
            rows = [{clean_text(k): clean_text(v) for k, v in row.items() if k is not None} for row in reader]
    except OSError as exc:
        raise NormalizeError(f"Cannot read {path}: {exc}") from exc
    return fields, rows


def load_supplier_rows(path: Path) -> list[dict[str, str]]:
    fields, raw_rows = read_csv(path)
    missing = sorted(REQUIRED_TSW_FIELDS - set(fields))
    if missing:
        raise NormalizeError(f"{path}: missing required TSW columns: {', '.join(missing)}")

    normalized: list[dict[str, str]] = []
    for row_number, row in enumerate(raw_rows, start=2):
        supplier_sku = clean_text(row.get("sku"))
        brand = clean_text(row.get("brand"))
        if not supplier_sku:
            raise NormalizeError(f"{path}:{row_number}: blank supplier SKU")
        if brand not in BRAND_RULES:
            raise NormalizeError(f"{path}:{row_number}: unsupported brand {brand!r}")
        currency = clean_text(row.get("currency")).upper()
        if currency != "USD":
            raise NormalizeError(f"{supplier_sku}: expected USD currency, found {currency!r}")
        normalized.append(
            {
                "source_name": clean_text(row.get("source_name")),
                "brand": brand,
                "catalog_brand": BRAND_RULES[brand]["catalog_brand"],
                "supplier_sku": supplier_sku,
                "normalized_part_number": strip_tsw_prefix(brand, supplier_sku),
                "supplier_cost": parse_money(row.get("supplier_cost", ""), sku=supplier_sku),
                "currency": currency,
                "price_unit": normalize_unit(row.get("price_unit", "")),
                "supplier_product_name": clean_text(row.get("product_name")),
                "supplier_product_url": clean_text(row.get("product_url")),
                "scraped_at_utc": parse_timestamp(row.get("scraped_at_utc", ""), sku=supplier_sku),
            }
        )
    return collapse_supplier_duplicates(normalized)


def collapse_supplier_duplicates(rows: list[dict[str, str]]) -> list[dict[str, str]]:
    """Collapse overlapping source catalogs only when their commercial data agrees."""
    grouped: dict[tuple[str, str], list[dict[str, str]]] = defaultdict(list)
    for row in rows:
        key = (row["catalog_brand"].casefold(), canonical_identifier(row["normalized_part_number"]))
        grouped[key].append(row)

    collapsed: list[dict[str, str]] = []
    for key, candidates in grouped.items():
        costs = {row["supplier_cost"] for row in candidates}
        currencies = {row["currency"] for row in candidates}
        supplier_skus = {canonical_identifier(row["supplier_sku"]) for row in candidates}
        if len(costs) != 1 or len(currencies) != 1 or len(supplier_skus) != 1:
            labels = ", ".join(f"{row['source_name']}:{row['supplier_sku']}={row['supplier_cost']}" for row in candidates)
            raise NormalizeError(f"Conflicting overlapping supplier rows for {key}: {labels}")
        # Prefer the freshest scrape while retaining a deterministic source name
        # list so provenance is not lost when the main TapeTech and EasyClean
        # source catalogs overlap.
        winner = max(candidates, key=lambda row: (row["scraped_at_utc"], row["source_name"].casefold())).copy()
        winner["source_name"] = " | ".join(sorted({row["source_name"] for row in candidates}, key=str.casefold))
        collapsed.append(winner)

    collapsed.sort(key=lambda row: (row["catalog_brand"].casefold(), canonical_identifier(row["normalized_part_number"])))
    return collapsed


def first_present(row: dict[str, str], names: tuple[str, ...]) -> str:
    for name in names:
        if name in row and clean_text(row[name]):
            return clean_text(row[name])
    return ""


def load_catalog(path: Path) -> list[CatalogRecord]:
    fields, rows = read_csv(path)
    field_set = set(fields)
    if "SKU" not in field_set:
        raise NormalizeError(f"{path}: production catalog must contain an SKU column")

    records: list[CatalogRecord] = []
    for row in rows:
        sku = clean_text(row.get("SKU"))
        if not sku:
            continue
        records.append(
            CatalogRecord(
                sku=sku,
                mpn=first_present(row, ("MPN", "Meta: mpn", "Meta: _mpn", "Meta: MPN")),
                name=first_present(row, ("Name", "Product name", "Product Name")),
                brand=first_present(row, ("Brands", "Brand")),
            )
        )
    if not records:
        raise NormalizeError(f"{path}: production catalog contains no rows with SKU values")
    return records


def brand_compatible(supplier_brand: str, catalog_brand: str) -> bool:
    if not catalog_brand:
        return True
    left = canonical_identifier(supplier_brand)
    right = canonical_identifier(catalog_brand)
    aliases = {
        canonical_identifier("Columbia Taping Tools"): {canonical_identifier("Columbia Tools"), canonical_identifier("Columbia Taping Tools")},
        canonical_identifier("TapeTech"): {canonical_identifier("TapeTech")},
        canonical_identifier("Dura-Stilts"): {canonical_identifier("Dura-Stilts"), canonical_identifier("Dura Stilts")},
        canonical_identifier("SurPro"): {canonical_identifier("SurPro"), canonical_identifier("Sur-Pro")},
    }
    return right in aliases.get(left, {left})


def reconcile(supplier_rows: list[dict[str, str]], catalog: list[CatalogRecord]) -> list[dict[str, str]]:
    index: dict[str, list[CatalogRecord]] = defaultdict(list)
    for record in catalog:
        for identifier in (record.sku, record.mpn):
            key = canonical_identifier(identifier)
            if key and record not in index[key]:
                index[key].append(record)

    output: list[dict[str, str]] = []
    for supplier in supplier_rows:
        key = canonical_identifier(supplier["normalized_part_number"])
        candidates = [record for record in index.get(key, []) if brand_compatible(supplier["catalog_brand"], record.brand)]
        unique = {(record.sku, record.mpn): record for record in candidates}
        candidates = list(unique.values())

        if len(candidates) == 1:
            record = candidates[0]
            status = "matched"
        elif not candidates:
            record = CatalogRecord("", "", "", "")
            status = "unmatched"
        else:
            record = CatalogRecord("", "", "", "")
            status = "ambiguous"

        output.append(
            {
                "match_status": status,
                "catalog_sku": record.sku,
                "catalog_mpn": record.mpn,
                "catalog_name": record.name,
                "catalog_brand": supplier["catalog_brand"],
                "normalized_part_number": supplier["normalized_part_number"],
                "supplier_sku": supplier["supplier_sku"],
                "supplier_cost": supplier["supplier_cost"],
                "currency": supplier["currency"],
                "price_unit": supplier["price_unit"],
                "supplier_product_name": supplier["supplier_product_name"],
                "source_name": supplier["source_name"],
                "supplier_product_url": supplier["supplier_product_url"],
                "scraped_at_utc": supplier["scraped_at_utc"],
            }
        )
    output.sort(key=lambda row: (row["match_status"], row["catalog_brand"].casefold(), canonical_identifier(row["normalized_part_number"])))
    return output


def write_csv_atomic(path: Path, rows: list[dict[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    handle = tempfile.NamedTemporaryFile(mode="w", encoding="utf-8-sig", newline="", delete=False, dir=path.parent, prefix=path.name + ".", suffix=".tmp")
    temp_path = Path(handle.name)
    try:
        with handle:
            writer = csv.DictWriter(handle, fieldnames=OUTPUT_FIELDS, lineterminator="\r\n", extrasaction="raise")
            writer.writeheader()
            writer.writerows(rows)
        os.replace(temp_path, path)
    except Exception:
        temp_path.unlink(missing_ok=True)
        raise


def write_json_atomic(path: Path, payload: dict[str, object]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    handle = tempfile.NamedTemporaryFile(mode="w", encoding="utf-8", newline="\n", delete=False, dir=path.parent, prefix=path.name + ".", suffix=".tmp")
    temp_path = Path(handle.name)
    try:
        with handle:
            json.dump(payload, handle, ensure_ascii=False, indent=2, sort_keys=True)
            handle.write("\n")
        os.replace(temp_path, path)
    except Exception:
        temp_path.unlink(missing_ok=True)
        raise


def build_report(rows: list[dict[str, str]], input_path: Path, catalog_path: Path) -> dict[str, object]:
    statuses = Counter(row["match_status"] for row in rows)
    brands = Counter(row["catalog_brand"] for row in rows)
    return {
        "schema_version": 1,
        "input": str(input_path),
        "catalog": str(catalog_path),
        "total_normalized_rows": len(rows),
        "match_status": dict(sorted(statuses.items())),
        "brands": dict(sorted(brands.items())),
        "unmatched_supplier_skus": [row["supplier_sku"] for row in rows if row["match_status"] == "unmatched"],
        "ambiguous_supplier_skus": [row["supplier_sku"] for row in rows if row["match_status"] == "ambiguous"],
    }


def main() -> int:
    args = parse_args()
    try:
        supplier_rows = load_supplier_rows(args.input.resolve())
        catalog = load_catalog(args.catalog.resolve())
        rows = reconcile(supplier_rows, catalog)
        report = build_report(rows, args.input.resolve(), args.catalog.resolve())
        write_csv_atomic(args.output.resolve(), rows)
        write_json_atomic(args.report.resolve(), report)

        statuses = report["match_status"]
        print(
            f"Normalized {len(rows)} supplier rows: "
            f"{statuses.get('matched', 0)} matched, "
            f"{statuses.get('unmatched', 0)} unmatched, "
            f"{statuses.get('ambiguous', 0)} ambiguous"
        )
        unresolved = statuses.get("unmatched", 0) + statuses.get("ambiguous", 0)
        if unresolved and not args.allow_unmatched:
            print("ERROR: unresolved catalog matches remain; review the report or rerun with --allow-unmatched")
            return 2
        return 0
    except NormalizeError as exc:
        print(f"ERROR: {exc}")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
