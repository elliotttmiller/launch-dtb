#!/usr/bin/env python3
"""Fast, resumable competitor catalog scraper for Drywall Toolbox.

Scope:
- audit each competitor's public catalog endpoints;
- use All-Wall SuiteCommerce catalog JSON first, product pages only for missing fields;
- use sitemap-driven structured page extraction for Al's Taping Tools and Wall Tools;
- enforce competitor-specific identifier semantics before accepting records;
- write exactly five business fields to per-site and combined CSV files;
- preserve compact internal state only for resume, diagnostics, and provenance.

This script performs no DTB catalog matching, price recommendation, or commerce
mutation. It is read-only against competitor storefronts.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import gzip
import logging
import threading
import re
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from contextlib import contextmanager
import xml.etree.ElementTree as ET
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable
from urllib.parse import urljoin, urlparse, urlunparse
from urllib.robotparser import RobotFileParser

try:
    import cloudscraper
except ImportError:  # handled with a clear runtime error in _session()
    cloudscraper = None  # type: ignore[assignment]

import requests
from bs4 import BeautifulSoup

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 "
    "DTB-CompetitorCatalogScraper/6.0"
)
DEFAULT_OUTPUT_DIR = Path("reports/competitor-catalog")
DEFAULT_WORKERS = 12
DEFAULT_PER_HOST = 6
DEFAULT_TIMEOUT = 20.0
DEFAULT_RETRIES = 2
DEFAULT_REQUEST_INTERVAL = 0.15
MAX_SITEMAPS = 200
MAX_URLS = 100_000
RETRYABLE_STATUS = {403, 408, 425, 429, 500, 502, 503, 504}

PRODUCT_HINTS = (
    "/products/",
    "/product/",
    "/p/",
    "product",
)
NON_PRODUCT_HINTS = (
    "/blog/",
    "/blogs/",
    "/pages/",
    "/page/",
    "/categories/",
    "/category/",
    "/brands/",
    "/brand/",
    "/collections/",
    "/customer/",
    "/checkout/",
    "/cart/",
    "/search",
    "/account",
    "/login",
)


@dataclass(frozen=True)
class SiteConfig:
    key: str
    name: str
    base_url: str
    sitemap_candidates: tuple[str, ...]
    identifier_strategy: str
    sku_prefixes_to_strip: tuple[str, ...] = ()
    product_path_hints: tuple[str, ...] = ()
    exclude_path_hints: tuple[str, ...] = NON_PRODUCT_HINTS

    @property
    def allowed_hosts(self) -> set[str]:
        host = (urlparse(self.base_url).hostname or "").lower()
        if host.startswith("www."):
            return {host, host[4:]}
        return {host, f"www.{host}"}


SITES: dict[str, SiteConfig] = {
    "als_taping_tools": SiteConfig(
        key="als_taping_tools",
        name="Al's Taping Tools",
        base_url="https://www.alstapingtools.com/",
        sitemap_candidates=("/xmlsitemap.php", "/sitemap.xml"),
        identifier_strategy="sku_exact",
    ),
    "wall_tools": SiteConfig(
        key="wall_tools",
        name="Wall Tools",
        base_url="https://walltools.com/",
        sitemap_candidates=("/xmlsitemap.php", "/sitemap.xml"),
        identifier_strategy="sku_strip_prefix",
        sku_prefixes_to_strip=("LEV5-", "DURA-", "SURP-", "TAPE-", "COLM-"),
    ),
    "all_wall": SiteConfig(
        key="all_wall",
        name="All-Wall",
        base_url="https://www.all-wall.com/",
        sitemap_candidates=("/sitemap.xml", "/sitemap_index.xml"),
        identifier_strategy="mpn",
        # All-Wall currently serves product pages as root-level slugs, so do not
        # require a product path token here.
    ),
}


@dataclass
class ProductRecord:
    competitor: str
    competitor_name: str
    url: str
    canonical_url: str
    title: str = ""
    brand: str = ""
    sku: str = ""
    description: str = ""
    mpn: str = ""
    gtin: str = ""
    price: str = ""
    regular_price: str = ""
    sale_price: str = ""
    currency: str = ""
    availability: str = ""
    category: str = ""
    image_url: str = ""
    parse_method: str = ""
    retrieved_at: str = ""
    source_hash: str = ""


class HostGate:
    """Bounded per-host concurrency plus minimum spacing between request starts."""

    def __init__(self, per_host: int, interval: float) -> None:
        self.per_host = max(1, per_host)
        self.interval = max(0.0, interval)
        self._lock = threading.Lock()
        self._semaphores: dict[str, threading.BoundedSemaphore] = {}
        self._host_locks: dict[str, threading.Lock] = {}
        self._last_start: dict[str, float] = {}

    def _objects(self, host: str) -> tuple[threading.BoundedSemaphore, threading.Lock]:
        with self._lock:
            semaphore = self._semaphores.setdefault(host, threading.BoundedSemaphore(self.per_host))
            host_lock = self._host_locks.setdefault(host, threading.Lock())
        return semaphore, host_lock

    @contextmanager
    def slot(self, url: str):
        host = (urlparse(url).hostname or "").lower()
        semaphore, host_lock = self._objects(host)
        semaphore.acquire()
        try:
            with host_lock:
                previous = self._last_start.get(host)
                if previous is not None:
                    remaining = self.interval - (time.monotonic() - previous)
                    if remaining > 0:
                        time.sleep(remaining)
                self._last_start[host] = time.monotonic()
            yield
        finally:
            semaphore.release()


class Scraper:
    """Single-site scraper using one persistent cloudscraper session per worker thread."""

    def __init__(
        self,
        site: SiteConfig,
        output_dir: Path,
        workers: int,
        per_host: int,
        timeout: float,
        retries: int,
        request_interval: float,
        respect_robots: bool,
        max_urls: int,
        verbose: bool,
    ) -> None:
        self.site = site
        self.site_dir = output_dir / site.key
        self.site_dir.mkdir(parents=True, exist_ok=True)
        self.urls_path = self.site_dir / "urls.jsonl"
        self.products_path = self.site_dir / "products.jsonl"
        self.failures_path = self.site_dir / "failures.jsonl"
        self.endpoint_audit_path = self.site_dir / "endpoint_audit.json"
        self.workers = max(1, workers)
        self.retries = max(0, retries)
        self.respect_robots = respect_robots
        self.max_urls = max(1, max_urls)
        self.timeout = max(1.0, timeout)
        self.gate = HostGate(per_host=per_host, interval=request_interval)
        self.completed_urls = self._load_completed_urls()
        self.endpoint_audit: dict[str, Any] = {}
        self.robots: RobotFileParser | None = None
        self.verbose = verbose
        self._thread_local = threading.local()
        self._write_lock = threading.Lock()

    def _load_completed_urls(self) -> set[str]:
        completed: set[str] = set()
        if not self.products_path.exists():
            return completed
        with self.products_path.open("r", encoding="utf-8") as handle:
            for line in handle:
                line = line.strip()
                if not line:
                    continue
                try:
                    row = json.loads(line)
                except json.JSONDecodeError:
                    continue
                url = str(row.get("canonical_url") or row.get("url") or "").strip()
                has_price = any(str(row.get(field) or "").strip() for field in ("price", "regular_price", "sale_price"))
                has_identifier = bool(output_identifier(self.site.key, row))
                has_title = bool(str(row.get("title") or "").strip())
                if url and has_price and has_identifier and has_title:
                    completed.add(canonicalize_url(url))
        return completed

    def _session(self):
        if cloudscraper is None:
            raise RuntimeError("cloudscraper is not installed. Run: python -m pip install -r requirements.txt")
        session = getattr(self._thread_local, "session", None)
        if session is None:
            session = cloudscraper.create_scraper(
                browser={"browser": "chrome", "platform": "windows", "mobile": False},
                delay=10,
            )
            session.headers.update(
                {
                    "User-Agent": USER_AGENT,
                    "Accept-Language": "en-US,en;q=0.9",
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                    "Cache-Control": "no-cache",
                }
            )
            self._thread_local.session = session
        return session

    def _get(self, url: str, *, accept: str | None = None) -> requests.Response:
        last_error: Exception | None = None
        for attempt in range(self.retries + 1):
            try:
                headers = {"Accept": accept} if accept else None
                with self.gate.slot(url):
                    response = self._session().get(
                        url,
                        headers=headers,
                        timeout=self.timeout,
                        allow_redirects=True,
                    )
                status = response.status_code
                if status >= 400:
                    if status in RETRYABLE_STATUS and attempt < self.retries:
                        delay = min(20.0, 2.0**attempt)
                        retry_after = response.headers.get("Retry-After")
                        if retry_after:
                            try:
                                delay = min(60.0, float(retry_after))
                            except ValueError:
                                pass
                        time.sleep(delay)
                        continue
                    response.raise_for_status()
                return response
            except (requests.Timeout, requests.ConnectionError, requests.HTTPError) as exc:
                last_error = exc
                if isinstance(exc, requests.HTTPError) and exc.response is not None:
                    if exc.response.status_code not in RETRYABLE_STATUS:
                        raise
                if attempt >= self.retries:
                    raise
                time.sleep(min(20.0, 2.0**attempt))
        raise RuntimeError(f"request failed: {url}: {last_error}")

    def _audit_probe(self, label: str, url: str, *, accept: str | None = None) -> dict[str, Any]:
        row: dict[str, Any] = {"label": label, "url": url, "checked_at": utc_now()}
        try:
            response = self._get(url, accept=accept)
            text = response.text[:250000]
            row.update({
                "status": response.status_code,
                "final_url": response.url,
                "content_type": response.headers.get("Content-Type", ""),
                "content_length": len(response.content),
                "server": response.headers.get("Server", ""),
                "platform_signals": detect_platform_signals(text, response.headers),
                "usable_json": is_json_response(response),
                "sha256": hashlib.sha256(response.content).hexdigest(),
            })
        except Exception as exc:
            row.update({"status": 0, "error": f"{type(exc).__name__}: {exc}"})
        return row

    def audit_site_endpoints(self) -> dict[str, Any]:
        probes: list[dict[str, Any]] = []
        probes.append(self._audit_probe("homepage", self.site.base_url))
        probes.append(self._audit_probe("robots", urljoin(self.site.base_url, "/robots.txt"), accept="text/plain,*/*;q=0.8"))
        for candidate in self.site.sitemap_candidates:
            probes.append(self._audit_probe(f"sitemap:{candidate}", urljoin(self.site.base_url, candidate), accept="application/xml,text/xml,*/*;q=0.8"))

        if self.site.key in {"als_taping_tools", "wall_tools"}:
            # BigCommerce storefronts often expose these routes. They are probes only;
            # no private token or authenticated API is assumed.
            probes.append(self._audit_probe("bigcommerce_graphql", urljoin(self.site.base_url, "/graphql"), accept="application/json,*/*;q=0.8"))
            probes.append(self._audit_probe("bigcommerce_storefront_products", urljoin(self.site.base_url, "/api/storefront/products"), accept="application/json,*/*;q=0.8"))
        elif self.site.key == "all_wall":
            probes.append(self._audit_probe("suitecommerce_items", urljoin(self.site.base_url, "/api/items?limit=1&offset=0"), accept="application/json,*/*;q=0.8"))
            probes.append(self._audit_probe("suitecommerce_cacheable_items", urljoin(self.site.base_url, "/api/cacheable/items?limit=1&offset=0"), accept="application/json,*/*;q=0.8"))

        detected = sorted({signal for probe in probes for signal in probe.get("platform_signals", [])})
        audit = {
            "competitor": self.site.key,
            "competitor_name": self.site.name,
            "base_url": self.site.base_url,
            "audited_at": utc_now(),
            "identifier_strategy": self.site.identifier_strategy,
            "verified_sku_prefixes_to_strip": list(self.site.sku_prefixes_to_strip),
            "preferred_catalog_strategy": "suitecommerce_item_search_api_then_selective_page_enrichment" if self.site.key == "all_wall" else "sitemap_discovery_then_structured_product_page_extraction",
            "detected_platform_signals": detected,
            "probes": probes,
        }
        self.endpoint_audit = audit
        self.endpoint_audit_path.write_text(json.dumps(audit, indent=2, ensure_ascii=False), encoding="utf-8")
        logging.info("%s endpoint audit written to %s", self.site.key, self.endpoint_audit_path)
        return audit

    def audit_product_samples(self, urls: list[str], limit: int = 3) -> None:
        if not urls:
            return
        probes = self.endpoint_audit.setdefault("probes", [])
        for idx, url in enumerate(urls[:max(0, limit)], start=1):
            probes.append(self._audit_probe(f"product_sample_{idx}", url))
        self.endpoint_audit["audited_at"] = utc_now()
        self.endpoint_audit_path.write_text(json.dumps(self.endpoint_audit, indent=2, ensure_ascii=False), encoding="utf-8")

    def _all_wall_api_endpoint(self) -> str | None:
        if self.site.key != "all_wall":
            return None
        for preferred in ("suitecommerce_cacheable_items", "suitecommerce_items"):
            for probe in self.endpoint_audit.get("probes", []):
                if probe.get("label") == preferred and probe.get("status") == 200 and probe.get("usable_json"):
                    return str(probe.get("final_url") or probe.get("url")).split("?", 1)[0]
        return None

    def _enrich_all_wall_identifier(self, record: ProductRecord) -> ProductRecord:
        """Fetch a product page only when the SuiteCommerce API omitted All-Wall's MPN."""
        if record.mpn or not record.url or record.url == self._all_wall_api_endpoint():
            return record
        try:
            response = self._get(record.url)
            page = extract_product_record(self.site, str(response.url), response.text)
        except Exception as exc:
            if self.verbose:
                logging.debug("all_wall MPN enrichment failed %s: %s", record.url, exc)
            return record
        record.mpn = record.mpn or page.mpn
        record.brand = record.brand or page.brand
        record.description = record.description or page.description
        record.title = record.title or page.title
        record.price = record.price or page.price
        record.regular_price = record.regular_price or page.regular_price
        record.sale_price = record.sale_price or page.sale_price
        if page.source_hash:
            record.source_hash = page.source_hash
        if record.mpn:
            record.parse_method = "suitecommerce_api+selective_product_page_enrichment"
        return record

    def scrape_all_wall_api(self) -> dict[str, int] | None:
        endpoint = self._all_wall_api_endpoint()
        if not endpoint:
            return None
        logging.info("all_wall using SuiteCommerce Item Search API: %s", endpoint)
        offset = 0
        limit = 100
        saved = failed = discovered = 0
        seen_urls: set[str] = set()
        while discovered < self.max_urls:
            # Request the richer details field set first so MPN/description fields can be
            # returned in bulk. If this account rejects that fieldset, fall back cleanly.
            detail_url = f"{endpoint}?fieldset=details&limit={limit}&offset={offset}"
            plain_url = f"{endpoint}?limit={limit}&offset={offset}"
            try:
                try:
                    response = self._get(detail_url, accept="application/json,*/*;q=0.8")
                    payload = response.json()
                except Exception:
                    response = self._get(plain_url, accept="application/json,*/*;q=0.8")
                    payload = response.json()
            except Exception as exc:
                logging.warning("all_wall API page failed at offset %d: %s", offset, exc)
                failed += 1
                break
            items = payload.get("items") if isinstance(payload, dict) else None
            if not isinstance(items, list) or not items:
                break

            page_records: list[ProductRecord] = []
            for item in items:
                if not isinstance(item, dict):
                    continue
                record = record_from_suitecommerce_item(self.site, endpoint, item)
                if record.title:
                    page_records.append(record)

            # Only products whose bulk API record omitted MPN pay the cost of a page fetch.
            needs_enrichment = [r for r in page_records if (not r.mpn or not r.description or not r.brand) and r.url != endpoint]
            if needs_enrichment:
                with ThreadPoolExecutor(max_workers=min(self.workers, len(needs_enrichment))) as executor:
                    future_map = {executor.submit(self._enrich_all_wall_identifier, r): r for r in needs_enrichment}
                    for future in as_completed(future_map):
                        try:
                            future.result()
                        except Exception as exc:
                            if self.verbose:
                                logging.debug("all_wall enrichment worker failed: %s", exc)

            for record in page_records:
                discovered += 1
                if record.canonical_url in seen_urls:
                    continue
                seen_urls.add(record.canonical_url)
                has_price = bool(record.price or record.regular_price or record.sale_price)
                if not record.mpn:
                    self._write_failure(record.url, "no_mpn", "All-Wall product has no extractable manufacturer part number (MPN)", 1)
                    failed += 1
                elif has_price:
                    with self._write_lock:
                        append_jsonl(self.products_path, asdict(record))
                        self.completed_urls.add(record.canonical_url)
                    saved += 1
                else:
                    self._write_failure(record.url, "no_price", "SuiteCommerce item returned without a public price", 1)
                    failed += 1
                if discovered >= self.max_urls:
                    break
            total = payload.get("total") if isinstance(payload, dict) else None
            offset += len(items)
            if len(items) < limit or (isinstance(total, int) and offset >= total):
                break
        write_url_inventory(self.urls_path, self.site, sorted(seen_urls), self.completed_urls, source="suitecommerce_item_search_api")
        return {"discovered": discovered, "pending": discovered, "saved": saved, "failed": failed, "skipped": 0}

    def load_robots(self) -> list[str]:
        robots_url = urljoin(self.site.base_url, "/robots.txt")
        try:
            response = self._get(robots_url, accept="text/plain,*/*;q=0.8")
        except Exception as exc:
            logging.warning("%s robots unavailable: %s", self.site.key, exc)
            return []

        parser = RobotFileParser()
        parser.set_url(robots_url)
        parser.parse(response.text.splitlines())
        self.robots = parser

        sitemap_urls: list[str] = []
        for line in response.text.splitlines():
            if line.lower().startswith("sitemap:"):
                candidate = line.split(":", 1)[1].strip()
                if candidate and is_allowed_url(candidate, self.site):
                    sitemap_urls.append(candidate)
        return dedupe_request_urls(sitemap_urls)

    def robots_allowed(self, url: str) -> bool:
        if not self.respect_robots or self.robots is None:
            return True
        return self.robots.can_fetch(USER_AGENT, url)

    def discover_urls(self) -> list[str]:
        advertised = self.load_robots()
        candidates = advertised + [urljoin(self.site.base_url, path) for path in self.site.sitemap_candidates]
        candidates = dedupe_request_urls(candidates)

        seen_sitemaps: set[str] = set()
        product_urls: set[str] = set()
        queue = list(candidates)
        broad_urlsets: list[list[str]] = []

        while queue and len(seen_sitemaps) < MAX_SITEMAPS and len(product_urls) < self.max_urls:
            sitemap_url = normalize_request_url(queue.pop(0))
            sitemap_key = sitemap_url
            if sitemap_key in seen_sitemaps or not is_allowed_sitemap_url(sitemap_url, self.site):
                continue
            seen_sitemaps.add(sitemap_key)
            try:
                response = self._get(sitemap_url, accept="application/xml,text/xml,application/gzip,*/*;q=0.8")
                content = response.content
                if sitemap_url.lower().endswith(".gz") or "gzip" in (response.headers.get("Content-Type") or "").lower():
                    content = gzip.decompress(content)
                root = ET.fromstring(content)
            except Exception as exc:
                logging.info("%s sitemap rejected %s: %s", self.site.key, sitemap_url, exc)
                continue

            tag = strip_ns(root.tag)
            locs = [
                (node.text or "").strip()
                for node in root.iter()
                if strip_ns(node.tag) == "loc" and (node.text or "").strip()
            ]
            if tag == "sitemapindex":
                for loc in locs:
                    if is_allowed_sitemap_url(loc, self.site):
                        queue.append(loc)
                continue
            if tag != "urlset":
                continue

            broad_urlsets.append(locs)
            for loc in locs:
                if len(product_urls) >= self.max_urls:
                    break
                if is_product_candidate(loc, self.site):
                    product_urls.add(canonicalize_url(loc))

        # Some storefronts use flat product slugs and broad sitemaps. If strict
        # filtering yields nothing, retain safe same-domain, non-obvious-content URLs.
        if not product_urls:
            for locs in broad_urlsets:
                for loc in locs:
                    canonical = canonicalize_url(loc)
                    if is_allowed_url(canonical, self.site) and not has_excluded_hint(canonical, self.site):
                        if (urlparse(canonical).path or "/") != "/":
                            product_urls.add(canonical)
                    if len(product_urls) >= self.max_urls:
                        break
                if len(product_urls) >= self.max_urls:
                    break

        urls = sorted(product_urls)
        write_url_inventory(self.urls_path, self.site, urls, self.completed_urls)
        logging.info("%s discovered %d candidate URLs", self.site.key, len(urls))
        return urls

    def scrape(self, urls: list[str]) -> dict[str, int]:
        pending = [url for url in urls if canonicalize_url(url) not in self.completed_urls]
        counts = {
            "discovered": len(urls),
            "pending": len(pending),
            "saved": 0,
            "failed": 0,
            "skipped": len(urls) - len(pending),
        }

        if not pending:
            return counts

        with ThreadPoolExecutor(max_workers=self.workers, thread_name_prefix=f"dtb-{self.site.key}") as executor:
            futures = {executor.submit(self._scrape_one, url): url for url in pending}
            for future in as_completed(futures):
                url = futures[future]
                try:
                    outcome = future.result()
                except Exception as exc:  # defensive boundary around worker execution
                    outcome = ("failed", type(exc).__name__, str(exc))
                if outcome[0] == "saved":
                    counts["saved"] += 1
                else:
                    counts["failed"] += 1
                    if self.verbose:
                        logging.warning("%s failed %s: %s", self.site.key, url, outcome[2])

        return counts

    def _scrape_one(self, url: str) -> tuple[str, str, str]:
        if not self.robots_allowed(url):
            self._write_failure(url, "robots_disallowed", "robots.txt disallows this URL", 0)
            return ("failed", "robots_disallowed", "robots.txt disallows this URL")

        try:
            response = self._get(url)
            record = extract_product_record(self.site, response.url, response.text)
            if not record.title:
                raise ValueError("no product title extracted")
            if not output_identifier(self.site.key, asdict(record)):
                raise ValueError("no authoritative product identifier extracted")
            if not (record.price or record.regular_price or record.sale_price):
                raise ValueError("no product price extracted")
            with self._write_lock:
                if record.canonical_url not in self.completed_urls:
                    append_jsonl(self.products_path, asdict(record))
                    self.completed_urls.add(record.canonical_url)
            if self.verbose:
                logging.info("%s saved %s", self.site.key, record.url)
            return ("saved", "", "")
        except Exception as exc:
            self._write_failure(url, type(exc).__name__, str(exc), self.retries + 1)
            return ("failed", type(exc).__name__, str(exc))

    def _write_failure(self, url: str, error_type: str, error: str, attempts: int) -> None:
        row = {
            "competitor": self.site.key,
            "url": canonicalize_url(url),
            "error_type": error_type,
            "error": error[:1000],
            "attempts": attempts,
            "failed_at": utc_now(),
        }
        with self._write_lock:
            append_jsonl(self.failures_path, row)


