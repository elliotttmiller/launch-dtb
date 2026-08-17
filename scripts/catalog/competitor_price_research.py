#!/usr/bin/env python3
"""Fast, resumable competitor price research for the DTB catalog.

Production scope is intentionally limited to Al's Taping Tools, All-Wall, and
Wall Tools. The extraction, normalization, matching, and market-analysis logic
remains in competitor_price_research_core. This entrypoint owns bounded
concurrency, streaming persistence, durable resume checkpoints, and operator
telemetry.
"""

from __future__ import annotations

import argparse
import csv
import json
import logging
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import asdict, replace
from datetime import datetime, timezone
from decimal import Decimal
from pathlib import Path
from typing import Any, Mapping, Sequence
from urllib.parse import urlparse

from competitor_price_research_core import *  # noqa: F403,F401
import competitor_price_research_core as core


DEFAULT_WORKERS = 10
DEFAULT_REQUEST_INTERVAL = 0.20
PROGRESS_EVERY = 100
CHECKPOINT_EVERY = 100
CHECKPOINT_INTERVAL_SECONDS = 30.0
SUMMARY_REPLACE_ATTEMPTS = 3
ACTIVE_SITE_KEYS = ("als_taping_tools", "all_wall", "wall_tools")

# All-Wall serves real product pages as root-level slugs without a .html suffix.
# Override only that stale discovery constraint while leaving the shared core
# configuration unchanged for other tooling that imports it.
ACTIVE_SITES = tuple(
    replace(site, product_path_tokens=()) if site.key == "all_wall" else site
    for site in core.SITES
    if site.key in ACTIVE_SITE_KEYS
)

PRIMARY_MATCH_FIELDS = [
    "dtb_sku",
    "dtb_name",
    "price_delta",
    "dtb_price",
    "competitor_sku",
    "competitor_title",
    "competitor_price",
    "competitor_url",
]


def selected_active_sites(keys: Sequence[str] | None) -> list[core.SiteConfig]:
    if not keys:
        return list(ACTIVE_SITES)
    requested = {item.strip().lower() for item in keys if item.strip()}
    return [site for site in ACTIVE_SITES if site.key in requested]


class SharedHostGate:
    """Bound request starts per host while allowing network I/O to overlap."""

    def __init__(self, interval: float) -> None:
        self.interval = max(0.0, interval)
        self._lock = threading.Lock()
        self._last_by_host: dict[str, float] = {}

    def wait(self, url: str) -> None:
        host = (urlparse(url).hostname or "").lower()
        with self._lock:
            previous = self._last_by_host.get(host)
            if previous is not None:
                remaining = self.interval - (time.monotonic() - previous)
                if remaining > 0:
                    time.sleep(remaining)
            self._last_by_host[host] = time.monotonic()


class WorkerClients:
    """Use one keep-alive cloudscraper session per worker thread."""

    def __init__(self, template: core.HttpClient, gate: SharedHostGate) -> None:
        self.template = template
        self.gate = gate
        self.local = threading.local()

    def get(self) -> core.HttpClient:
        client = getattr(self.local, "client", None)
        if client is None:
            client = core.HttpClient(
                timeout=self.template.timeout,
                retries=self.template.retries,
                interval=0.0,
                user_agent=self.template.user_agent,
                respect_robots=False,
            )
            client._wait = self.gate.wait  # type: ignore[method-assign]
            self.local.client = client
        return client


def primary_match_row(match: core.Match) -> dict[str, str]:
    delta: Decimal | None = None
    if match.dtb_price is not None and match.competitor_price is not None:
        delta = match.dtb_price - match.competitor_price
    return {
        "dtb_sku": match.dtb_sku,
        "dtb_name": match.dtb_name,
        "price_delta": core.decimal_text(delta),
        "dtb_price": core.decimal_text(match.dtb_price),
        "competitor_sku": match.competitor_sku,
        "competitor_title": match.competitor_title,
        "competitor_price": core.decimal_text(match.competitor_price),
        "competitor_url": match.competitor_url,
    }


def listing_from_checkpoint(payload: Mapping[str, Any]) -> core.Listing | None:
    fields = core.Listing.__dataclass_fields__
    values = {key: payload.get(key) for key in fields if key in payload}
    if not values.get("site_key") or not values.get("url") or not values.get("title"):
        return None
    for key in ("price", "regular_price", "sale_price"):
        values[key] = core.decimal_value(values.get(key))
    try:
        values["discovery_score"] = float(values.get("discovery_score") or 0.0)
    except (TypeError, ValueError):
        values["discovery_score"] = 0.0
    try:
        return core.Listing(**values)
    except TypeError:
        return None


