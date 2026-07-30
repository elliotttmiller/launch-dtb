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
from urllib.parse import urljoin, urlsplit

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


class OrderConfirmationPageError(CheckoutFlowError):
    """Raised when an order exists but its confirmation document did not render."""

    def __init__(self, message: str, confirmation: OrderConfirmation) -> None:
        super().__init__(message)
        self.confirmation = confirmation


def resolve_product_url(config: "Config") -> str:
    """Resolve the configured product path without permitting another origin."""

    configured = config.product_url_path.strip()
    if not configured:
        return ""

    url = urljoin(f"{config.site_url}/", configured)
    site = urlsplit(config.site_url)
    product = urlsplit(url)
    if (product.scheme, product.netloc) != (site.scheme, site.netloc):
        raise CheckoutFlowError(
            "LAUNCH_PRODUCT_URL_PATH must be a path or an absolute URL on "
            f"{site.scheme}://{site.netloc}."
        )
    return url


def find_first_purchasable_product(page: "Page", config: "Config") -> ProductInfo:
    """Return the first product listed on the Shop page, or the configured one."""

    if config.product_url_path:
        url = resolve_product_url(config)
        page.goto(url, wait_until="domcontentloaded")
        title = page.title()
        return ProductInfo(name=title, url=url)

    page.goto(f"{config.site_url}/products", wait_until="domcontentloaded")
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
    page.goto(product.url, wait_until="domcontentloaded")
    add_to_cart = page.get_by_role("button", name=re.compile("add to cart", re.I)).first
    add_to_cart.wait_for(state="visible", timeout=config.browser_timeout_ms)
    add_to_cart.click()
    # Confirmation is either an inline toast/badge update or a cart-drawer open;
    # give the storefront a moment to reflect the new cart state before we read it.
    page.wait_for_timeout(1500)


def go_to_cart(page: "Page", config: "Config") -> None:
    page.goto(f"{config.site_url}/cart", wait_until="domcontentloaded")


def cart_has_items(page: "Page") -> bool:
    body = page.inner_text("body").lower()
    if "your cart is empty" in body or "cart is empty" in body:
        return False
    return True


def proceed_to_checkout(page: "Page", config: "Config") -> None:
    # Checkout is intentionally a full-document WooCommerce handoff, not a
    # client-side React transition.
    page.goto(f"{config.site_url}/checkout/", wait_until="domcontentloaded")

    # Stripe and Woo Blocks keep background connections active, so
    # `networkidle` is not a reliable checkout-readiness signal.
    page.locator("#email, .wc-block-checkout").first.wait_for(
        state="visible",
        timeout=config.browser_timeout_ms * 2,
    )


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
    """Fill DTB contact fields and the native Checkout Block shipping address."""

    fields: list[tuple[list[str], str]] = [
        (["#email", 'input[name="email"]'], email),
        (
            [
                "#contact-dtb-first_name",
                'input[name="contact_dtb/first_name"]',
                "#shipping-first_name",
                "#billing-first_name",
                "#billing_first_name",
            ],
            first_name,
        ),
        (
            [
                "#contact-dtb-last_name",
                'input[name="contact_dtb/last_name"]',
                "#shipping-last_name",
                "#billing-last_name",
                "#billing_last_name",
            ],
            last_name,
        ),
        (["#shipping-address_1", "#billing-address_1", "#billing_address_1"], "123 Contractor Way"),
        (["#shipping-city", "#billing-city", "#billing_city"], "Chicago"),
        (["#shipping-postcode", "#billing-postcode", "#billing_postcode"], "60601"),
        (
            [
                "#contact-dtb-phone",
                'input[name="contact_dtb/phone"]',
                "#shipping-phone",
                "#billing-phone",
                "#billing_phone",
            ],
            "3125551234",
        ),
    ]
    missing = []
    for selectors, value in fields:
        if not _fill_first_matching(page, selectors, value):
            missing.append(selectors[0])

    _select_state(page, "IL")

    if missing:
        raise CheckoutFlowError(f"Could not locate checkout fields: {', '.join(missing)}")