# ----------------------------- extraction -----------------------------

def extract_product_record(site: SiteConfig, final_url: str, html: str) -> ProductRecord:
    soup = BeautifulSoup(html, "html.parser")
    source_hash = hashlib.sha256(html.encode("utf-8", errors="ignore")).hexdigest()
    canonical = extract_canonical_url(soup, final_url)
    record = ProductRecord(
        competitor=site.key,
        competitor_name=site.name,
        url=final_url,
        canonical_url=canonicalize_url(canonical),
        retrieved_at=utc_now(),
        source_hash=source_hash,
    )

    jsonld_products = extract_jsonld_products(soup)
    if jsonld_products:
        product = jsonld_products[0]
        apply_jsonld_product(record, product)
        record.parse_method = "jsonld"

    # Fill gaps from common meta tags / DOM without overriding stronger JSON-LD.
    record.title = record.title or meta_content(soup, "property", "og:title") or text_of(soup.select_one("h1"))
    record.description = record.description or first_nonempty(
        meta_content(soup, "name", "description"),
        meta_content(soup, "property", "og:description"),
        text_of(soup.select_one("[itemprop=\"description\"]")),
        text_of(soup.select_one(".productView-description")),
        text_of(soup.select_one(".product-description")),
    )
    record.price = record.price or meta_content(soup, "property", "product:price:amount")
    record.currency = record.currency or meta_content(soup, "property", "product:price:currency")
    record.brand = record.brand or first_nonempty(
        attr_content(soup, '[itemprop="brand"]', "content"),
        text_of(soup.select_one('[itemprop="brand"]')),
        text_of(soup.select_one(".brand")),
        text_of(soup.select_one("[data-product-brand]")),
    )
    record.sku = record.sku or first_nonempty(
        attr_content(soup, '[itemprop="sku"]', "content"),
        text_of(soup.select_one('[itemprop="sku"]')),
        text_of(soup.select_one("[data-product-sku]")),
    )
    record.mpn = record.mpn or first_nonempty(
        attr_content(soup, '[itemprop="mpn"]', "content"),
        text_of(soup.select_one('[itemprop="mpn"]')),
        attr_content(soup, '[data-product-mpn]', "data-product-mpn"),
        text_of(soup.select_one('[data-product-mpn]')),
    )
    record.sku = record.sku or extract_labeled_identifier(soup, "SKU")
    record.mpn = record.mpn or extract_labeled_identifier(soup, "MPN")
    record.brand = record.brand or first_nonempty(
        extract_labeled_identifier(soup, "Brand"),
        extract_labeled_identifier(soup, "Manufacturer"),
        extract_labeled_identifier(soup, "Mfr"),
    )

    # All-Wall exposes both a storefront SKU and a manufacturer part number (MPN).
    # DTB's exported SKU contract intentionally uses the manufacturer identifier.
    if site.key == "all_wall":
        record.mpn = record.mpn or extract_all_wall_mpn(soup)
        record.brand = record.brand or extract_all_wall_manufacturer(soup)
    # BigCommerce / common ecommerce price markup fallbacks.
    if not record.price:
        record.price = first_nonempty(
            attr_content(soup, '[data-product-price]', 'data-product-price'),
            attr_content(soup, '[data-product-price-with-tax]', 'data-product-price-with-tax'),
            attr_content(soup, '[data-product-price-without-tax]', 'data-product-price-without-tax'),
            text_of(soup.select_one('[data-product-price-with-tax]')),
            text_of(soup.select_one('[data-product-price-without-tax]')),
            text_of(soup.select_one('.price--withTax')),
            text_of(soup.select_one('.price--withoutTax')),
            text_of(soup.select_one('.price-section .price')),
        )
    if not record.regular_price:
        record.regular_price = first_nonempty(
            text_of(soup.select_one('.price--rrp')),
            text_of(soup.select_one('.price--non-sale')),
            text_of(soup.select_one('[data-product-rrp-with-tax]')),
        )
    if not record.sale_price:
        record.sale_price = first_nonempty(
            text_of(soup.select_one('.price--sale')),
            text_of(soup.select_one('[data-product-price-with-tax] .price--sale')),
        )

    # Conservative embedded JSON/JS fallback: only price-shaped keys, never arbitrary dollar text.
    if not (record.price or record.regular_price or record.sale_price):
        embedded = extract_embedded_price_candidates(html)
        record.price = embedded.get('price', '')
        record.regular_price = embedded.get('regular_price', '')
        record.sale_price = embedded.get('sale_price', '')
        record.currency = record.currency or embedded.get('currency', '')

    record.price = normalize_price(record.price)
    record.regular_price = normalize_price(record.regular_price)
    record.sale_price = normalize_price(record.sale_price)
    if not record.parse_method:
        record.parse_method = "meta_dom"
    return record


