# Drywall Toolbox Engineering Authority

Last reconciled with tracked source: 2026-07-31.

This file defines repository ownership, current architecture, system boundaries,
and engineering constraints. It intentionally contains no deployment, release,
rollback, build-validation, smoke-test, or acceptance-test procedures.

## 1. Mission and truth discipline

Act as the senior engineering authority for Drywall Toolbox. Changes must
preserve security, privacy, data integrity, business identifiers, authorization,
customer ownership, idempotency, queue semantics, observability, compatibility,
and recoverability.

Never fabricate repository state, runtime configuration, routes, schemas,
credentials, external responses, production state, or evidence. Distinguish:

- facts verified in active source;
- facts supplied by the user as current operational truth;
- evidence-based inference;
- recommendations;
- runtime state that the repository cannot prove.

When sources disagree, use this precedence:

1. active source code and current composition/routing configuration;
2. this `AGENTS.md`;
3. current architecture and contract documents under `docs/`;
4. `memory-bank/product.md`, `memory-bank/structure.md`, and
   `memory-bank/tech.md`;
5. module READMEs;
6. historical plans, generated reports, comments, legacy wrappers, deleted
   files, and reference-only material.

Source code wins. Filenames and comments are not sufficient proof of behavior.
External plugin and API behavior must be grounded in current primary sources.

## 2. Product and runtime topology

Drywall Toolbox is a contractor-focused commerce and service-operations system
for professional drywall tools, parts, schematics, repairs, returns, support,
customer accounts, inventory, fulfillment, accounting, and marketplace work.

Current topology:

```text
React 19 storefront
  -> same-origin WordPress REST and WooCommerce Store API
  -> WooCommerce cookie-backed cart/session
  -> full-document native WooCommerce checkout
  -> WooCommerce Checkout Block
  -> Payment Plugins for Stripe WooCommerce (`woo-stripe-payment`)
  -> WooCommerce order/payment/refund lifecycle
  -> DTB event ledgers and Action Scheduler queues
  -> Veeqo, QuickBooks, notifications, tracking, and marketplace integrations
```

The React SPA owns browsing, search, product and schematic interaction, cart UX,
account UX, service intake, responsive presentation, and checkout handoff. It is
not authoritative for order creation, payment execution, refunds, inventory,
fulfillment, or accounting.

WordPress and WooCommerce own authoritative commerce persistence. DTB MU plugins
own domain policy, orchestration, projections, integration boundaries, eventing,
and operator surfaces.

## 3. Repository ownership

### `frontend/`

The React SPA uses JavaScript/JSX, React 19.2, React Router 7, Webpack 5,
Tailwind CSS 4, feature CSS files, Framer Motion, Axios, and Lucide icons.

- composition and providers: `frontend/src/App.jsx`;
- route screens: `frontend/src/pages/`;
- shared and domain UI: `frontend/src/components/`;
- API clients: `frontend/src/api/`;
- authentication/session: `frontend/src/auth/` and `frontend/src/api/client.js`;
- shared state: `frontend/src/context/` and `frontend/src/hooks/`;
- active catalog/data adapters: `frontend/src/services/`;
- generated/static client data: `frontend/src/data/`;
- presentation authority: `frontend/src/styles/`.

`frontend/src/services/` is actively consumed and is not merely a legacy area.
Do not introduce isolated TypeScript into the JavaScript application.

### `drywalltoolbox/`

This is the tracked WordPress application source tree. Custom backend behavior
belongs under `drywalltoolbox/wp/wp-content/mu-plugins/`. The primary tracked
theme integration is under
`drywalltoolbox/wp/wp-content/themes/drywall-toolbox/`.

Regular plugins and their runtime settings are WordPress-managed dependencies;
their implementation and activation state are not proven by this repository.

### `products/`

This directory owns canonical catalog source files, taxonomy and compatibility
data, schematics, media references, and product assets. WooCommerce owns the
runtime product records derived from that material.

SKU, MPN, part number, GTIN, brand, taxonomy, compatibility, and external IDs are
stable business identifiers. They change only through an explicit data
correction, never as incidental cleanup.

### `scripts/`

Scripts are deterministic operational tooling. They must be bounded,
idempotent where practical, non-destructive by default, and explicit about the
data or subsystem they own.

### Generated output

`dist/`, generated catalogs, caches, and assembled artifacts are not canonical
implementation source. Do not hand-edit generated output when an owning source
or generator exists.

