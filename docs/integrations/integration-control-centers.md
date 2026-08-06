# Integration Control Centers

## Purpose

The Veeqo and QuickBooks wp-admin pages are operator control centers for the existing DTB integration pipeline. They do not create a second source of truth and do not call external systems directly from browser-owned state.

The interfaces are intentionally restrained. They prioritize:

- connection and configuration readiness;
- queue and synchronization state;
- exceptions and blockers;
- explicit retry, reconcile, discovery, and recovery actions;
- redacted diagnostics needed for incident response.

Decorative charts, workflow diagrams, branding marks, duplicated metrics, and non-actionable visualizations are not part of the operator contract.

## System authorities

- WooCommerce owns products, customers, orders, payments, refunds, and authoritative commerce status.
- DTB owns validation, the event ledger, idempotency, queueing, integration state, retries, and operator workflows.
- Action Scheduler executes durable asynchronous jobs and isolates external-service latency and failure.
- Veeqo owns inventory allocation, fulfillment, labels, carrier execution, and tracking.
- QuickBooks receives accounting projections only; it does not become order or payment authority.

## Canonical order pipeline

```text
WooCommerce paid order
  -> DTB event ledger
  -> dtb-orders queue
  -> Veeqo order projection
  -> Veeqo allocation / fulfillment / tracking
  -> DTB integration state and customer-visible tracking

WooCommerce paid order or refund
  -> DTB event ledger
  -> dtb-orders queue
  -> QuickBooks SalesReceipt or RefundReceipt projection
  -> DTB integration state and reconciliation evidence
```

Each projection must remain idempotent. Operator retries enqueue the canonical job again with durable context; they do not bypass the ledger, captured-payment gate, refund identity, or downstream queue barriers.

## Live operational health

Both control centers load a shared, visibility-aware health observer:

- it refreshes the protected local DTB readiness endpoint every 15 seconds while the browser tab is visible;
- it prevents overlapping requests;
- it applies exponential backoff after failures, capped at two minutes;
- it stops polling while the page is hidden or unloading;
- it exposes only redacted readiness data already available to authorized wp-admin users;
- it never sends credentials, external API tokens, payment data, or server configuration to the browser.

This is live operational observation, not synchronous coupling. External writes remain queue-backed and webhook-driven so Veeqo or QuickBooks latency cannot hold the WooCommerce checkout request open or create duplicate side effects.

## Admin UX contract

The shared integration layer provides:

- one plain page heading with concise operational context;
- one live-health strip with the last local refresh time;
- flat bordered panels and compact status summaries;
- text-first status and recovery controls;
- responsive tables and forms;
- keyboard and screen-reader-compatible navigation;
- no decorative workflow visualization in the QuickBooks operator path;
- no provider-specific dark sidebar or nested dashboard shell in Veeqo.

Detailed tables remain explicit operator views and refresh through their owning module. The shared observer reports readiness only and emits a `dtb:integration-health` DOM event for bounded module enhancements; it does not mutate orders, products, inventory, accounting records, or queue state.

## Failure and recovery

- A health-refresh failure changes only the local status strip and increases the next retry delay.
- Existing page data remains visible.
- Veeqo order retries continue through `dtb_order_enqueue_job()`.
- Veeqo inventory reconciliation continues through the durable operation store and Action Scheduler.
- QuickBooks synchronization and backfill continue through the existing queue-owned synchronization controls.
- Operators must inspect Action Scheduler and DTB integration state before repeating a failed operation.

## Deployment and rollback

The shared assets are canonical source under:

```text
drywalltoolbox/wp/wp-content/mu-plugins/dtb-integrations/assets/
```

Both integration pages must deploy with the shared assets and their updated registration files as one dependency-consistent change set. Rollback must restore those files together; no database rollback is required for this presentation and health-observation change.