def extract_jsonld_products(soup: BeautifulSoup) -> list[dict[str, Any]]:
    products: list[dict[str, Any]] = []
    for script in soup.find_all("script", attrs={"type": re.compile(r"application/ld\+json", re.I)}):
        raw = script.string or script.get_text("", strip=False)
        if not raw.strip():
            continue
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            continue
        for node in walk_jsonld(data):
            node_type = node.get("@type")
            types = {str(v).lower() for v in (node_type if isinstance(node_type, list) else [node_type]) if v}
            if "product" in types or "productgroup" in types:
                products.append(node)
    return products


def walk_jsonld(value: Any) -> Iterable[dict[str, Any]]:
    if isinstance(value, dict):
        yield value
        for child in value.values():
            yield from walk_jsonld(child)
    elif isinstance(value, list):
        for child in value:
            yield from walk_jsonld(child)


def apply_jsonld_product(record: ProductRecord, product: dict[str, Any]) -> None:
    record.title = scalar(product.get("name"))
    record.sku = scalar(product.get("sku"))
    record.mpn = scalar(product.get("mpn") or product.get("manufacturerPartNumber"))
    brand = product.get("brand")
    if isinstance(brand, dict):
        record.brand = scalar(brand.get("name"))
    else:
        record.brand = scalar(brand)
    record.description = scalar(product.get("description"))

    offers = product.get("offers")
    offer_list: list[dict[str, Any]] = []
    if isinstance(offers, dict):
        offer_list = [offers]
    elif isinstance(offers, list):
        offer_list = [o for o in offers if isinstance(o, dict)]

    if offer_list:
        offer = offer_list[0]
        record.price = scalar(offer.get("price") or offer.get("lowPrice"))
        record.currency = scalar(offer.get("priceCurrency"))
        record.availability = clean_availability(scalar(offer.get("availability")))
        price_spec = offer.get("priceSpecification")
        specs = price_spec if isinstance(price_spec, list) else [price_spec] if isinstance(price_spec, dict) else []
        for spec in specs:
            price_type = scalar(spec.get("priceType")).lower()
            value = scalar(spec.get("price"))
            if "list" in price_type or "regular" in price_type:
                record.regular_price = record.regular_price or value
            elif "sale" in price_type:
                record.sale_price = record.sale_price or value


