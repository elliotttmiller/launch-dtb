from __future__ import annotations

import sys
import unittest
from pathlib import Path

SUITE_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SUITE_ROOT))

from config import Config  # noqa: E402
from workflows.common import CheckoutFlowError, resolve_product_url  # noqa: E402


class ResolveProductUrlTests(unittest.TestCase):
    def setUp(self) -> None:
        self.config = Config(site_url="https://shop.example.test")

    def test_resolves_root_relative_path(self) -> None:
        self.config.product_url_path = "/products/tool"
        self.assertEqual(
            "https://shop.example.test/products/tool",
            resolve_product_url(self.config),
        )

    def test_preserves_same_origin_absolute_url(self) -> None:
        self.config.product_url_path = "https://shop.example.test/products/tool"
        self.assertEqual(
            "https://shop.example.test/products/tool",
            resolve_product_url(self.config),
        )

    def test_rejects_cross_origin_absolute_url(self) -> None:
        self.config.product_url_path = "https://malicious.example/products/tool"
        with self.assertRaises(CheckoutFlowError):
            resolve_product_url(self.config)


if __name__ == "__main__":
    unittest.main()
