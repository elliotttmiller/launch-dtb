from __future__ import annotations

import sys
import types
import unittest
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parents[1]
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

# Helper tests do not launch Chromium.
if "playwright.sync_api" not in sys.modules:
    playwright_module = types.ModuleType("playwright")
    sync_api_module = types.ModuleType("playwright.sync_api")
    sync_api_module.BrowserContext = object
    sync_api_module.Page = object
    sync_api_module.Response = object
    sync_api_module.sync_playwright = object
    playwright_module.sync_api = sync_api_module
    sys.modules["playwright"] = playwright_module
    sys.modules["playwright.sync_api"] = sync_api_module

import competitor_endpoint_probe as probe  # noqa: E402


class CompetitorEndpointProbeTests(unittest.TestCase):
    def test_csr_collection_url_probes_only_us_product_endpoints(self) -> None:
        url = "https://csrbuilding.com/en-us/collections/columbia/products/columbia-corner-roller-cr"
        self.assertEqual(
            [
                "https://csrbuilding.com/en-us/products/columbia-corner-roller-cr.js",
                "https://csrbuilding.com/en-us/products/columbia-corner-roller-cr.json",
            ],
            probe.direct_probe_candidates("csr_building", url),
        )

    def test_sensitive_query_values_are_redacted(self) -> None:
        value = probe.redact_url("https://example.com/api/product?id=7&token=secret&sort=price")
        self.assertIn("id=7", value)
        self.assertIn("sort=price", value)
        self.assertIn("token=%5BREDACTED%5D", value)
        self.assertNotIn("secret", value)

    def test_endpoint_template_preserves_shopify_locale_and_suffix(self) -> None:
        self.assertEqual(
            "https://csrbuilding.com/en-us/products/{handle}.js",
            probe.endpoint_template("https://csrbuilding.com/en-us/products/columbia-corner-roller-cr.js"),
        )

    def test_endpoint_template_generalizes_query_values(self) -> None:
        value = probe.endpoint_template(
            "https://www.all-wall.com/api/cacheable/items?country=US&currency=USD&url=TapeTech-Taper"
        )
        self.assertEqual(
            "https://www.all-wall.com/api/cacheable/items?country=%7Bvalue%7D&currency=%7Bvalue%7D&url=%7Bvalue%7D",
            value,
        )

    def test_fetch_and_structured_responses_are_inventory_findings(self) -> None:
        fetch = probe.NetworkObservation(
            site_key="all_wall",
            source="browser",
            method="GET",
            resource_type="fetch",
            status=200,
            url="https://www.all-wall.com/api/cacheable/items?url=Example",
            content_type="application/json",
            content_length=1000,
            same_origin=True,
            structured=True,
            platform_hint="suitecommerce",
            detected_fields="price|sku|title",
            json_keys="items|price|sku|title",
        )
        self.assertTrue(probe.is_endpoint_finding(fetch))
        self.assertEqual("browser_fetch", probe.endpoint_kind(fetch))

    def test_patterns_group_duplicate_endpoint_structures_without_ranking(self) -> None:
        observations = [
            probe.NetworkObservation(
                site_key="all_wall",
                source="browser",
                method="GET",
                resource_type="xhr",
                status=200,
                url="https://www.all-wall.com/api/cacheable/items?country=US&url=Product-A",
                content_type="application/json",
                content_length=1000,
                same_origin=True,
                structured=True,
                platform_hint="suitecommerce",
                detected_fields="price|sku",
            ),
            probe.NetworkObservation(
                site_key="all_wall",
                source="browser",
                method="GET",
                resource_type="xhr",
                status=200,
                url="https://www.all-wall.com/api/cacheable/items?country=US&url=Product-B",
                content_type="application/json",
                content_length=1100,
                same_origin=True,
                structured=True,
                platform_hint="suitecommerce",
                detected_fields="price|title",
            ),
        ]
        patterns = probe.build_patterns(observations)
        self.assertEqual(1, len(patterns))
        self.assertEqual(2, patterns[0].observed_count)
        self.assertEqual("price|sku|title", patterns[0].detected_fields)
        self.assertNotIn("rank", patterns[0].__dataclass_fields__)


if __name__ == "__main__":
    unittest.main()
