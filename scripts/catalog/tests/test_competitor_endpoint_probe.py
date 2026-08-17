from __future__ import annotations

import sys
import types
import unittest
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parents[1]
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

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
    def observation(self, **overrides):
        values = {
            "site_key": "all_wall",
            "sample_url": "https://www.all-wall.com/Product-A",
            "source": "browser",
            "method": "GET",
            "resource_type": "xhr",
            "status": 200,
            "url": "https://www.all-wall.com/api/cacheable/items?country=US&currency=USD&url=Product-A",
            "content_type": "application/json",
            "content_length": 1000,
            "same_origin": True,
            "structured": True,
            "platform_hint": "suitecommerce",
            "detected_fields": "currency|mpn|name|price|sku",
            "json_keys": "currency|items|mpn|name|price|sku",
        }
        values.update(overrides)
        return probe.NetworkObservation(**values)

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

    def test_endpoint_template_uses_semantic_query_placeholders(self) -> None:
        value = probe.endpoint_template(
            "https://www.all-wall.com/api/cacheable/items?c=590358&country=US&currency=USD&fieldset=details&url=TapeTech-Taper&pricelevel=5"
        )
        self.assertEqual(
            "https://www.all-wall.com/api/cacheable/items?c=%7Bsite_id%7D&country=%7Bcountry%7D&currency=%7Bcurrency%7D&fieldset=%7Bfieldset%7D&url=%7Bproduct_slug%7D&pricelevel=%7Bprice_level%7D",
            value,
        )

    def test_endpoint_template_generalizes_variant_and_uuid_paths(self) -> None:
        self.assertEqual(
            "https://example.com/variants/{variant_id}/details",
            probe.endpoint_template("https://example.com/variants/31471150596235/details"),
        )
        self.assertEqual(
            "https://api.example.com/v4/{uuid}/recommend/product",
            probe.endpoint_template("https://api.example.com/v4/f701e626-1fc2-4ccd-a04d-fe3dad4311e6/recommend/product"),
        )

    def test_static_and_analytics_noise_are_not_findings(self) -> None:
        static = self.observation(
            resource_type="script",
            url="https://cdn.searchspring.net/search/v3/js/searchspring.catalog.js",
            content_type="application/javascript",
            structured=False,
            detected_fields="",
            json_keys="",
            same_origin=False,
        )
        analytics = self.observation(
            method="POST",
            resource_type="fetch",
            url="https://analytics.google.com/g/collect?v=2",
            content_type="text/plain",
            structured=False,
            detected_fields="",
            json_keys="",
            same_origin=False,
        )
        self.assertFalse(probe.is_endpoint_finding(static))
        self.assertFalse(probe.is_endpoint_finding(analytics))

    def test_same_origin_structured_product_api_is_inventory_finding(self) -> None:
        finding = self.observation()
        self.assertTrue(probe.is_endpoint_finding(finding))
        self.assertEqual("browser_xhr", probe.endpoint_kind(finding))

    def test_third_party_structured_product_service_is_retained(self) -> None:
        finding = self.observation(
            site_key="wall_tools",
            sample_url="https://walltools.com/product/",
            url="https://api.findify.io/v4/f701e626-1fc2-4ccd-a04d-fe3dad4311e6/recommend/product",
            same_origin=False,
            resource_type="fetch",
            platform_hint="bigcommerce",
            detected_fields="name|price|sku",
        )
        self.assertTrue(probe.is_endpoint_finding(finding))

    def test_replay_candidates_only_include_relevant_get_endpoints(self) -> None:
        relevant = self.observation()
        post = self.observation(method="POST")
        noise = self.observation(url="https://analytics.google.com/g/collect?v=2", same_origin=False)
        self.assertEqual([relevant.url], probe.replay_candidates([relevant, post, noise]))

    def test_patterns_group_structures_and_record_direct_confirmation(self) -> None:
        browser = self.observation()
        replay = self.observation(source="direct_replay", resource_type="probe")
        patterns = probe.build_patterns([browser, replay])
        self.assertEqual(2, len(patterns))
        replay_pattern = next(item for item in patterns if item.endpoint_kind == "direct_replay")
        self.assertTrue(replay_pattern.direct_fetch_confirmed)
        self.assertEqual(1, replay_pattern.structured_count)
        self.assertNotIn("rank", replay_pattern.__dataclass_fields__)
        self.assertNotIn("confidence", replay_pattern.__dataclass_fields__)

    def test_repeated_url_overrides_are_preserved(self) -> None:
        result = probe.parse_url_overrides(
            [
                "csr_building=https://csrbuilding.com/en-us/products/a",
                "csr_building=https://csrbuilding.com/en-us/products/b",
            ]
        )
        self.assertEqual(2, len(result["csr_building"]))


if __name__ == "__main__":
    unittest.main()
