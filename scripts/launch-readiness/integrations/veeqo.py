"""Veeqo synchronization verification.

Veeqo owns sellable inventory, allocation, fulfillment, and tracking
(`AGENTS.md` section 5). DTB's order pipeline projects each paid WooCommerce
order into Veeqo asynchronously via Action Scheduler and records the outcome
back onto the WooCommerce order as post meta
(`drywalltoolbox/wp/wp-content/mu-plugins/dtb-order-platform/Infrastructure/OrderQueue.php`,
`dtb-platform/Services/AdminIntegrationStateService.php`). Reading that meta
back through the WooCommerce REST API is the least invasive way to confirm
synchronization without a separate Veeqo API credential.
"""

from __future__ import annotations

from .woocommerce import OrderSnapshot

SYNCED_STATUSES = {"synced"}
FAILED_STATUSES = {"failed"}


class VeeqoVerifier:
    @staticmethod
    def sync_status(order: OrderSnapshot) -> str:
        status = order.meta_get("_dtb_veeqo_sync_status")
        if status:
            return status
        if order.meta_get("_dtb_veeqo_order_id", "_veeqo_order_id"):
            return "synced"
        return "pending"

    @staticmethod
    def is_terminal(status: str) -> bool:
        return status in SYNCED_STATUSES | FAILED_STATUSES

    def verify(self, order: OrderSnapshot) -> list[tuple[str, bool, str]]:
        veeqo_order_id = order.meta_get("_dtb_veeqo_order_id", "_veeqo_order_id")
        status = self.sync_status(order)
        error = order.meta_get("_dtb_veeqo_sync_error")
        tracking = order.meta_get("_dtb_veeqo_tracking_number", "_dtb_veeqo_tracking", "_tracking_number")
        carrier = order.meta_get("_dtb_veeqo_carrier", "_dtb_veeqo_tracking_carrier")

        detail = f"sync_status={status!r} veeqo_order_id={veeqo_order_id!r}"
        if tracking:
            detail += f" tracking={tracking} carrier={carrier or 'n/a'}"
        if error:
            detail += f" error={error!r}"

        checks: list[tuple[str, bool, str]] = [
            ("Order synchronized to Veeqo", status in SYNCED_STATUSES, detail),
            ("Veeqo order identifier recorded", bool(veeqo_order_id), f"veeqo_order_id={veeqo_order_id!r}"),
        ]
        return checks
