from __future__ import annotations

import sys
import unittest
from pathlib import Path

SUITE_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SUITE_ROOT))

from config import Config  # noqa: E402
from workflows.common import (  # noqa: E402
    CheckoutFlowError,
    order_id_from_confirmation_url,
    resolve_product_url,
)


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


class OrderConfirmationUrlTests(unittest.TestCase):
    def test_recognizes_native_woocommerce_confirmation(self) -> None:
        self.assertEqual(
            5831,
            order_id_from_confirmation_url(
                "https://shop.example.test/checkout/order-received/5831/?key=wc_order_example"
            ),
        )

    def test_recognizes_dtb_tracking_confirmation(self) -> None:
        self.assertEqual(
            5831,
            order_id_from_confirmation_url(
                "https://shop.example.test/order-tracking/5831"
                "?order_key=wc_order_example&checkout_complete=1"
            ),
        )

    def test_rejects_normal_tracking_link_as_checkout_confirmation(self) -> None:
        self.assertIsNone(
            order_id_from_confirmation_url(
                "https://shop.example.test/order-tracking/5831?order_key=wc_order_example"
            )
        )


if __name__ == "__main__":
    unittest.main()