def _select_state(page: "Page", state_code: str) -> None:
    for selector in ["#shipping-state", "#billing-state", "#billing_state"]:
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

    gateway = page.locator(
        '#radio-control-wc-payment-method-options-stripe_upm, '
        'input[type="radio"][value="stripe_upm"]'
    ).first
    try:
        if gateway.count() and not gateway.is_checked():
            gateway.check()
    except PlaywrightTimeoutError:
        pass

    frame = page.frame_locator('iframe[title*="Secure payment input frame"]').first
    try:
        card_method = frame.get_by_text(re.compile(r"^Card$", re.I)).first
        card_method.wait_for(state="visible", timeout=config.browser_timeout_ms)
        card_method.click()

        number = frame.locator(
            'input[name="number"], input[autocomplete="cc-number"], input[aria-label*="card number" i]'
        ).first
        number.wait_for(state="visible", timeout=config.browser_timeout_ms)
        number.fill(config.stripe_test_card_number)

        frame.locator(
            'input[name="expiry"], input[autocomplete="cc-exp"], input[aria-label*="expiration" i]'
        ).first.fill(config.stripe_test_card_exp)
        frame.locator(
            'input[name="cvc"], input[autocomplete="cc-csc"], input[aria-label*="security code" i]'
        ).first.fill(config.stripe_test_card_cvc)
        zip_field = frame.locator(
            'input[name="postalCode"], input[autocomplete="postal-code"], '
            'input[aria-label*="postal" i], input[aria-label*="ZIP" i]'
        ).first
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

    try:
        with page.expect_navigation(
            wait_until="domcontentloaded",
            timeout=config.browser_timeout_ms * 4,
        ) as navigation:
            place_order_button.click()
        response = navigation.value
    except PlaywrightTimeoutError as exc:
        raise CheckoutFlowError(
            "Checkout did not reach an order-confirmation page after placing the order "
            "(payment may have failed or requires manual 3-D Secure handling)."
        ) from exc

    url = page.url
    if not re.search(r"(order-received|/order/|thank-you)", url, re.I):
        raise CheckoutFlowError(f"Checkout navigated to an unexpected post-payment URL: {url}")

    match = re.search(r"order-received/(\d+)|/order/(\d+)|order[-_]?id=(\d+)", url, re.I)
    order_id = int(next(g for g in (match.groups() if match else []) if g)) if match else None

    body = page.inner_text("body")
    number_match = re.search(r"order\s*(?:number|#)\s*[:#]?\s*([A-Za-z0-9-]+)", body, re.I)
    order_number = number_match.group(1) if number_match else (str(order_id) if order_id else "")

    if not order_number:
        raise CheckoutFlowError("Order confirmation page did not expose an order number.")

    confirmation = OrderConfirmation(order_number=order_number, order_id=order_id, confirmation_url=url)
    if response is not None and response.status >= 400:
        raise OrderConfirmationPageError(
            f"Order #{order_number} was created, but its confirmation document returned "
            f"HTTP {response.status} at {url}",
            confirmation,
        )

    return confirmation


def register_account(
    page: "Page",
    config: "Config",
    email: str,
    password: str,
    first_name: str,
    last_name: str,
) -> None:
    page.goto(f"{config.site_url}/register", wait_until="networkidle")
    if not _fill_first_matching(page, ["#signup-email", 'input[name="email"]', "#email"], email):
        raise CheckoutFlowError("Registration form email field not found.")
    if not _fill_first_matching(
        page,
        ["#signup-first-name", 'input[autocomplete="given-name"]', 'input[name="first_name"]'],
        first_name,
    ):
        raise CheckoutFlowError("Registration form first-name field not found.")
    if not _fill_first_matching(
        page,
        ["#signup-last-name", 'input[autocomplete="family-name"]', 'input[name="last_name"]'],
        last_name,
    ):
        raise CheckoutFlowError("Registration form last-name field not found.")
    if not _fill_first_matching(
        page, ["#signup-password", 'input[name="password"]', "#password", 'input[type="password"]'], password
    ):
        raise CheckoutFlowError("Registration form password field not found.")
    if not _fill_first_matching(
        page,
        ["#signup-confirm-password", 'input[name="confirm_password"]', 'input[autocomplete="new-password"]:nth-of-type(2)'],
        password,
    ):
        raise CheckoutFlowError("Registration form password-confirmation field not found.")
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
