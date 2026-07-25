# Veeqo Control Center Verified Scope

The current release covers DTB-owned operator workflows: inventory projection, order projection visibility/retry, fulfillment/tracking projection visibility, durable operations, resource configuration, connection validation, and exact-SKU comparison.

Direct Veeqo physical-stock adjustment, label purchase/printing, allocation mutation, picking/packing mutation, and shipment creation are not activated because their current upstream API contracts and idempotency/compensation requirements have not been verified in this change. Those functions must not be inferred from the visual similarity to Veeqo's dashboard.
