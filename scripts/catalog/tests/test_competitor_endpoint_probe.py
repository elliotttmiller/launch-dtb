from __future__ import annotations

import sys
import types
import unittest
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parents[1]
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

# Helper tests do not launch Chromium. Provide a minimal import shim so this regression
# suite can validate URL/candidate/ranking behavior without installing browser binaries.
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

    def test_shopify_js_with_product_fields_wins_recommendation(self) -> None:
        observations = [
            probe.NetworkObservation(
                site_key="csr_building",
                source="direct_probe",
                method="GET",
                resource_type="probe",
                status=200,
                url="https://csrbuilding.com/en-us/products/columbia-corner-roller-cr.js",
                content_type="application/json",
                content_length=1200,
                same_origin=True,
                structured=True,
                product_score=22,
                platform_hint="shopify",
                elapsed_ms=80,
            ),
            probe.NetworkObservation(
                site_key="csr_building",
                source="browser",
                method="GET",
                resource_type="document",
                status=200,
                url="https://csrbuilding.com/en-us/products/columbia-corner-roller-cr",
                content_type="text/html",
                content_length=150000,
                same_origin=True,
                structured=False,
                product_score=0,
                platform_hint="shopify",
            ),
        ]
        result = probe.choose_recommendation(
            "csr_building",
            "https://csrbuilding.com/en-us/collections/columbia/products/columbia-corner-roller-cr",
            "https://csrbuilding.com/en-us/products/columbia-corner-roller-cr",
            observations,
        )
        self.assertEqual("shopify_product_js", result.recommended_method)
        self.assertEqual("high", result.confidence)
        self.assertEqual(
            "https://csrbuilding.com/en-us/products/{handle}.js",
            result.endpoint_template,
        )


if __name__ == "__main__":
    unittest.main()
