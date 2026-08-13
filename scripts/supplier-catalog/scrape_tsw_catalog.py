#!/usr/bin/env python3
"""Export authenticated TSW brand catalogs without persisting credentials."""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import os
import re
import sys
import tempfile
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation
from pathlib import Path
from urllib.parse import parse_qsl, urlencode, urljoin, urlparse, urlunparse

from playwright.sync_api import Page, TimeoutError as PlaywrightTimeoutError, sync_playwright


BASE_URL = "https://www.tswfast.com"
DEFAULT_PROFILE = Path(__file__).resolve().parent / ".browser-profile"
DEFAULT_SOURCES = Path(__file__).resolve().parent / "catalog-sources.json"
DEFAULT_OUTPUT = Path(__file__).resolve().parent / "results" / "tsw-costs.csv"
PRICE_RE = re.compile(r"\$\s*([0-9,]+(?:\.[0-9]+)?)")
FIELDNAMES = [
    "source_name",
    "brand",
    "sku",
    "product_name",
    "manufacturer",
    "supplier_cost",
    "currency",
    "price_display",
    "price_unit",
    "product_description",
    "product_description_html",
    "product_url",
    "image_url",
    "source_catalog_page",
    "scraped_at_utc",
]


class ScrapeError(RuntimeError):
    pass


@dataclass(frozen=True)
class Brand:
    source_name: str
    name: str
    url: str
    exclude_name_contains: tuple[str, ...] = ()


@dataclass(frozen=True)
class ProductRef:
    listing_sku: str
    url: str
    image_url: str
    source_catalog_page: int


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--login", action="store_true", help="open TSW login and save a local browser session")
    parser.add_argument("--brands-file", type=Path, default=DEFAULT_SOURCES, help="JSON catalog source configuration")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--profile-dir", type=Path, default=DEFAULT_PROFILE)
    parser.add_argument("--headed", action="store_true", help="show Chromium during scraping")
    parser.add_argument("--delay-seconds", type=float, default=0.5, help="pause between individual product requests")
    parser.add_argument("--timeout-seconds", type=float, default=30.0)
    parser.add_argument("--allow-missing-prices", action="store_true")
    args = parser.parse_args()
    if args.delay_seconds < 0 or args.timeout_seconds <= 0:
        parser.error("timeouts must be positive and delay must not be negative")
    return args


def load_brands(path: Path) -> list[Brand]:
    try:
        raw = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise ScrapeError(f"Cannot read brands file {path}: {exc}") from exc
    if isinstance(raw, dict):
        raw = [
            {"source_name": name, "brand": name, "url": url}
            for name, url in raw.items()
        ]
    if not isinstance(raw, list) or not raw:
        raise ScrapeError("Brands file must be a nonempty JSON array of catalog source objects")
    brands: list[Brand] = []
    source_names: set[str] = set()
    for entry in raw:
        if not isinstance(entry, dict):
            raise ScrapeError("Every catalog source must be a JSON object")
        source_name = entry.get("source_name")
        name = entry.get("brand")
        url = entry.get("url")
        exclusions = entry.get("exclude_name_contains", [])
        if not all(isinstance(value, str) and value.strip() for value in (source_name, name, url)):
            raise ScrapeError("Every source requires nonempty source_name, brand, and url strings")
        if not isinstance(exclusions, list) or not all(isinstance(value, str) and value for value in exclusions):
            raise ScrapeError("exclude_name_contains must be an array of nonempty strings")
        source_key = source_name.strip().casefold()
        if source_key in source_names:
            raise ScrapeError(f"Duplicate source_name in brands file: {source_name}")
        source_names.add(source_key)
        parsed = urlparse(url)
        if parsed.scheme != "https" or parsed.netloc.lower() not in {"tswfast.com", "www.tswfast.com"}:
            raise ScrapeError(f"Brand URL is not an HTTPS tswfast.com URL: {url}")
        if not parsed.path.startswith("/category/"):
            raise ScrapeError(f"Brand URL is not a TSW category page: {url}")
        brands.append(
            Brand(
                source_name=source_name.strip(),
                name=name.strip(),
                url=url,
                exclude_name_contains=tuple(exclusions),
            )
        )
    return brands


