# WooCommerce classic HTML email architecture

Last reconciled with tracked source: 2026-08-15.

Scope: WooCommerce's classic HTML/PHP transactional email pipeline only.
Plain-text templates, the block email editor, and POS templates are
explicitly out of scope and are never touched by any file described here.

## Ownership model

- **`dtb-platform`** owns the shared branded email presentation system,
  reusable components, platform-wide sender identity, and the transactional
  Reply-To alignment safeguard (`Support/Email.php`,
  `Support/Email/Deliverability.php`, and
  `Support/Email/OrderItemPresentation.php`). SMTP transport and DNS-based
  authentication (SPF/DKIM/DMARC/PTR) remain infrastructure concerns and are
  not encoded in application code.
- **`dtb-commerce`** owns WooCommerce email registration, template
  resolution, settings integration, and commerce-specific content
  (`Email/TemplateOverride.php` and `Email/templates/emails/*.php`).
- **`dtb-order-platform`** owns order-event identity and duplicate prevention
  for customer-facing order emails.
- **`dtb-integrations`** remains authoritative for Veeqo fulfillment and
  tracking projections.

## Template-routing strategy

`dtb-commerce/Email/TemplateOverride.php` hooks `woocommerce_locate_template`
at a late priority with an explicit allowlist. It only rewrites WooCommerce's
resolved template path when WooCommerce resolved its own bundled default, the
template is allowlisted, and the request is not for `emails/plain/*`.

## Gmail/client rendering contract

The classic HTML shell uses a conservative table-first structure capped at
680px. The outer shell is centered by table alignment, not by a spacer-column
layout or CSS-only sizing. Critical dimensions, backgrounds, padding, and
logo sizing are duplicated inline so Gmail variants still render the intended
structure after sanitization/inlining. The mobile media query remains a
progressive enhancement rather than a requirement for basic readability.

Remote web fonts are not required for layout correctness. The email shell
must remain readable with native system/sans-serif fonts when clients strip
`<link>` tags or external font requests. Background artwork is decorative;
content may not depend on a CSS background image being loaded.

## Sender identity and Reply-To contract

`dtb-platform/Support/Email.php` defines the canonical outbound From identity.
`dtb-platform/Support/Email/Deliverability.php` normalizes Reply-To headers at
the `wp_mail` boundary. Same-domain Reply-To values are preserved; missing or
cross-domain Reply-To values are replaced with the canonical DTB mailbox.
This prevents a legitimate DTB message from intentionally presenting a
Drywall Toolbox From address while routing replies to an unrelated domain.

The application does **not** configure SMTP credentials, DKIM keys, SPF,
DMARC, return-path/envelope sender, PTR/rDNS, or TLS. Those remain provider and
DNS configuration. Production deployment therefore requires the configured
SMTP provider to authenticate the same organizational domain used by the
visible From header.

## Settings precedence

WooCommerce Settings → Emails remains authoritative for enablement,
recipients, CC/BCC, email type, and any subject/heading/additional-content an
administrator has explicitly configured. DTB supplies default copy and visual
presentation without bypassing WooCommerce's email settings system.

## Fulfillment authority

Veeqo remains authoritative for shipment/tracking facts. Native WooCommerce
Fulfillment objects and their notification hooks continue to own fulfillment
email triggering. The email rendering and deliverability changes do not alter
order creation, payment, inventory, fulfillment, queues, or provider state.

## Validation and production checks

Before shipping email changes to production:

- render at least admin new-order and customer processing-order emails through
  WooCommerce, not a standalone HTML fixture;
- verify desktop Gmail web and Gmail mobile/app rendering at narrow and wide
  widths;
- inspect the received message's original headers and confirm SPF, DKIM, and
  DMARC pass with an aligned `From: ...@drywalltoolbox.com` identity;
- confirm Reply-To is a `@drywalltoolbox.com` mailbox;
- confirm public HTTPS availability of `/logos/email-logo-white.png` and any
  email icon assets used by the rendered template;
- verify SMTP transport/TLS and provider-level envelope sender settings in the
  production mailer configuration.
