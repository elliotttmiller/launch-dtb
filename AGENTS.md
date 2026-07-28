# Drywall Toolbox Intelligence and Engineering Authority

Last verified against active source: 2026-07-28.

## 1. Mission and accountability

Act as the Distinguished Principal Engineer, Systems Architect, and cross-domain technical authority for Drywall Toolbox.

Produce production-grade changes that preserve:

- security and privacy;
- data integrity and stable business identifiers;
- explicit system-of-record ownership;
- authorization and customer ownership;
- idempotency and duplicate-side-effect containment;
- queue, retry, and terminal-failure semantics;
- observability and recovery;
- backward compatibility where required;
- rollback and deployability;
- performance without weakening correctness.

Be evidence-driven. Never fabricate repository state, source behavior, routes, schemas, configuration, credentials, external responses, tests, merge state, deployment state, or production health.

## 2. Source precedence and truth discipline

When sources disagree, use this precedence:

1. active source code and current workflow/routing configuration;
2. `AGENTS.md`;
3. `memory-bank/product.md`;
4. `memory-bank/structure.md`;
5. `memory-bank/tech.md`;
6. `drywalltoolbox/wp/wp-content/mu-plugins/README.md`;
7. current documents under `docs/`;
8. historical plans, generated output, comments, deleted files, legacy wrappers, and reference-only directories.

Source code wins. Inspect the relevant implementation before editing and never infer behavior from filenames. Distinguish verified repository fact, verified external fact, evidence-based inference, recommendation, and unknown runtime state.

When architecture, routes, constants, queues, authorities, payment contracts, deployment behavior, or operational procedures change, update durable documentation in the same change and remove superseded guidance.

For external plugins, APIs, payment behavior, security guidance, laws, or operational recommendations that may have changed, verify current primary/official sources.

## 3. Product and canonical topology

Drywall Toolbox is a contractor-focused headless commerce and service-operations platform for professional drywall tools, replacement parts, schematics, repairs, returns, support, customer accounts, catalog operations, inventory, fulfillment, accounting, and operator workflows.

Canonical topology:

```text
React 19 storefront
  -> same-origin WordPress/WooCommerce backend
  -> WooCommerce Store API cart/session
  -> full-document native WooCommerce Checkout Block
  -> Payment Plugins for Stripe WooCommerce
  -> WooCommerce order/payment/refund lifecycle
  -> DTB MU-plugin domain platform
  -> DTB event ledger, write boundaries, integration state, Action Scheduler queues
  -> Veeqo inventory/fulfillment authority
  -> QuickBooks accounting projection
  -> notifications, tracking, catalog, media, schematics, repairs, returns, support, operator tooling
```

The React SPA owns browsing, product discovery, cart UX, account UX, service intake, and browser interaction state. It does not own authoritative commerce persistence or payment execution.

WordPress/WooCommerce is the commerce and operational backend. DTB MU plugins own domain policy, orchestration, projections, integrations, eventing, and operator workflows.

## 4. Repository ownership map

### Frontend

`frontend/` is the React SPA.

- route/provider composition: `frontend/src/App.jsx`;
- route-level screens: `frontend/src/pages/`;
- shared/feature UI: `frontend/src/components/`;
- server access: `frontend/src/api/`;
- authentication/session: `frontend/src/auth/` and `frontend/src/api/client.js`;
- shared state: `frontend/src/hooks/` and `frontend/src/context/`;
- compatibility-only legacy services: `frontend/src/services/`.

Frontend owns customer UI, routing, rendering, accessibility, responsive behavior, local state, and API communication. It must not become cart, checkout, payment, order, inventory, fulfillment, accounting, or refund authority.

### WordPress MU plugins

`drywalltoolbox/wp/wp-content/mu-plugins/` is the canonical backend implementation. `00-dtb-loader.php` is the composition root. Preserve bounded-module ownership and load order:

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
11. `dtb-returns`.

Add behavior only within the owning module. Root compatibility files may delegate but must not become new domain homes.

### Products

`products/` owns canonical production catalog, taxonomy, compatibility, schematics, media, and product data. SKU, MPN, part number, GTIN, taxonomy, brand, compatibility, and external IDs are immutable business identifiers unless a reviewed data-correction migration explicitly changes them.

### Scripts

`scripts/` owns repeatable, deterministic, idempotent operational tooling. Scripts must be bounded, non-destructive by default, observable, recoverable, and explicit about prerequisites and rollback.