def is_logged_in(page: Page) -> bool:
    return bool(
        page.evaluate(
            """() => {
                if (window.kd?.customer?.isLoggedIn === true) return true;
                const logout = [...document.querySelectorAll('a')].some(link => {
                    const href = (link.getAttribute('href') || '').toLowerCase();
                    const text = (link.textContent || '').trim().toLowerCase();
                    return href.includes('/logout') || text === 'logout';
                });
                const accountNavigation = document.querySelector(
                    'a[href*="/account/orders"], a[href*="/account/open-invoices"], a[href*="/account/my-lists"]'
                );
                return logout && Boolean(accountNavigation);
            }"""
        )
    )


def login(page: Page, timeout_ms: int) -> None:
    page.goto(f"{BASE_URL}/spcu/login", wait_until="domcontentloaded", timeout=timeout_ms)
    print("Sign in to TSW in the opened browser. Waiting for the authenticated session ...")
    deadline = time.monotonic() + max(timeout_ms / 1000, 300)
    while time.monotonic() < deadline:
        try:
            if is_logged_in(page):
                print("Authenticated TSW session saved in the local browser profile.")
                return
        except Exception:
            pass
        page.wait_for_timeout(1000)
    raise ScrapeError("Timed out waiting for TSW login")


def with_page(url: str, page_number: int) -> str:
    parsed = urlparse(url)
    query = dict(parse_qsl(parsed.query, keep_blank_values=True))
    query["from"] = str(page_number)
    return urlunparse(parsed._replace(query=urlencode(query)))


def wait_for_product_price(page: Page, timeout_ms: int) -> None:
    page.wait_for_selector(".cv-info .cp-price", timeout=timeout_ms)
    try:
        page.wait_for_function(
            """() => {
                const el = document.querySelector('.cv-info .cp-price');
                return el && !el.classList.contains('cp-price--loading') &&
                    (el.textContent || '').trim().length > 0 &&
                    !/calculating price/i.test(el.textContent || '');
            }""",
            timeout=timeout_ms,
        )
    except PlaywrightTimeoutError as exc:
        raise ScrapeError(f"Timed out waiting for the product price on {page.url}") from exc


def page_count(page: Page) -> int:
    locator = page.locator("#page")
    if not locator.count():
        return 1
    value = locator.first.get_attribute("max") or "1"
    try:
        count = int(value)
    except ValueError as exc:
        raise ScrapeError(f"Invalid page count {value!r} on {page.url}") from exc
    if count < 1 or count > 10_000:
        raise ScrapeError(f"Unsafe page count {count} on {page.url}")
    return count


def normalize_price(display: str) -> tuple[str, str, str]:
    text = " ".join(display.split())
    match = PRICE_RE.search(text)
    if not match:
        return "", "", ""
    try:
        amount = Decimal(match.group(1).replace(",", ""))
    except InvalidOperation:
        return "", "", ""
    unit_match = re.search(r"\bEACH\b(?:\s+of\s+\d+)?|\b(?:BOX|CASE|PACK|PAIR|SET)\b(?:\s+of\s+\d+)?", text, re.I)
    return format(amount, "f"), "USD", unit_match.group(0) if unit_match else ""


def discover_product_refs(page: Page, page_number: int) -> list[ProductRef]:
    raw = page.locator(".cp-product").evaluate_all(
        """els => els.map(el => {
            const link = el.querySelector('.cp-name');
            const image = el.querySelector('.cvg-img img');
            return {
                sku: (el.dataset.code || '').trim(),
                href: link?.getAttribute('href') || '',
                image: image?.getAttribute('src') || ''
            };
        })"""
    )
    refs: list[ProductRef] = []
    for item in raw:
        sku = str(item.get("sku", "")).strip()
        product_url = urljoin(BASE_URL, str(item.get("href", "")))
        if not sku or not urlparse(product_url).path.startswith("/product/"):
            raise ScrapeError(f"Product listing missing SKU or detail URL on {page.url}")
        refs.append(
            ProductRef(
                listing_sku=sku,
                url=product_url,
                image_url=urljoin(BASE_URL, str(item.get("image", ""))),
                source_catalog_page=page_number,
            )
        )
    if not refs:
        raise ScrapeError(f"No products found on {page.url}")
    return refs