def detect_platform_signals(text: str, headers: Any) -> list[str]:
    hay = (text or "").lower()
    out: list[str] = []
    if any(token in hay for token in ("bigcommerce", "cdn11.bigcommerce.com", "stencil-utils", "bcapp")):
        out.append("bigcommerce")
    if any(token in hay for token in ("suitecommerce", "sc.environment", "shopping.environment", "netsuite")):
        out.append("suitecommerce")
    server = str(getattr(headers, "get", lambda *_: "")("Server", "")).lower()
    if "cloudflare" in server:
        out.append("cloudflare")
    return sorted(set(out))

def is_json_response(response: requests.Response) -> bool:
    ctype = (response.headers.get("Content-Type") or "").lower()
    if "json" in ctype:
        try:
            response.json(); return True
        except Exception:
            return False
    try:
        response.json(); return True
    except Exception:
        return False

def normalize_price(value: str) -> str:
    value = str(value or "").strip()
    if not value:
        return ""
    m = re.search(r"(?<!\d)(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)(?!\d)", value.replace("$", ""))
    return m.group(1).replace(",", "") if m else ""

def extract_embedded_price_candidates(html: str) -> dict[str, str]:
    result = {"price": "", "regular_price": "", "sale_price": "", "currency": ""}
    patterns = {
        "sale_price": [r'"sale[_-]?price"\s*:\s*"?([0-9][0-9,.]*)', r'"salePrice"\s*:\s*"?([0-9][0-9,.]*)'],
        "regular_price": [r'"regular[_-]?price"\s*:\s*"?([0-9][0-9,.]*)', r'"retail[_-]?price"\s*:\s*"?([0-9][0-9,.]*)', r'"rrp"\s*:\s*"?([0-9][0-9,.]*)'],
        "price": [r'"price"\s*:\s*"?([0-9][0-9,.]*)', r'"value"\s*:\s*"?([0-9][0-9,.]*)\s*"?\s*,\s*"currency"'],
        "currency": [r'"priceCurrency"\s*:\s*"([A-Z]{3})"', r'"currency"\s*:\s*"([A-Z]{3})"'],
    }
    for key, pats in patterns.items():
        for pat in pats:
            m = re.search(pat, html, flags=re.I)
            if m:
                result[key] = m.group(1).replace(",", "")
                break
    return result

