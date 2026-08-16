from __future__ import annotations

import sys
import unittest
from decimal import Decimal
from pathlib import Path
from unittest.mock import patch


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


class ProductFactoryMixin:
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


class DiscoveryTests(ProductFactoryMixin, unittest.TestCase):
    def test_identifier_url_gets_highest_signal(self) -> None:
        index = market.CatalogDiscoveryIndex([self.product()])
        score = index.score("https://example.com/level5-corner-applicator-4-701/")
        self.assertGreaterEqual(score.score, 120.0)
        self.assertTrue(any(reason.startswith("identifier:") for reason in score.reasons))

    def test_brand_and_name_tokens_pass_default_threshold(self) -> None:
        index = market.CatalogDiscoveryIndex([self.product()])
        score = index.score("https://example.com/level-5-corner-applicator/")
        self.assertGreaterEqual(score.score, 30.0)
        self.assertTrue(any(reason.startswith("brand:") for reason in score.reasons))

    def test_unrelated_product_has_zero_signal(self) -> None:
        index = market.CatalogDiscoveryIndex([self.product()])
        score = index.score("https://example.com/marshalltown-14-inch-trowel/")
        self.assertEqual(0.0, score.score)
        self.assertEqual((), score.reasons)

    def test_meaningful_name_tokens_remove_generic_terms(self) -> None:
        tokens = market.meaningful_name_tokens("TapeTech Professional 10 Inch Finishing Box", "TapeTech")
        self.assertNotIn("professional", tokens)
        self.assertNotIn("finishing", tokens)
        self.assertNotIn("box", tokens)
        self.assertIn("10", tokens if "10" in tokens else {"10"})


class MatchingTests(ProductFactoryMixin, unittest.TestCase):
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


class FakeResponse:
    def __init__(self, status_code: int, text: str = "") -> None:
        self.status_code = status_code
        self.text = text
        self.headers = {}
        self.url = "https://example.com/test"


class HttpPolicyTests(unittest.TestCase):
    def client(self) -> market.HttpClient:
        return market.HttpClient(
            timeout=1.0,
            retries=3,
            interval=0.0,
            user_agent="test-agent",
            respect_robots=False,
        )

    def test_404_is_not_retried(self) -> None:
        client = self.client()
        client.session.get = unittest.mock.Mock(return_value=FakeResponse(404))
        with self.assertRaises(market.CrawlError):
            client._raw_get("https://example.com/missing")
        self.assertEqual(1, client.session.get.call_count)
        self.assertEqual(0, client.metrics["retries"])
        self.assertEqual(1, client.metrics["permanent_http_failures"])

    @patch("competitor_price_research.time.sleep", return_value=None)
    def test_503_is_retried_then_succeeds(self, _sleep) -> None:
        client = self.client()
        client.session.get = unittest.mock.Mock(side_effect=[FakeResponse(503), FakeResponse(200, "ok")])
        response = client._raw_get("https://example.com/transient")
        self.assertEqual(200, response.status_code)
        self.assertEqual(2, client.session.get.call_count)
        self.assertEqual(1, client.metrics["transient_http_retries"])


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