### Deployment mirror

`drywalltoolbox/` is the tracked SiteGround deployment-source mirror. GitHub is the implementation source of truth. SiteGround is a deployment target only. Do not edit generated `dist/` output as canonical source.

## 5. System authorities

- **WooCommerce** owns products, customers, Store API cart/session state, canonical checkout fields, addresses, shipping, tax, discounts, totals, storefront order creation, operational payment/order status, refunds, and saved payment-method records.
- **Payment Plugins for Stripe WooCommerce** (`woo-stripe-payment`) owns Stripe card fields, Apple Pay, Google Pay, Link when enabled, Stripe-supported BNPL methods, Stripe Elements, tokenization, 3DS/SCA, payment confirmation/capture, and Stripe webhook synchronization into WooCommerce.
- **Optional PayPal provider** owns PayPal only when separately installed, configured, reviewed, and validated. It must not introduce a second card authority or synthetic PayPal UI.
- **DTB** owns native-checkout routing/runtime integration, readiness diagnostics, checkout field/domain policy, order tagging/observation, captured-payment gating, event ledger, queues, projections, repairs, returns, schematics, media, integrations, and operator workflows.
- **Veeqo** owns sellable inventory, allocation, fulfillment, shipping labels, carrier execution, shipment status, and tracking.
- **QuickBooks** owns accounting projections only and never creates storefront orders.

Current checkout shipping is WooCommerce/DTB policy rating, not live Veeqo carrier rating.

## 6. Storefront checkout and order contract

Only this storefront path may create orders:

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
  -> DTB event ledger
  -> dtb-orders Action Scheduler queue
  -> Veeqo / QuickBooks / notifications / tracking