def _deep_get(d: dict[str, Any], *keys: str) -> Any:
    cur: Any = d
    for key in keys:
        if not isinstance(cur, dict):
            return None
        cur = cur.get(key)
    return cur

def _suite_price(item: dict[str, Any]) -> tuple[str, str]:
    detail = item.get("onlinecustomerprice_detail")
    candidates: list[Any] = []
    if isinstance(detail, dict):
        for key in ("onlinecustomerprice", "price", "formatted", "value"):
            candidates.append(detail.get(key))
    for key in ("onlinecustomerprice", "price", "pricelevel1", "pricelevel1_formatted", "formatted"):
        candidates.append(item.get(key))
    numeric = ""
    formatted = ""
    for value in candidates:
        if isinstance(value, (int, float)):
            numeric = str(value); break
        if isinstance(value, str) and value.strip():
            p = normalize_price(value)
            if p and not numeric:
                numeric = p
            if ("$" in value or any(c.isalpha() for c in value)) and not formatted:
                formatted = value.strip()
    return numeric, formatted

def record_from_suitecommerce_item(site: SiteConfig, endpoint: str, item: dict[str, Any]) -> ProductRecord:
    title = first_nonempty(scalar(item.get("storedisplayname2")), scalar(item.get("displayname")), scalar(item.get("itemid")))
    store_sku = scalar(item.get("itemid"))
    manufacturer_mpn = extract_suitecommerce_mpn(item)
    url_component = first_nonempty(scalar(item.get("urlcomponent")), scalar(item.get("url")))
    if url_component.startswith("http"):
        url = url_component
    elif url_component:
        url = urljoin(site.base_url, "/" + url_component.lstrip("/"))
    else:
        url = endpoint
    price, _formatted = _suite_price(item)
    regular = normalize_price(first_nonempty(scalar(item.get("pricelevel1")), scalar(item.get("pricelevel1_formatted"))))
    description = first_nonempty(
        scalar(item.get("storedetaileddescription")),
        scalar(item.get("storedisplaydescription")),
        scalar(item.get("storedescription")),
        scalar(item.get("description")),
    )
    return ProductRecord(
        competitor=site.key, competitor_name=site.name, url=url, canonical_url=canonicalize_url(url),
        title=title, brand=first_nonempty(
            scalar(item.get("custitem_brand")),
            scalar(item.get("brand")),
            scalar(item.get("manufacturer")),
            scalar(item.get("manufacturername")),
        ),
        sku=store_sku, mpn=manufacturer_mpn, description=description, price=price,
        regular_price=regular, currency=first_nonempty(scalar(item.get("currency")), "USD"),
        availability="InStock" if item.get("isinstock") is True else "OutOfStock" if item.get("isinstock") is False else "",
        parse_method="suitecommerce_item_search_api", retrieved_at=utc_now(),
        source_hash=hashlib.sha256(json.dumps(item, sort_keys=True, default=str).encode()).hexdigest(),
    )