def scrape_product_detail(
    page: Page, brand: Brand, product: ProductRef, timeout_ms: int, scraped_at: str
) -> dict[str, str]:
    page.goto(product.url, wait_until="domcontentloaded", timeout=timeout_ms)
    if not page.locator(".cv-info").count():
        fallback_url = f"{BASE_URL}/product/{product.listing_sku}"
        print(f"    supplier detail URL did not render; retrying stable SKU route {fallback_url}")
        page.goto(fallback_url, wait_until="domcontentloaded", timeout=timeout_ms)
    if not is_logged_in(page):
        raise ScrapeError(f"TSW session is not authenticated while loading {product.url}")
    page.wait_for_selector(".cv-info .cp-name", timeout=timeout_ms)
    wait_for_product_price(page, timeout_ms)
    detail = page.evaluate(
        """() => {
            const clean = value => (value || '').replace(/\s+/g, ' ').trim();
            const attributes = {};
            document.querySelectorAll('.cv-info .cv-attribute').forEach(el => {
                const spans = [...el.querySelectorAll(':scope > span')];
                if (spans.length >= 2) attributes[clean(spans[0].textContent).toUpperCase()] = clean(spans[1].textContent);
            });
            const description = document.querySelector('#product-description');
            const selectedUnit = document.querySelector('.cv-info .cp-units option:checked');
            const image = document.querySelector('.cv-images img, .cv-image img, .product-images img');
            return {
                name: clean(document.querySelector('.cv-info .cp-name')?.textContent),
                part: attributes.PART || '',
                manufacturer: attributes.MANUFACTURER || '',
                price: clean(document.querySelector('.cv-info .cp-price')?.textContent),
                unit: clean(selectedUnit?.textContent || selectedUnit?.value),
                description: description ? description.innerText.trim() : '',
                descriptionHtml: description ? description.innerHTML.trim() : '',
                image: image?.getAttribute('src') || ''
            };
        }"""
    )
    sku = str(detail.get("part", "")).strip()
    name = " ".join(str(detail.get("name", "")).split())
    if not sku or not name:
        raise ScrapeError(f"Product detail page missing PART or name: {product.url}")
    if sku.casefold() != product.listing_sku.casefold():
        raise ScrapeError(
            f"Listing/detail part mismatch on {product.url}: {product.listing_sku!r} != {sku!r}"
        )
    display = " ".join(str(detail.get("price", "")).split())
    amount, currency, inferred_unit = normalize_price(display)
    return {
        "source_name": brand.source_name,
        "brand": brand.name,
        "sku": sku,
        "product_name": name,
        "manufacturer": " ".join(str(detail.get("manufacturer", "")).split()),
        "supplier_cost": amount,
        "currency": currency,
        "price_display": display,
        "price_unit": str(detail.get("unit", "")).strip() or inferred_unit,
        "product_description": str(detail.get("description", "")).strip(),
        "product_description_html": str(detail.get("descriptionHtml", "")).strip(),
        "product_url": page.url,
        "image_url": (
            urljoin(BASE_URL, str(detail.get("image", "")))
            if str(detail.get("image", "")).strip()
            else product.image_url
        ),
        "source_catalog_page": str(product.source_catalog_page),
        "scraped_at_utc": scraped_at,
    }


def checkpoint_key(source_name: str, sku: str) -> str:
    return f"{source_name.casefold()}\0{sku.casefold()}"


def checkpoint_path(output: Path) -> Path:
    return output.with_name(output.name + ".checkpoint.json")


def config_fingerprint(path: Path) -> str:
    try:
        return hashlib.sha256(path.read_bytes()).hexdigest()
    except OSError as exc:
        raise ScrapeError(f"Cannot fingerprint catalog source configuration {path}: {exc}") from exc


def load_checkpoint(path: Path, fingerprint: str) -> dict[str, dict[str, object]]:
    if not path.exists():
        return {}
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise ScrapeError(f"Cannot read progress checkpoint {path}: {exc}") from exc
    if not isinstance(payload, dict):
        raise ScrapeError(f"Progress checkpoint {path} must contain a JSON object")
    if payload.get("schema_version") != 1 or payload.get("config_sha256") != fingerprint:
        raise ScrapeError(
            f"Progress checkpoint {path} does not match the current source configuration; "
            "move it aside before starting a new catalog definition"
        )
    records = payload.get("records")
    if not isinstance(records, dict):
        raise ScrapeError(f"Progress checkpoint {path} has an invalid records object")
    print(f"Resuming from {path}: {len(records)} completed product(s)")
    return records


