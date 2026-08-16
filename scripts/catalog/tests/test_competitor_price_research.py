from __future__ import annotations

import sys
import unittest
from decimal import Decimal
from pathlib import Path


SCRIPT_DIR = Path(__file__).resolve().parents[1]
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

import competitor_price_research as market  # noqa: E402


class SitemapTests(unittest.TestCase):
    def test_parses_urlset(self) -> None:
        xml = """<?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
          <url><loc>https://example.com/products/a</loc></url>
          <url><loc>https://example.com/products/b</loc></url>
        </urlset>
        """
        children, urls = market.parse_sitemap(xml)
        self.assertEqual([], children)
        self.assertEqual(
            ["https://example.com/products/a", "https://example.com/products/b"],
            urls,
        )

    def test_parses_sitemap_index(self) -> None:
        xml = """<?xml version="1.0" encoding="UTF-8"?>
        <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
          <sitemap><loc>https://example.com/sitemap_products_1.xml</loc></sitemap>
        </sitemapindex>
        """
        children, urls = market.parse_sitemap(xml)
        self.assertEqual(["https://example.com/sitemap_products_1.xml"], children)
        self.assertEqual([], urls)


class StructuredDataTests(unittest.TestCase):
    def test_extracts_product_jsonld(self) -> None:
        html = """
        <html><head>
          <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "Product",
            "name": "TapeTech EasyClean Automatic Taper",
            "brand": {"@type": "Brand", "name": "TapeTech"},
            "sku": "07TT",
            "mpn": "07TT",
            "offers": {
              "@type": "Offer",
              "priceCurrency": "USD",
              "price": "1499.00",
              "availability": "https://schema.org/InStock"
            }
          }
          </script>
        </head><body></body></html>
        """
        listings = market.parse_product_page(
            market.SITES[0],
            "https://www.alstapingtools.com/tapetech-easyclean-automatic-taper/",
            html,
        )
        self.assertEqual(1, len(listings))
        self.assertEqual("07TT", listings[0].sku)
        self.assertEqual("TapeTech", listings[0].brand)
        self.assertEqual(Decimal("1499.00"), listings[0].current_price)
        self.assertEqual("jsonld", listings[0].parse_method)

    def test_extracts_shopify_variant_money_in_cents(self) -> None:
        html = """
        <html><head></head><body>
          <script id="ProductJson" type="application/json">
          {
            "title": "Level 5 Corner Applicator",
            "vendor": "Level 5",
            "variants": [
              {"title": "7 inch", "sku": "084-701", "barcode": "815966023815", "price": 30200, "compare_at_price": null, "available": true}
            ]
          }
          </script>
        </body></html>
        """
        site = next(site for site in market.SITES if site.key == "csr_building")
        listings = market.parse_product_page(site, "https://csrbuilding.com/en-us/products/level-5-corner-applicator", html)
        self.assertEqual(1, len(listings))
        self.assertEqual(Decimal("302.00"), listings[0].current_price)
        self.assertEqual("084-701", listings[0].sku)
        self.assertEqual("shopify_json", listings[0].parse_method)


class MatchingTests(unittest.TestCase):
    def product(self, **overrides):
        values = {
            "sku": "4-701",
            "name": "Level 5 Corner Applicator",
            "brand": "Level 5",
            "product_type": "simple",
            "regular_price": Decimal("299.00"),
            "sale_price": None,
            "map_price": None,
            "gtin": "815966023815",
            "mpn": "4-701",
            "manufacturer_sku": "4-701",
            "slug": "level-5-corner-applicator",
        }
        values.update(overrides)
        return market.CatalogProduct(**values)

    def listing(self, **overrides):
        values = {
            "site_key": "csr_building",
            "site_name": "CSR Building Supplies",
            "url": "https://csrbuilding.com/en-us/products/level-5-corner-applicator",
            "title": "Level 5 Corner Applicator",
            "brand": "Level 5",
            "sku": "084-701",
            "mpn": "4-701",
            "gtin": "815966023815",
            "price": Decimal("302.00"),
        }
        values.update(overrides)
        return market.Listing(**values)

    def test_gtin_exact_has_highest_precedence(self) -> None:
        matches, unmatched, missing = market.match_listings(
            [self.product()],
            [self.listing()],
            91.0,
        )
        self.assertEqual(1, len(matches))
        self.assertEqual("gtin_exact", matches[0].match_method)
        self.assertEqual([], unmatched)
        self.assertEqual([], missing)

    def test_conflicting_brand_is_rejected(self) -> None:
        matches, unmatched, missing = market.match_listings(
            [self.product()],
            [self.listing(brand="TapeTech")],
            91.0,
        )
        self.assertEqual([], matches)
        self.assertEqual(1, len(unmatched))
        self.assertEqual(1, len(missing))

    def test_single_source_is_not_called_market_aligned(self) -> None:
        self.assertEqual(
            "single_source_only",
            market.market_position(Decimal("0.50"), 1),
        )


class NormalizationTests(unittest.TestCase):
    def test_brand_aliases(self) -> None:
        self.assertEqual("level5", market.normalize_brand("Level 5"))
        self.assertEqual("tapetech", market.normalize_brand("TapeTech Tools"))
        self.assertEqual("dura stilt", market.normalize_brand("Dura-Stilts"))

    def test_url_tracking_is_removed(self) -> None:
        self.assertEqual(
            "https://example.com/product?a=1",
            market.canonicalize_url("https://example.com/product?utm_source=x&a=1#details"),
        )


if __name__ == "__main__":
    unittest.main()