def extract_suitecommerce_mpn(item: dict[str, Any]) -> str:
    """Return the manufacturer part number from a SuiteCommerce item record.

    Field sets vary by NetSuite account, so prefer explicit known names and then
    conservatively inspect top-level keys whose names clearly mean MPN or
    manufacturer part number. Never fall back to itemid/store SKU here.
    """
    preferred = (
        "mpn",
        "manufacturerpartnumber",
        "manufacturer_part_number",
        "manufacturerpartno",
        "custitem_mpn",
        "custitem_manufacturerpartnumber",
        "custitem_manufacturer_part_number",
        "custitem_manufacturer_part_no",
        "vendorcode",
    )
    for key in preferred:
        value = scalar(item.get(key))
        if value:
            return value
    for key, value in item.items():
        normalized = re.sub(r"[^a-z0-9]", "", str(key).lower())
        if normalized == "mpn" or "manufacturerpartnumber" in normalized or "manufacturerpartno" in normalized:
            candidate = scalar(value)
            if candidate:
                return candidate
    return ""


def extract_labeled_identifier(soup: BeautifulSoup, label: str) -> str:
    """Extract a compact visible label/value pair without consuming surrounding copy."""
    label_re = re.escape(label)
    text = soup.get_text(" ", strip=True)
    pattern = rf"\b{label_re}\s*[:#]\s*([A-Za-z0-9][A-Za-z0-9._/+\-]*)"
    match = re.search(pattern, text, flags=re.I)
    return match.group(1).strip() if match else ""


def extract_all_wall_mpn(soup: BeautifulSoup) -> str:
    """Extract All-Wall's visible MPN label, keeping it distinct from store SKU."""
    # First inspect compact product-detail areas; fall back to normalized page text.
    selectors = (
        ".product-details", ".product-info", ".product-information", ".product-detail",
        "[class*='product']", "main",
    )
    texts: list[str] = []
    for selector in selectors:
        node = soup.select_one(selector)
        if node:
            texts.append(node.get_text(" ", strip=True))
    texts.append(soup.get_text(" ", strip=True))
    patterns = (
        r"\bMPN\s*[:#-]?\s*([A-Za-z0-9][A-Za-z0-9._/-]*)",
        r"\bManufacturer\s+Part\s+(?:Number|No\.?|#)\s*[:#-]?\s*([A-Za-z0-9][A-Za-z0-9._/-]*)",
        r"\bMfr\.?\s+Part\s+(?:Number|No\.?|#)\s*[:#-]?\s*([A-Za-z0-9][A-Za-z0-9._/-]*)",
    )
    for text in texts:
        for pattern in patterns:
            match = re.search(pattern, text, flags=re.I)
            if match:
                return match.group(1).strip()
    return ""


def extract_all_wall_manufacturer(soup: BeautifulSoup) -> str:
    """Extract the manufacturer shown next to All-Wall's Mfr label."""
    text = soup.get_text(" ", strip=True)
    match = re.search(r"\bMfr\s*:\s*(.+?)(?=\s+MPN\s*:|\s+SKU\s*:|$)", text, flags=re.I)
    return re.sub(r"\s+", " ", match.group(1)).strip() if match else ""


