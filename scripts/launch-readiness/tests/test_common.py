from __future__ import annotations

import sys
import unittest
from pathlib import Path
from unittest.mock import Mock, patch

SUITE_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SUITE_ROOT))

from config import Config  # noqa: E402
from integrations.woocommerce import CheckoutExpectation, OrderSnapshot, WooCommerceClient  # noqa: E402
from workflows.common import (  # noqa: E402
    CheckoutFlowError,
    _require_successful_auth_response,
    configured_product,
    find_first_purchasable_product,
    order_id_from_confirmation_url,
    resolve_product_url,
)


class TestCustomerEmailConfigTests(unittest.TestCase):
    def test_base_address_generates_unique_role_alias(self) -> None:
        config = Config(test_customer_email_address="owner@gmail.com")

        self.assertEqual(
            "owner+launch-readiness-guest-ab12cd34@gmail.com",
            config.make_test_customer_email("guest", "ab12cd34"),
        )

    def test_base_address_takes_precedence_over_domain_fallback(self) -> None:
        config = Config(
            test_customer_email_address="owner@gmail.com",
            test_customer_email_domain="ignored.example.test",
        )

        self.assertEqual(
            "owner+launch-readiness-customer-ef56gh78@gmail.com",
            config.make_test_customer_email("customer", "ef56gh78"),
        )

    def test_domain_fallback_remains_backward_compatible(self) -> None:
        config = Config(test_customer_email_domain="mail.example.test")

        self.assertEqual(
            "guest+ab12cd34@mail.example.test",
            config.make_test_customer_email("guest", "ab12cd34"),
        )

    def test_invalid_base_address_is_rejected(self) -> None:
        config = Config(test_customer_email_address="not-an-address")

        with self.assertRaisesRegex(ValueError, "LAUNCH_TEST_EMAIL_ADDRESS"):
            config.make_test_customer_email("guest", "ab12cd34")


class AuthResponseContractTests(unittest.TestCase):
    def test_accepts_confirmed_auth_response(self) -> None:
        response = Mock(status=200)
        response.json.return_value = {"success": True, "user": {"id": 42}}

        data = _require_successful_auth_response(response, "Login")

        self.assertEqual(42, data["user"]["id"])

    def test_rejects_auth_error_with_server_message(self) -> None:
        response = Mock(status=401)
        response.json.return_value = {"success": False, "message": "Invalid credentials."}

        with self.assertRaisesRegex(CheckoutFlowError, "HTTP 401: Invalid credentials"):
            _require_successful_auth_response(response, "Login")

    def test_rejects_success_without_user_identity(self) -> None:
        response = Mock(status=200)
        response.json.return_value = {"success": True, "user": None}

        with self.assertRaisesRegex(CheckoutFlowError, "HTTP 200"):
            _require_successful_auth_response(response, "Registration")


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


class ConfiguredProductTests(unittest.TestCase):
    def setUp(self) -> None:
        self.config = Config(site_url="https://shop.example.test")
        self.page = Mock()

    @staticmethod
    def store_api_response(products: list[dict]) -> Mock:
        response = Mock()
        response.json.return_value = products
        return response

    @patch("workflows.common.requests.get")
    def test_returns_exact_live_purchasable_product(self, get: Mock) -> None:
        self.config.product_url_path = "/products/tool-kit"
        get.return_value = self.store_api_response(
            [
                {
                    "name": "Tool Kit",
                    "slug": "tool-kit",
                    "is_purchasable": True,
                    "is_in_stock": True,
                }
            ]
        )

        product = find_first_purchasable_product(self.page, self.config)

        self.assertEqual("Tool Kit", product.name)
        self.assertEqual("https://shop.example.test/products/tool-kit", product.url)
        self.page.goto.assert_called_once_with(product.url, wait_until="domcontentloaded")

    @patch("workflows.common.requests.get")
    def test_rejects_stale_configured_slug_before_browser_navigation(self, get: Mock) -> None:
        self.config.product_url_path = "/products/stale-tool"
        get.return_value = self.store_api_response([])

        with self.assertRaisesRegex(CheckoutFlowError, "does not identify a live"):
            find_first_purchasable_product(self.page, self.config)

        self.page.goto.assert_not_called()

    @patch("workflows.common.requests.get")
    def test_rejects_unpurchasable_configured_product(self, get: Mock) -> None:
        self.config.product_url_path = "/products/tool-kit"
        get.return_value = self.store_api_response(
            [
                {
                    "name": "Tool Kit",
                    "slug": "tool-kit",
                    "is_purchasable": False,
                    "is_in_stock": True,
                }
            ]
        )

        with self.assertRaisesRegex(CheckoutFlowError, "not currently purchasable"):
            find_first_purchasable_product(self.page, self.config)

        self.page.goto.assert_not_called()

    @patch("workflows.common.requests.get")
    def test_configured_product_can_be_preflighted_without_browser(self, get: Mock) -> None:
        self.config.product_url_path = "/products/tool-kit"
        get.return_value = self.store_api_response(
            [
                {
                    "name": "Tool Kit",
                    "slug": "tool-kit",
                    "is_purchasable": True,
                    "is_in_stock": True,
                }
            ]
        )

        product = configured_product(self.config)

        self.assertIsNotNone(product)
        self.assertEqual("Tool Kit", product.name)
        self.page.goto.assert_not_called()

        cached = configured_product(self.config)
        self.assertEqual(product, cached)
        get.assert_called_once()


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


class WooCommerceVerificationTests(unittest.TestCase):
    @staticmethod
    def snapshot(*, shipping_lines: list[dict], customer_id: int = 0) -> OrderSnapshot:
        return OrderSnapshot(
            order_id=1,
            number="1",
            status="processing",
            currency="USD",
            total=100.0,
            shipping_total=0.0,
            total_tax=0.0,
            payment_method="stripe_upm",
            date_paid="2026-07-30T00:00:00",
            billing_email="buyer@example.test",
            customer_id=customer_id,
            raw={"shipping_lines": shipping_lines},
        )

    def test_free_shipping_line_is_valid_shipping(self) -> None:
        order = self.snapshot(
            shipping_lines=[
                {
                    "method_id": "free_shipping",
                    "method_title": "Free shipping",
                    "total": "0.00",
                }
            ]
        )
        checks = WooCommerceClient(Config()).verify(
            order,
            CheckoutExpectation(email="buyer@example.test"),
        )
        shipping = next(check for check in checks if check[0] == "Shipping method was recorded")
        self.assertTrue(shipping[1])

    def test_registered_order_requires_customer_assignment(self) -> None:
        order = self.snapshot(shipping_lines=[], customer_id=0)
        checks = WooCommerceClient(Config()).verify(
            order,
            CheckoutExpectation(
                email="buyer@example.test",
                expect_shipping=False,
                expect_registered_customer=True,
            ),
        )
        customer = next(
            check
            for check in checks
            if check[0] == "Order is assigned to the registered WooCommerce customer"
        )
        self.assertFalse(customer[1])


if __name__ == "__main__":
    unittest.main()