class LiveResults:
    """Persist evidence, matches, and processed URLs with durable resume support."""

    def __init__(self, output_dir: Path, products: Sequence[core.CatalogProduct], args: argparse.Namespace) -> None:
        self.output_dir = output_dir
        self.products = list(products)
        self.args = args
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.paths = {
            "analysis": output_dir / "competitor_price_analysis.csv",
            "matches": output_dir / "competitor_price_matches.csv",
            "evidence": output_dir / "competitor_scrape_evidence.jsonl",
            "processed": output_dir / "competitor_processed_urls.jsonl",
            "unmatched_listings": output_dir / "unmatched_competitor_listings.csv",
            "unmatched_catalog": output_dir / "unmatched_catalog_products.csv",
            "summary": output_dir / "run_summary.json",
        }
        self.listings: list[core.Listing] = []
        self.matches: list[core.Match] = []
        self.unmatched_listings: list[core.Listing] = []
        self.matched_skus: set[str] = set()
        self.processed_urls: set[tuple[str, str]] = set()
        self._evidence_keys: set[tuple[str, str, str, str, str]] = set()
        self._match_keys: set[tuple[str, str, str, str, str]] = set()
        self.crawl_stats: dict[str, Any] = {}
        self.legacy_completed_sites: set[str] = set()
        self.started_at = datetime.now(timezone.utc).isoformat()
        self.successful_pages = 0
        self._last_checkpoint_pages = 0
        self._last_checkpoint_time = time.monotonic()
        self._closed = False

        # Resume state must be loaded before any output file is opened for write.
        self._load_previous_summary()
        self._load_previous_evidence()
        self._load_processed_urls()
        self._validate_legacy_completion()
        self._rebuild_matches_from_evidence()

        self._evidence_handle = self.paths["evidence"].open("a", encoding="utf-8", newline="\n", buffering=1)
        self._processed_handle = self.paths["processed"].open("a", encoding="utf-8", newline="\n", buffering=1)
        self._matches_handle = self.paths["matches"].open("w", encoding="utf-8-sig", newline="", buffering=1)
        self._matches_writer = csv.DictWriter(self._matches_handle, fieldnames=PRIMARY_MATCH_FIELDS)
        self._matches_writer.writeheader()
        for match in self.matches:
            self._matches_writer.writerow(primary_match_row(match))
        self._matches_handle.flush()

        self._write_aggregate_reports()
        self._write_summary("running")
        logging.info(
            "live_outputs_ready dir=%s resumed_listings=%s resumed_matches=%s processed_urls=%s legacy_completed_sites=%s",
            self.output_dir,
            len(self.listings),
            len(self.matches),
            len(self.processed_urls),
            ",".join(sorted(self.legacy_completed_sites)) or "none",
        )

    def _load_previous_summary(self) -> None:
        path = self.paths["summary"]
        if not path.exists():
            return
        try:
            payload = json.loads(path.read_text(encoding="utf-8-sig"))
        except (OSError, json.JSONDecodeError):
            return
        crawl = payload.get("crawl")
        if not isinstance(crawl, Mapping):
            return
        for site_key, raw_stats in crawl.items():
            if site_key not in ACTIVE_SITE_KEYS or not isinstance(raw_stats, Mapping):
                continue
            try:
                allowed = int(raw_stats.get("allowed_urls") or 0)
                fetched = int(raw_stats.get("fetched_urls") or 0)
            except (TypeError, ValueError):
                continue
            if allowed > 0 and fetched >= allowed:
                self.legacy_completed_sites.add(site_key)
                self.crawl_stats[site_key] = dict(raw_stats)

    def _load_previous_evidence(self) -> None:
        path = self.paths["evidence"]
        if not path.exists():
            return
        try:
            with path.open("r", encoding="utf-8", errors="replace") as handle:
                for line in handle:
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        payload = json.loads(line)
                    except json.JSONDecodeError:
                        continue
                    if not isinstance(payload, Mapping) or payload.get("site_key") not in ACTIVE_SITE_KEYS:
                        continue
                    item = listing_from_checkpoint(payload)
                    if item is None:
                        continue
                    key = self._evidence_key(item)
                    if key in self._evidence_keys:
                        continue
                    self._evidence_keys.add(key)
                    self.listings.append(item)
        except OSError as exc:
            logging.warning("resume_evidence_unavailable error=%s", exc)

    def _load_processed_urls(self) -> None:
        path = self.paths["processed"]
        if not path.exists():
            return
        try:
            with path.open("r", encoding="utf-8", errors="replace") as handle:
                for line in handle:
                    try:
                        payload = json.loads(line)
                    except json.JSONDecodeError:
                        continue
                    if not isinstance(payload, Mapping):
                        continue
                    site_key = str(payload.get("site_key") or "")
                    url = core.canonicalize_url(str(payload.get("url") or ""))
                    if site_key in ACTIVE_SITE_KEYS and url:
                        self.processed_urls.add((site_key, url))
        except OSError as exc:
            logging.warning("resume_processed_urls_unavailable error=%s", exc)

    def _validate_legacy_completion(self) -> None:
        """Never skip a legacy completed site unless its evidence was restored.

        Older checkpoints did not persist attempted URLs. A summary can prove a
        crawl finished, but it cannot reconstruct pricing evidence after that
        evidence file was lost or truncated. In that case rerunning is the only
        data-safe option.
        """
        evidence_sites = {item.site_key for item in self.listings}
        invalid = sorted(site_key for site_key in self.legacy_completed_sites if site_key not in evidence_sites)
        for site_key in invalid:
            self.legacy_completed_sites.discard(site_key)
            self.crawl_stats.pop(site_key, None)
            logging.warning(
                "legacy_resume_invalidated site=%s reason=completed_summary_without_restored_evidence rerun_required=true",
                site_key,
            )

    def _rebuild_matches_from_evidence(self) -> None:
        if not self.listings:
            return
        matches, unmatched, _ = core.match_listings(self.products, self.listings, self.args.fuzzy_threshold)
        for match in matches:
            key = self._match_key(match)
            if key in self._match_keys:
                continue
            self._match_keys.add(key)
            self.matches.append(match)
            self.matched_skus.add(match.dtb_sku)
        self.unmatched_listings = list(unmatched)
        self.successful_pages = len(self.listings)
        self._last_checkpoint_pages = self.successful_pages

    @staticmethod
    def _evidence_key(item: core.Listing) -> tuple[str, str, str, str, str]:
        return (
            item.site_key,
            core.canonicalize_url(item.url),
            core.normalize_identifier(item.sku or item.mpn or item.gtin),
            core.normalize_text(item.variant),
            core.decimal_text(item.current_price),
        )

    @staticmethod
    def _match_key(item: core.Match) -> tuple[str, str, str, str, str]:
        return (
            item.dtb_sku,
            item.competitor_site,
            core.canonicalize_url(item.competitor_url),
            core.normalize_identifier(item.competitor_sku or item.competitor_mpn or item.competitor_gtin),
            core.decimal_text(item.competitor_price),
        )

    def is_processed(self, site_key: str, url: str) -> bool:
        return (site_key, core.canonicalize_url(url)) in self.processed_urls

    def mark_processed(self, site_key: str, url: str, status: str) -> None:
        key = (site_key, core.canonicalize_url(url))
        if key in self.processed_urls:
            return
        self.processed_urls.add(key)
        self._processed_handle.write(json.dumps({
            "site_key": site_key,
            "url": key[1],
            "status": status,
            "processed_at": datetime.now(timezone.utc).isoformat(),
        }, ensure_ascii=False, sort_keys=True) + "\n")
        self._processed_handle.flush()

    def record(self, extracted: Sequence[core.Listing]) -> None:
        fresh: list[core.Listing] = []
        for item in core.dedupe_listings(extracted):
            key = self._evidence_key(item)
            if key in self._evidence_keys:
                continue
            self._evidence_keys.add(key)
            fresh.append(item)

        if fresh:
            for item in fresh:
                self._evidence_handle.write(
                    json.dumps(core.serializable(asdict(item)), ensure_ascii=False, sort_keys=True) + "\n"
                )
            self._evidence_handle.flush()
            self.listings.extend(fresh)

            new_matches, new_unmatched, _ = core.match_listings(self.products, fresh, self.args.fuzzy_threshold)
            wrote_match = False
            for match in new_matches:
                key = self._match_key(match)
                if key in self._match_keys:
                    continue
                self._match_keys.add(key)
                self.matches.append(match)
                self.matched_skus.add(match.dtb_sku)
                self._matches_writer.writerow(primary_match_row(match))
                wrote_match = True
            if wrote_match:
                self._matches_handle.flush()
            self.unmatched_listings.extend(new_unmatched)

        self.successful_pages += 1
        if self._checkpoint_due():
            self.checkpoint("running")

    def _checkpoint_due(self) -> bool:
        page_due = self.successful_pages - self._last_checkpoint_pages >= CHECKPOINT_EVERY
        time_due = time.monotonic() - self._last_checkpoint_time >= CHECKPOINT_INTERVAL_SECONDS
        return page_due or time_due

    def update_site_stats(self, site_key: str, stats: dict[str, Any]) -> None:
        self.crawl_stats[site_key] = dict(stats)

    def checkpoint(self, status: str = "running") -> None:
        self._write_aggregate_reports()
        self._write_summary(status)
        self._last_checkpoint_pages = self.successful_pages
        self._last_checkpoint_time = time.monotonic()

    def finish(self, status: str) -> None:
        if self._closed:
            return
        try:
            self.checkpoint(status)
        finally:
            for handle in (self._evidence_handle, self._processed_handle, self._matches_handle):
                handle.flush()
                handle.close()
            self._closed = True

    def _unmatched_products(self) -> list[core.CatalogProduct]:
        return [product for product in self.products if product.sku not in self.matched_skus]

    def _write_aggregate_reports(self) -> None:
        writers = (
            ("analysis", core.write_analysis, (self.paths["analysis"], self.products, self.matches)),
            ("unmatched_listings", core.write_unmatched_listings, (self.paths["unmatched_listings"], self.unmatched_listings)),
            ("unmatched_catalog", core.write_unmatched_catalog, (self.paths["unmatched_catalog"], self._unmatched_products())),
        )
        for name, writer, values in writers:
            try:
                writer(*values)
            except PermissionError as exc:
                logging.warning("report_checkpoint_skipped report=%s error=%s", name, exc)

    def _summary_payload(self, status: str) -> dict[str, Any]:
        return {
            "schema_version": 7,
            "status": status,
            "started_at": self.started_at,
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "catalog": str(self.args.catalog),
            "sites": [site.key for site in selected_active_sites(self.args.sites)],
            "brand_filter": self.args.brands or [],
            "workers": self.args.workers,
            "request_interval_seconds": self.args.request_interval,
            "resume_enabled": True,
            "processed_url_count": len(self.processed_urls),
            "catalog_products_analyzed": len(self.products),
            "successful_product_pages": self.successful_pages,
            "competitor_listings_collected": len(self.listings),
            "matches": len(self.matches),
            "matched_catalog_products": len(self.matched_skus),
            "unmatched_competitor_listings": len(self.unmatched_listings),
            "unmatched_catalog_products": len(self.products) - len(self.matched_skus),
            "crawl": self.crawl_stats,
            "outputs": {key: str(value) for key, value in self.paths.items()},
        }

    def _write_summary(self, status: str) -> None:
        payload = json.dumps(self._summary_payload(status), indent=2, sort_keys=True) + "\n"
        temp = self.paths["summary"].with_suffix(".json.tmp")
        for attempt in range(SUMMARY_REPLACE_ATTEMPTS):
            try:
                temp.write_text(payload, encoding="utf-8")
                temp.replace(self.paths["summary"])
                return
            except PermissionError as exc:
                if attempt + 1 >= SUMMARY_REPLACE_ATTEMPTS:
                    logging.warning("summary_checkpoint_skipped error=%s", exc)
                    return
                time.sleep(0.10 * (attempt + 1))


