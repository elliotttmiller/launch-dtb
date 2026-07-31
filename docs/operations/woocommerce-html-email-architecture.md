# WooCommerce classic HTML email architecture

Last reconciled with tracked source: 2026-07-31.

Scope: WooCommerce's classic HTML/PHP transactional email pipeline only.
Plain-text templates, the block email editor, and POS templates are
explicitly out of scope and are never touched by any file described here.

## Ownership model

- **`dtb-platform`** owns the shared branded email presentation system and
  reusable components: `dtb_email_palette()`, `dtb_email_button()`,
  `dtb_email_details_table()`, `dtb_email_status_badge()`,
  `dtb_email_next_steps_list()`, `dtb_email_note_box()`, `dtb_email_logo_url()`
  (`Support/Email.php`), and the shared order-item thumbnail/name renderer
  (`Support/Email/OrderItemPresentation.php`). `dtb_render_branded_email()` /
  `Templates/branded-email.html` remain the presentation layer for DTB's
  *non*-WooCommerce transactional email systems (support, returns, repair,
  marketing, and the SPA's own `/auth/*` flow) — unrelated to the classic
  WooCommerce pipeline described in this document.
- **`dtb-commerce`** owns WooCommerce email registration, template
  resolution, settings integration, and commerce-specific content
  (`Email/TemplateOverride.php` and `Email/templates/emails/*.php`).
- **`dtb-order-platform`** owns order-event identity and duplicate
  prevention for customer-facing order emails
  (`Email/OrderEmailIdempotency.php`, `customer_processing_order` dedupe) and
  is the durable, queryable record of fulfillment-projection outcomes (via
  `dtb_order_append_event()`), but is not a second source of truth for
  fulfillment-projection idempotency itself.
- **`dtb-integrations`** remains authoritative for Veeqo fulfillment and
  tracking projections, including the Veeqo → native WooCommerce Fulfillment
  projector (`Veeqo/VeeqoFulfillmentProjector.php`).

## Template-routing strategy

`dtb-commerce/Email/TemplateOverride.php` hooks `woocommerce_locate_template`
at a late priority with an explicit allowlist,
`DTB_WC_EMAIL_TEMPLATE_MAP` (`template_name => ['file' => ..., 'source_version'
=> ...]`). It only rewrites WooCommerce's resolved template path when:

- WooCommerce resolved its own bundled default (no theme override already
  won — the active `drywall-toolbox` theme ships no `woocommerce/emails/`
  directory today, but a future theme override would still take precedence);
- the `template_name` is in the allowlist; and
- it is not under `emails/plain/` (plain-text templates always resolve to
  WooCommerce core, unmodified).

This is the standard mechanism WooCommerce itself expects a plugin/child
theme to use to override a template without forking WooCommerce — no output
buffering, no wrapping.

Every override file under `Email/templates/emails/` carries a header comment
recording the exact upstream WooCommerce template path and the `@version`
it was traced against (10.9.4-era, individual files ranging 9.7.0–10.9.0 per
the reference export), plus a one-line "DTB customization" note. The same
version metadata lives in `DTB_WC_EMAIL_TEMPLATE_MAP` for code-level
traceability. **Every override preserves the upstream file's exact
`do_action`/`apply_filters` call sequence — same hook names, same argument
order, same call order** — only surrounding markup/copy changes. This is
required, not stylistic: `dtb-order-tracking-links.php`'s "Track Order"
button hooks `woocommerce_email_after_order_table` with 4 args, WooCommerce's
own structured-data output hooks `woocommerce_email_order_details`, and the
order-item filters (`woocommerce_order_item_thumbnail`,
`woocommerce_order_item_name`, `woocommerce_order_item_visible`, etc.) are
all depended upon by exact identity.

## Settings precedence

WooCommerce Settings → Emails remains authoritative for: enablement,
recipients, CC/BCC, email type, and any subject/heading/additional-content an
administrator has explicitly configured (each core `WC_Email` subclass's
`get_option()` mechanism, untouched). DTB supplies professional default
copy only through each class's own `get_default_subject()` /
`get_default_heading()` override points and through the template body copy —
never by replacing or bypassing the settings system. Visual design (colors,
typography, layout) is DTB-owned via `dtb_email_palette()` and the template
files, not the WooCommerce admin color-picker options in
`email-styles.php`.

## Supported email registry

| WooCommerce email ID | Audience | Notes |
|---|---|---|
| `new_order` | admin | |
| `cancelled_order` | admin | |
| `failed_order` | admin | |
| `customer_processing_order` | customer | idempotency via `OrderEmailIdempotency.php` |
| `customer_completed_order` | customer | copy no longer implies "completed == shipped" |
| `customer_on_hold_order` | customer | |
| `customer_failed_order` | customer | uses `get_checkout_payment_url()` |
| `customer_cancelled_order` | customer | |
| `customer_refunded_order` | customer | uses core's `$partial_refund` + concrete refund object |
| `customer_invoice` | customer | uses `get_checkout_payment_url()` |
| `customer_note` | customer | |
| `customer_new_account` | customer | WooCommerce's native flow; distinct from the SPA's own `/auth/*` REST flow |
| `customer_reset_password` | customer | WooCommerce's native flow; distinct from the SPA's own `/auth/*` REST flow |
| `customer_fulfillment_created` | customer | native Fulfillments feature |
| `customer_fulfillment_updated` | customer | native Fulfillments feature |
| `customer_fulfillment_deleted` | customer | **disabled** — see below |

`customer_fulfillment_deleted` is explicitly force-disabled
(`woocommerce_email_enabled_customer_fulfillment_deleted` filtered to
`false` in `TemplateOverride.php`) because no DTB business rule currently
originates a customer-visible fulfillment deletion. This is intentional, not
an oversight; lift the gate only alongside an explicit deletion rule.

## Fulfillment authority

```text
Veeqo (authoritative shipment/tracking facts)
  -> dtb-integrations/Veeqo/VeeqoOrderStatusApplier.php
     (existing rank/tracking change-detection, unchanged)
  -> dtb-integrations/Veeqo/VeeqoFulfillmentProjector.php
     (identity resolution, fingerprint, per-shipment lock,
      duplicate/replay detection, native-notification ownership)
  -> Automattic\WooCommerce\Admin\Features\Fulfillments\Fulfillment::save()
     (native WooCommerce data store, "order-fulfillment")
  -> woocommerce_fulfillment_created_notification /
     woocommerce_fulfillment_updated_notification
  -> WC_Email_Customer_Fulfillment_Created / Updated::trigger()
  -> dtb-commerce's customer-fulfillment-created.php / -updated.php
```

Verified against the production WooCommerce 10.9.4 vendor source export
(`drywalltoolbox/wp/wp-content/woo/dtb-woocommerce-fulfillments-source-20260731-123114/`):
`Fulfillment.php`, `FulfillmentsDataStore.php`, `FulfillmentUtils.php`,
`OrderFulfillmentsRestController.php`,
`class-wc-email-customer-fulfillment-{created,updated}.php`. The projector
never calls this site's own REST API, never writes `wc_order_fulfillments` /
`wc_order_fulfillment_meta` directly, and never references
`Automattic\WCShipping\Fulfillments\*` (the separately-installed WooCommerce
Shipping plugin also registers fulfillment-related classes; the projector
only ever uses the core `Fulfillment` domain object and the
`order-fulfillment` `WC_Data_Store` key, and verifies at runtime that the
key still resolves to WooCommerce core's own `FulfillmentsDataStore`).

`FulfillmentsManager::update_order_fulfillment_status_on_fulfillment_update()`
(native WooCommerce code, fired automatically by
`woocommerce_fulfillment_after_create`/`_update`) recomputes and persists
the order-level `_fulfillment_status` meta
(`fulfilled`/`partially_fulfilled`/`unfulfilled`/`no_fulfillments`) — this is
WooCommerce's own native partial/complete-shipment computation; the
projector never reimplements it.

### Typed projection result

`dtb_veeqo_project_fulfillment()` returns one of:

```text
created / updated / no_change
deferred_incomplete_source
rejected_stale / rejected_quantity_conflict / rejected_identity_conflict / rejected_locked
failed_native_persistence
```

`created`, `updated`, and `no_change` mean the native path owns this
shipment's customer notification (`native_notified`); every other result
falls through to the legacy `dtb_order_send_notification` /
`order-shipped` path (`legacy_fallback_used`), preserved unchanged in
`VeeqoOrderStatusApplier.php::dtb_veeqo_dispatch_shipped_notification()`.
The two paths are mutually exclusive per shipment — never both, never
neither.

### Open verification item

`VeeqoFulfillmentProjector.php::dtb_veeqo_resolve_shipment_identity()`
currently always returns `null` (→ `deferred_incomplete_source` →
legacy path for every shipment). This codebase's own existing polling code
(`VeeqoOrderStatusPoller.php::dtb_veeqo_order_status_poll_extract_tracking()`)
already documents that Veeqo's `allocations[].shipment` shape is
nullable/unconfirmed against a real payload, and no confirmed-stable
per-allocation or per-shipment identifier has been observed by this
integration. Confirming the real field (inspect one real Veeqo order payload
for a shipped order) and filling in that one function is the only remaining
step to activate native fulfillment emails; nothing else in the design
changes. The identity is never the tracking number (mutable, correctable
after the fact) and is stored as **private** Fulfillment meta
(`_dtb_veeqo_shipment_id`), alongside a canonical fingerprint
(`_dtb_veeqo_projection_fingerprint`) over only customer-visible state.

### Failure recovery

Transient failures (lock contention, a temporarily incomplete Veeqo payload,
a DB hiccup) are retry-safe by construction — the fingerprint means a retry
can never double-create or double-notify. Permanent validation failures
(`rejected_quantity_conflict`, `rejected_identity_conflict`) are not
auto-retried; they need operator attention. The `dtb_veeqo_fulfillment_projection_enabled`
filter is a kill switch: disabling it never touches a previously created
native Fulfillment record, and because ownership is only ever recorded after
a full commit + successful notification, disabling/re-enabling never causes
a historical shipment to be re-notified.

## Extension/back-compat notes

Structured data (`WC_Structured_Data::generate_order_data()`/
`output_structured_data()`), the WooCommerce Settings → Emails preview
(`woocommerce_is_email_preview`), and RTL (`is_rtl()`) all continue to work
unchanged because every override calls the same hooks in the same order as
the traced upstream template — none of that behavior lived in DTB code
before this change, and none of it needed to move.
