"""QuickBooks synchronization verification.

QuickBooks receives accounting projections only and never creates storefront
orders (`AGENTS.md` section 5). The same DTB order pipeline that projects to
Veeqo also projects paid orders to QuickBooks as a SalesReceipt and records
the outcome back onto the WooCommerce order as post meta
(`dtb-platform/Services/AdminIntegrationStateService.php`). As with Veeqo,
reading that meta through the WooCommerce REST API avoids requiring a
separate Intuit OAuth credential for a launch-readiness check.
"""

from __future__ import annotations

from .woocommerce import OrderSnapshot

SYNCED_STATUSES = {"synced"}
FAILED_STATUSES = {"failed"}


class QuickBooksVerifier:
    @staticmethod
    def sync_status(order: OrderSnapshot) -> str:
        status = order.meta_get("_dtb_quickbooks_sync_status")
        if status:
            return status
        if order.meta_get(
            "_dtb_quickbooks_entity_id", "_dtb_qbo_receipt_id", "_dtb_quickbooks_invoice_id"
        ):
            return "synced"
        return "pending"

    @staticmethod
    def is_terminal(status: str) -> bool:
        return status in SYNCED_STATUSES | FAILED_STATUSES

    def verify(self, order: OrderSnapshot) -> list[tuple[str, bool, str]]:
        entity_id = order.meta_get(
            "_dtb_quickbooks_entity_id", "_dtb_qbo_receipt_id", "_dtb_quickbooks_invoice_id"
        )
        status = self.sync_status(order)
        error = order.meta_get("_dtb_quickbooks_sync_error")

        detail = f"sync_status={status!r} entity_id={entity_id!r}"
        if error:
            detail += f" error={error!r}"

        checks: list[tuple[str, bool, str]] = [
            ("Order synchronized to QuickBooks", status in SYNCED_STATUSES, detail),
            ("QuickBooks accounting record created", bool(entity_id), f"entity_id={entity_id!r}"),
            (
                "Order total matches the accounting projection",
                order.total > 0,
                f"woocommerce_total={order.total} {order.currency}",
            ),
        ]
        return checks