class FastMarketScraper(core.MarketScraper):
    """Catalog-aware discovery with bounded concurrent product-page fetching."""

    def __init__(self, *, workers: int, sink: LiveResults, **kwargs: Any) -> None:
        super().__init__(**kwargs)
        self.workers = max(1, workers)
        self.sink = sink

    def _fetch_one(
        self,
        worker_clients: WorkerClients,
        site: core.SiteConfig,
        url: str,
        discovery_meta: dict[str, Any],
    ) -> tuple[str, list[core.Listing], str | None]:
        try:
            response = worker_clients.get().get(url)
            parsed = core.parse_product_page(site, response.url, response.text)
            accepted: list[core.Listing] = []
            for item in parsed:
                if not self._brand_allowed(item):
                    continue
                item.discovery_score = float(discovery_meta.get("score", 0.0))
                item.discovery_reasons = str(discovery_meta.get("reasons", ""))
                accepted.append(item)
            return url, accepted, None
        except Exception as exc:  # noqa: BLE001
            return url, [], str(exc)

    def run(self) -> tuple[list[core.Listing], dict[str, Any]]:
        stats: dict[str, Any] = {}
        for site in self.sites:
            if site.key in self.sink.legacy_completed_sites:
                previous = dict(self.sink.crawl_stats.get(site.key, {}))
                previous["resumed_site_complete"] = True
                stats[site.key] = previous
                self.sink.update_site_stats(site.key, previous)
                logging.info(
                    "site_resume_skip key=%s reason=completed_previous_run fetched=%s allowed=%s",
                    site.key,
                    previous.get("fetched_urls", 0),
                    previous.get("allowed_urls", 0),
                )
                continue

            urls, discovery = self.discover(site)
            selected_scores = discovery.pop("selected_url_scores", [])
            score_by_url = {item["url"]: item for item in selected_scores}
            previously_processed = sum(1 for url in urls if self.sink.is_processed(site.key, url))
            allowed_urls: list[str] = []
            robots_skips = 0
            for url in urls:
                if self.sink.is_processed(site.key, url):
                    continue
                if self.client.allowed(url):
                    allowed_urls.append(url)
                else:
                    robots_skips += 1

            worker_clients = WorkerClients(self.client, SharedHostGate(self.client.interval))
            start_matches = len(self.sink.matches)
            start_matched_skus = set(self.sink.matched_skus)
            site_stats: dict[str, Any] = {
                **discovery,
                "candidate_urls": len(urls),
                "resume_skipped_urls": previously_processed,
                "remaining_urls": len(allowed_urls),
                "allowed_urls": len(allowed_urls),
                "workers": self.workers,
                "request_interval_seconds": self.client.interval,
                "retries": self.client.retries,
                "fetched_urls": 0,
                "product_pages": 0,
                "listings": 0,
                "errors": 0,
                "rate_limit_errors": 0,
                "robots_skips": robots_skips,
            }
            self.sink.update_site_stats(site.key, site_stats)
            logging.info(
                "site_start key=%s candidates=%s remaining=%s resume_skipped=%s workers=%s interval=%.2fs retries=%s discovered=%s rejected=%s fallback=%s",
                site.key,
                len(urls),
                len(allowed_urls),
                previously_processed,
                self.workers,
                self.client.interval,
                self.client.retries,
                site_stats.get("sitemap_product_urls", 0),
                site_stats.get("url_prefilter_rejected", 0),
                site_stats.get("url_prefilter_fallback", 0),
            )

            executor = ThreadPoolExecutor(max_workers=self.workers, thread_name_prefix=f"dtb-{site.key}")
            futures: dict[Any, str] = {}
            try:
                futures = {
                    executor.submit(self._fetch_one, worker_clients, site, url, score_by_url.get(url, {})): url
                    for url in allowed_urls
                }
                processed = 0
                for future in as_completed(futures):
                    processed += 1
                    url, accepted, error = future.result()
                    site_stats["fetched_urls"] += 1
                    if error:
                        site_stats["errors"] += 1
                        if "HTTP 429" in error:
                            site_stats["rate_limit_errors"] += 1
                        self.sink.mark_processed(site.key, url, "error")
                        logging.warning("page_fetch_failed site=%s url=%s error=%s", site.key, url, error)
                    else:
                        if accepted:
                            site_stats["product_pages"] += 1
                            site_stats["listings"] += len(accepted)
                            self.sink.record(accepted)
                        self.sink.mark_processed(site.key, url, "product" if accepted else "non_product")

                    if processed % PROGRESS_EVERY == 0 or processed == len(allowed_urls):
                        site_matches = len(self.sink.matches) - start_matches
                        site_matched_skus = len(self.sink.matched_skus - start_matched_skus)
                        self.sink.update_site_stats(site.key, site_stats)
                        logging.info(
                            "site_progress key=%s processed=%s/%s product_pages=%s listings=%s site_matches=%s site_matched_skus=%s total_matches=%s total_matched_skus=%s errors=%s rate_limits=%s",
                            site.key,
                            processed,
                            len(allowed_urls),
                            site_stats["product_pages"],
                            site_stats["listings"],
                            site_matches,
                            site_matched_skus,
                            len(self.sink.matches),
                            len(self.sink.matched_skus),
                            site_stats["errors"],
                            site_stats["rate_limit_errors"],
                        )
            except KeyboardInterrupt:
                for future in futures:
                    future.cancel()
                executor.shutdown(wait=False, cancel_futures=True)
                self.sink.update_site_stats(site.key, site_stats)
                raise
            else:
                executor.shutdown(wait=True)

            site_stats["site_matches"] = len(self.sink.matches) - start_matches
            site_stats["site_matched_skus"] = len(self.sink.matched_skus - start_matched_skus)
            stats[site.key] = dict(site_stats)
            self.sink.update_site_stats(site.key, site_stats)
            self.sink.checkpoint("running")
            logging.info("site_done key=%s stats=%s", site.key, json.dumps(site_stats, sort_keys=True))

        stats["http"] = dict(self.client.metrics)
        return list(self.sink.listings), stats


