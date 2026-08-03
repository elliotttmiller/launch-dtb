# DTB Email Previewer

Local-only development runner for the actual Drywall Toolbox WooCommerce classic HTML email pipeline.

It boots the tracked WordPress installation, loads WooCommerce and DTB MU plugins, prepares a registered `WC_Email` with an existing local order, renders through the canonical `dtb-commerce` template resolver, applies WooCommerce CSS inlining, and displays the final HTML in a desktop or mobile iframe. It never calls an email `trigger()` or `send()` method.

## Boundaries

- Local or development WordPress environments only.
- Requires an authenticated user with `manage_woocommerce`.
- Loads orders read-only.
- Does not create orders, change statuses, add order notes, enqueue jobs, create fulfillments, or send email.
- Does not provide a second template implementation; it renders the same DTB/WooCommerce templates used by real messages.
- Supports order-backed lifecycle emails only. Refund, fulfillment, customer-note, account, and password-reset emails require additional lifecycle objects and remain outside this intentionally minimal runner.

## Prerequisites

1. A local WordPress installation rooted at `drywalltoolbox/wp/`.
2. WooCommerce and the DTB MU-plugin loader active locally.
3. A sanitized local WooCommerce order.
4. Node.js 20 or newer.
5. Local `wp-config.php` configured with:

```php
define( 'WP_ENVIRONMENT_TYPE', 'local' );
```

Do not set the production environment to `local` or `development`.

## Install

From this directory:

```powershell
cd drywalltoolbox\wp\email-previewer
npm install
```

`node_modules/` is local generated state and must not be committed.

## Open without BrowserSync

Sign in to the local WordPress wp-admin first, then open:

```text
http://localhost/wp/email-previewer/?email=customer_processing_order&order=1234&device=desktop
```

Replace `1234` with an existing local WooCommerce order ID and adjust the origin/path for the local WordPress installation.

## Live-reload development

PowerShell example:

```powershell
$env:DTB_EMAIL_PREVIEW_ORIGIN="http://localhost"
$env:DTB_EMAIL_PREVIEW_PATH="/wp/email-previewer/"
$env:DTB_EMAIL_PREVIEW_ORDER="1234"
$env:DTB_EMAIL_PREVIEW_EMAIL="customer_processing_order"
npm run dev
```

BrowserSync opens a proxied URL, normally on port `3000`. Sign in through that proxied origin when prompted. Saving any of these files reloads the preview:

```text
wp-content/mu-plugins/dtb-commerce/Email/**/*.php
wp-content/mu-plugins/dtb-platform/Support/Email.php
email-previewer/**/*.php
email-previewer/assets/**/*.css
```

Environment variables:

| Variable | Default | Purpose |
|---|---|---|
| `DTB_EMAIL_PREVIEW_ORIGIN` | `http://localhost` | Local WordPress origin BrowserSync proxies. |
| `DTB_EMAIL_PREVIEW_PATH` | `/wp/email-previewer/` | URL path to this previewer. |
| `DTB_EMAIL_PREVIEW_ORDER` | empty | Initial local WooCommerce order ID. |
| `DTB_EMAIL_PREVIEW_EMAIL` | `customer_processing_order` | Initial registered email ID. |

## Supported email IDs

- `customer_processing_order`
- `customer_completed_order`
- `customer_on_hold_order`
- `customer_failed_order`
- `customer_cancelled_order`
- `customer_invoice`
- `new_order`
- `cancelled_order`
- `failed_order`

The selector shows only registered, order-backed contexts that can be prepared without inventing domain objects.

## Development workflow

```text
npm run dev
  -> BrowserSync proxies local WordPress
  -> previewer renders the selected WC_Email
  -> DTB template resolver selects canonical templates
  -> WooCommerce applies email CSS inlining
  -> save PHP/CSS
  -> BrowserSync reloads
```

The browser preview is the fast design loop. Major milestones still require an actual test send to representative clients because Gmail, Outlook, and Apple Mail do not share one rendering engine.

## Removal

This is tracked local tooling. It does not load during ordinary WordPress requests unless its URL is explicitly requested, and it returns `404` outside `local` or `development` environments. To remove the tool entirely, delete `drywalltoolbox/wp/email-previewer/`.
