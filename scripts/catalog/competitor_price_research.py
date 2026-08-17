#!/usr/bin/env python3
"""Fast, streaming competitor price research for the DTB catalog.

This remains a single-purpose cloudscraper research script. The extraction,
normalization, matching, and report logic lives in competitor_price_research_core;
this entrypoint adds bounded concurrent fetching and durable live report updates.
"""

from __future__ import annotations

import argparse
import csv
import json
import logging
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Sequence

from competitor_price_research_core import *  # noqa: F403,F401
import competitor_price_research_core as core


DEFAULT_WORKERS = 4
DEFAULT_REQUEST_INTERVAL = 0.35
PROGRESS_EVERY = 25


class SharedHostGate:
    """Small shared per-host request gate used by worker-local sessions."""

    def __init__(self, interval: float) -> None:
        self.interval = max(0.0, interval)
        self._lock = threading.Lock()
        self._last_by_host: dict[str, float] = {}

    def wait(self, url: str) -> None:
        host = (urlparse(url).hostname or "").lower()  # noqa: F405
        with self._lock:
            previous = self._last_by_host.get(host)
            if previous is not None:
                remaining = self.interval - (time.monotonic() - previous)
                if remaining > 0:
                    time.sleep(remaining)
            self._last_by_host[host] = time.monotonic()


class WorkerClients:
    """One cloudscraper session per worker thread, with one shared request gate."""

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


class LiveResults:
    """Persist usable evidence and reports after every successful product page."""

    def __init__(self, output_dir: Path, products: Sequence[core.CatalogProduct], args: argparse.Namespace) -> None:
        self.output_dir = output_dir
        self.products = list(products)
        self.args = args
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.paths = {
            "analysis": output_dir / "competitor_price_analysis.csv",
            "matches": output_dir / "competitor_price_matches.csv",
            "evidence": output_dir / "competitor_scrape_evidence.jsonl",
            "unmatched_listings": output_dir / "unmatched_competitor_listings.csv",
            "unmatched_catalog": output_dir / "unmatched_catalog_products.csv",
            "summary": output_dir / "run_summary.json",
        }
        self.listings: list[core.Listing] = []
        self._evidence_keys: set[tuple[str, str, str, str, str]] = set()
        self.crawl_stats: dict[str, Any] = {}
        self.started_at = datetime.now(timezone.utc).isoformat()
        self.successful_pages = 0

        self.paths["evidence"].write_text("", encoding="utf-8")
        self._refresh_reports(status="running")
        logging.info("live_outputs_ready dir=%s", self.output_dir)

    @staticmethod
    def _key(item: core.Listing) -> tuple[str, str, str, str, str]:
        return (
            item.site_key,
            core.canonicalize_url(item.url),
            core.normalize_identifier(item.sku or item.mpn or item.gtin),
            core.normalize_text(item.variant),
            core.decimal_text(item.current_price),
        )

    def record(self, extracted: Sequence[core.Listing]) -> None:
        fresh: list[core.Listing] = []
        for item in extracted:
            key = self._key(item)
            if key in self._evidence_keys:
                continue
            self._evidence_keys.add(key)
            fresh.append(item)

        if fresh:
            with self.paths["evidence"].open("a", encoding="utf-8", newline="\n") as handle:
                for item in fresh:
                    handle.write(json.dumps(core.serializable(asdict(item)), ensure_ascii=False, sort_keys=True) + "\n")
                handle.flush()
            self.listings = core.dedupe_listings([*self.listings, *fresh])

        self.successful_pages += 1
        self._refresh_reports(status="running")

    def update_site_stats(self, site_key: str, stats: dict[str, Any]) -> None:
        self.crawl_stats[site_key] = dict(stats)
        self._write_summary("running")

    def finish(self, status: str) -> None:
        self._refresh_reports(status=status)

    def _refresh_reports(self, status: str) -> None:
        matches, unmatched_listings, unmatched_products = core.match_listings(
            self.products,
            self.listings,
            self.args.fuzzy_threshold,
        )
        core.write_matches(self.paths["matches"], matches)
        core.write_analysis(self.paths["analysis"], self.products, matches)
        core.write_unmatched_listings(self.paths["unmatched_listings"], unmatched_listings)
        core.write_unmatched_catalog(self.paths["unmatched_catalog"], unmatched_products)
        self._write_summary(status, matches, unmatched_listings, unmatched_products)

    def _write_summary(
        self,
        status: str,
        matches: Sequence[core.Match] | None = None,
        unmatched_listings: Sequence[core.Listing] | None = None,
        unmatched_products: Sequence[core.CatalogProduct] | None = None,
    ) -> None:
        if matches is None or unmatched_listings is None or unmatched_products is None:
            matches, unmatched_listings, unmatched_products = core.match_listings(
                self.products,
                self.listings,
                self.args.fuzzy_threshold,
            )
        payload = {
            "schema_version": 3,
            "status": status,
            "started_at": self.started_at,
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "catalog": str(self.args.catalog),
            "sites": [site.key for site in core.selected_sites(self.args.sites)],
            "brand_filter": self.args.brands or [],
            "workers": self.args.workers,
            "request_interval_seconds": self.args.request_interval,
            "catalog_products_analyzed": len(self.products),
            "successful_product_pages": self.successful_pages,
            "competitor_listings_collected": len(self.listings),
            "matches": len(matches),
            "matched_catalog_products": len({match.dtb_sku for match in matches}),
            "unmatched_competitor_listings": len(unmatched_listings),
            "unmatched_catalog_products": len(unmatched_products),
            "crawl": self.crawl_stats,
            "outputs": {key: str(value) for key, value in self.paths.items()},
        }
        temp = self.paths["summary"].with_suffix(".json.tmp")
        temp.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")
        temp.replace(self.paths["summary"])