## 4. MU-plugin composition and module boundaries

`drywalltoolbox/wp/wp-content/mu-plugins/00-dtb-loader.php` is the backend
composition root. Its active load order is:

1. `dtb-platform`;
2. `dtb-catalog-platform`;
3. `dtb-commerce`;
4. `dtb-order-platform`;
5. `dtb-schematics`;
6. `dtb-media`;
7. `dtb-marketing`;
8. `dtb-repair-service`;
9. `dtb-integrations`;
10. `dtb-support`;
11. `dtb-returns`;
12. `dtb-deployment`.

Module ownership:

- `dtb-platform`: shared configuration, security/origin/authentication,
  Store API containment, cache, health, metrics, audit, account APIs, and common
  admin/system surfaces.
- `dtb-catalog-platform`: catalog normalization, products, variations, brands,
  taxonomy, relationships, compatible parts, inventory intelligence, and
  catalog-facing REST/admin behavior.
- `dtb-commerce`: cart extension data, checkout policy, native checkout runtime,
  Stripe-provider readiness and order tagging, shipping policy, order typing,
  WooCommerce classic HTML email template routing/registration (deterministic
  `woocommerce_locate_template` overrides — see
  `docs/operations/woocommerce-html-email-architecture.md`), and
  commerce-facing REST behavior.
- `dtb-order-platform`: order transitions, append-only order events, tracking
  projections, captured-payment observation, refund events, integration state,
  and the `dtb-orders` queue boundary.
- `dtb-schematics`: schematic domain records, manifests, attachment metadata,
  part resolution, and schematic APIs.
- `dtb-media`: product-image synchronization and media administration. Its
  bootstrap is intentionally limited to admin or REST requests.
- `dtb-marketing`: coming-soon/referral and product SEO behavior.
- `dtb-repair-service`: repair intake, status, events, media, quotes, queues,
  notifications, and operator workflows.
- `dtb-integrations`: Woo adapters, Veeqo, QuickBooks, notifications, Amazon,
  eBay, marketplace records, and integration pipeline controls. Owns the
  Veeqo → native WooCommerce Fulfillment projector (shipment identity,
  idempotency, and native customer-notification ownership for
  `customer_fulfillment_created`/`updated`).
- `dtb-support`: support tickets, events, outbox/automation, macros, APIs, and
  operator workbench behavior.
- `dtb-returns`: return domain records, workflow, persistence, APIs, and operator
  behavior.
- `dtb-deployment`: release-event persistence and its System Manager/GitHub
  control-plane integration. Procedure is intentionally outside this file.

New behavior belongs inside the owning module. Root MU-plugin files may remain
compatibility delegates but must not become new domain homes. Preserve loader
order unless a dependency change requires an explicit composition change.

## 5. System-of-record boundaries

- **WooCommerce** owns runtime products, customers, cookie-backed Store API
  cart/session state, checkout fields, addresses, shipping, tax, discounts,
  totals, storefront order creation, payment/order status, refunds, and saved
  payment-method records.
- **Payment Plugins for Stripe WooCommerce** owns Stripe payment-method
  rendering, the `stripe_upm` Payment Element, wallet and BNPL eligibility,
  tokenization, 3DS/SCA, payment confirmation, capture, and Stripe webhooks.
- **A separately configured PayPal provider** owns PayPal when present. Stripe
  does not supply PayPal, and DTB must not fabricate a PayPal control.
- **DTB** owns checkout runtime integration, domain policy, non-secret readiness,
  order contract tagging, captured-payment gating, events, queues, projections,
  repairs, returns, support, schematics, media, and integration orchestration.
- **Veeqo** owns sellable inventory and fulfillment truth, including allocation,
  shipment execution, shipment status, and tracking.
- **QuickBooks** owns the accounting projection. It never creates storefront
  orders or becomes the commerce system of record.

Current checkout shipping is WooCommerce/DTB policy rating, not live Veeqo
carrier rating.

## 6. Storefront session and API contract

Same-origin cart traffic uses the WooCommerce Store API, the WooCommerce cookie
session, and Store API nonce handling. Cart-Token support is compatibility-only
for genuinely cross-origin clients.

Never decode unsigned Cart-Token payloads or query `woocommerce_sessions` to
recover arbitrary sessions. Never weaken nonce, cookie, origin, CORS,
authentication, capability, ownership, or rate-limit boundaries to make a
request succeed.

