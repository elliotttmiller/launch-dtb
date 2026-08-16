#!/usr/bin/env python3
"""Scrape public competitor pricing and compare it with the DTB launch catalog.

This is deterministic, read-only operational tooling. It never mutates the
canonical catalog, WooCommerce, MAP, Veeqo, QuickBooks, or any provider state.

Key guarantees:
- canonical DTB catalog supplies product identity and DTB pricing truth;
- cloudscraper is used with bounded retries, timeouts, and per-host throttling;
- permanent HTTP failures (including 404) are never retried;
- robots.txt is honored by default;
- sitemap discovery is bounded and product URLs are scored against the actual
  DTB catalog before product-page requests are issued;
- uncertain URLs are retained only through a deterministic bounded fallback;
- extraction prefers JSON-LD, then Shopify JSON, then conservative DOM parsing;
- matching precedence is GTIN -> MPN/manufacturer SKU -> SKU -> guarded fuzzy;
- ambiguous matches remain unmatched;
- all evidence remains attributable to URL, retrieval time, parser, and SHA-256.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import logging
import re
import statistics
import time
import unicodedata
import urllib.robotparser
import xml.etree.ElementTree as ET
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation
from pathlib import Path
from typing import Any, Iterable, Iterator, Mapping, Sequence
from urllib.parse import parse_qsl, unquote, urlencode, urljoin, urlparse, urlunparse

import cloudscraper
from bs4 import BeautifulSoup
from rapidfuzz import fuzz


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_CATALOG = ROOT / "products" / "launch" / "official" / "dtb_official_catalog.csv"
DEFAULT_OUTPUT_DIR = ROOT / "reports" / "pricing" / "competitor-market"
DEFAULT_USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 DTB-MarketResearch/2.0"
)

TRANSIENT_STATUS_CODES = {403, 408, 425, 429, 500, 502, 503, 504}
PRICE_RE = re.compile(r"(?<![A-Za-z0-9])(?:US\$|USD\s*|\$)\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)")
MODEL_TOKEN_RE = re.compile(r"\b[A-Z0-9][A-Z0-9._/-]{2,}\b", re.I)
WHITESPACE_RE = re.compile(r"\s+")
NON_ALNUM_RE = re.compile(r"[^a-z0-9]+")
URL_TOKEN_RE = re.compile(r"[a-z0-9]+")
TRACKING_QUERY_KEYS = {
    "gclid", "fbclid", "msclkid", "mc_cid", "mc_eid", "ref", "source",
    "utm_campaign", "utm_content", "utm_medium", "utm_source", "utm_term",
}
NAME_STOPWORDS = {
    "and", "automatic", "box", "compound", "drywall", "finish", "finisher", "finishing",
    "for", "from", "handle", "head", "inch", "inches", "kit", "part", "parts", "professional",
    "set", "standard", "the", "tool", "tools", "with",
}

CATALOG_COLUMNS = {
    "type": "Type",
    "sku": "SKU",
    "gtin": "GTIN, UPC, EAN, or ISBN",
    "name": "Name",
    "published": "Published",
    "sale_price": "Sale price",
    "regular_price": "Regular price",
    "brand": "Brands",
    "schema_mpn": "Meta: schema_mpn",
    "manufacturer_sku": "Meta: _dtb_manufacturer_sku",
    "mpn": "Meta: _dtb_mpn",
    "map_price": "Meta: _dtb_map_price",
    "slug": "Slug",
}


@dataclass(frozen=True)
class SiteConfig:
    key: str
    name: str
    base_url: str
    sitemap_candidates: tuple[str, ...]
    product_path_tokens: tuple[str, ...] = ()
    exclude_path_tokens: tuple[str, ...] = ()


SITES: tuple[SiteConfig, ...] = (
    SiteConfig(
        key="als_taping_tools",
        name="Al's Taping Tools",
        base_url="https://www.alstapingtools.com/",
        sitemap_candidates=("/xmlsitemap.php", "/sitemap.xml"),
        exclude_path_tokens=("/blog/", "/brands/", "/categories/", "/pages/"),
    ),
    SiteConfig(
        key="all_wall",
        name="All-Wall",
        base_url="https://www.all-wall.com/",
        sitemap_candidates=("/sitemap.xml", "/media/sitemap.xml"),
        product_path_tokens=(".html",),
        exclude_path_tokens=("/blog/", "/catalog/category/", "/customer/", "/checkout/"),
    ),
    SiteConfig(
        key="wall_tools",
        name="Wall Tools",
        base_url="https://walltools.com/",
        sitemap_candidates=("/xmlsitemap.php", "/sitemap.xml"),
        exclude_path_tokens=("/blog/", "/brands/", "/categories/", "/pages/"),
    ),
    SiteConfig(
        key="csr_building",
        name="CSR Building Supplies",
        base_url="https://csrbuilding.com/en-us/",
        sitemap_candidates=("/sitemap.xml",),
        product_path_tokens=("/products/",),
        exclude_path_tokens=("/blogs/", "/collections/", "/pages/"),
    ),
)


BRAND_URL_ALIASES: dict[str, tuple[str, ...]] = {
    "columbia": ("columbia", "columbia-tools", "columbia-taping-tools"),
    "dura stilt": ("dura-stilt", "dura-stilts", "durastilt", "durastilts"),
    "level5": ("level5", "level-5", "level-five"),
    "platinum": ("platinum", "platinum-drywall-tools"),
    "surpro": ("surpro", "sur-pro"),
    "tapetech": ("tapetech", "tape-tech"),
}


@dataclass
class CatalogProduct:
    sku: str
    name: str
    brand: str
    product_type: str
    regular_price: Decimal | None
    sale_price: Decimal | None
    map_price: Decimal | None
    gtin: str
    mpn: str
    manufacturer_sku: str
    slug: str

    @property
    def current_price(self) -> Decimal | None:
        return self.sale_price if self.sale_price and self.sale_price > 0 else self.regular_price

    @property
    def identifiers(self) -> set[str]:
        return {
            item for item in (
                normalize_identifier(self.gtin),
                normalize_identifier(self.mpn),
                normalize_identifier(self.manufacturer_sku),
                normalize_identifier(self.sku),
            ) if item
        }


@dataclass
class Listing:
    site_key: str
    site_name: str
    url: str
    title: str
    brand: str = ""
    sku: str = ""
    mpn: str = ""
    gtin: str = ""
    currency: str = "USD"
    price: Decimal | None = None
    regular_price: Decimal | None = None
    sale_price: Decimal | None = None
    availability: str = ""
    variant: str = ""
    parse_method: str = ""
    retrieved_at: str = ""
    source_hash: str = ""
    discovery_score: float = 0.0
    discovery_reasons: str = ""

    @property
    def current_price(self) -> Decimal | None:
        return self.sale_price if self.sale_price and self.sale_price > 0 else (self.price or self.regular_price)


@dataclass
class Match:
    dtb_sku: str
    dtb_name: str
    dtb_brand: str
    dtb_price: Decimal | None
    dtb_map_price: Decimal | None
    competitor_site: str
    competitor_title: str
    competitor_brand: str
    competitor_sku: str
    competitor_mpn: str
    competitor_gtin: str
    competitor_url: str
    competitor_price: Decimal | None
    competitor_regular_price: Decimal | None
    competitor_sale_price: Decimal | None
    currency: str
    availability: str
    variant: str
    match_method: str
    match_score: float
    price_delta: Decimal | None = None
    price_delta_pct: Decimal | None = None


@dataclass(frozen=True)
class UrlScore:
    url: str
    score: float
    reasons: tuple[str, ...] = field(default_factory=tuple)


class CrawlError(RuntimeError):
    pass


class HttpClient:
    """Bounded cloudscraper client with explicit retry classification."""

    def __init__(self, *, timeout: float, retries: int, interval: float, user_agent: str, respect_robots: bool) -> None:
        self.timeout = timeout
        self.retries = max(0, retries)
        self.interval = max(0.0, interval)
        self.user_agent = user_agent
        self.respect_robots = respect_robots
        self.session = cloudscraper.create_scraper(
            browser={"browser": "chrome", "platform": "windows", "mobile": False},
            delay=10,
        )
        self.session.headers.update({
            "User-Agent": user_agent,
            "Accept-Language": "en-US,en;q=0.9",
            "Cache-Control": "no-cache",
        })
        self._last_by_host: dict[str, float] = {}
        self._robots: dict[str, urllib.robotparser.RobotFileParser | None] = {}
        self.metrics = {
            "requests": 0,
            "retries": 0,
            "transient_http_retries": 0,
            "network_retries": 0,
            "permanent_http_failures": 0,
        }

    def _wait(self, url: str) -> None:
        host = (urlparse(url).hostname or "").lower()
        previous = self._last_by_host.get(host)
        if previous is not None:
            remaining = self.interval - (time.monotonic() - previous)
            if remaining > 0:
                time.sleep(remaining)
        self._last_by_host[host] = time.monotonic()

    @staticmethod
    def _retry_delay(response: Any, attempt: int) -> float:
        retry_after = str(response.headers.get("Retry-After", "") or "").strip()
        if retry_after:
            try:
                return min(60.0, max(0.0, float(retry_after)))
            except ValueError:
                pass
        return min(20.0, 2.0 ** attempt)

    def _raw_get(self, url: str, *, accept: str | None = None):
        last_error: Exception | None = None
        for attempt in range(self.retries + 1):
            self._wait(url)
            try:
                headers = {"Accept": accept} if accept else None
                self.metrics["requests"] += 1
                response = self.session.get(url, timeout=self.timeout, headers=headers, allow_redirects=True)
                status = int(response.status_code)

                if status >= 400:
                    if status in TRANSIENT_STATUS_CODES and attempt < self.retries:
                        delay = self._retry_delay(response, attempt)
                        self.metrics["retries"] += 1
                        self.metrics["transient_http_retries"] += 1
                        logging.warning("retry status=%s url=%s delay=%.1fs", status, url, delay)
                        time.sleep(delay)
                        continue
                    self.metrics["permanent_http_failures"] += 1
                    raise CrawlError(f"HTTP {status}: {url}")

                return response
            except CrawlError:
                raise
            except Exception as exc:  # network/TLS/timeout failures only
                last_error = exc
                if attempt >= self.retries:
                    break
                delay = min(20.0, 2.0 ** attempt)
                self.metrics["retries"] += 1
                self.metrics["network_retries"] += 1
                logging.warning("retry network_error=%s url=%s delay=%.1fs", exc, url, delay)
                time.sleep(delay)
        raise CrawlError(f"request failed: {url}: {last_error}")

    def _robot_parser(self, url: str) -> urllib.robotparser.RobotFileParser | None:
        parsed = urlparse(url)
        origin = f"{parsed.scheme}://{parsed.netloc}"
        if origin in self._robots:
            return self._robots[origin]
        robots_url = origin + "/robots.txt"
        try:
            response = self._raw_get(robots_url, accept="text/plain,*/*;q=0.8")
            parser = urllib.robotparser.RobotFileParser()
            parser.set_url(robots_url)
            parser.parse(response.text.splitlines())
            self._robots[origin] = parser
        except CrawlError as exc:
            logging.warning("robots_unavailable url=%s error=%s", robots_url, exc)
            self._robots[origin] = None
        return self._robots[origin]

    def allowed(self, url: str) -> bool:
        if not self.respect_robots:
            return True
        parser = self._robot_parser(url)
        return True if parser is None else parser.can_fetch(self.user_agent, url)

    def get(self, url: str, *, accept: str | None = None):
        if not self.allowed(url):
            raise CrawlError(f"robots.txt disallows fetch: {url}")
        return self._raw_get(url, accept=accept)


class CatalogDiscoveryIndex:
    """High-recall URL relevance index built only from canonical DTB catalog data."""

    def __init__(self, products: Sequence[CatalogProduct]) -> None:
        self.products = list(products)
        self.brand_aliases: dict[str, set[str]] = {}
        self.identifiers: set[str] = set()
        self.token_to_products: dict[str, set[int]] = {}
        self.product_tokens: list[set[str]] = []

        for index, product in enumerate(self.products):
            brand = normalize_brand(product.brand)
            aliases = self.brand_aliases.setdefault(brand, set())
            aliases.add(normalize_text(product.brand).replace(" ", "-"))
            aliases.update(BRAND_URL_ALIASES.get(brand, ()))

            for identifier in product.identifiers:
                if len(identifier) >= 4:
                    self.identifiers.add(identifier.lower())

            tokens = meaningful_name_tokens(product.name, product.brand)
            slug_tokens = meaningful_name_tokens(product.slug.replace("-", " "), product.brand)
            tokens |= slug_tokens
            self.product_tokens.append(tokens)
            for token in tokens:
                self.token_to_products.setdefault(token, set()).add(index)

    def score(self, url: str) -> UrlScore:
        parsed = urlparse(unquote(url))
        path = parsed.path.lower().strip("/")
        compact = normalize_identifier(path).lower()
        tokens = set(URL_TOKEN_RE.findall(path.replace("_", "-").replace("/", "-")))
        score = 0.0
        reasons: list[str] = []

        identifier_hits = sorted(identifier for identifier in self.identifiers if identifier in compact)
        if identifier_hits:
            score += 120.0
            reasons.append("identifier:" + identifier_hits[0])

        matched_brands: set[str] = set()
        hyphen_path = path.replace("_", "-")
        for brand, aliases in self.brand_aliases.items():
            if any(alias and alias in hyphen_path for alias in aliases):
                matched_brands.add(brand)
        if matched_brands:
            score += 45.0
            reasons.append("brand:" + "+".join(sorted(matched_brands)))

        candidate_product_ids: set[int] = set()
        for token in tokens:
            candidate_product_ids.update(self.token_to_products.get(token, set()))

        best_overlap = 0
        best_ratio = 0.0
        for product_id in candidate_product_ids:
            product_tokens = self.product_tokens[product_id]
            if not product_tokens:
                continue
            overlap = len(tokens & product_tokens)
            ratio = overlap / len(product_tokens)
            if overlap > best_overlap or (overlap == best_overlap and ratio > best_ratio):
                best_overlap = overlap
                best_ratio = ratio

        if best_overlap >= 4:
            score += 55.0
            reasons.append(f"name_tokens:{best_overlap}")
        elif best_overlap == 3:
            score += 45.0
            reasons.append("name_tokens:3")
        elif best_overlap == 2:
            score += 32.0
            reasons.append("name_tokens:2")
        elif best_overlap == 1 and best_ratio >= 0.5:
            score += 18.0
            reasons.append("name_token_specific")

        # Product-ish model tokens are useful supporting evidence but never
        # sufficient on their own because generic retailer URLs contain many numbers.
        modelish = [token for token in tokens if any(ch.isdigit() for ch in token) and len(token) >= 3]
        if modelish and score > 0:
            score += 8.0
            reasons.append("model_token")

        return UrlScore(url=url, score=score, reasons=tuple(reasons))


class MarketScraper:
    def __init__(
        self,
        *,
        client: HttpClient,
        sites: Sequence[SiteConfig],
        products: Sequence[CatalogProduct],
        max_urls: int,
        max_sitemaps: int,
        max_discovered_urls: int,
        prefilter_min_score: float,
        uncertain_fallback_cap: int,
    ) -> None:
        self.client = client
        self.sites = list(sites)
        self.products = list(products)
        self.target_brands = {normalize_brand(product.brand) for product in products if normalize_brand(product.brand)}
        self.discovery_index = CatalogDiscoveryIndex(products)
        self.max_urls = max(1, max_urls)
        self.max_sitemaps = max(1, max_sitemaps)
        self.max_discovered_urls = max(self.max_urls, max_discovered_urls)
        self.prefilter_min_score = max(0.0, prefilter_min_score)
        self.uncertain_fallback_cap = max(0, uncertain_fallback_cap)

    def run(self) -> tuple[list[Listing], dict[str, Any]]:
        all_listings: list[Listing] = []
        stats: dict[str, Any] = {}
        for site in self.sites:
            urls, discovery = self.discover(site)
            site_stats: dict[str, Any] = {
                **discovery,
                "candidate_urls": len(urls),
                "fetched_urls": 0,
                "product_pages": 0,
                "listings": 0,
                "errors": 0,
                "robots_skips": 0,
            }
            score_by_url = {item["url"]: item for item in discovery.pop("selected_url_scores", [])}
            logging.info(
                "site_start key=%s candidates=%s discovered=%s prefilter_rejected=%s fallback=%s",
                site.key,
                len(urls),
                site_stats.get("sitemap_product_urls", 0),
                site_stats.get("url_prefilter_rejected", 0),
                site_stats.get("url_prefilter_fallback", 0),
            )

            for index, url in enumerate(urls, start=1):
                if not self.client.allowed(url):
                    site_stats["robots_skips"] += 1
                    continue
                try:
                    response = self.client.get(url)
                    site_stats["fetched_urls"] += 1
                    parsed = parse_product_page(site, response.url, response.text)
                    if not parsed:
                        continue
                    site_stats["product_pages"] += 1
                    discovery_meta = score_by_url.get(url, {})
                    accepted: list[Listing] = []
                    for item in parsed:
                        if not self._brand_allowed(item):
                            continue
                        item.discovery_score = float(discovery_meta.get("score", 0.0))
                        item.discovery_reasons = str(discovery_meta.get("reasons", ""))
                        accepted.append(item)
                    all_listings.extend(accepted)
                    site_stats["listings"] += len(accepted)
                except CrawlError as exc:
                    site_stats["errors"] += 1
                    logging.warning("page_fetch_failed site=%s url=%s error=%s", site.key, url, exc)
                except Exception as exc:  # noqa: BLE001
                    site_stats["errors"] += 1
                    logging.exception("page_parse_failed site=%s url=%s error=%s", site.key, url, exc)

                if index % 100 == 0:
                    logging.info(
                        "site_progress key=%s processed=%s/%s listings=%s",
                        site.key, index, len(urls), site_stats["listings"],
                    )
            stats[site.key] = site_stats
            logging.info("site_done key=%s stats=%s", site.key, json.dumps(site_stats, sort_keys=True))

        stats["http"] = dict(self.client.metrics)
        return dedupe_listings(all_listings), stats

    def _brand_allowed(self, listing: Listing) -> bool:
        normalized = normalize_brand(listing.brand)
        if normalized:
            return normalized in self.target_brands
        title = normalize_text(listing.title)
        return any(brand and brand in title for brand in self.target_brands)

    def discover(self, site: SiteConfig) -> tuple[list[str], dict[str, Any]]:
        queue = self._sitemap_candidates(site)
        seen_sitemaps: set[str] = set()
        raw_urls: list[str] = []
        sitemap_failures = 0

        while queue and len(seen_sitemaps) < self.max_sitemaps and len(raw_urls) < self.max_discovered_urls:
            sitemap_url = queue.pop(0)
            if sitemap_url in seen_sitemaps:
                continue
            seen_sitemaps.add(sitemap_url)
            try:
                response = self.client.get(sitemap_url, accept="application/xml,text/xml,text/plain,*/*;q=0.8")
            except CrawlError as exc:
                sitemap_failures += 1
                logging.warning("sitemap_failed site=%s url=%s error=%s", site.key, sitemap_url, exc)
                continue

            children, locations = parse_sitemap(response.text)
            queue.extend(
                child for child in children
                if child not in seen_sitemaps and same_site(child, site.base_url) and sitemap_is_relevant(child)
            )
            for location in locations:
                candidate = canonicalize_url(location)
                if same_site(candidate, site.base_url) and candidate_url(site, candidate):
                    raw_urls.append(candidate)
                    if len(raw_urls) >= self.max_discovered_urls:
                        break

        raw_urls = stable_unique(raw_urls)
        scored = [self.discovery_index.score(url) for url in raw_urls]
        relevant = [item for item in scored if item.score >= self.prefilter_min_score]
        uncertain = [item for item in scored if 0 < item.score < self.prefilter_min_score]
        zero_signal = [item for item in scored if item.score <= 0]

        relevant.sort(key=lambda item: (-item.score, item.url))
        uncertain.sort(key=lambda item: (-item.score, item.url))
        zero_signal.sort(key=lambda item: item.url)

        # Bounded fallback preserves recall for product URLs whose slugs do not
        # expose brand/model identity. Prefer weak-signal URLs, then zero-signal.
        fallback_pool = (uncertain + zero_signal)[: self.uncertain_fallback_cap]
        selected = stable_unique([item.url for item in relevant] + [item.url for item in fallback_pool])[: self.max_urls]
        selected_set = set(selected)
        selected_scores = []
        for item in relevant + fallback_pool:
            if item.url not in selected_set:
                continue
            selected_scores.append({
                "url": item.url,
                "score": item.score,
                "reasons": ";".join(item.reasons),
            })

        exact_identifier_hits = sum(1 for item in relevant if any(reason.startswith("identifier:") for reason in item.reasons))
        brand_hits = sum(1 for item in relevant if any(reason.startswith("brand:") for reason in item.reasons))
        name_hits = sum(1 for item in relevant if any(reason.startswith("name_") for reason in item.reasons))

        logging.info(
            "discovery_filter site=%s sitemap_product_urls=%s relevant=%s rejected=%s fallback=%s id_hits=%s brand_hits=%s name_hits=%s",
            site.key,
            len(raw_urls),
            len(relevant),
            max(0, len(raw_urls) - len(selected)),
            len(fallback_pool),
            exact_identifier_hits,
            brand_hits,
            name_hits,
        )

        return selected, {
            "sitemaps_attempted": len(seen_sitemaps),
            "sitemap_failures": sitemap_failures,
            "sitemap_product_urls": len(raw_urls),
            "url_prefilter_matched": len(relevant),
            "url_prefilter_fallback": len(fallback_pool),
            "url_prefilter_rejected": max(0, len(raw_urls) - len(selected)),
            "identifier_url_hits": exact_identifier_hits,
            "brand_url_hits": brand_hits,
            "name_url_hits": name_hits,
            "selected_url_scores": selected_scores,
        }

    def _sitemap_candidates(self, site: SiteConfig) -> list[str]:
        candidates = [urljoin(site.base_url, path) for path in site.sitemap_candidates]
        try:
            robots_url = urljoin(site.base_url, "/robots.txt")
            response = self.client._raw_get(robots_url, accept="text/plain,*/*;q=0.8")
            for line in response.text.splitlines():
                if line.lower().startswith("sitemap:"):
                    url = line.split(":", 1)[1].strip()
                    if url:
                        candidates.append(url)
        except CrawlError as exc:
            logging.warning("robots_sitemap_discovery_failed site=%s error=%s", site.key, exc)
        return stable_unique(canonicalize_url(item) for item in candidates)


def parse_sitemap(text: str) -> tuple[list[str], list[str]]:
    try:
        root = ET.fromstring(text.lstrip("\ufeff \t\r\n"))
    except ET.ParseError:
        return [], []
    root_type = root.tag.rsplit("}", 1)[-1].lower()
    locations = [
        (element.text or "").strip()
        for element in root.iter()
        if element.tag.rsplit("}", 1)[-1].lower() == "loc" and (element.text or "").strip()
    ]
    if root_type == "sitemapindex":
        return locations, []
    if root_type == "urlset":
        return [], locations
    return [], []


def sitemap_is_relevant(url: str) -> bool:
    lowered = url.lower()
    if "product" in lowered:
        return True
    return not any(token in lowered for token in ("blog", "post", "page", "category", "image", "video", "news"))


def candidate_url(site: SiteConfig, url: str) -> bool:
    path = urlparse(url).path.lower()
    if any(token.lower() in path for token in site.exclude_path_tokens):
        return False
    if site.product_path_tokens:
        return any(token.lower() in path for token in site.product_path_tokens)
    # BigCommerce commonly serves product slugs at the domain root.
    leaf = path.strip("/")
    return bool(leaf and "/" not in leaf and "." not in leaf)


def meaningful_name_tokens(name: str, brand: str = "") -> set[str]:
    brand_tokens = set(normalize_text(brand).split()) | set(normalize_brand(brand).split())
    tokens = set(normalize_text(name).split())
    return {
        token for token in tokens
        if len(token) >= 3 and token not in NAME_STOPWORDS and token not in brand_tokens
    }


def parse_product_page(site: SiteConfig, url: str, html: str) -> list[Listing]:
    retrieved_at = datetime.now(timezone.utc).isoformat()
    source_hash = hashlib.sha256(html.encode("utf-8", errors="replace")).hexdigest()
    soup = BeautifulSoup(html, "html.parser")

    listings: list[Listing] = []
    for product in parse_jsonld_products(soup):
        listings.extend(listings_from_jsonld(site, url, product, retrieved_at, source_hash))
    if listings:
        return dedupe_listings(listings)

    if site.key == "csr_building":
        shopify = parse_shopify_product_json(soup)
        if shopify:
            listings = listings_from_shopify(site, url, shopify, retrieved_at, source_hash)
            if listings:
                return dedupe_listings(listings)

    fallback = listing_from_dom(site, url, soup, retrieved_at, source_hash)
    return [fallback] if fallback else []


def parse_jsonld_products(soup: BeautifulSoup) -> list[dict[str, Any]]:
    products: list[dict[str, Any]] = []
    for script in soup.find_all("script", attrs={"type": re.compile(r"application/ld\+json", re.I)}):
        raw = script.string or script.get_text("", strip=True)
        if not raw:
            continue
        for payload in tolerant_json_values(raw):
            for node in walk_json(payload):
                raw_type = node.get("@type")
                types = raw_type if isinstance(raw_type, list) else [raw_type]
                if any(str(item).lower() in {"product", "productgroup"} for item in types if item):
                    products.append(node)
    return products


def tolerant_json_values(raw: str) -> list[Any]:
    cleaned = re.sub(r"^\s*<!--|-->\s*$", "", raw.strip().rstrip(";")).strip()
    try:
        return [json.loads(cleaned)]
    except json.JSONDecodeError:
        return []


def walk_json(value: Any) -> Iterator[dict[str, Any]]:
    if isinstance(value, dict):
        yield value
        for child in value.values():
            yield from walk_json(child)
    elif isinstance(value, list):
        for child in value:
            yield from walk_json(child)


def listings_from_jsonld(
    site: SiteConfig,
    url: str,
    product: Mapping[str, Any],
    retrieved_at: str,
    source_hash: str,
) -> list[Listing]:
    variants = product.get("hasVariant")
    if isinstance(variants, list):
        result: list[Listing] = []
        for variant in variants:
            if not isinstance(variant, Mapping):
                continue
            merged = dict(variant)
            merged.setdefault("brand", product.get("brand"))
            merged.setdefault("name", product.get("name"))
            result.extend(listings_from_jsonld(site, url, merged, retrieved_at, source_hash))
        if result:
            return result

    title = text_value(product.get("name"))
    brand = brand_value(product.get("brand"))
    sku = text_value(product.get("sku"))
    mpn = text_value(product.get("mpn"))
    gtin = first_nonempty(product, ("gtin14", "gtin13", "gtin12", "gtin8", "gtin"))
    offers = product.get("offers")
    if isinstance(offers, Mapping):
        offer_nodes = [offers]
    elif isinstance(offers, list):
        offer_nodes = [item for item in offers if isinstance(item, Mapping)]
    else:
        offer_nodes = [{}]

    result: list[Listing] = []
    for offer in offer_nodes:
        price = decimal_value(offer.get("price"))
        low = decimal_value(offer.get("lowPrice"))
        high = decimal_value(offer.get("highPrice"))
        current = price or low
        if not title or current is None:
            continue
        result.append(Listing(
            site_key=site.key,
            site_name=site.name,
            url=canonicalize_url(text_value(offer.get("url")) or url),
            title=title,
            brand=brand,
            sku=sku,
            mpn=mpn,
            gtin=gtin,
            currency=(text_value(offer.get("priceCurrency")) or "USD").upper(),
            price=current,
            regular_price=high if high and low and high > low else None,
            sale_price=low if high and low and high > low else None,
            availability=text_value(offer.get("availability")).rsplit("/", 1)[-1],
            variant=text_value(offer.get("name")),
            parse_method="jsonld",
            retrieved_at=retrieved_at,
            source_hash=source_hash,
        ))
    return result


def parse_shopify_product_json(soup: BeautifulSoup) -> Mapping[str, Any] | None:
    for script in soup.find_all("script"):
        script_type = (script.get("type") or "").lower()
        script_id = (script.get("id") or "").lower()
        if "json" not in script_type and "product" not in script_id:
            continue
        raw = script.string or script.get_text("", strip=True)
        if not raw or '"variants"' not in raw:
            continue
        for payload in tolerant_json_values(raw):
            if isinstance(payload, Mapping) and isinstance(payload.get("variants"), list):
                return payload
            nested = payload.get("product") if isinstance(payload, Mapping) else None
            if isinstance(nested, Mapping) and isinstance(nested.get("variants"), list):
                return nested
    return None


def listings_from_shopify(
    site: SiteConfig,
    url: str,
    product: Mapping[str, Any],
    retrieved_at: str,
    source_hash: str,
) -> list[Listing]:
    title = text_value(product.get("title"))
    brand = text_value(product.get("vendor"))
    result: list[Listing] = []
    for variant in product.get("variants", []):
        if not isinstance(variant, Mapping):
            continue
        price = shopify_money(variant.get("price"))
        compare = shopify_money(variant.get("compare_at_price"))
        if price is None:
            continue
        result.append(Listing(
            site_key=site.key,
            site_name=site.name,
            url=url,
            title=title,
            brand=brand,
            sku=text_value(variant.get("sku")),
            gtin=text_value(variant.get("barcode")),
            price=price,
            regular_price=compare if compare and compare > price else price,
            sale_price=price if compare and compare > price else None,
            availability="InStock" if variant.get("available") is True else "OutOfStock" if variant.get("available") is False else "",
            variant=text_value(variant.get("public_title") or variant.get("title")),
            parse_method="shopify_json",
            retrieved_at=retrieved_at,
            source_hash=source_hash,
        ))
    return result


def listing_from_dom(
    site: SiteConfig,
    url: str,
    soup: BeautifulSoup,
    retrieved_at: str,
    source_hash: str,
) -> Listing | None:
    title = first_text(soup, (
        "h1.productView-title", "h1.page-title span.base", "h1.product-single__title",
        "h1.product__title", "h1",
    ))
    if not title:
        return None
    sku = first_attr_or_text(soup, (
        "[itemprop='sku']", ".product.attribute.sku .value", ".sku", "[data-product-sku]",
    ), ("content", "data-product-sku"))
    brand = first_attr_or_text(soup, (
        "[itemprop='brand']", ".productView-brand a", ".product-brand", ".brand",
    ), ("content",))
    mpn = first_attr_or_text(soup, ("[itemprop='mpn']", ".mpn"), ("content",))
    gtin = first_attr_or_text(soup, (
        "[itemprop='gtin13']", "[itemprop='gtin12']", "[itemprop='gtin']", ".barcode",
    ), ("content",))
    price = first_decimal_from_selectors(soup, (
        "[itemprop='price']", "meta[property='product:price:amount']", ".price--withoutTax",
        ".special-price .price", ".price-final_price .price", ".price-item--final",
        ".product__price", ".price",
    ))
    regular = first_decimal_from_selectors(soup, (
        ".price--rrp", ".price--non-sale", ".old-price .price", ".price-item--regular",
        "s.price", ".was-price",
    ))
    if price is None:
        price = first_price_from_text(soup.get_text(" ", strip=True))
    if price is None:
        return None
    availability = first_attr_or_text(soup, (
        "[itemprop='availability']", "link[itemprop='availability']", ".availability", ".stock",
    ), ("href", "content")).rsplit("/", 1)[-1]
    return Listing(
        site_key=site.key,
        site_name=site.name,
        url=url,
        title=title,
        brand=brand,
        sku=sku,
        mpn=mpn,
        gtin=gtin,
        price=price,
        regular_price=regular or price,
        sale_price=price if regular and regular > price else None,
        availability=availability,
        parse_method="dom",
        retrieved_at=retrieved_at,
        source_hash=source_hash,
    )


def load_catalog(path: Path, brand_filter: set[str] | None) -> list[CatalogProduct]:
    required = set(CATALOG_COLUMNS.values())
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        missing = required - set(reader.fieldnames or [])
        if missing:
            raise SystemExit("ERROR: catalog missing required columns: " + ", ".join(sorted(missing)))
        result: list[CatalogProduct] = []
        for row in reader:
            if (row.get(CATALOG_COLUMNS["published"]) or "").strip().lower() not in {"1", "true", "yes"}:
                continue
            product_type = (row.get(CATALOG_COLUMNS["type"]) or "").strip().lower()
            if product_type not in {"simple", "variation", "variable"}:
                continue
            brand = (row.get(CATALOG_COLUMNS["brand"]) or "").strip()
            if brand_filter and normalize_brand(brand) not in brand_filter:
                continue
            regular = decimal_value(row.get(CATALOG_COLUMNS["regular_price"]))
            sale = decimal_value(row.get(CATALOG_COLUMNS["sale_price"]))
            if regular is None and sale is None:
                continue
            mpn_values = [
                (row.get(CATALOG_COLUMNS["mpn"]) or "").strip(),
                (row.get(CATALOG_COLUMNS["schema_mpn"]) or "").strip(),
                (row.get(CATALOG_COLUMNS["manufacturer_sku"]) or "").strip(),
            ]
            result.append(CatalogProduct(
                sku=(row.get(CATALOG_COLUMNS["sku"]) or "").strip(),
                name=(row.get(CATALOG_COLUMNS["name"]) or "").strip(),
                brand=brand,
                product_type=product_type,
                regular_price=regular,
                sale_price=sale,
                map_price=decimal_value(row.get(CATALOG_COLUMNS["map_price"])),
                gtin=(row.get(CATALOG_COLUMNS["gtin"]) or "").strip(),
                mpn=next((item for item in mpn_values if item), ""),
                manufacturer_sku=(row.get(CATALOG_COLUMNS["manufacturer_sku"]) or "").strip(),
                slug=(row.get(CATALOG_COLUMNS["slug"]) or "").strip(),
            ))

    seen: set[str] = set()
    duplicates: list[str] = []
    for product in result:
        if product.sku in seen:
            duplicates.append(product.sku)
        seen.add(product.sku)
    if duplicates:
        raise SystemExit("ERROR: duplicate analyzed SKUs: " + ", ".join(sorted(set(duplicates))))
    return result


def match_listings(
    products: Sequence[CatalogProduct],
    listings: Sequence[Listing],
    fuzzy_threshold: float,
) -> tuple[list[Match], list[Listing], list[CatalogProduct]]:
    by_gtin: dict[str, list[CatalogProduct]] = {}
    by_mpn: dict[str, list[CatalogProduct]] = {}
    by_sku: dict[str, list[CatalogProduct]] = {}
    by_brand: dict[str, list[CatalogProduct]] = {}
    for product in products:
        by_brand.setdefault(normalize_brand(product.brand), []).append(product)
        add_index(by_gtin, normalize_identifier(product.gtin), product)
        add_index(by_mpn, normalize_identifier(product.mpn), product)
        add_index(by_mpn, normalize_identifier(product.manufacturer_sku), product)
        add_index(by_sku, normalize_identifier(product.sku), product)

    matches: list[Match] = []
    unmatched: list[Listing] = []
    matched_skus: set[str] = set()
    for listing in listings:
        candidate: tuple[CatalogProduct, str, float] | None = None
        ngtin = normalize_identifier(listing.gtin)
        nmpn = normalize_identifier(listing.mpn)
        nsku = normalize_identifier(listing.sku)

        if ngtin and len(by_gtin.get(ngtin, [])) == 1:
            candidate = (by_gtin[ngtin][0], "gtin_exact", 100.0)
        elif nmpn and len(by_mpn.get(nmpn, [])) == 1:
            candidate = (by_mpn[nmpn][0], "mpn_exact", 99.0)
        elif nsku and len(by_mpn.get(nsku, [])) == 1:
            candidate = (by_mpn[nsku][0], "competitor_sku_to_mpn_exact", 98.0)
        elif nsku and len(by_sku.get(nsku, [])) == 1:
            candidate = (by_sku[nsku][0], "sku_exact", 97.0)
        else:
            brand = normalize_brand(listing.brand)
            brand_products = by_brand.get(brand, []) if brand else []
            if not brand_products:
                title = normalize_text(listing.title)
                inferred = [item for item in by_brand if item and item in title]
                if len(inferred) == 1:
                    brand_products = by_brand[inferred[0]]
            scored = sorted(
                ((product, product_name_score(product, listing)) for product in brand_products),
                key=lambda item: (-item[1], item[0].sku),
            )
            if scored and scored[0][1] >= fuzzy_threshold:
                runner_up = scored[1][1] if len(scored) > 1 else 0.0
                if scored[0][1] - runner_up >= 4.0 or runner_up < fuzzy_threshold:
                    candidate = (scored[0][0], "brand_name_fuzzy", scored[0][1])

        if candidate is None:
            unmatched.append(listing)
            continue
        product, method, score = candidate
        if normalize_brand(listing.brand) and normalize_brand(listing.brand) != normalize_brand(product.brand):
            unmatched.append(listing)
            continue

        competitor_price = listing.current_price
        dtb_price = product.current_price
        delta = competitor_price - dtb_price if competitor_price is not None and dtb_price is not None else None
        pct = (delta / dtb_price * Decimal("100")) if delta is not None and dtb_price not in {None, Decimal("0")} else None
        matches.append(Match(
            dtb_sku=product.sku,
            dtb_name=product.name,
            dtb_brand=product.brand,
            dtb_price=dtb_price,
            dtb_map_price=product.map_price,
            competitor_site=listing.site_name,
            competitor_title=listing.title,
            competitor_brand=listing.brand,
            competitor_sku=listing.sku,
            competitor_mpn=listing.mpn,
            competitor_gtin=listing.gtin,
            competitor_url=listing.url,
            competitor_price=competitor_price,
            competitor_regular_price=listing.regular_price,
            competitor_sale_price=listing.sale_price,
            currency=listing.currency,
            availability=listing.availability,
            variant=listing.variant,
            match_method=method,
            match_score=score,
            price_delta=delta,
            price_delta_pct=pct,
        ))
        matched_skus.add(product.sku)

    matches.sort(key=lambda item: (
        item.dtb_brand.lower(), item.dtb_sku, item.competitor_site,
        item.competitor_price or Decimal("0"),
    ))
    return matches, unmatched, [product for product in products if product.sku not in matched_skus]


def add_index(index: dict[str, list[CatalogProduct]], key: str, product: CatalogProduct) -> None:
    if key:
        index.setdefault(key, []).append(product)


def product_name_score(product: CatalogProduct, listing: Listing) -> float:
    left = normalize_product_name(product.name, product.brand)
    right = normalize_product_name(listing.title, listing.brand or product.brand)
    if not left or not right:
        return 0.0
    score = 0.7 * fuzz.token_set_ratio(left, right) + 0.3 * fuzz.ratio(left, right)
    listing_tokens = {normalize_identifier(token) for token in MODEL_TOKEN_RE.findall(listing.title)}
    if product.identifiers & listing_tokens:
        score = max(score, 96.0)
    return min(100.0, float(score))


def write_outputs(
    output_dir: Path,
    *,
    products: Sequence[CatalogProduct],
    listings: Sequence[Listing],
    matches: Sequence[Match],
    unmatched_listings: Sequence[Listing],
    unmatched_products: Sequence[CatalogProduct],
    crawl_stats: Mapping[str, Any],
    args: argparse.Namespace,
) -> dict[str, str]:
    output_dir.mkdir(parents=True, exist_ok=True)
    paths = {
        "analysis": output_dir / "competitor_price_analysis.csv",
        "matches": output_dir / "competitor_price_matches.csv",
        "evidence": output_dir / "competitor_scrape_evidence.jsonl",
        "unmatched_listings": output_dir / "unmatched_competitor_listings.csv",
        "unmatched_catalog": output_dir / "unmatched_catalog_products.csv",
        "summary": output_dir / "run_summary.json",
    }
    write_matches(paths["matches"], matches)
    write_analysis(paths["analysis"], products, matches)
    write_unmatched_listings(paths["unmatched_listings"], unmatched_listings)
    write_unmatched_catalog(paths["unmatched_catalog"], unmatched_products)
    with paths["evidence"].open("w", encoding="utf-8", newline="\n") as handle:
        for listing in sorted(listings, key=lambda item: (item.site_key, item.url, item.sku, item.variant)):
            handle.write(json.dumps(serializable(asdict(listing)), ensure_ascii=False, sort_keys=True) + "\n")

    summary = {
        "schema_version": 2,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "catalog": str(args.catalog),
        "sites": [site.key for site in selected_sites(args.sites)],
        "brand_filter": args.brands or [],
        "respect_robots": args.respect_robots,
        "request_interval_seconds": args.request_interval,
        "fuzzy_threshold": args.fuzzy_threshold,
        "url_prefilter_min_score": args.url_prefilter_min_score,
        "uncertain_fallback_cap": args.uncertain_fallback_cap,
        "catalog_products_analyzed": len(products),
        "competitor_listings_collected": len(listings),
        "matches": len(matches),
        "matched_catalog_products": len({match.dtb_sku for match in matches}),
        "unmatched_competitor_listings": len(unmatched_listings),
        "unmatched_catalog_products": len(unmatched_products),
        "crawl": crawl_stats,
        "outputs": {key: str(value) for key, value in paths.items()},
    }
    paths["summary"].write_text(json.dumps(summary, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    return {key: str(value) for key, value in paths.items()}


def write_matches(path: Path, matches: Sequence[Match]) -> None:
    fields = list(Match.__dataclass_fields__.keys())
    with path.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        for match in matches:
            writer.writerow(serializable(asdict(match)))


def write_unmatched_listings(path: Path, listings: Sequence[Listing]) -> None:
    fields = list(Listing.__dataclass_fields__.keys())
    with path.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        for listing in listings:
            writer.writerow(serializable(asdict(listing)))


def write_unmatched_catalog(path: Path, products: Sequence[CatalogProduct]) -> None:
    fields = [
        "sku", "name", "brand", "product_type", "current_price", "map_price",
        "gtin", "mpn", "manufacturer_sku", "slug",
    ]
    with path.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        for product in products:
            writer.writerow({
                "sku": product.sku,
                "name": product.name,
                "brand": product.brand,
                "product_type": product.product_type,
                "current_price": decimal_text(product.current_price),
                "map_price": decimal_text(product.map_price),
                "gtin": product.gtin,
                "mpn": product.mpn,
                "manufacturer_sku": product.manufacturer_sku,
                "slug": product.slug,
            })


def write_analysis(path: Path, products: Sequence[CatalogProduct], matches: Sequence[Match]) -> None:
    grouped: dict[str, list[Match]] = {}
    for match in matches:
        if match.competitor_price is not None and match.currency.upper() == "USD":
            grouped.setdefault(match.dtb_sku, []).append(match)

    fields = [
        "sku", "name", "brand", "dtb_price", "map_price", "competitor_count", "site_count",
        "market_low", "market_high", "market_mean", "market_median", "market_spread_pct",
        "dtb_vs_market_median", "dtb_vs_market_median_pct", "market_position", "map_floor_status",
        "lowest_competitor", "lowest_competitor_url",
    ]
    with path.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        for product in sorted(products, key=lambda item: (item.brand.lower(), item.sku)):
            rows = grouped.get(product.sku, [])
            prices = [row.competitor_price for row in rows if row.competitor_price is not None]
            float_prices = [float(value) for value in prices]
            low = min(prices) if prices else None
            high = max(prices) if prices else None
            mean = Decimal(str(statistics.fmean(float_prices))) if float_prices else None
            median = Decimal(str(statistics.median(float_prices))) if float_prices else None
            spread = ((high - low) / low * Decimal("100")) if low and high and low > 0 else None
            delta = product.current_price - median if product.current_price is not None and median is not None else None
            delta_pct = (delta / median * Decimal("100")) if delta is not None and median and median > 0 else None
            lowest = min(
                rows,
                key=lambda row: (row.competitor_price or Decimal("999999999"), row.competitor_site),
                default=None,
            )
            writer.writerow({
                "sku": product.sku,
                "name": product.name,
                "brand": product.brand,
                "dtb_price": decimal_text(product.current_price),
                "map_price": decimal_text(product.map_price),
                "competitor_count": len(prices),
                "site_count": len({row.competitor_site for row in rows}),
                "market_low": decimal_text(low),
                "market_high": decimal_text(high),
                "market_mean": decimal_text(mean),
                "market_median": decimal_text(median),
                "market_spread_pct": decimal_text(spread),
                "dtb_vs_market_median": decimal_text(delta),
                "dtb_vs_market_median_pct": decimal_text(delta_pct),
                "market_position": market_position(delta_pct, len(prices)),
                "map_floor_status": "no_map" if product.map_price is None or product.current_price is None else "below_map" if product.current_price < product.map_price else "at_or_above_map",
                "lowest_competitor": lowest.competitor_site if lowest else "",
                "lowest_competitor_url": lowest.competitor_url if lowest else "",
            })


def market_position(delta_pct: Decimal | None, count: int) -> str:
    if count == 0 or delta_pct is None:
        return "no_market_data"
    if count < 2:
        return "single_source_only"
    if delta_pct < Decimal("-5"):
        return "below_market_median"
    if delta_pct > Decimal("5"):
        return "above_market_median"
    return "market_aligned"


def selected_sites(keys: Sequence[str] | None) -> list[SiteConfig]:
    if not keys:
        return list(SITES)
    requested = {item.strip().lower() for item in keys if item.strip()}
    return [site for site in SITES if site.key in requested]


def normalize_brand(value: str) -> str:
    normalized = normalize_text(value)
    return {
        "level 5": "level5",
        "level five": "level5",
        "columbia tools": "columbia",
        "columbia taping tools": "columbia",
        "tapetech tools": "tapetech",
        "tape tech": "tapetech",
        "dura stilts": "dura stilt",
        "dura stilt": "dura stilt",
        "dura stilts tools": "dura stilt",
        "surpro stilts": "surpro",
        "sur pro": "surpro",
        "platinum drywall tools": "platinum",
    }.get(normalized, normalized)


def normalize_product_name(name: str, brand: str) -> str:
    value = normalize_text(name)
    brand_tokens = set(normalize_text(brand).split()) | set(normalize_brand(brand).split())
    return " ".join(
        token for token in value.split()
        if token not in brand_tokens and token not in {"tools", "drywall", "professional"}
    )


def normalize_text(value: Any) -> str:
    text = unicodedata.normalize("NFKD", str(value or ""))
    text = "".join(character for character in text if not unicodedata.combining(character))
    text = text.replace("®", " ").replace("™", " ")
    return WHITESPACE_RE.sub(" ", NON_ALNUM_RE.sub(" ", text.lower())).strip()


def normalize_identifier(value: Any) -> str:
    return re.sub(r"[^A-Z0-9]", "", str(value or "").upper())


def decimal_value(value: Any) -> Decimal | None:
    if value is None:
        return None
    text = str(value).strip()
    if not text:
        return None
    match = PRICE_RE.search(text)
    if match:
        text = match.group(1)
    try:
        result = Decimal(text.replace(",", "").strip())
    except (InvalidOperation, ValueError):
        return None
    return result if result.is_finite() and result >= 0 else None


def shopify_money(value: Any) -> Decimal | None:
    result = decimal_value(value)
    if result is None:
        return None
    raw = str(value or "").strip()
    return result / Decimal("100") if raw.isdigit() and "." not in raw else result


def decimal_text(value: Decimal | None) -> str:
    return "" if value is None else format(value.quantize(Decimal("0.01")), "f")


def first_price_from_text(text: str) -> Decimal | None:
    match = PRICE_RE.search(text)
    return decimal_value(match.group(1)) if match else None


def first_decimal_from_selectors(soup: BeautifulSoup, selectors: Sequence[str]) -> Decimal | None:
    for selector in selectors:
        element = soup.select_one(selector)
        if element is None:
            continue
        for candidate in (
            element.get("content"), element.get("data-price-amount"), element.get_text(" ", strip=True),
        ):
            value = decimal_value(candidate)
            if value is not None:
                return value
    return None


def first_text(soup: BeautifulSoup, selectors: Sequence[str]) -> str:
    for selector in selectors:
        element = soup.select_one(selector)
        if element is not None:
            value = WHITESPACE_RE.sub(" ", element.get_text(" ", strip=True)).strip()
            if value:
                return value
    return ""


def first_attr_or_text(soup: BeautifulSoup, selectors: Sequence[str], attrs: Sequence[str]) -> str:
    for selector in selectors:
        element = soup.select_one(selector)
        if element is None:
            continue
        for attr in attrs:
            value = str(element.get(attr) or "").strip()
            if value:
                return value
        text = WHITESPACE_RE.sub(" ", element.get_text(" ", strip=True)).strip()
        if text:
            return text
    return ""


def text_value(value: Any) -> str:
    if isinstance(value, Mapping):
        return text_value(value.get("name") or value.get("value") or value.get("@id"))
    return WHITESPACE_RE.sub(" ", str(value or "")).strip()


def brand_value(value: Any) -> str:
    return text_value(value.get("name")) if isinstance(value, Mapping) else text_value(value)


def first_nonempty(mapping: Mapping[str, Any], keys: Sequence[str]) -> str:
    for key in keys:
        value = text_value(mapping.get(key))
        if value:
            return value
    return ""


def canonicalize_url(url: str) -> str:
    parsed = urlparse(str(url or "").strip())
    if not parsed.scheme or not parsed.netloc:
        return str(url or "").strip()
    query = [
        (key, value) for key, value in parse_qsl(parsed.query, keep_blank_values=True)
        if key.lower() not in TRACKING_QUERY_KEYS and not key.lower().startswith("utm_")
    ]
    return urlunparse(parsed._replace(fragment="", query=urlencode(query, doseq=True)))


def same_site(url: str, base_url: str) -> bool:
    host = (urlparse(url).hostname or "").lower().removeprefix("www.")
    base = (urlparse(base_url).hostname or "").lower().removeprefix("www.")
    return bool(host and base and host == base)


def stable_unique(values: Iterable[str]) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for value in values:
        if value and value not in seen:
            seen.add(value)
            result.append(value)
    return result


def dedupe_listings(listings: Sequence[Listing]) -> list[Listing]:
    by_key: dict[tuple[str, str, str, str, str], Listing] = {}
    rank = {"jsonld": 3, "shopify_json": 2, "dom": 1}
    for listing in listings:
        key = (
            listing.site_key,
            canonicalize_url(listing.url),
            normalize_identifier(listing.sku or listing.mpn or listing.gtin),
            normalize_text(listing.variant),
            decimal_text(listing.current_price),
        )
        current = by_key.get(key)
        if current is None or rank.get(listing.parse_method, 0) > rank.get(current.parse_method, 0):
            by_key[key] = listing
    return sorted(by_key.values(), key=lambda item: (item.site_key, item.url, item.sku, item.variant, item.title))


def serializable(value: Any) -> Any:
    if isinstance(value, Decimal):
        return decimal_text(value)
    if isinstance(value, dict):
        return {key: serializable(item) for key, item in value.items()}
    if isinstance(value, list):
        return [serializable(item) for item in value]
    return value


def parse_args(argv: Sequence[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--catalog", type=Path, default=DEFAULT_CATALOG)
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR)
    parser.add_argument("--sites", nargs="*", choices=[site.key for site in SITES])
    parser.add_argument("--brands", nargs="*", help="Optional DTB brand subset; defaults to all priced published catalog brands")
    parser.add_argument("--request-interval", type=float, default=1.25)
    parser.add_argument("--timeout", type=float, default=30.0)
    parser.add_argument("--retries", type=int, default=3)
    parser.add_argument("--max-urls-per-site", type=int, default=5000, help="Maximum product pages actually fetched per site")
    parser.add_argument("--max-discovered-urls-per-site", type=int, default=50000, help="Maximum sitemap product URLs considered before prefiltering")
    parser.add_argument("--max-sitemap-documents", type=int, default=100)
    parser.add_argument("--url-prefilter-min-score", type=float, default=30.0, help="Catalog relevance score required before fetch")
    parser.add_argument("--uncertain-fallback-cap", type=int, default=150, help="Maximum weak/zero-signal product URLs retained per site for recall")
    parser.add_argument("--fuzzy-threshold", type=float, default=91.0)
    parser.add_argument("--user-agent", default=DEFAULT_USER_AGENT)
    parser.add_argument("--ignore-robots", action="store_false", dest="respect_robots", help="Use only after independently verifying permission/terms for the target site")
    parser.set_defaults(respect_robots=True)
    parser.add_argument("--verbose", action="store_true")
    return parser.parse_args(argv)


def main(argv: Sequence[str] | None = None) -> int:
    args = parse_args(argv)
    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(asctime)s %(levelname)s %(message)s",
    )
    brand_filter = {normalize_brand(item) for item in (args.brands or []) if normalize_brand(item)} or None
    products = load_catalog(args.catalog.resolve(), brand_filter)
    if not products:
        raise SystemExit("ERROR: no priced published catalog products matched the requested scope")

    target_brands = {normalize_brand(product.brand) for product in products if normalize_brand(product.brand)}
    logging.info("catalog_loaded products=%s brands=%s", len(products), ",".join(sorted(target_brands)))

    client = HttpClient(
        timeout=args.timeout,
        retries=args.retries,
        interval=args.request_interval,
        user_agent=args.user_agent,
        respect_robots=args.respect_robots,
    )
    scraper = MarketScraper(
        client=client,
        sites=selected_sites(args.sites),
        products=products,
        max_urls=args.max_urls_per_site,
        max_sitemaps=args.max_sitemap_documents,
        max_discovered_urls=args.max_discovered_urls_per_site,
        prefilter_min_score=args.url_prefilter_min_score,
        uncertain_fallback_cap=args.uncertain_fallback_cap,
    )
    listings, crawl_stats = scraper.run()
    matches, unmatched_listings, unmatched_products = match_listings(products, listings, args.fuzzy_threshold)
    paths = write_outputs(
        args.output_dir.resolve(),
        products=products,
        listings=listings,
        matches=matches,
        unmatched_listings=unmatched_listings,
        unmatched_products=unmatched_products,
        crawl_stats=crawl_stats,
        args=args,
    )
    print(json.dumps({
        "catalog_products": len(products),
        "listings": len(listings),
        "matches": len(matches),
        "matched_skus": len({match.dtb_sku for match in matches}),
        "http": client.metrics,
        "outputs": paths,
    }, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