def normalize_site_sku(site: SiteConfig, value: str) -> str:
    """Normalize a storefront SKU only according to verified, site-specific rules.

    Never apply generic hyphen stripping: legitimate manufacturer SKUs may contain
    hyphens. Unknown prefixes are preserved unchanged.
    """
    sku = str(value or "").strip()
    if not sku:
        return ""
    if site.identifier_strategy != "sku_strip_prefix":
        return sku
    for prefix in site.sku_prefixes_to_strip:
        if sku.upper().startswith(prefix.upper()):
            return sku[len(prefix):].strip()
    return sku


def output_identifier(site_key: str, row: dict[str, Any]) -> str:
    """Map each storefront's authoritative identifier into the CSV SKU column."""
    site = SITES[site_key]
    if site.identifier_strategy == "mpn":
        return str(row.get("mpn") or "").strip()
    sku = str(row.get("sku") or "").strip()
    if not sku:
        sku = str(row.get("mpn") or "").strip()
    return normalize_site_sku(site, sku)


def extract_canonical_url(soup: BeautifulSoup, fallback: str) -> str:
    tag = soup.find("link", rel=lambda value: value and "canonical" in str(value).lower())
    if tag and tag.get("href"):
        return urljoin(fallback, str(tag.get("href")))
    return fallback


def extract_gtin_from_dom(soup: BeautifulSoup) -> str:
    for prop in ("gtin", "gtin8", "gtin12", "gtin13", "gtin14"):
        value = first_nonempty(
            attr_content(soup, f'[itemprop="{prop}"]', "content"),
            text_of(soup.select_one(f'[itemprop="{prop}"]')),
        )
        if value:
            return value
    return ""


def meta_content(soup: BeautifulSoup, attr: str, value: str) -> str:
    tag = soup.find("meta", attrs={attr: value})
    return str(tag.get("content", "")).strip() if tag else ""


def attr_content(soup: BeautifulSoup, selector: str, attr: str) -> str:
    tag = soup.select_one(selector)
    return str(tag.get(attr, "")).strip() if tag else ""


def text_of(tag: Any) -> str:
    return tag.get_text(" ", strip=True) if tag else ""


def scalar(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, (str, int, float)):
        return str(value).strip()
    return ""


def clean_availability(value: str) -> str:
    if not value:
        return ""
    return value.rstrip("/").split("/")[-1]


def first_nonempty(*values: str) -> str:
    return next((str(v).strip() for v in values if str(v).strip()), "")


# ----------------------------- helpers -----------------------------

def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def normalize_request_url(url: str) -> str:
    """Normalize transport URLs without discarding semantically required query strings."""
    parsed = urlparse(url.strip())
    scheme = parsed.scheme.lower() or "https"
    host = (parsed.hostname or "").lower()
    port = parsed.port
    netloc = host
    if port and not ((scheme == "https" and port == 443) or (scheme == "http" and port == 80)):
        netloc = f"{host}:{port}"
    path = re.sub(r"/{2,}", "/", parsed.path or "/")
    return urlunparse((scheme, netloc, path, "", parsed.query, ""))


def canonicalize_url(url: str) -> str:
    parsed = urlparse(url.strip())
    scheme = parsed.scheme.lower() or "https"
    host = (parsed.hostname or "").lower()
    port = parsed.port
    netloc = host
    if port and not ((scheme == "https" and port == 443) or (scheme == "http" and port == 80)):
        netloc = f"{host}:{port}"
    path = re.sub(r"/{2,}", "/", parsed.path or "/")
    if path != "/":
        path = path.rstrip("/")
    return urlunparse((scheme, netloc, path, "", "", ""))


def is_allowed_url(url: str, site: SiteConfig) -> bool:
    try:
        parsed = urlparse(url)
    except ValueError:
        return False
    return parsed.scheme in {"http", "https"} and (parsed.hostname or "").lower() in site.allowed_hosts


def is_allowed_sitemap_url(url: str, site: SiteConfig) -> bool:
    """Allow same-store sitemap hosts plus BigCommerce's permanent sitemap host.

    Product URLs remain restricted to the configured storefront host. This exception
    applies only to sitemap documents discovered from the storefront's own sitemap
    chain and does not authorize arbitrary cross-domain product crawling.
    """
    try:
        parsed = urlparse(url)
    except ValueError:
        return False
    if parsed.scheme not in {"http", "https"}:
        return False
    host = (parsed.hostname or "").lower()
    if host in site.allowed_hosts:
        return True
    return site.key in {"als_taping_tools", "wall_tools"} and host.endswith(".mybigcommerce.com")


def has_excluded_hint(url: str, site: SiteConfig) -> bool:
    path = (urlparse(url).path or "").lower()
    return any(token.lower() in path for token in site.exclude_path_hints)


def is_product_candidate(url: str, site: SiteConfig) -> bool:
    if not is_allowed_url(url, site) or has_excluded_hint(url, site):
        return False
    path = (urlparse(url).path or "").lower()
    if path in {"", "/"}:
        return False
    if re.search(r"\.(?:jpg|jpeg|png|gif|webp|svg|pdf|xml|txt|css|js)$", path):
        return False
    if site.product_path_hints:
        return any(token.lower() in path for token in site.product_path_hints)
    # For stores with flat/root-level product URLs, accept plausible slugs but
    # reject common generic endpoints. Product validation happens during extraction.
    segments = [segment for segment in path.split("/") if segment]
    if len(segments) == 1 and len(segments[0]) >= 4:
        return True
    return any(token in path for token in PRODUCT_HINTS)


def strip_ns(tag: str) -> str:
    return tag.split("}", 1)[-1].lower()


def dedupe_preserve(values: Iterable[str]) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for value in values:
        key = canonicalize_url(value)
        if key not in seen:
            seen.add(key)
            result.append(value)
    return result


def dedupe_request_urls(values: Iterable[str]) -> list[str]:
    """Deduplicate transport URLs while preserving meaningful query strings."""
    seen: set[str] = set()
    result: list[str] = []
    for value in values:
        key = normalize_request_url(value)
        if key not in seen:
            seen.add(key)
            result.append(value)
    return result


