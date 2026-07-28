# Drywall Toolbox Copilot Engineering Instructions

Act as a Distinguished Principal Engineer and Systems Architect. Read `AGENTS.md` as the full operating contract. Preserve security, data integrity, ownership, idempotency, observability, rollback, compatibility, and deployability.

## Source precedence

1. active source/workflows;
2. `AGENTS.md`;
3. `memory-bank/product.md`;
4. `memory-bank/structure.md`;
5. `memory-bank/tech.md`;
6. `drywalltoolbox/wp/wp-content/mu-plugins/README.md`;
7. current `docs/`;
8. historical plans/generated output/comments/legacy wrappers.

Source wins. Update durable docs when architecture, routes, constants, queues, authorities, or deployment behavior changes.

## Repository ownership

- `frontend/`: React storefront. UI, routes, accessibility, client state, and API communication only.
- `drywalltoolbox/wp/wp-content/mu-plugins/`: canonical backend business logic. Composition root `00-dtb-loader.php`.
- Preserve module order: `dtb-platform`, `dtb-catalog-platform`, `dtb-commerce`, `dtb-order-platform`, `dtb-schematics`, `dtb-media`, `dtb-marketing`, `dtb-repair-service`, `dtb-integrations`, `dtb-support`, `dtb-returns`.
- `products/`: production catalog/taxonomy/media/schematic business data. Preserve stable identifiers.
- `scripts/`: deterministic, repeatable, non-destructive operational tooling.
- `drywalltoolbox/`: tracked SiteGround deployment source mirror. Never edit generated `dist/` as source.

## System authorities

- **React**: browsing, product/cart/account UX, checkout handoff, local interaction state. Never payment authority.
- **WooCommerce**: products, customers, Store API cart/session, Checkout Block, addresses, shipping/tax/totals, storefront order creation, refunds, and authoritative order/payment status.
- **Payment Plugins for Stripe WooCommerce (`woo-stripe-payment`)**: Stripe card fields, Apple Pay, Google Pay, Link when enabled, Stripe-supported BNPL methods, tokenization, 3DS/SCA, confirmation/capture, and Stripe webhook synchronization into WooCommerce.
- **Optional PayPal provider**: PayPal only when separately installed, configured, reviewed, and validated. It must not introduce a second card authority or synthetic PayPal UI.
- **DTB**: native checkout routing/runtime integration, readiness diagnostics, domain validation, order tagging/observation, captured-payment gate, event ledger, queues, projections, integrations, and operator tooling.
- **Veeqo**: inventory, allocation, fulfillment, labels, shipment execution/status, carrier, and tracking.
- **QuickBooks**: accounting projection after qualifying payment/refund events; never order creation.

Current checkout shipping is WooCommerce/DTB policy rating, not live Veeqo carrier rating.

## Storefront checkout contract

Only this storefront checkout path is approved:

```text
React Store API cart using same-origin WooCommerce cookie session
  -> full-document /checkout/
  -> domain-root routing to WordPress
  -> DTB native checkout runtime exempts checkout from the React theme override
  -> assigned WooCommerce Checkout page
  -> WooCommerce Checkout Block
  -> Payment Plugins for Stripe WooCommerce
  -> WooCommerce order/payment lifecycle
  -> DTB captured-payment observation
  -> dtb-orders Action Scheduler queue
  -> Veeqo / QuickBooks / notifications / tracking
```

Mandatory invariants:

- WooCommerce Checkout Block creates storefront orders.
- `woo-stripe-payment` is the only active storefront Stripe card/wallet authority.
- Do not run WooCommerce Stripe Gateway or WooPayments simultaneously with `woo-stripe-payment` in production.
- React never creates Woo orders, PaymentIntents, Stripe Checkout Sessions, card fields, wallet tokens, or payment iframes.
- Never copy or patch regular-plugin internals into DTB code. Use documented filters, WooCommerce contracts, and provider-owned settings.
- Same-origin React cart uses WooCommerce cookie session plus Store API `Nonce`; Cart-Token is compatibility-only for genuinely cross-origin clients.
- Never decode unsigned Cart-Token payloads or query `woocommerce_sessions` to recover arbitrary sessions.
- Preserve WooCommerce/provider order, payment, webhook, refund, and saved-payment-method lifecycles.
- Downstream fulfillment/accounting waits for the captured-payment contract.
- Raw browser/external Woo REST order creation remains blocked; legacy `POST /drywall/v1/orders` remains retired.

New paid orders use:

```text
_dtb_checkout_gateway = woo_native_stripe
_dtb_checkout_contract_version = payment-plugins-stripe-v1
_dtb_payment_provider = payment_plugins_stripe
WooCommerce date_paid present
non-secret transaction/payment reference present
```

