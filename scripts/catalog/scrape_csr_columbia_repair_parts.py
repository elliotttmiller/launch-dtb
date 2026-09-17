#!/usr/bin/env python3
"""Extract all public CSR Columbia repair-parts variants from Shopify collection data.

This is a documentation/data-extraction tool. It never mutates the DTB catalog.
Only parent products named ``Columbia * Repair Parts`` are included.
"""
from __future__ import annotations

import csv
import json
import re
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parents[2]
BASE_URL = "https://csrtools.com"
COLLECTION_PATH = "/en-us/collections/columbia-parts/products.json"
OUT = ROOT / "docs/catalog_prices/csrtools"
REPAIR_TITLE = re.compile(r"^Columbia\s+.+\s+Repair Parts$", re.IGNORECASE)
HEADERS = {"User-Agent": "DrywallToolboxCSRPartsResearch/1.0 (public-data-extraction)"}


def fetch_json(url: str) -> dict:
    request = Request(url, headers=HEADERS)
    with urlopen(request, timeout=45) as response:  # nosec B310 -- fixed public HTTPS source.
        return json.loads(response.read().decode("utf-8"))


def part_fields(variant_title: str) -> tuple[str, str]:
    """Split Shopify option text into visible manufacturer part number and name."""
    # Most labels use ``PART-NUMBER - description``, but a few CSR labels omit
    # the separator.  The option's first whitespace-delimited token remains the
    # displayed part number in both forms.
    match = re.match(r"^\s*([^\s-]+)(?:\s*-\s*|\s+)(.+?)\s*$", variant_title or "")
    return (match.group(1).strip(), match.group(2).strip()) if match else ("", (variant_title or "").strip())


def write_csv_atomic(path: Path, fields: list[str], rows: list[dict[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile("w", encoding="utf-8", newline="", delete=False, dir=path.parent, prefix=f".{path.name}.", suffix=".tmp") as handle:
        temp = Path(handle.name)
        writer = csv.DictWriter(handle, fieldnames=fields, extrasaction="raise", lineterminator="\n")
        writer.writeheader(); writer.writerows(rows); handle.flush()
    temp.replace(path)


def main() -> int:
    checked_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    products: list[dict] = []
    page = 1
    while True:
        url = f"{BASE_URL}{COLLECTION_PATH}?{urlencode({'limit': 250, 'page': page})}"
        payload = fetch_json(url)
        batch = payload.get("products", [])
        if not isinstance(batch, list):
            raise ValueError("CSR collection response has no product list")
        products.extend(batch)
        print(f"CSR collection page {page}: {len(batch)} products; total {len(products)}", flush=True)
        if len(batch) < 250:
            break
        page += 1

    repair_pages = [product for product in products if REPAIR_TITLE.fullmatch(str(product.get("title", "")).strip())]
    rows: list[dict[str, str]] = []
    page_rows: list[dict[str, str]] = []
    for product in repair_pages:
        title = str(product.get("title", "")).strip()
        handle = str(product.get("handle", "")).strip()
        product_url = f"{BASE_URL}/en-us/products/{handle}" if handle else ""
        variants = product.get("variants", [])
        if not isinstance(variants, list):
            raise ValueError(f"CSR product {title!r} has malformed variants")
        page_rows.append({
            "repair_product_name": title,
            "repair_product_handle": handle,
            "repair_product_url": product_url,
            "csr_product_id": str(product.get("id", "")),
            "variant_count": str(len(variants)),
            "source_updated_at": str(product.get("updated_at", "")),
            "checked_at": checked_at,
        })
        for variant in variants:
            variant_title = str(variant.get("title", "")).strip()
            manufacturer_part_number, part_name = part_fields(variant_title)
            rows.append({
                "repair_product_name": title,
                "repair_product_handle": handle,
                "repair_product_url": product_url,
                "csr_product_id": str(product.get("id", "")),
                "csr_variant_id": str(variant.get("id", "")),
                "csr_variant_sku": str(variant.get("sku", "")).strip(),
                "manufacturer_part_number": manufacturer_part_number,
                "variant_title": variant_title,
                "part_name": part_name,
                "price_usd": str(variant.get("price", "")).strip(),
                "compare_at_price_usd": str(variant.get("compare_at_price", "") or "").strip(),
                "available": str(bool(variant.get("available", False))).lower(),
                "source_updated_at": str(product.get("updated_at", "")),
                "checked_at": checked_at,
            })
    rows.sort(key=lambda row: (row["repair_product_name"].casefold(), row["csr_variant_id"]))
    page_rows.sort(key=lambda row: row["repair_product_name"].casefold())
    variant_fields = ["repair_product_name", "repair_product_handle", "repair_product_url", "csr_product_id", "csr_variant_id", "csr_variant_sku", "manufacturer_part_number", "variant_title", "part_name", "price_usd", "compare_at_price_usd", "available", "source_updated_at", "checked_at"]
    page_fields = ["repair_product_name", "repair_product_handle", "repair_product_url", "csr_product_id", "variant_count", "source_updated_at", "checked_at"]
    write_csv_atomic(OUT / "csrtools_columbia_repair_parts.csv", variant_fields, rows)
    write_csv_atomic(OUT / "csrtools_columbia_repair_part_pages.csv", page_fields, page_rows)
    summary = {
        "source_collection": f"{BASE_URL}/en-us/collections/columbia-parts",
        "checked_at": checked_at,
        "collection_products_examined": len(products),
        "repair_part_pages": len(page_rows),
        "repair_part_variants": len(rows),
        "missing_csr_variant_sku": sum(not row["csr_variant_sku"] for row in rows),
        "missing_manufacturer_part_number": sum(not row["manufacturer_part_number"] for row in rows),
    }
    (OUT / "README.md").write_text(
        "# CSR Columbia repair-parts extraction\n\n"
        "Public Shopify collection extraction for product pages named `Columbia * Repair Parts`. "
        "`csr_variant_sku` is CSR's retailer SKU; `manufacturer_part_number` is parsed from the displayed variant option. "
        "No DTB catalog records are modified.\n\n"
        + "```json\n" + json.dumps(summary, indent=2) + "\n```\n",
        encoding="utf-8",
    )
    print(json.dumps(summary, sort_keys=True), flush=True)


if __name__ == "__main__":
    main()
