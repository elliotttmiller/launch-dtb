"""WooCommerce REST API v3 client used to verify placed orders.

WooCommerce is the system of record for orders, customers, totals, tax, and
payment status (see `AGENTS.md` section 5). This client only reads — it never
creates, edits, or cancels anything — using a read-scoped REST API key
(WooCommerce > Settings > Advanced > REST API).
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import TYPE_CHECKING, Any

import requests

if TYPE_CHECKING:
    from config import Config

PAID_STATUSES = {"processing", "completed", "on-hold"}


@dataclass(slots=True)
class OrderSnapshot:
    order_id: int
    number: str
    status: str
    currency: str
    total: float
    shipping_total: float
    total_tax: float
    payment_method: str
    date_paid: str | None
    billing_email: str
    customer_id: int
    meta: dict[str, str] = field(default_factory=dict)
    raw: dict[str, Any] = field(default_factory=dict)

    def meta_get(self, *keys: str) -> str:
        for key in keys:
            value = self.meta.get(key)
            if value:
                return value
        return ""


@dataclass(slots=True)
class CheckoutExpectation:
    """What a simulated checkout expects WooCommerce to have recorded."""

    email: str
    min_total: float = 0.01
    currency: str = "USD"
    expect_tax: bool = False
    expect_shipping: bool = True


class WooCommerceClient:
    def __init__(self, config: "Config") -> None:
        self._config = config
        self._session = requests.Session()
        self._session.auth = (config.wc_consumer_key, config.wc_consumer_secret)

    @property
    def configured(self) -> bool:
        return self._config.wc_api_configured

    def _get(self, path: str, params: dict | None = None) -> requests.Response:
        url = f"{self._config.api_base}/wc/v3{path}"
        return self._session.get(url, params=params, timeout=self._config.request_timeout_s)

    def ping(self) -> tuple[bool, str]:
        """Confirm the API is reachable and credentials are valid."""

        try:
            response = self._get("/system_status", params={"per_page": 1})
        except requests.RequestException as exc:
            return False, f"WooCommerce API unreachable: {exc}"
        if response.status_code == 401:
            return False, "WooCommerce REST API credentials were rejected (401)."
        if response.status_code >= 400:
            return False, f"WooCommerce REST API returned HTTP {response.status_code}."
        return True, "WooCommerce REST API reachable and authenticated."

    def get_order(self, order_id: int) -> OrderSnapshot | None:
        try:
            response = self._get(f"/orders/{order_id}")
        except requests.RequestException:
            return None
        if response.status_code != 200:
            return None
        return self._to_snapshot(response.json())

    def find_order_by_number(self, order_number: str) -> OrderSnapshot | None:
        """Fall back lookup when only the human-facing order number is known."""

        try:
            response = self._get("/orders", params={"search": order_number, "per_page": 5})
        except requests.RequestException:
            return None
        if response.status_code != 200:
            return None
        for raw in response.json():
            if str(raw.get("number")) == str(order_number) or str(raw.get("id")) == str(order_number):
                return self._to_snapshot(raw)
        return None

    @staticmethod
    def _to_snapshot(raw: dict[str, Any]) -> OrderSnapshot:
        meta = {
            str(item.get("key")): str(item.get("value"))
            for item in raw.get("meta_data", [])
            if item.get("key") is not None
        }
        billing = raw.get("billing", {}) or {}
        return OrderSnapshot(
            order_id=int(raw.get("id", 0)),
            number=str(raw.get("number", "")),
            status=str(raw.get("status", "")),
            currency=str(raw.get("currency", "")),
            total=float(raw.get("total") or 0),
            shipping_total=float(raw.get("shipping_total") or 0),
            total_tax=float(raw.get("total_tax") or 0),
            payment_method=str(raw.get("payment_method", "")),
            date_paid=raw.get("date_paid"),
            billing_email=str(billing.get("email", "")),
            customer_id=int(raw.get("customer_id", 0)),
            meta=meta,
            raw=raw,
        )

    def verify(self, order: OrderSnapshot, expectation: CheckoutExpectation) -> list[tuple[str, bool, str]]:
        """Return `(check_name, ok, detail)` tuples for a placed order."""

        checks: list[tuple[str, bool, str]] = []

        order_ok = order.status in PAID_STATUSES
        checks.append((
            "Order exists with a paid-equivalent status",
            order_ok,
            f"status={order.status!r} (expected one of {sorted(PAID_STATUSES)})",
        ))

        email_ok = order.billing_email.strip().lower() == expectation.email.strip().lower()
        checks.append((
            "Customer email matches the checkout session",
            email_ok,
            f"billing_email={order.billing_email!r} expected={expectation.email!r}",
        ))

        total_ok = order.total >= expectation.min_total and order.currency == expectation.currency
        checks.append((
            "Order total and currency are correct",
            total_ok,
            f"total={order.total} {order.currency} (min expected {expectation.min_total} {expectation.currency})",
        ))

        if expectation.expect_shipping:
            shipping_ok = order.shipping_total > 0
            checks.append((
                "Shipping total was recorded",
                shipping_ok,
                f"shipping_total={order.shipping_total}",
            ))

        if expectation.expect_tax:
            tax_ok = order.total_tax > 0
            checks.append(("Tax total was recorded", tax_ok, f"total_tax={order.total_tax}"))

        payment_ok = order.date_paid is not None or order.status in PAID_STATUSES
        checks.append((
            "Payment status is captured",
            payment_ok,
            f"date_paid={order.date_paid!r} status={order.status!r}",
        ))

        return checks
