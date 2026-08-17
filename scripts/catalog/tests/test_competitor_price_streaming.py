from __future__ import annotations

import argparse
import csv
import json
import tempfile
import unittest
from decimal import Decimal
from pathlib import Path

import sys
SCRIPT_DIR = Path(__file__).resolve().parents[1]
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

import competitor_price_research as market  # noqa: E402


class LivePersistenceTests(unittest.TestCase):
    def test_primary_match_is_streamed_immediately_with_compact_schema(self) -> None:
        product = market.CatalogProduct(
            sku="4-701",
            name="Level 5 Corner Applicator",
            brand="Level 5",
            product_type="simple",
            regular_price=Decimal("299.00"),
            sale_price=None,
            map_price=None,
            gtin="815966023815",
            mpn="4-701",
            manufacturer_sku="4-701",
            slug="level-5-corner-applicator",
        )
        args = argparse.Namespace(
            catalog=Path("catalog.csv"),
            sites=["csr_building"],
            brands=["LEVEL5"],
            workers=10,
            request_interval=0.20,
            fuzzy_threshold=91.0,
        )
        listing = market.Listing(
            site_key="csr_building",
            site_name="CSR Building Supplies",
            url="https://csrbuilding.com/en-us/products/level-5-corner-applicator",
            title="Level 5 Corner Applicator",
            brand="Level 5",
            sku="084-701",
            mpn="4-701",
            gtin="815966023815",
            price=Decimal("302.00"),
            parse_method="jsonld",
        )

        with tempfile.TemporaryDirectory() as directory:
            sink = market.LiveResults(Path(directory), [product], args)
            for path in sink.paths.values():
                self.assertTrue(path.exists(), path)

            sink.record([listing])
            sink.checkpoint("running")

            evidence = sink.paths["evidence"].read_text(encoding="utf-8")
            self.assertIn("815966023815", evidence)

            with sink.paths["matches"].open("r", encoding="utf-8-sig", newline="") as handle:
                rows = list(csv.DictReader(handle))
            self.assertEqual(market.PRIMARY_MATCH_FIELDS, list(rows[0].keys()))
            self.assertEqual("4-701", rows[0]["dtb_sku"])
            self.assertEqual("299.00", rows[0]["dtb_price"])
            self.assertEqual("084-701", rows[0]["competitor_sku"])
            self.assertEqual("302.00", rows[0]["competitor_price"])
            self.assertEqual("-3.00", rows[0]["price_delta"])
            self.assertEqual(listing.url, rows[0]["competitor_url"])

            summary = json.loads(sink.paths["summary"].read_text(encoding="utf-8"))
            self.assertEqual("running", summary["status"])
            self.assertEqual(1, summary["successful_product_pages"])
            self.assertEqual(1, summary["matched_catalog_products"])
            sink.finish("completed")

    def test_default_runtime_is_bounded_but_fast(self) -> None:
        args = market.parse_args([])
        self.assertEqual(10, args.workers)
        self.assertEqual(0.20, args.request_interval)
        self.assertLessEqual(args.workers, 16)
        self.assertEqual(100, market.PROGRESS_EVERY)
        self.assertEqual(100, market.CHECKPOINT_EVERY)
        self.assertEqual(30.0, market.CHECKPOINT_INTERVAL_SECONDS)

    def test_csr_collection_alias_collapses_to_us_product_url(self) -> None:
        source = "https://csrbuilding.com/en-us/collections/columbia/products/columbia-corner-roller-cr?variant=123"
        self.assertEqual(
            "https://csrbuilding.com/en-us/products/columbia-corner-roller-cr",
            market.canonical_csr_us_product_url(source),
        )

    def test_csr_direct_us_product_url_is_canonical(self) -> None:
        source = "https://csrbuilding.com/en-us/products/columbia-corner-roller-cr"
        self.assertEqual(source, market.canonical_csr_us_product_url(source))

    def test_csr_rejects_non_us_and_root_cad_product_urls(self) -> None:
        rejected = (
            "https://csrbuilding.com/products/columbia-corner-roller-cr",
            "https://csrbuilding.com/en-au/products/columbia-corner-roller-cr",
            "https://csrbuilding.com/en-gb/products/columbia-corner-roller-cr",
            "https://csrbuilding.com/fr/products/columbia-corner-roller-cr",
            "https://csrbuilding.com/es-us/products/columbia-corner-roller-cr",
        )
        for url in rejected:
            with self.subTest(url=url):
                self.assertIsNone(market.canonical_csr_us_product_url(url))

    def test_csr_runtime_has_site_specific_rate_limit(self) -> None:
        site = next(site for site in market.core.SITES if site.key == market.CSR_SITE_KEY)
        workers, interval, retries = market.FastMarketScraper._site_runtime(site, 10, 0.20, 2)
        self.assertEqual(4, workers)
        self.assertEqual(0.75, interval)
        self.assertEqual(1, retries)


if __name__ == "__main__":
    unittest.main()
