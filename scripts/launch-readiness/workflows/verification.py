"""Stages 5-7 — WooCommerce, Veeqo, and QuickBooks Verification.

After a checkout simulation places an order, these stages confirm each
downstream system-of-record actually received it: WooCommerce (the order
itself), Veeqo (fulfillment sync), and QuickBooks (accounting sync). Veeqo
and QuickBooks projections run asynchronously through DTB's Action Scheduler
queue, so both stages poll the order for a terminal sync status before
judging pass/fail (see `integrations/veeqo.py` and `integrations/quickbooks.py`
for exactly which order meta this reads).
"""

from __future__ import annotations

import time
from typing import TYPE_CHECKING

import tui
from integrations.quickbooks import QuickBooksVerifier
from integrations.veeqo import VeeqoVerifier
from integrations.woocommerce import CheckoutExpectation, OrderSnapshot, WooCommerceClient
from reports.models import StageResult, Status

if TYPE_CHECKING:
    from config import Config

WOOCOMMERCE_STAGE = "WooCommerce Verification"
VEEQO_STAGE = "Veeqo Verification"
QUICKBOOKS_STAGE = "QuickBooks Verification"


def _resolve_order(client: WooCommerceClient, order_id: int | None, order_number: str | None) -> OrderSnapshot | None:
    if order_id:
        snapshot = client.get_order(order_id)
        if snapshot:
            return snapshot
    if order_number:
        return client.find_order_by_number(order_number)
    return None


def run_woocommerce(
    config: "Config", order_id: int | None, order_number: str | None, email: str | None
) -> tuple[StageResult, OrderSnapshot | None]:
    stage = StageResult(name=WOOCOMMERCE_STAGE)

    if not order_id and not order_number:
        tui.run_step(
            stage,
            "Order verification",
            lambda: (Status.SKIP, "No order was placed by a checkout simulation stage to verify."),
        )
        return stage, None

    if not config.wc_api_configured:
        tui.run_step(
            stage,
            "Order verification",
            lambda: (Status.SKIP, "LAUNCH_WC_CONSUMER_KEY/SECRET not set — cannot query the WooCommerce REST API."),
        )
        return stage, None

    client = WooCommerceClient(config)
    box: dict[str, OrderSnapshot] = {}

    def fetch():
        snapshot = _resolve_order(client, order_id, order_number)
        if snapshot is None:
            return Status.FAIL, f"Order {order_id or order_number} was not found via the WooCommerce REST API."
        box["snapshot"] = snapshot
        return Status.PASS, f"Retrieved order #{snapshot.number} (id={snapshot.order_id}, status={snapshot.status})."

    tui.run_step(stage, "Order exists in WooCommerce", fetch)
    if "snapshot" not in box:
        return stage, None

    snapshot = box["snapshot"]
    expectation = CheckoutExpectation(email=email or snapshot.billing_email)
    for check_name, ok, detail in client.verify(snapshot, expectation):
        tui.run_step(stage, check_name, lambda ok=ok, detail=detail: (Status.PASS if ok else Status.FAIL, detail))

    return stage, snapshot


def _poll_for_terminal_sync(
    config: "Config",
    client: WooCommerceClient,
    order_id: int,
    is_terminal,
    sync_status,
) -> OrderSnapshot | None:
    deadline = time.monotonic() + config.sync_poll_timeout_s
    latest: OrderSnapshot | None = None
    while True:
        latest = client.get_order(order_id)
        if latest is not None and is_terminal(sync_status(latest)):
            return latest
        if time.monotonic() >= deadline:
            return latest
        time.sleep(config.sync_poll_interval_s)


def run_veeqo(config: "Config", order: OrderSnapshot | None) -> StageResult:
    stage = StageResult(name=VEEQO_STAGE)

    if order is None:
        tui.run_step(stage, "Veeqo synchronization", lambda: (Status.SKIP, "No verified WooCommerce order to check."))
        return stage
    if config.skip_integration_checks or not config.wc_api_configured:
        tui.run_step(stage, "Veeqo synchronization", lambda: (Status.SKIP, "Integration checks disabled or WooCommerce API not configured."))
        return stage

    client = WooCommerceClient(config)
    verifier = VeeqoVerifier()
    box: dict[str, OrderSnapshot] = {"snapshot": order}

    def wait_for_sync():
        result = _poll_for_terminal_sync(config, client, order.order_id, verifier.is_terminal, verifier.sync_status)
        if result is not None:
            box["snapshot"] = result
        status = verifier.sync_status(box["snapshot"])
        if verifier.is_terminal(status):
            return Status.PASS, f"Veeqo sync reached a terminal state: {status!r}."
        return Status.WARN, f"Veeqo sync still {status!r} after {config.sync_poll_timeout_s:.0f}s — queue may be backed up."

    tui.run_step(stage, "Wait for Veeqo synchronization", wait_for_sync)

    for check_name, ok, detail in verifier.verify(box["snapshot"]):
        tui.run_step(stage, check_name, lambda ok=ok, detail=detail: (Status.PASS if ok else Status.FAIL, detail))

    return stage


def run_quickbooks(config: "Config", order: OrderSnapshot | None) -> StageResult:
    stage = StageResult(name=QUICKBOOKS_STAGE)

    if order is None:
        tui.run_step(stage, "QuickBooks synchronization", lambda: (Status.SKIP, "No verified WooCommerce order to check."))
        return stage
    if config.skip_integration_checks or not config.wc_api_configured:
        tui.run_step(stage, "QuickBooks synchronization", lambda: (Status.SKIP, "Integration checks disabled or WooCommerce API not configured."))
        return stage

    client = WooCommerceClient(config)
    verifier = QuickBooksVerifier()
    box: dict[str, OrderSnapshot] = {"snapshot": order}

    def wait_for_sync():
        result = _poll_for_terminal_sync(config, client, order.order_id, verifier.is_terminal, verifier.sync_status)
        if result is not None:
            box["snapshot"] = result
        status = verifier.sync_status(box["snapshot"])
        if verifier.is_terminal(status):
            return Status.PASS, f"QuickBooks sync reached a terminal state: {status!r}."
        return Status.WARN, f"QuickBooks sync still {status!r} after {config.sync_poll_timeout_s:.0f}s — queue may be backed up."

    tui.run_step(stage, "Wait for QuickBooks synchronization", wait_for_sync)

    for check_name, ok, detail in verifier.verify(box["snapshot"]):
        tui.run_step(stage, check_name, lambda ok=ok, detail=detail: (Status.PASS if ok else Status.FAIL, detail))

    return stage