The frontend uses both DTB WordPress REST endpoints and WooCommerce Store API
endpoints. Do not describe it as communicating exclusively through one API
namespace.

Customer reads and writes derive identity from authenticated server context and
verify resource ownership independently. Caller-provided customer or order IDs
are not authorization.

## 7. Checkout and payment contract

The supported storefront order path is:

```text
React cart or Product Checkout Now
  -> checkout handoff confirms authoritative Store API cart/session
  -> full-document `/checkout/`
  -> WordPress native checkout runtime exception
  -> tracked `drywall-toolbox` checkout template
  -> assigned WooCommerce Checkout page
  -> WooCommerce Checkout Block
  -> Payment Plugins for Stripe
  -> WooCommerce order/payment lifecycle
  -> DTB captured-payment observation and queued downstream effects
```

The SPA `/checkout` route is a handoff/loading surface. It is not a React payment
form and does not create an order.

Mandatory boundaries:

- WooCommerce Checkout Block creates storefront orders.
- `woo-stripe-payment` is the only Stripe card/wallet authority.
- `stripe_upm` is the only Payment Plugins gateway exposed on the primary
  storefront checkout when enabled.
- Competing WooCommerce Stripe and WooPayments gateways are excluded from the
  primary storefront payment surface when `stripe_upm` is authoritative.
- React and DTB do not create PaymentIntents, Checkout Sessions, payment fields,
  wallet tokens, provider iframes, payment confirmations, or captures.
- Regular-plugin internals are not copied or patched into tracked DTB source.
- Checkout capability responses contain only non-secret readiness metadata.

Current provider-backed order identity is:

```text
_dtb_checkout_gateway = woo_native_stripe
_dtb_checkout_contract_version = payment-plugins-stripe-v1
_dtb_payment_provider = payment_plugins_stripe
WooCommerce date_paid is present
a non-secret transaction/payment reference is present
```

Historical paid orders may retain:

```text
_dtb_checkout_contract_version = woo-stripe-v1
_dtb_payment_provider = woocommerce_stripe
```

Historical payment identity remains readable and is not bulk rewritten.
Authorization-only/manual-capture state is not treated as captured payment.

## 8. Checkout presentation boundary

The tracked `drywall-toolbox` theme owns native checkout document presentation.
Active source includes:

- `templates/checkout/native-checkout.php`;
- `assets/checkout/checkout.css`;
- `assets/checkout/checkout.js`;
- `assets/checkout/checkout-order-summary.js`.

The stylesheet and controller present the existing Checkout Block responsively,
including mobile step presentation and desktop layout. They do not own checkout
field values, shipping selection, payment state, or order submission.

WooCommerce fields and provider surfaces remain mounted and authoritative.
Theme and MU-plugin code must not inspect, clone, reparent, replace, or mutate
cross-origin provider iframe contents. Stripe Elements appearance belongs to the
provider-supported Appearance API integration.

There must be one checkout field set, one payment state, and one native order
submission action. Mobile Contact/Shipping/Payment steps are presentation state,
not separate checkout state.

Checkout, order-pay, callbacks, account/session-owned pages, and payment
endpoints are private and non-cacheable. Host optimization must not rehost
Stripe.js or reorder WooCommerce/provider dependencies.

## 9. Product and payment presentation facts

Current storefront presentation uses locally bundled Inter Variable and primary
brand blue `#2255ee`.

Product-detail behavior:

- Add to Cart uses `#2255ee`; Checkout Now uses black.
- Clicking the primary product image opens the viewer; there is no magnifier
  control.
- Product-page express-method marks are informational and capability-gated.
- Product pages may show PayPal, Klarna, Google Pay, Apple Pay, Afterpay, and
  Affirm marks when backend capability data supports them.
- Visa, Mastercard, American Express, and Discover marks are not part of the
  product-detail express-method row.
- Payment marks have transparent outer backgrounds unless the official mark
  itself includes a field or frame.
- Mobile product cards do not render Add to Cart controls.
- Mobile product-detail modal trust items retain titles while secondary detail
  text is suppressed.

Payment marks never imply that a payment method is configured. Real availability
comes from backend/provider capability state.

## 10. Order, queue, integration, and refund contract

External order effects are queue-owned. Order work uses
`dtb_order_enqueue_job()` and Action Scheduler group `dtb-orders` with explicit
identity, deduplication, retry classification, terminal failure, and integration
state.