def write_checkpoint_atomic(
    path: Path, fingerprint: str, records: dict[str, dict[str, object]]
) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    handle = tempfile.NamedTemporaryFile(
        mode="w", encoding="utf-8", newline="\n", delete=False,
        dir=path.parent, prefix=path.name + ".", suffix=".tmp"
    )
    temp_path = Path(handle.name)
    try:
        with handle:
            json.dump(
                {"schema_version": 1, "config_sha256": fingerprint, "records": records},
                handle, ensure_ascii=False, indent=2, sort_keys=True,
            )
            handle.write("\n")
        os.replace(temp_path, path)
    except Exception:
        temp_path.unlink(missing_ok=True)
        raise


def included_checkpoint_rows(progress: dict[str, dict[str, object]]) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    for key, record in progress.items():
        if record.get("status") != "included":
            continue
        row = record.get("row")
        if not isinstance(row, dict) or any(field not in row for field in FIELDNAMES):
            raise ScrapeError(f"Checkpoint contains an invalid included row for {key}")
        rows.append({field: str(row[field]) for field in FIELDNAMES})
    rows.sort(
        key=lambda row: (
            row["source_name"].casefold(),
            row["brand"].casefold(),
            row["sku"].casefold(),
        )
    )
    return rows


def scrape_brand(
    page: Page,
    brand: Brand,
    timeout_ms: int,
    delay: float,
    progress: dict[str, dict[str, object]],
    save_progress,
) -> list[dict[str, str]]:
    scraped_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
    refs: list[ProductRef] = []
    total_pages: int | None = None
    page_number = 1
    while total_pages is None or page_number <= total_pages:
        url = with_page(brand.url, page_number)
        page.goto(url, wait_until="domcontentloaded", timeout=timeout_ms)
        if not is_logged_in(page):
            raise ScrapeError(f"TSW session is not authenticated while loading {brand.name}")
        page.wait_for_selector(".cp-product", timeout=timeout_ms)
        observed_pages = page_count(page)
        if total_pages is None:
            total_pages = observed_pages
            print(f"{brand.name}: {total_pages} page(s)")
        elif observed_pages != total_pages:
            raise ScrapeError(f"Page count changed for {brand.name}: {total_pages} to {observed_pages}")
        page_refs = discover_product_refs(page, page_number)
        refs.extend(page_refs)
        print(f"  catalog page {page_number}/{total_pages}: discovered {len(page_refs)} products")
        page_number += 1
    duplicate_urls = len(refs) - len({ref.url for ref in refs})
    if duplicate_urls:
        raise ScrapeError(f"{brand.name} catalog contains {duplicate_urls} duplicate product URLs")
    print(f"{brand.name}: opening {len(refs)} individual product pages")
    rows: list[dict[str, str]] = []
    excluded = 0
    for index, product in enumerate(refs, start=1):
        key = checkpoint_key(brand.source_name, product.listing_sku)
        completed = progress.get(key)
        if completed:
            if completed.get("status") == "included" and isinstance(completed.get("row"), dict):
                rows.append(completed["row"])
            elif completed.get("status") == "excluded":
                excluded += 1
            else:
                raise ScrapeError(f"Invalid checkpoint record for {brand.source_name}:{product.listing_sku}")
            print(f"  product {index}/{len(refs)}: resumed {product.listing_sku}")
            continue
        row = scrape_product_detail(page, brand, product, timeout_ms, scraped_at)
        folded_name = row["product_name"].casefold()
        matched = next((term for term in brand.exclude_name_contains if term.casefold() in folded_name), None)
        if matched is not None:
            excluded += 1
            progress[key] = {"status": "excluded", "product_name": row["product_name"]}
            print(f"  product {index}/{len(refs)}: excluded {row['sku']} - {row['product_name']} (contains {matched!r})")
        else:
            rows.append(row)
            progress[key] = {"status": "included", "row": row}
            print(f"  product {index}/{len(refs)}: {row['sku']} - {row['product_name']}")
        save_progress()
        if index < len(refs) and delay:
            page.wait_for_timeout(round(delay * 1000))
    if excluded:
        print(f"{brand.source_name}: excluded {excluded} product(s) by name")
    return rows