def parse_args(argv: Sequence[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--catalog", type=Path, default=core.DEFAULT_CATALOG)
    parser.add_argument("--output-dir", type=Path, default=core.DEFAULT_OUTPUT_DIR)
    parser.add_argument("--sites", nargs="*", choices=[site.key for site in ACTIVE_SITES])
    parser.add_argument("--brands", nargs="*")
    parser.add_argument("--workers", type=int, default=DEFAULT_WORKERS, help="Concurrent product-page workers (default: 10)")
    parser.add_argument("--request-interval", type=float, default=DEFAULT_REQUEST_INTERVAL, help="Minimum seconds between request starts per host (default: 0.20)")
    parser.add_argument("--timeout", type=float, default=20.0)
    parser.add_argument("--retries", type=int, default=2)
    parser.add_argument("--max-urls-per-site", type=int, default=5000)
    parser.add_argument("--max-discovered-urls-per-site", type=int, default=50000)
    parser.add_argument("--max-sitemap-documents", type=int, default=100)
    parser.add_argument("--url-prefilter-min-score", type=float, default=38.0)
    parser.add_argument("--uncertain-fallback-cap", type=int, default=50)
    parser.add_argument("--fuzzy-threshold", type=float, default=91.0)
    parser.add_argument("--user-agent", default=core.DEFAULT_USER_AGENT.replace("2.0", "4.4"))
    parser.add_argument("--ignore-robots", action="store_false", dest="respect_robots")
    parser.set_defaults(respect_robots=True)
    parser.add_argument("--verbose", action="store_true")
    return parser.parse_args(argv)


def main(argv: Sequence[str] | None = None) -> int:
    args = parse_args(argv)
    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(asctime)s %(levelname)s %(message)s",
    )
    if args.workers < 1 or args.workers > 16:
        raise SystemExit("ERROR: --workers must be between 1 and 16")
    if args.request_interval < 0:
        raise SystemExit("ERROR: --request-interval must be >= 0")

    brand_filter = {core.normalize_brand(item) for item in (args.brands or []) if core.normalize_brand(item)} or None
    products = core.load_catalog(args.catalog.resolve(), brand_filter)
    if not products:
        raise SystemExit("ERROR: no priced published catalog products matched the requested scope")

    target_brands = {core.normalize_brand(product.brand) for product in products if core.normalize_brand(product.brand)}
    logging.info("catalog_loaded products=%s brands=%s", len(products), ",".join(sorted(target_brands)))

    sink = LiveResults(args.output_dir.resolve(), products, args)
    client = core.HttpClient(
        timeout=args.timeout,
        retries=args.retries,
        interval=args.request_interval,
        user_agent=args.user_agent,
        respect_robots=args.respect_robots,
    )
    scraper = FastMarketScraper(
        client=client,
        sites=selected_active_sites(args.sites),
        products=products,
        max_urls=args.max_urls_per_site,
        max_sitemaps=args.max_sitemap_documents,
        max_discovered_urls=args.max_discovered_urls_per_site,
        prefilter_min_score=args.url_prefilter_min_score,
        uncertain_fallback_cap=args.uncertain_fallback_cap,
        workers=args.workers,
        sink=sink,
    )

    try:
        _listings, crawl_stats = scraper.run()
        sink.crawl_stats.update(crawl_stats)
        sink.finish("completed")
    except KeyboardInterrupt:
        sink.finish("interrupted")
        logging.warning("run_interrupted data_saved=%s", sink.output_dir)
        return 130
    except Exception:
        sink.finish("failed")
        raise

    print(json.dumps({
        "status": "completed",
        "catalog_products": len(products),
        "listings": len(sink.listings),
        "matches": len(sink.matches),
        "matched_skus": len(sink.matched_skus),
        "processed_urls": len(sink.processed_urls),
        "outputs": {key: str(value) for key, value in sink.paths.items()},
    }, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
