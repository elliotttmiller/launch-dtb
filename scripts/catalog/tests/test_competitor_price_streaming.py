from __future__ import annotations

import argparse
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
    def test_outputs_exist_at_start_and_update_after_one_product(self) -> None:
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
            workers=4,
            request_interval=0.35,
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
            matches = sink.paths["matches"].read_text(encoding="utf-8-sig")
            self.assertIn("gtin_exact", matches)
            summary = json.loads(sink.paths["summary"].read_text(encoding="utf-8"))
            self.assertEqual("running", summary["status"])
            self.assertEqual(1, summary["successful_product_pages"])
            self.assertEqual(1, summary["matched_catalog_products"])


if __name__ == "__main__":
    unittest.main()