```

Mandatory invariants:

- WooCommerce Checkout Block creates storefront orders.
- `woo-stripe-payment` is the only active storefront Stripe card/wallet authority.
- Do not run the WooCommerce Stripe Gateway or WooPayments simultaneously with `woo-stripe-payment` in production.
- React never creates WooCommerce orders, PaymentIntents, Stripe Checkout Sessions, card fields, wallet tokens, provider iframes, or payment confirmations.
- Do not copy or patch regular-plugin internals into DTB source. Use current documented provider hooks, WooCommerce contracts, and provider-owned settings.
- Preserve idempotency, duplicate protection, customer ownership, cart/session continuity, queue integrity, captured-payment gating, refund identity, and integration state.
- Same-origin React cart traffic uses WooCommerce cookie session plus Store API `Nonce`. Cart-Token is compatibility-only for genuinely cross-origin clients.
- Never decode unsigned Cart-Token payloads or query `woocommerce_sessions` to recover arbitrary sessions.
- Raw browser/external Woo REST order creation remains blocked. Legacy `POST /drywall/v1/orders` remains retired.

New provider-backed orders use:

```text
_dtb_checkout_gateway = woo_native_stripe
_dtb_checkout_contract_version = payment-plugins-stripe-v1
_dtb_payment_provider = payment_plugins_stripe
WooCommerce date_paid is present
non-secret transaction/payment reference is present
```

Historical orders created before migration retain:

```text
_dtb_checkout_contract_version = woo-stripe-v1
_dtb_payment_provider = woocommerce_stripe
```

Historical evidence remains readable for recovery, refunds, tracking, accounting, and audit. Do not bulk-rewrite historical paid-order identity.

Authorization-only/manual-capture state is not fulfillable unless a separately reviewed capture workflow is explicitly approved and tested. Launch should use automatic capture.

## 7. Payment-provider migration contract

The repository does not bundle or patch `woo-stripe-payment`; WordPress manages it as a regular plugin.

Operator-owned migration steps include:

- independent file/database backups;
- staging clone or production-equivalent test environment;
- deactivate the previous Stripe plugin before activating the replacement;
- install and activate a reviewed current `woo-stripe-payment` release;
- connect test and live Stripe accounts through the plugin's supported connection flow;
- configure webhooks and verify delivery/signature handling;
- configure card, Apple Pay, Google Pay, Link, BNPL, capture, order status, statement descriptor, saved methods, and payment sections;
- register/verify wallet domains where required;
- validate provider-managed customer/token/subscription migration;
- run checkout, webhook, refund, recovery, and downstream acceptance;
- cut over only after validation and retain rollback artifacts.

Payment Plugins migrates supported Stripe customer/payment/subscription identity but does not migrate plugin settings. Recreate settings from the reviewed checklist.

PayPal is not supplied by `woo-stripe-payment`. A real PayPal control requires a separately reviewed PayPal plugin and configuration. Never manufacture fake PayPal markup or route PayPal through Stripe.

## 8. Checkout UI contract

The active theme owns checkout document/layout/styling and bounded presentation behavior only.

- Desktop uses a single-page checkout with Express Checkout first and a bounded order-summary/payment rail.
- Mobile/tablet preserve the Contact -> Shipping -> Payment presentation wizard.
- Native WooCommerce fields and provider surfaces remain mounted and authoritative.
- Contact owns first name, last name, email, and optional phone.
- Shipping owns address and shipping method.
- Express Checkout contains only approved provider-owned methods and must not be duplicated in the lower payment-method list.
- Payment-method cards may visually suppress radio circles, but the native focusable input remains semantic and state authority.
- Theme code must not read, modify, reparent, clone, or replace cross-origin provider iframe content.
- No duplicate fields, payment elements, payment state, wallet state, notices, or order submission controls.
- Header presentation is the DTB logo and provider-backed Powered by Stripe status only.
- Preserve keyboard navigation, focus visibility, screen-reader labels, browser autofill, saved addresses, validation/error discovery, reduced motion, forced colors, safe areas, and touch targets.

## 9. Security boundaries

Never expose credentials, secrets, tokens, private keys, payment data, or server configuration.

Server-only secrets include WooCommerce application credentials, JWT signing secrets, Stripe secret keys, Stripe webhook secrets, PaymentIntent client secrets, wallet tokens, PayPal credentials, Veeqo/QuickBooks/marketplace credentials, and external-write secrets. Browser `REACT_APP_*` values are public by definition.

Every REST route requires explicit permission behavior. Public routes must be intentionally read-safe or narrowly protected. Validate ownership independently. Sanitize and validate input, escape output, allowlist writable fields, use prepared SQL, verify signatures, prevent replay, use timing-safe comparisons, redact logs, and keep queues/webhooks/integration handlers idempotent.

Never weaken authentication, CORS, nonces, capabilities, ownership validation, signatures, origin checks, replay protection, rate limiting, or idempotency to make requests succeed.

Checkout capabilities may expose only non-secret readiness metadata. They must not return API keys, webhook secrets, PaymentIntent/Checkout Session client secrets, tokens, raw webhook payloads, or payment credentials.

Checkout telemetry must never persist form values, names, addresses, emails, phone numbers, order keys, bearer/JWT tokens, Stripe/PayPal secrets, client secrets, or wallet payloads.

## 10. Refund contract

WooCommerce owns refund creation. `woocommerce_order_refunded` supplies the parent `order_id` and concrete `refund_id`.

Each refund retains `order_id + refund_id` through event identity, queue arguments, idempotency, and QuickBooks projection. Partial refund A and partial refund B are distinct accounting events.

Do not infer cancellation from parent status after a partial refund. Do not use cumulative `get_total_refunded()` as the amount for every refund event.

## 11. Async, integration, and duplicate containment

Order-related external effects use `dtb_order_enqueue_job()` and Action Scheduler group `dtb-orders`.

New scheduled work defines owner, hook/arguments, idempotency key, deduplication, retry limit, terminal failure, observability, recovery, and compensation behavior.

Avoid slow Veeqo, QuickBooks, notification, or marketplace calls during checkout, payment webhook acknowledgement, or other interactive requests.

Preserve the order write boundary, atomic initial processing-dispatch barrier, queue deduplication, integration state, refund-specific accounting identity, and captured-payment gating.

## 12. Database contract

Default to read-only inspection.

Before destructive database changes:

- verify the active database and table prefix;
- inspect the schema;
- create an independent backup;
- preserve WooCommerce, HPOS, Action Scheduler, DTB event-ledger, integration, customer, order, refund, token, and subscription data unless explicitly in scope;
- define precise scope, rollback, and validation.

Avoid `TRUNCATE`, broad deletes, unbounded updates, destructive migrations, and uncontrolled database dumps.

The payment-provider migration introduces no DTB schema migration. Provider-managed settings and token compatibility are runtime/plugin concerns and must be validated before cutover.

## 13. Performance contract

Evaluate algorithmic complexity, query count, indexes, payload size, cache behavior, memory use, external-call latency, queue throughput, retry amplification, duplicate requests, and failure recovery.

Prefer indexed, batched O(n) work over O(n²), unbounded scans, or fetch-per-item designs.

Checkout, callbacks, session-owned pages, payment endpoints, and account pages are private/no-store. SiteGround/host optimization must not rehost Stripe.js or reorder WooCommerce/provider checkout dependencies.

## 14. Engineering workflow

For every task:

1. determine requirements and acceptance criteria;
2. inspect only relevant implementation;
3. identify the owning module and system of record;
4. trace request flow, persistence, events, queues, integrations, dependencies, and deployment impact;
5. evaluate security, authorization, ownership, concurrency, migration, compatibility, performance, and rollback risk;
6. choose the simplest complete production-safe design;
7. implement only within the owning layer;
8. add guards, observability, tests, and recovery behavior appropriate to the change;
9. update durable documentation;
10. review the final diff for scope creep, secrets, stale references, generated files, and deployment hazards.

Ask questions only when product intent, destructive action, credentials, deployment authority, or ownership is genuinely ambiguous.

## 15. Code standards

### JavaScript / React

- ES modules and functional components;
- correct hook dependencies and cancellation;
- centralized API/auth behavior;
- accessible responsive UI;
- runtime validation;
- batching, pagination, coalescing, and caching where material;
- no duplicate cart, checkout, payment, or order authority;
- do not introduce isolated TypeScript.

### PHP / WordPress

- `defined( 'ABSPATH' ) || exit;`;
- WordPress coding/security conventions;
- explicit architectural boundaries;
- capability and ownership checks;
- prepared SQL;
- no output before headers;
- idempotent handlers;
- redacted diagnostics and graceful degradation;
- no unbounded or N+1 queries.

## 16. Deployment contract

GitHub is the implementation source of truth. SiteGround is a deployment target only.

Production file transfer is operator-managed through FileZilla outside the repository. The repository must not contain FTP, FTPS, SFTP, SSH, remote-write workflows, connection helpers, credential contracts, or transport-specific deployment code.

Deploy only reviewed production artifacts assembled from canonical source. Before transfer, require independent file and database backups, verify the complete dependency-consistent change set, and define rollback. After transfer, clear required SiteGround caches and run runtime acceptance.

Never overwrite WordPress core, `wp-config.php`, regular plugins, uploads, cache, logs, runtime secrets, uncontrolled database dumps, or server-owned state.

Regular plugin installation/activation/deactivation is an operator action, not FileZilla source deployment.

## 17. Validation contract

Frontend:

```powershell
cd frontend
npm ci --include=dev
npm run lint
npm run build
```

Provider migration and checkout:

```powershell
.\scripts\smoke-dtb-payment-provider-migration.ps1
.\scripts\smoke-dtb-checkout-ui.ps1
.\scripts\smoke-dtb-product-express-checkout.ps1
.\scripts\smoke-dtb-mu-modules.ps1
```

Targeted PHP syntax must cover every changed PHP file.

Runtime acceptance must cover:

- plugin exclusivity and version;
- guest and authenticated checkout;
- simple/variable products and quantity changes;
- browser autofill and saved addresses;
- cards and saved cards;
- 3DS/SCA, redirects, cancellation, retries, declines, and network failures;
- Apple Pay and Google Pay on supported devices/browsers;
- configured Stripe BNPL methods and eligibility thresholds;
- optional PayPal only when separately installed;
- shipping-rate, address, tax, coupon, total, and no-rate recalculation;
- order creation, transaction references, webhook status, captured-payment gate, event ledger, queues, Veeqo, QuickBooks, notifications, and return routing;
- full and partial refunds with concrete refund identity;
- no duplicate fields, payment surfaces, payment attempts, orders, notices, or downstream side effects;
- no JavaScript errors, PHP notices, horizontal overflow, clipped provider content, or fixed-overlay collisions.

Do not claim a smoke, syntax, build, browser, payment, webhook, integration, CI, deployment, or live-server check passed unless it was actually performed and produced evidence. Merge is not deployment.

## 18. Required final reporting

When repository files change, report:

- changed repository files;
- owning module/layer;
- database or migration impact;
- deployment mechanism;
- backup approach;
- rollback approach;
- validation actually performed;
- residual risks;
- a FileZilla Deployment Runbook containing only operator steps for backup, artifact preparation, transfer scope, cache clearing, validation, and rollback, without credentials.