def validate_rows(rows: list[dict[str, str]], allow_missing: bool) -> None:
    seen: dict[str, dict[str, str]] = {}
    conflicts: list[str] = []
    missing: list[str] = []
    for row in rows:
        key = f"{row['source_name'].casefold()}\0{row['sku'].casefold()}"
        if key in seen:
            prior = seen[key]
            if prior["product_name"] != row["product_name"] or prior["price_display"] != row["price_display"]:
                conflicts.append(f"{row['source_name']}:{row['sku']}")
            else:
                conflicts.append(f"{row['source_name']}:{row['sku']} (duplicate)")
        seen[key] = row
        display = row["price_display"].casefold()
        if not row["supplier_cost"] and "call" not in display:
            missing.append(row["sku"])
    if conflicts:
        raise ScrapeError(f"Duplicate/conflicting SKUs found: {', '.join(conflicts[:20])}")
    if missing and not allow_missing:
        raise ScrapeError(
            f"{len(missing)} products have no numeric or call-for-price result: " + ", ".join(missing[:20])
        )
    if missing:
        print(f"WARNING: exporting {len(missing)} products with unresolved prices", file=sys.stderr)


def write_csv_atomic(path: Path, rows: list[dict[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    handle = tempfile.NamedTemporaryFile(
        mode="w", encoding="utf-8-sig", newline="", delete=False, dir=path.parent, prefix=path.name + ".", suffix=".tmp"
    )
    temp_path = Path(handle.name)
    try:
        with handle:
            writer = csv.DictWriter(handle, fieldnames=FIELDNAMES, lineterminator="\r\n")
            writer.writeheader()
            writer.writerows(
                {
                    field: re.sub(r"[\r\n]+", " ", str(row.get(field, ""))).strip()
                    for field in FIELDNAMES
                }
                for row in rows
            )
        os.replace(temp_path, path)
    except Exception:
        temp_path.unlink(missing_ok=True)
        raise


def main() -> int:
    args = parse_args()
    timeout_ms = round(args.timeout_seconds * 1000)
    try:
        with sync_playwright() as playwright:
            context = playwright.chromium.launch_persistent_context(
                str(args.profile_dir.resolve()),
                headless=False if args.login else not args.headed,
                viewport={"width": 1440, "height": 1000},
            )
            try:
                page = context.pages[0] if context.pages else context.new_page()
                page.set_default_timeout(timeout_ms)
                if args.login:
                    login(page, timeout_ms)
                    return 0
                brands = load_brands(args.brands_file)
                output_path = args.output.resolve()
                progress_path = checkpoint_path(output_path)
                fingerprint = config_fingerprint(args.brands_file.resolve())
                progress = load_checkpoint(progress_path, fingerprint)
                def save_progress() -> None:
                    write_checkpoint_atomic(progress_path, fingerprint, progress)
                    live_rows = included_checkpoint_rows(progress)
                    write_csv_atomic(output_path, live_rows)

                if progress:
                    write_csv_atomic(output_path, included_checkpoint_rows(progress))
                rows: list[dict[str, str]] = []
                for brand in brands:
                    rows.extend(
                        scrape_brand(
                            page, brand, timeout_ms, args.delay_seconds, progress, save_progress
                        )
                    )
                validate_rows(rows, args.allow_missing_prices)
                rows.sort(
                    key=lambda row: (
                        row["source_name"].casefold(),
                        row["brand"].casefold(),
                        row["sku"].casefold(),
                    )
                )
                write_csv_atomic(output_path, rows)
                progress_path.unlink(missing_ok=True)
                call_count = sum("call" in row["price_display"].casefold() for row in rows)
                print(f"Wrote {len(rows)} products to {output_path} ({call_count} call-for-price)")
                return 0
            finally:
                context.close()
    except (ScrapeError, PlaywrightTimeoutError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
