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
    @staticmethod
    def product() -> market.CatalogProduct:
        return market.CatalogProduct(
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

    @staticmethod
    def args() -> argparse.Namespace:
        return argparse.Namespace(
            catalog=Path("catalog.csv"),
            sites=["als_taping_tools"],
            brands=["LEVEL5"],
            workers=10,
            request_interval=0.20,
            fuzzy_threshold=91.0,
        )

    @staticmethod
    def listing() -> market.Listing:
        return market.Listing(
            site_key="als_taping_tools",
            site_name="Al's Taping Tools",
            url="https://www.alstapingtools.com/level-5-corner-applicator/",
            title="Level 5 Corner Applicator",
            brand="Level 5",
            sku="LEV5-4766",
            mpn="4-701",
            gtin="815966023815",
            price=Decimal("302.00"),
            parse_method="jsonld",
        )

    def test_primary_match_is_streamed_immediately_with_compact_schema(self) -> None:
        product = self.product()
        args = self.args()
        listing = self.listing()

        with tempfile.TemporaryDirectory() as directory:
            sink = market.LiveResults(Path(directory), [product], args)
            for path in sink.paths.values():
                self.assertTrue(path.exists(), path)

            sink.record([listing])
            sink.mark_processed(listing.site_key, listing.url, "product")
            sink.checkpoint("running")

            evidence = sink.paths["evidence"].read_text(encoding="utf-8")
            self.assertIn("815966023815", evidence)

            with sink.paths["matches"].open("r", encoding="utf-8-sig", newline="") as handle:
                rows = list(csv.DictReader(handle))
            self.assertEqual(market.PRIMARY_MATCH_FIELDS, list(rows[0].keys()))
            self.assertEqual("4-701", rows[0]["dtb_sku"])
            self.assertEqual("299.00", rows[0]["dtb_price"])
            self.assertEqual("LEV5-4766", rows[0]["competitor_sku"])
            self.assertEqual("302.00", rows[0]["competitor_price"])
            self.assertEqual("-3.00", rows[0]["price_delta"])
            self.assertEqual(listing.url, rows[0]["competitor_url"])

            summary = json.loads(sink.paths["summary"].read_text(encoding="utf-8"))
            self.assertEqual("running", summary["status"])
            self.assertTrue(summary["resume_enabled"])
            self.assertEqual(1, summary["processed_url_count"])
            self.assertEqual(1, summary["matched_catalog_products"])
            sink.finish("completed")

    def test_resume_rehydrates_evidence_matches_and_processed_urls(self) -> None:
        product = self.product()
        args = self.args()
        listing = self.listing()

        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory)
            first = market.LiveResults(output, [product], args)
            first.record([listing])
            first.mark_processed(listing.site_key, listing.url, "product")
            first.finish("interrupted")

            second = market.LiveResults(output, [product], args)
            self.assertEqual(1, len(second.listings))
            self.assertEqual(1, len(second.matches))
            self.assertEqual({"4-701"}, second.matched_skus)
            self.assertTrue(second.is_processed(listing.site_key, listing.url))
            second.finish("completed")

    def test_legacy_completed_site_without_evidence_is_invalidated(self) -> None:
        product = self.product()
        args = self.args()
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory)
            (output / "run_summary.json").write_text(json.dumps({
                "status": "interrupted",
                "crawl": {
                    "als_taping_tools": {"allowed_urls": 1134, "fetched_urls": 1134},
                    "wall_tools": {"allowed_urls": 1412, "fetched_urls": 1412},
                },
            }), encoding="utf-8")
            sink = market.LiveResults(output, [product], args)
            self.assertEqual(set(), sink.legacy_completed_sites)
            self.assertNotIn("als_taping_tools", sink.crawl_stats)
            self.assertNotIn("wall_tools", sink.crawl_stats)
            sink.finish("completed")

    def test_legacy_completed_site_with_restored_evidence_remains_skippable(self) -> None:
        product = self.product()
        args = self.args()
        listing = self.listing()
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory)
            (output / "run_summary.json").write_text(json.dumps({
                "status": "interrupted",
                "crawl": {
                    "als_taping_tools": {"allowed_urls": 1134, "fetched_urls": 1134},
                },
            }), encoding="utf-8")
            (output / "competitor_scrape_evidence.jsonl").write_text(
                json.dumps(market.core.serializable(market.asdict(listing))) + "\n",
                encoding="utf-8",
            )
            sink = market.LiveResults(output, [product], args)
            self.assertEqual({"als_taping_tools"}, sink.legacy_completed_sites)
            self.assertEqual(1, len(sink.listings))
            sink.finish("completed")

    def test_default_scope_contains_only_three_active_competitors(self) -> None:
        self.assertEqual(
            ["als_taping_tools", "all_wall", "wall_tools"],
            [site.key for site in market.selected_active_sites(None)],
        )
        args = market.parse_args([])
        self.assertEqual(10, args.workers)
        self.assertEqual(0.20, args.request_interval)
        self.assertLessEqual(args.workers, 16)
        self.assertEqual(100, market.PROGRESS_EVERY)
        self.assertEqual(100, market.CHECKPOINT_EVERY)
        self.assertEqual(30.0, market.CHECKPOINT_INTERVAL_SECONDS)

    def test_all_wall_accepts_root_slug_product_urls(self) -> None:
        site = next(site for site in market.ACTIVE_SITES if site.key == "all_wall")
        self.assertEqual((), site.product_path_tokens)
        self.assertTrue(
            market.core.candidate_url(
                site,
                "https://www.all-wall.com/TapeTech-EasyClean-Automatic-Taper",
            )
        )

    def test_csr_is_not_a_valid_cli_site(self) -> None:
        with self.assertRaises(SystemExit):
            market.parse_args(["--sites", "csr_building"])


if __name__ == "__main__":
    unittest.main()