Historical `woo-stripe-v1` / `woocommerce_stripe` evidence remains readable for orders created before migration. Never rewrite historical paid-order identity in bulk.

## Payment-provider migration contract

- The repository does not bundle or patch `woo-stripe-payment`; WordPress manages it as a regular plugin.
- Plugin activation, OAuth/API connection, webhook creation, live/test mode, payment-method settings, domain registration, and data-migration acceptance are operator actions.
- The retired official WooCommerce Stripe extension and the replacement plugin must not be active together during acceptance or production use.
- Saved-payment/customer/subscription compatibility is provider-managed and must be verified on staging before cutover.
- Payment Plugins migrates payment identity, not DTB/plugin settings. Recreate settings manually from the approved checklist.
- PayPal is not supplied by the Stripe plugin. A separately reviewed PayPal plugin is required for real PayPal controls.
- Never use a fake Apple Pay, Google Pay, PayPal, Link, BNPL, or card control. Provider eligibility and UI are authoritative.

## Checkout UI contract

- Desktop is a single-page checkout with Express Checkout first and an order-summary/payment rail.
- Mobile/tablet use the existing Contact -> Shipping -> Payment presentation wizard.
- Native WooCommerce fields and provider surfaces remain mounted; the theme must not create proxy fields or duplicate payment state.
- Contact owns first name, last name, email, and optional phone; shipping owns address and shipping method.
- Express Checkout is limited to approved provider-owned methods and must not be duplicated in the lower payment list.
- Payment-method cards may visually hide radio circles, but the native focusable input remains the semantic/state authority.
- Theme code must not read or mutate cross-origin provider iframe contents.
- The checkout header contains the DTB logo and provider-backed Powered by Stripe status only.

## Refund contract

WooCommerce owns refund creation. Each refund is identified by `order_id + refund_id` through events, queue args, and QuickBooks idempotency. Never use parent order status to infer partial refund versus cancellation. Never reuse cumulative lifetime refunded amount as the amount for each refund event.

## Async and duplicate containment

Order-related external effects use `dtb_order_enqueue_job()` and Action Scheduler group `dtb-orders`. New scheduled work defines owner, hook/args, idempotency, deduplication, retry limit, terminal failure, observability, recovery, and compensation behavior. Avoid slow external calls in checkout, payment webhook acknowledgement, or interactive requests.

## Security

Never expose or persist WooCommerce application passwords/consumer secrets, JWT signing secrets, Stripe secret keys/webhook secrets/PaymentIntent client secrets/wallet tokens, PayPal credentials, Veeqo/QuickBooks/marketplace credentials, or private keys in browser code, `REACT_APP_*`, storage, logs, REST responses, docs, or generated assets.

Every REST route needs explicit permission behavior. Validate customer ownership independently. Sanitize/validate input, escape output, allowlist writable fields, use prepared SQL, timing-safe secret comparisons, signature/replay protection, and idempotent queue/webhook handlers. Never weaken CORS/auth/origin/signature/nonce/capability controls to make requests succeed.

## Engineering method

For every task: extract acceptance criteria; inspect the smallest relevant source set; identify owner/system of record; trace request/persistence/events/queues/integrations/deployment; identify auth/concurrency/duplicate/compatibility/migration/scaling/rollback risks; choose the lowest-risk complete design; implement in the owning layer; add guards/tests/smoke checks; update durable docs; validate; inspect final diff for scope creep, secrets, generated files, and deployment hazards.

## Code standards

JavaScript/React: ES modules, functional components/hooks, dependency-correct cancelable effects, centralized API/auth, accessible responsive states, no duplicate/fetch-per-item patterns, batch/cache where material. Do not introduce isolated TypeScript.

PHP/WordPress: `defined( 'ABSPATH' ) || exit;`, WordPress/Woo security conventions, clear bounded layers, no output before headers, no unbounded/N+1 queries, transactions/compensation for partial writes, idempotent handlers.

## Validation

Frontend:

```powershell
cd frontend
npm ci --include=dev
npm run lint
npm run build
```

Provider migration:

```powershell
.\scripts\smoke-dtb-payment-provider-migration.ps1
.\scripts\smoke-dtb-checkout-ui.ps1
.\scripts\smoke-dtb-product-express-checkout.ps1
```

Runtime acceptance must cover plugin exclusivity, cards, saved cards, 3DS/SCA, Apple Pay, Google Pay, configured BNPL methods, optional PayPal, address/shipping/tax recalculation, declines/cancellation/retry, webhook status, refunds, order-pay/order-received, captured-payment gating, event ledger, queues, Veeqo, and QuickBooks.

Do not claim a smoke script or test passed unless it exists in the checked-out source and was actually run. Merge is not deployment. Never package credentials, `wp-config.php`, WordPress core, uploads, cache, runtime secrets, or uncontrolled dumps.
