# DTB Email Design System

Last reconciled with tracked source: 2026-07-31.

This is the design specification for the WooCommerce classic HTML email
redesign (see `docs/operations/woocommerce-html-email-architecture.md` for
the engineering/routing architecture that renders it). This document
describes what the emails look like and say; the architecture doc describes
how that content gets on the wire.

## Visual language

- **Brand identity.** Dark navy header (`#071126`) carrying the DTB logo,
  a clean white content surface (`#ffffff`), controlled blue accents
  (`#2563eb`) for links/buttons/badges, and restrained borders
  (`#dce6f3`/`#cbd5e1`) instead of heavy dividers or drop shadows. This
  matches the palette already established for DTB's other transactional
  email surfaces (`dtb_email_palette('light')`, `dtb-platform/Support/Email.php`)
  so the WooCommerce classic pipeline and DTB's support/returns/repair/
  marketing emails read as one brand, not two.
- **Tone.** Professional, direct, and specific to drywall tools/parts/repairs
  — no generic ecommerce filler ("Thank you for your purchase!"). Every
  email states what happened, what it means for the customer, and what (if
  anything) happens next.

## Layout architecture

Fixed-width (600px) single-column table layout, the email-client-safe
standard used by every major transactional sender (Stripe, Shopify, GitHub,
Linear): a dark header band (logo + heading), a white content body, and a
footer band. See `Email/templates/emails/email-header.php` /
`email-footer.php` / `email-styles.php` in `dtb-commerce` for the concrete
markup. Content within the body follows a consistent vertical rhythm: status
badge → lede paragraph(s) → supporting detail (order summary / tracking card
/ next-steps list) → order/fulfillment table → addresses → footer.

## Component library

All components are reusable PHP functions in `dtb-platform/Support/Email.php`
(plus the order-item renderer in `Support/Email/OrderItemPresentation.php`),
consumed directly from the WooCommerce template overrides in
`dtb-commerce/Email/templates/emails/`. One implementation, not one per
email:

| Component | Function | Used for |
|---|---|---|
| Status badge | `dtb_email_status_badge( $label, $tone )` | processing/payment/shipment/refund state at a glance (tones: neutral, info, success, warning, danger) |
| CTA button | `dtb_email_button( $url, $label )` | pay, retry payment, reset password, view account — MSO-safe with a VML fallback |
| Detail/summary table | `dtb_email_details_table_light( $rows )` | order number/date/total, refund amount, invoice date — label/value rows on a white card |
| Next-steps list | `dtb_email_next_steps_list( $steps )` | "what happens next" checklist (processing, on-hold) |
| Note box | `dtb_email_note_box( $content )` | order notes, shipment merchant notes |
| Order item row | `dtb_email_render_item_thumbnail()` / `dtb_email_render_item_name()` | product thumbnail + name in order/fulfillment item tables, via the standard `woocommerce_order_item_thumbnail`/`_name` filters |
| Shipment/tracking panel | `email-fulfillment-details.php` | carrier, tracking number, tracking-URL CTA |
| Address panel | `email-addresses.php` (`.address-title` + `.address`) | billing/shipping, side-by-side on desktop, stacked on mobile |

## Responsive design

Single `@media screen and (max-width: 600px)` block in `email-styles.php`
tightens header/body padding and heading size for narrow viewports; the
underlying table layout already collapses gracefully (addresses stack via
natural table wrapping, order items remain legible at native width) without
a second mobile-specific template.

## Accessibility

- Semantic heading hierarchy (`h1` for the email heading, `h2` for section
  titles — order summary, shipment summary, customer details).
  `role="presentation"` on every layout table so screen readers skip
  decorative structure.
  `lang`/`dir` attributes from `language_attributes()`/`is_rtl()` on the root
  `<html>` element (unchanged from WooCommerce core — see the architecture
  doc's RTL note).
- Text/background contrast: navy-on-white and the palette's badge
  tones were chosen to clear WCAG AA at the sizes used (12–17px).
- Every meaningful image (logo, product thumbnails, tracking icons) carries
  descriptive `alt` text; the layout never relies on an image loading to
  convey status (badges and headings are always live text).
- Buttons are real `<a>` elements with visible text labels, not
  image-only or icon-only controls.

## Email client compatibility

Table-based layout (no CSS Grid/Flexbox), inline styles applied by
WooCommerce's own Emogrifier CSS-inliner pipeline from `email-styles.php`
(WooCommerce core mechanism, unchanged), an MSO conditional VML fallback for
the button component (`dtb_email_button()`), and no background images or
custom web fonts — the system font stack
(`-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif`) renders
consistently across Outlook, Gmail, Apple Mail, and mobile clients without a
web-font fallback flash. Dark-mode email clients are not specifically
inverted (a deliberate reliability choice — the fixed navy header and white
body read correctly in both light- and dark-mode inboxes without relying on
`prefers-color-scheme` support, which several major clients still handle
inconsistently for inlined table email).

## Copywriting voice per email category

- **Admin (operator) emails** — action-oriented: state what changed, what
  action (if any) is required, and skip pleasantries. Example:
  "Order #1042 from Casey Alvarez was cancelled. Release any reserved
  inventory and stop fulfillment if it has not already shipped."
- **Customer status emails** — lead with what happened in plain terms, then
  what it means, then what's next. Every processing/on-hold email answers:
  payment status, current stage, and next expected step.
- **Customer account/security emails** — brief, reassuring, single clear CTA.

## Per-email specification (all 15 lifecycle emails)

| Email | Status badge | Core message | Primary CTA |
|---|---|---|---|
| `new_order` (admin) | — | New order + customer name, review/fulfill | Edit order (admin) |
| `cancelled_order` (admin) | — | Cancelled, release inventory | Edit order (admin) |
| `failed_order` (admin) | — | Payment failed, no action needed unless retried | Edit order (admin) |
| `customer_processing_order` | Payment received (success) | Payment confirmed, preparing shipment, tracking to follow | — (order summary + next steps) |
| `customer_completed_order` | Order complete (success) | Order fully closed out (not equated with "shipped") | — |
| `customer_on_hold_order` | Payment pending (warning) | On hold pending payment confirmation, no action needed | — |
| `customer_failed_order` | Payment failed (danger) | Declined, nothing charged, retry available | Retry payment |
| `customer_cancelled_order` | Order cancelled (neutral) | Cancelled, refund note if applicable | — |
| `customer_refunded_order` | Refund / partial refund issued (info) | Full vs. partial distinguished via core's `$partial_refund`; timeline/method | — |
| `customer_invoice` | — | Pay now (failed/needs-payment) or reference copy of order | Pay for this order |
| `customer_note` | — | Store note quoted, order details for reference | — |
| `customer_new_account` | — | Account ready, set/confirm password | Set password / My account |
| `customer_reset_password` | — | Reset request, single reset link | Reset your password |
| `customer_fulfillment_created` | Shipped (success) | Part/all of order shipped, tracking details | Track this shipment |
| `customer_fulfillment_updated` | Shipment updated (info) | What changed, optional merchant note, current tracking | Track this shipment |

Each row's implementation lives in the correspondingly-named file under
`dtb-commerce/Email/templates/emails/`.