class FastMarketScraper(core.MarketScraper):
    """Existing discovery/parser behavior with bounded concurrent page fetches."""

    def __init__(self, *, workers: int, sink: LiveResults, **kwargs: Any) -> None:
        super().__init__(**kwargs)
        self.workers = max(1, workers)
        self.sink = sink
        self.worker_clients = WorkerClients(self.client, SharedHostGate(self.client.interval))

    def _fetch_one(self, site: core.SiteConfig, url: str, discovery_meta: dict[str, Any]) -> tuple[str, list[core.Listing], str | None]:
        try:
            response = self.worker_clients.get().get(url)
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
            urls, discovery = self.discover(site)
            selected_scores = discovery.pop("selected_url_scores", [])
            score_by_url = {item["url"]: item for item in selected_scores}
            allowed_urls: list[str] = []
            robots_skips = 0
            for url in urls:
                if self.client.allowed(url):
                    allowed_urls.append(url)
                else:
                    robots_skips += 1

            site_stats: dict[str, Any] = {
                **discovery,
                "candidate_urls": len(urls),
                "allowed_urls": len(allowed_urls),
                "fetched_urls": 0,
                "product_pages": 0,
                "listings": 0,
                "errors": 0,
                "robots_skips": robots_skips,
            }
            self.sink.update_site_stats(site.key, site_stats)
            logging.info(
                "site_start key=%s candidates=%s allowed=%s workers=%s discovered=%s rejected=%s fallback=%s",
                site.key, len(urls), len(allowed_urls), self.workers,
                site_stats.get("sitemap_product_urls", 0),
                site_stats.get("url_prefilter_rejected", 0),
                site_stats.get("url_prefilter_fallback", 0),
            )

            executor = ThreadPoolExecutor(max_workers=self.workers, thread_name_prefix=f"dtb-{site.key}")
            try:
                futures = {
                    executor.submit(self._fetch_one, site, url, score_by_url.get(url, {})): url
                    for url in allowed_urls
                }
                processed = 0
                for future in as_completed(futures):
                    processed += 1
                    _url, accepted, error = future.result()
                    site_stats["fetched_urls"] += 1
                    if error:
                        site_stats["errors"] += 1
                        logging.warning("page_fetch_failed site=%s url=%s error=%s", site.key, _url, error)
                    elif accepted:
                        site_stats["product_pages"] += 1
                        site_stats["listings"] += len(accepted)
                        self.sink.update_site_stats(site.key, site_stats)
                        self.sink.record(accepted)
                    if processed % PROGRESS_EVERY == 0 or processed == len(allowed_urls):
                        self.sink.update_site_stats(site.key, site_stats)
                        logging.info(
                            "site_progress key=%s processed=%s/%s product_pages=%s listings=%s errors=%s",
                            site.key, processed, len(allowed_urls), site_stats["product_pages"],
                            site_stats["listings"], site_stats["errors"],
                        )
            except KeyboardInterrupt:
                for future in futures:
                    future.cancel()
                executor.shutdown(wait=False, cancel_futures=True)
                self.sink.update_site_stats(site.key, site_stats)
                raise
            else:
                executor.shutdown(wait=True)

            stats[site.key] = dict(site_stats)
            self.sink.update_site_stats(site.key, site_stats)
            logging.info("site_done key=%s stats=%s", site.key, json.dumps(site_stats, sort_keys=True))

        stats["http"] = dict(self.client.metrics)
        return list(self.sink.listings), stats


def parse_args(argv: Sequence[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--catalog", type=Path, default=core.DEFAULT_CATALOG)
    parser.add_argument("--output-dir", type=Path, default=core.DEFAULT_OUTPUT_DIR)
    parser.add_argument("--sites", nargs="*", choices=[site.key for site in core.SITES])
    parser.add_argument("--brands", nargs="*")
    parser.add_argument("--workers", type=int, default=DEFAULT_WORKERS, help="Concurrent product-page workers per competitor (default: 4)")
    parser.add_argument("--request-interval", type=float, default=DEFAULT_REQUEST_INTERVAL, help="Minimum seconds between request starts per host (default: 0.35)")
    parser.add_argument("--timeout", type=float, default=25.0)
    parser.add_argument("--retries", type=int, default=2)
    parser.add_argument("--max-urls-per-site", type=int, default=5000)
    parser.add_argument("--max-discovered-urls-per-site", type=int, default=50000)
    parser.add_argument("--max-sitemap-documents", type=int, default=100)
    parser.add_argument("--url-prefilter-min-score", type=float, default=38.0, help="Higher precision than the previous 30-point default")
    parser.add_argument("--uncertain-fallback-cap", type=int, default=50, help="Small bounded fallback; previous default was 150")
    parser.add_argument("--fuzzy-threshold", type=float, default=91.0)
    parser.add_argument("--user-agent", default=core.DEFAULT_USER_AGENT.replace("2.0", "3.0"))
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
        sites=core.selected_sites(args.sites),
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

    matches, _, _ = core.match_listings(products, sink.listings, args.fuzzy_threshold)
    print(json.dumps({
        "status": "completed",
        "catalog_products": len(products),
        "listings": len(sink.listings),
        "matches": len(matches),
        "matched_skus": len({match.dtb_sku for match in matches}),
        "outputs": {key: str(value) for key, value in sink.paths.items()},
    }, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