def append_jsonl(path: Path, row: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8", newline="\n") as handle:
        handle.write(json.dumps(row, ensure_ascii=False, separators=(",", ":")) + "\n")
        handle.flush()


def write_url_inventory(path: Path, site: SiteConfig, urls: list[str], completed: set[str], source: str = "sitemap") -> None:
    tmp = path.with_suffix(".tmp")
    with tmp.open("w", encoding="utf-8", newline="\n") as handle:
        discovered_at = utc_now()
        for url in urls:
            canonical = canonicalize_url(url)
            row = {
                "competitor": site.key,
                "url": url,
                "canonical_url": canonical,
                "source": source,
                "discovered_at": discovered_at,
                "status": "completed" if canonical in completed else "pending",
            }
            handle.write(json.dumps(row, ensure_ascii=False, separators=(",", ":")) + "\n")
    tmp.replace(path)


def _load_export_rows(output_dir: Path, site_key: str) -> list[dict[str, str]]:
    path = output_dir / site_key / "products.jsonl"
    if not path.exists():
        return []

    # Latest valid record wins for a given authoritative identifier. This avoids
    # duplicate rows caused by redirects, alternate product URLs, or re-scrapes.
    best: dict[str, dict[str, Any]] = {}
    with path.open("r", encoding="utf-8") as handle:
        for line in handle:
            try:
                row = json.loads(line)
            except json.JSONDecodeError:
                continue
            identifier = output_identifier(site_key, row)
            effective_price = first_nonempty(
                normalize_price(str(row.get("sale_price") or "")),
                normalize_price(str(row.get("price") or "")),
                normalize_price(str(row.get("regular_price") or "")),
            )
            title = str(row.get("title") or "").strip()
            if not identifier or not effective_price or not title:
                continue
            candidate = dict(row)
            candidate["_identifier"] = identifier
            candidate["_effective_price"] = effective_price
            key = identifier.casefold()
            prior = best.get(key)
            if prior is None or str(candidate.get("retrieved_at") or "") >= str(prior.get("retrieved_at") or ""):
                best[key] = candidate

    rows = [{
        "Brand": str(row.get("brand") or "").strip(),
        "Product Name": str(row.get("title") or "").strip(),
        "SKU": str(row.get("_identifier") or "").strip(),
        "Product Price": str(row.get("_effective_price") or "").strip(),
        "Product Description": clean_description(str(row.get("description") or "")),
    } for row in best.values()]
    rows.sort(key=lambda r: (r["Brand"].casefold(), r["Product Name"].casefold(), r["SKU"].casefold()))
    return rows


def _write_catalog_csv(path: Path, rows: list[dict[str, str]]) -> None:
    fields = ["Brand", "Product Name", "SKU", "Product Price", "Product Description"]
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)


def export_csv(output_dir: Path, selected_sites: list[str]) -> Path:
    """Write one concise five-column CSV per competitor plus a combined CSV.

    Provenance remains encoded by the per-site file path rather than adding fields
    the user explicitly does not want in the business-facing CSV.
    """
    combined: list[dict[str, str]] = []
    for site_key in selected_sites:
        rows = _load_export_rows(output_dir, site_key)
        _write_catalog_csv(output_dir / site_key / "catalog.csv", rows)
        combined.extend(rows)

    combined.sort(key=lambda r: (r["Brand"].casefold(), r["Product Name"].casefold(), r["SKU"].casefold(), r["Product Price"]))
    output_path = output_dir / "all_competitor_products.csv"
    _write_catalog_csv(output_path, combined)
    return output_path


def clean_description(value: str) -> str:
    if not value:
        return ""
    text = BeautifulSoup(value, "html.parser").get_text(" ", strip=True)
    return re.sub(r"\s+", " ", text).strip()


def run_site(args: argparse.Namespace, site: SiteConfig) -> dict[str, int]:
    scraper = Scraper(
        site=site, output_dir=args.output_dir, workers=args.workers, per_host=args.per_host,
        timeout=args.timeout, retries=args.retries, request_interval=args.request_interval,
        respect_robots=not args.ignore_robots, max_urls=args.max_urls, verbose=args.verbose,
    )
    scraper.audit_site_endpoints()

    # All-Wall / SuiteCommerce: prefer the public Item Search API because its HTML
    # product shells are frequently client-rendered and can omit price/title data.
    if site.key == "all_wall" and not args.discover_only:
        api_counts = scraper.scrape_all_wall_api()
        if api_counts is not None:
            return api_counts

    urls = scraper.discover_urls()
    scraper.audit_product_samples(urls)
    if args.discover_only:
        return {"discovered": len(urls), "pending": 0, "saved": 0, "failed": 0, "skipped": 0}
    return scraper.scrape(urls)


def run_main(args: argparse.Namespace) -> int:
    selected = args.site or list(SITES)
    summaries: dict[str, dict[str, int]] = {}
    for site_key in selected:
        site = SITES[site_key]
        logging.info("starting %s (%s)", site.name, site.base_url)
        summaries[site_key] = run_site(args, site)
        logging.info("finished %s: %s", site_key, summaries[site_key])

    csv_path = export_csv(args.output_dir, selected)
    summary_path = args.output_dir / "run_summary.json"
    summary_path.parent.mkdir(parents=True, exist_ok=True)
    summary = {
        "finished_at": utc_now(),
        "sites": selected,
        "transport": "cloudscraper",
        "settings": {
            "workers": args.workers,
            "per_host": args.per_host,
            "timeout": args.timeout,
            "retries": args.retries,
            "request_interval": args.request_interval,
            "respect_robots": not args.ignore_robots,
            "max_urls": args.max_urls,
            "discover_only": args.discover_only,
        },
        "results": summaries,
        "csv": str(csv_path),
    }
    summary_path.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(json.dumps(summary, indent=2))
    return 0


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Scrape competitor product catalogs to local JSONL/CSV files.")
    parser.add_argument("--site", action="append", choices=sorted(SITES), help="Competitor key. Repeat to select multiple. Default: all.")
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR)
    parser.add_argument("--workers", type=int, default=DEFAULT_WORKERS)
    parser.add_argument("--per-host", type=int, default=DEFAULT_PER_HOST)
    parser.add_argument("--timeout", type=float, default=DEFAULT_TIMEOUT)
    parser.add_argument("--retries", type=int, default=DEFAULT_RETRIES)
    parser.add_argument("--request-interval", type=float, default=DEFAULT_REQUEST_INTERVAL)
    parser.add_argument("--max-urls", type=int, default=MAX_URLS)
    parser.add_argument("--discover-only", action="store_true", help="Only discover and save URLs; do not fetch products.")
    parser.add_argument("--ignore-robots", action="store_true", help="Disable robots.txt enforcement. Use only when independently authorized.")
    parser.add_argument("--verbose", action="store_true")
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(asctime)s %(levelname)s %(message)s",
    )
    try:
        return run_main(args)
    except KeyboardInterrupt:
        logging.warning("interrupted; completed product rows already written are preserved")
        return 130


if __name__ == "__main__":
    sys.exit(main())