Slow Veeqo, QuickBooks, notification, and marketplace calls do not belong in
interactive checkout requests or payment-webhook acknowledgement paths.

Captured-payment gating, the initial processing-dispatch barrier, integration
locks, deterministic remote identity, and duplicate containment are shared
cross-module invariants.

WooCommerce owns refund creation. `woocommerce_order_refunded` supplies the
parent order ID and concrete refund ID. Every refund preserves
`order_id + refund_id` through event identity, queue arguments, idempotency, and
QuickBooks projection. Separate partial refunds remain separate accounting
events; cumulative lifetime refunded totals are not the amount of each event.

QuickBooks writes remain queue-owned and reconcile deterministic SalesReceipt or
RefundReceipt document identity before creating remote records. WooCommerce
remains the commerce record; QuickBooks is the accounting projection.

## 11. Security and privacy boundaries

Never expose credentials, secrets, private keys, tokens, payment data, or server
configuration.

Server-only material includes WooCommerce application credentials, JWT signing
secrets, Stripe secret and webhook keys, PaymentIntent client secrets, wallet
tokens, PayPal credentials, Veeqo and QuickBooks credentials, marketplace
credentials, and external-write secrets. `REACT_APP_*` values are public by
definition.

Every REST route has explicit permission behavior. Public routes are narrowly
read-safe. Inputs are validated and sanitized, outputs escaped, writable fields
allowlisted, SQL prepared, signatures verified, replay constrained, comparisons
timing-safe where relevant, and logs redacted.

Checkout telemetry never persists form values, names, addresses, emails, phone
numbers, order keys, bearer/JWT tokens, provider secrets, client secrets, wallet
payloads, or raw payment data.

## 12. Data and persistence boundaries

Database inspection is read-only by default. WooCommerce, HPOS, Action
Scheduler, DTB event ledgers, integration state, support, repair, return,
marketplace, accounting, and release-event records remain owned by their
respective modules.

Schema changes belong in the owning module's schema installer and have explicit
versioning and compatibility semantics. Broad deletes, unbounded updates,
`TRUNCATE`, uncontrolled dumps, and cross-domain table writes are outside the
normal application contract.

Structured catalog and configuration files are handled with structured parsers.
Preserve established CSV schema, quoting, line endings, encoding, identifier
columns, and deterministic output.

## 13. Performance and reliability

Consider query count, indexes, payload size, cacheability, memory use, external
latency, queue throughput, retry amplification, duplicate requests, and failure
recovery.

Prefer indexed and batched work over unbounded scans, N+1 requests, or
fetch-per-item designs. Browser data access should use existing centralized
clients, coalescing, caching, pagination, and cancellation patterns where
material.

Interactive requests must not absorb slow external-system work. Caches must not
cross customer, cart, checkout, payment, callback, or account ownership
boundaries.

## 14. Engineering standards

General:

- inspect the active implementation and its consumers before editing;
- identify the owning module and system of record;
- preserve existing contracts unless the task explicitly changes them;
- keep edits scoped and avoid unrelated refactors or generated-file churn;
- update durable architecture documentation when a contract or ownership
  boundary changes;
- do not overwrite unrelated user changes in a dirty worktree.

JavaScript and React:

- ES modules and functional components;
- correct hook dependencies, cleanup, and cancellation;
- centralized API, auth, cart, and checkout-handoff behavior;
- accessible responsive interfaces and stable layout geometry;
- runtime validation at untrusted boundaries;
- no duplicate cart, checkout, payment, order, inventory, or accounting
  authority.

PHP and WordPress:

- `defined( 'ABSPATH' ) || exit;` in executable module files;
- WordPress escaping, sanitization, capability, nonce, ownership, and prepared
  SQL conventions;
- bounded module ownership and explicit composition;
- idempotent event, webhook, queue, and integration handlers;
- redacted diagnostics and graceful failure;
- no unbounded or N+1 database access.

Frontend presentation:

- use the existing design tokens, Inter typography, Lucide icon system, and
  responsive authority layers;
- preserve touch targets, focus visibility, reduced motion, forced colors,
  safe-area handling, text wrapping, and non-overlapping layouts;
- use familiar icon controls for familiar actions and tooltips for unfamiliar
  icon-only controls;
- avoid fake payment controls, duplicate provider surfaces, decorative card
  nesting, and presentation that obscures authoritative state.
