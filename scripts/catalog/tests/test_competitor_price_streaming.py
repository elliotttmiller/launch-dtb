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
            workers=8,
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

    def test_default_runtime_is_bounded_but_faster(self) -> None:
        args = market.parse_args([])
        self.assertEqual(8, args.workers)
        self.assertEqual(0.20, args.request_interval)
        self.assertLessEqual(args.workers, 16)


if __name__ == "__main__":
    unittest.main()
