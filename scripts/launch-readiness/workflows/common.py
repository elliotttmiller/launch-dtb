"""Shared browser-driven customer actions used by both the guest and
registered-customer checkout workflows.

Kept in one place so "add a product to the cart" or "pay with the Stripe
test card" is implemented once, not duplicated between the two simulations
(they differ only in account creation/login around the same checkout core).

Checkout runs against the real, full-document WooCommerce Checkout Block at
`/checkout/` (see `frontend/src/utils/checkoutUrl.js` and `AGENTS.md` section
6) — this module drives that native page, not a simulated one.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import TYPE_CHECKING

from playwright.sync_api import TimeoutError as PlaywrightTimeoutError

if TYPE_CHECKING:
    from playwright.sync_api import Page

    from config import Config


@dataclass(slots=True)
class ProductInfo:
    name: str
    url: str


@dataclass(slots=True)
class OrderConfirmation:
    order_number: str
    order_id: int | None
    confirmation_url: str


class CheckoutFlowError(RuntimeError):
    """Raised when a customer-simulation step cannot complete as expected."""


def find_first_purchasable_product(page: "Page", config: "Config") -> ProductInfo:
    """Return the first product listed on the Shop page, or the configured one."""

    if config.product_url_path:
        url = f"{config.site_url}{config.product_url_path}"
        page.goto(url, wait_until="networkidle")
        title = page.title()
        return ProductInfo(name=title, url=url)

    page.goto(f"{config.site_url}/products", wait_until="networkidle")
    link = page.locator('a[href*="/products/"]').first
    try:
        link.wait_for(state="visible", timeout=config.browser_timeout_ms)
    except PlaywrightTimeoutError as exc:
        raise CheckoutFlowError("No product links found on the Shop page.") from exc

    href = link.get_attribute("href") or ""
    name = (link.get_attribute("aria-label") or link.inner_text() or "product").strip()
    url = href if href.startswith("http") else f"{config.site_url}{href}"
    return ProductInfo(name=name or "product", url=url)


def add_product_to_cart(page: "Page", config: "Config", product: ProductInfo) -> None:
    page.goto(product.url, wait_until="networkidle")
    add_to_cart = page.get_by_role("button", name=re.compile("add to cart", re.I)).first
    add_to_cart.wait_for(state="visible", timeout=config.browser_timeout_ms)
    add_to_cart.click()
    # Confirmation is either an inline toast/badge update or a cart-drawer open;
    # give the storefront a moment to reflect the new cart state before we read it.
    page.wait_for_timeout(1500)


def go_to_cart(page: "Page", config: "Config") -> None:
    page.goto(f"{config.site_url}/cart", wait_until="networkidle")


def cart_has_items(page: "Page") -> bool:
    body = page.inner_text("body").lower()
    if "your cart is empty" in body or "cart is empty" in body:
        return False
    return True


def proceed_to_checkout(page: "Page", config: "Config") -> None:
    checkout_link = page.get_by_role("link", name=re.compile("checkout", re.I)).first
    try:
        checkout_link.wait_for(state="visible", timeout=config.browser_timeout_ms)
        checkout_link.click()
    except PlaywrightTimeoutError:
        # Fall back to the canonical full-document checkout route directly.
        page.goto(f"{config.site_url}/checkout/", wait_until="networkidle")
    page.wait_for_load_state("networkidle")


def _fill_first_matching(page: "Page", selectors: list[str], value: str) -> bool:
    for selector in selectors:
        locator = page.locator(selector).first
        try:
            if locator.count() and locator.is_visible():
                locator.fill(value)
                return True
        except PlaywrightTimeoutError:
            continue
    return False


def fill_billing_details(page: "Page", email: str, first_name: str, last_name: str) -> None:
    """Fill the native WooCommerce Checkout Block billing/contact fields."""

    fields: list[tuple[list[str], str]] = [
        (["#email", 'input[name="email"]'], email),
        (["#billing-first_name", "#billing_first_name"], first_name),
        (["#billing-last_name", "#billing_last_name"], last_name),
        (["#billing-address_1", "#billing_address_1"], "123 Contractor Way"),
        (["#billing-city", "#billing_city"], "Chicago"),
        (["#billing-postcode", "#billing_postcode"], "60601"),
        (["#billing-phone", "#billing_phone"], "3125551234"),
    ]
    missing = []
    for selectors, value in fields:
        if not _fill_first_matching(page, selectors, value):
            missing.append(selectors[0])

    _select_state(page, "IL")

    if missing:
        raise CheckoutFlowError(f"Could not locate checkout fields: {', '.join(missing)}")


def _select_state(page: "Page", state_code: str) -> None:
    for selector in ["#billing-state", "#billing_state"]:
        locator = page.locator(selector).first
        if not locator.count():
            continue
        try:
            tag = locator.evaluate("el => el.tagName.toLowerCase()")
        except PlaywrightTimeoutError:
            continue
        try:
            if tag == "select":
                locator.select_option(state_code)
            else:
                locator.click()
                page.get_by_role("option", name=re.compile(rf"^{state_code}\b|Illinois", re.I)).first.click()
            return
        except PlaywrightTimeoutError:
            continue


def select_a_shipping_method(page: "Page") -> None:
    option = page.locator('input[type="radio"][name*="shipping"]').first
    try:
        if option.count() and option.is_visible():
            option.check()
            page.wait_for_timeout(500)
    except PlaywrightTimeoutError:
        pass  # A single free-shipping method may already be pre-selected with no radio group.


def pay_with_stripe_test_card(page: "Page", config: "Config") -> None:
    """Fill the Stripe Payment Element inside its secure iframe with a test card."""

    frame = page.frame_locator('iframe[title*="Secure payment input frame"]').first
    try:
        frame.get_by_placeholder(re.compile("card number", re.I)).fill(config.stripe_test_card_number)
        frame.get_by_placeholder(re.compile("mm\\s*/\\s*yy", re.I)).fill(config.stripe_test_card_exp)
        frame.get_by_placeholder(re.compile("cvc", re.I)).fill(config.stripe_test_card_cvc)
        zip_field = frame.get_by_placeholder(re.compile("zip|postal", re.I))
        if zip_field.count():
            zip_field.fill(config.stripe_test_card_zip)
    except PlaywrightTimeoutError as exc:
        raise CheckoutFlowError(
            "Could not fill the Stripe Payment Element — the storefront's Stripe "
            "iframe markup may not match the suite's selectors and needs tuning."
        ) from exc


def place_order(page: "Page", config: "Config") -> OrderConfirmation:
    place_order_button = page.get_by_role("button", name=re.compile("place order", re.I)).first
    place_order_button.wait_for(state="visible", timeout=config.browser_timeout_ms)
    place_order_button.click()

    try:
        page.wait_for_url(re.compile(r"(order-received|/order/|thank-you)", re.I), timeout=config.browser_timeout_ms * 2)
    except PlaywrightTimeoutError as exc:
        raise CheckoutFlowError(
            "Checkout did not reach an order-confirmation page after placing the order "
            "(payment may have failed or requires manual 3-D Secure handling)."
        ) from exc

    page.wait_for_load_state("networkidle")
    url = page.url
    match = re.search(r"order-received/(\d+)|/order/(\d+)|order[-_]?id=(\d+)", url, re.I)
    order_id = int(next(g for g in (match.groups() if match else []) if g)) if match else None

    body = page.inner_text("body")
    number_match = re.search(r"order\s*(?:number|#)\s*[:#]?\s*([A-Za-z0-9-]+)", body, re.I)
    order_number = number_match.group(1) if number_match else (str(order_id) if order_id else "")

    if not order_number:
        raise CheckoutFlowError("Order confirmation page did not expose an order number.")

    return OrderConfirmation(order_number=order_number, order_id=order_id, confirmation_url=url)


def register_account(page: "Page", config: "Config", email: str, password: str, first_name: str) -> None:
    page.goto(f"{config.site_url}/register", wait_until="networkidle")
    if not _fill_first_matching(page, ['input[name="email"]', "#email"], email):
        raise CheckoutFlowError("Registration form email field not found.")
    _fill_first_matching(page, ['input[name="firstName"]', 'input[name="first_name"]', "#first_name"], first_name)
    if not _fill_first_matching(
        page, ['input[name="password"]', "#password", 'input[type="password"]'], password
    ):
        raise CheckoutFlowError("Registration form password field not found.")
    submit = page.get_by_role("button", name=re.compile("register|create account|sign up", re.I)).first
    submit.click()
    page.wait_for_load_state("networkidle")


def login(page: "Page", config: "Config", email: str, password: str) -> None:
    page.goto(f"{config.site_url}/login", wait_until="networkidle")
    if not _fill_first_matching(page, ['input[name="email"]', "#email", 'input[type="email"]'], email):
        raise CheckoutFlowError("Login form email field not found.")
    if not _fill_first_matching(page, ['input[name="password"]', "#password", 'input[type="password"]'], password):
        raise CheckoutFlowError("Login form password field not found.")
    submit = page.get_by_role("button", name=re.compile("log ?in|sign in", re.I)).first
    submit.click()
    page.wait_for_load_state("networkidle")


def logout(page: "Page", config: "Config") -> None:
    logout_link = page.get_by_role("link", name=re.compile("log ?out|sign out", re.I)).first
    try:
        logout_link.wait_for(state="visible", timeout=5_000)
        logout_link.click()
        page.wait_for_load_state("networkidle")
        return
    except PlaywrightTimeoutError:
        pass
    page.goto(f"{config.site_url}/wp-login.php?action=logout", wait_until="networkidle")


def order_appears_in_history(page: "Page", config: "Config", order_number: str) -> bool:
    page.goto(f"{config.site_url}/dashboard?tab=orders", wait_until="networkidle")
    page.wait_for_timeout(1000)
    body = page.inner_text("body")
    return order_number in body
