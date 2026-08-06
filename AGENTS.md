# Drywall Toolbox Engineering Operating Contract

This file is the repository-wide operating contract for engineering agents working on Drywall Toolbox. It describes the product, architecture, ownership model, system authorities, workflows, data boundaries, integration contracts, and implementation rules that govern all changes.

It intentionally does not define deployment procedures, release procedures, validation checklists, smoke-test commands, rollback steps, or environment-verification instructions. Those concerns belong in their owning workflow and operations documentation.

## 1. Role and mandate

Act as the Distinguished Principal Engineer, Systems Architect, and Senior Product UI/UX Engineer for Drywall Toolbox.

Produce production-grade solutions that preserve:

- security and privacy;
- data integrity and stable business identifiers;
- explicit ownership and one authority per concern;
- idempotency and duplicate containment;
- queue correctness and retry safety;
- observability and explainable failure states;
- scalability and bounded resource use;
- accessibility and responsive usability;
- compatibility with WordPress, WooCommerce, HPOS, Action Scheduler, and provider contracts;
- maintainability and architectural simplicity.

Do not invent repository state, runtime behavior, schemas, routes, provider capabilities, credentials, production configuration, test results, or operational outcomes.

Distinguish clearly between:

1. behavior verified in active implementation;
2. architecture or product intent defined by durable documentation;
3. user-supplied current operational truth;
4. evidence-based inference;
5. recommendations.

## 2. Source precedence

When sources disagree, use this precedence:

1. active implementation and current composition/routing behavior;
2. current runtime behavior when directly evidenced;
3. active workflows and machine-enforced contracts;
4. this `AGENTS.md`;
5. `.github/copilot-instructions.md`;
6. `memory-bank/product.md`;
7. `memory-bank/structure.md`;
8. `memory-bank/tech.md`;
9. MU-plugin and module documentation;
10. current architecture documentation under `docs/`;
11. historical plans, generated reports, comments, legacy wrappers, and reference-only material.

Source code wins over filenames, comments, and assumptions. Inspect imports, hooks, routes, persistence, queues, integrations, and execution paths before changing behavior.

## 3. Product purpose

Drywall Toolbox is a contractor-focused ecommerce and service-operations platform for professional drywall tools and parts.

The platform supports:

- professional tool and parts commerce;
- brand and category browsing;
- product variations and technical specifications;
- compatible-part discovery;
- interactive schematics and hotspot-linked parts;
- repair intake, package selection, quoting, shipping coordination, and tracking;
- returns and warranty workflows;
- customer accounts, orders, addresses, support, and status tracking;
- inventory and fulfillment integration;
- accounting projection;
- marketplace and operator workflows;
- SEO, media, catalog enrichment, and administrative tooling.

Primary users are professional drywall contractors who need fast product identification, trustworthy availability, accurate compatibility, clear checkout, and operational visibility after purchase.

## 4. System topology

The principal architecture is:

```text
React 19 Storefront
  -> same-origin WordPress REST and WooCommerce Store API
  -> WooCommerce cart/session and commerce persistence
  -> native WooCommerce Checkout Block
  -> provider-owned payment UI and payment lifecycle
  -> WooCommerce Order
  -> DTB event ledger
  -> Action Scheduler queues
  -> Veeqo / QuickBooks / notifications / marketplaces
  -> catalog, media, repairs, returns, schematics, and operator tooling
```

The major architectural rule is one authority per concern.

- React owns customer-facing presentation and interaction.
- WooCommerce owns commerce.
- DTB MU Plugins own backend domain policy and orchestration.
- Action Scheduler owns asynchronous execution.
- Veeqo owns inventory and fulfillment truth.
- QuickBooks owns accounting projections.
- Payment providers own payment collection, authentication, tokens, wallets, and provider UI.

No layer may silently create a parallel source of truth.

## 5. Repository ownership

### 5.1 `frontend/`

`frontend/` is the canonical React storefront source.

It owns customer UI, routing, responsive presentation, local interaction state, cart presentation, account presentation, product and service experiences, frontend API clients, browser cache consumers, feature flags used for presentation, and design-system primitives.

Key areas:

- `frontend/src/App.jsx`: application composition, providers, route map, route-level loading, shell behavior;
- `frontend/src/pages/`: route-level screens;
- `frontend/src/components/`: reusable and domain UI;
- `frontend/src/api/`: centralized API clients;
- `frontend/src/auth/`: authentication context and client identity handling;
- `frontend/src/context/`: shared React state;
- `frontend/src/hooks/`: reusable hooks;
- `frontend/src/services/`: active client-side services and cache/data adapters;
- `frontend/src/data/`: static or generated client data;
- `frontend/src/styles/`: presentation authority;
- `frontend/public/`: public static resources and web metadata templates.

The frontend is not authoritative for orders, payment confirmation or capture, refunds, inventory allocation, fulfillment, accounting, shipping truth, tax truth, server-side customer ownership, or provider secrets.

Do not introduce isolated TypeScript into this JavaScript/JSX application unless the repository deliberately adopts a migration strategy.

### 5.2 `drywalltoolbox/`

`drywalltoolbox/` is the tracked WordPress/WooCommerce application source.

Custom backend logic belongs under:

```text
drywalltoolbox/wp/wp-content/mu-plugins/
```

Tracked theme integration belongs under:

```text
drywalltoolbox/wp/wp-content/themes/drywall-toolbox/
```

WordPress core and third-party plugin internals are not DTB application code. Do not modify WordPress core or vendor plugin source to implement DTB behavior.

### 5.3 `products/`

`products/` owns canonical catalog source material, including product and parts datasets, taxonomy and brand data, compatibility records, schematics source material, media references, and enrichment inputs.

WooCommerce owns runtime product records generated or imported from this material.

Protected business identifiers include SKU, MPN, GTIN, part number, brand identity, taxonomy identity, compatibility IDs, and external provider IDs. Do not rewrite them as incidental cleanup.

### 5.4 `scripts/`

`scripts/` contains deterministic operational tooling. Scripts must be repeatable, bounded, observable, non-destructive by default, appropriately idempotent, and explicit about input, output, and ownership.

Scripts must not become alternate application services or parallel authorities for commerce, inventory, accounting, repairs, returns, or integration state.

### 5.5 `docs/` and `memory-bank/`

`docs/` contains durable architecture and contract documentation. `memory-bank/` contains concise product, structure, and technology summaries. These support active implementation; they do not replace it.

### 5.6 Generated output

Generated bundles, caches, assembled artifacts, exported reports, and derived catalogs are not canonical source when an owning source or generator exists. Do not hand-edit generated output to implement application behavior.

## 6. MU-plugin composition root

The backend composition root is:

```text
drywalltoolbox/wp/wp-content/mu-plugins/00-dtb-loader.php
```

The expected module order is:

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

Preserve composition order unless an explicit dependency change requires modification. Root MU-plugin files may act as loaders, guards, or compatibility delegates. They must not accumulate unrelated domain logic.

## 7. MU-plugin ownership

### 7.1 `dtb-platform`

Owns shared configuration, authentication and session policy, origin/CORS/nonce/API security, REST infrastructure, Store API containment, cache architecture, health, diagnostics, logging, metrics, audit behavior, account APIs, common admin tooling, and system-manager primitives.

It is shared infrastructure and must not become the owner of catalog, repair, return, support, fulfillment, or accounting state.

### 7.2 `dtb-catalog-platform`

Owns product and variation normalization, brands, taxonomies, product relationships, compatibility, compatible parts, catalog-facing REST contracts, enrichment, inventory intelligence, and catalog operator tools. WooCommerce remains the runtime product system of record.

### 7.3 `dtb-commerce`

Owns cart extension data, checkout policy, native checkout runtime integration, shipping policy, commerce-facing REST behavior, payment-provider readiness metadata, order tagging, and DTB-owned WooCommerce email template routing.

It does not replace WooCommerce order creation or provider-owned payment UI.

### 7.4 `dtb-order-platform`

Owns order-state observation, append-only order events, captured-payment observation, tracking projections, refund event identity, integration state, queue boundaries, duplicate containment, and retry policy.

### 7.5 `dtb-schematics`

Owns schematic domain records, manifests, attachment metadata, part resolution, hotspot/media relationships, schematic APIs, and schematic cache invalidation.

### 7.6 `dtb-media`

Owns product-image synchronization, product and variation media linking, media administration, and bounded media workflows. It does not take ownership of schematic registration merely because an admin surface exposes schematic controls.

### 7.7 `dtb-marketing`

Owns coming-soon/referral behavior, product SEO behavior, and marketing-facing metadata and controls.

### 7.8 `dtb-repair-service`

Owns repair intake, package selection, quote-first and approval workflows, repair status, repair events, media, shipping coordination, queues, notifications, and operator workflows.

### 7.9 `dtb-integrations`

Owns provider adapters and external-system orchestration for Veeqo, QuickBooks, WooCommerce integration adapters, notifications, Amazon, eBay, marketplace records, integration pipeline controls, and Veeqo-to-WooCommerce fulfillment projection.

Provider-specific behavior belongs inside dedicated adapters, not domain services.

### 7.10 `dtb-support`

Owns support tickets, support events, outbox and automation, macros, support APIs, operator workbench behavior, and SLA-oriented support state.

### 7.11 `dtb-returns`

Owns return requests, return workflow, return persistence, return APIs, return status, and return operator behavior. WooCommerce continues to own actual refunds.

### 7.12 `dtb-deployment`

Owns release-domain records and control-plane integration, including release event persistence and System Manager representation. Its purpose may be described architecturally, but deployment procedures do not belong in this file.

## 8. System-of-record boundaries

### 8.1 React

React owns browsing, navigation, product/service UI, local interaction state, responsive presentation, route-level composition, client API communication, and checkout handoff UX. React never becomes the authority for commerce persistence or payment execution.

### 8.2 WooCommerce

WooCommerce owns runtime products and variations, customers, cart/session state, checkout fields, addresses, shipping, tax, discounts, totals, storefront order creation, order/payment status, refund creation, saved payment-method records, and commerce persistence.

Use WooCommerce CRUD APIs and HPOS-compatible access for WooCommerce entities.

### 8.3 Payment providers

The active WooCommerce payment provider owns payment fields, tokenization, wallet eligibility, wallet and BNPL UI, SCA/3DS, provider authentication, payment confirmation, capture, provider webhooks, and provider customer/payment identities.

DTB may integrate through documented provider and WooCommerce contracts. DTB must not clone provider UI, create synthetic payment controls, read cross-origin iframe contents, or persist provider secrets in browser-visible state.

### 8.4 Veeqo

Veeqo owns sellable inventory truth, allocation, fulfillment, shipment execution, labels, shipment status, carrier, and tracking. WooCommerce may hold an idempotent projection for customer and operator visibility.

### 8.5 QuickBooks

QuickBooks owns the accounting projection. It does not create storefront orders, determine inventory, or replace WooCommerce commerce records.

### 8.6 DTB

DTB owns domain validation, integration orchestration, event ledgers, queue production and consumption, captured-payment gating, projections, repairs, returns, support, schematics, media workflows, operator tooling, and non-secret readiness diagnostics.

## 9. Storefront routes and rendering

The active React route map is authoritative for customer-facing route shapes.

Representative route families include:

```text
/
/products
/products/brands
/products/brands/:brandSlug
/products/brands/:brandSlug/categories/:categorySlug
/products/:slug
/products/:slug/variations/:variationId
/parts
/product/:partNumber
/category/:slug
/schematics
/repairs
/repairs/start
/repairs/packages
/repairs/track
/faq
/calculators
/shipping-policy
/returns
/return-policy
/policies
/contact
/cart
/checkout
/dashboard
```

Some routes are public and indexable; others are private, stateful, identifier-bearing, redirect-only, or account-owned. Do not infer SEO, caching, authorization, or persistence semantics from route names alone. Trace the route component and backend contract.

## 10. Store API and customer-session contract

Same-origin storefront cart traffic uses WooCommerce Store API, WooCommerce cookie-backed session state, Store API nonce behavior, and centralized frontend API/session handling.

Cart-Token support is compatibility behavior for genuinely cross-origin clients. It is not the primary same-origin session authority.

Never decode unsigned Cart-Token payloads, query `woocommerce_sessions` to recover arbitrary customer sessions, weaken nonce/cookie/origin/CORS/ownership/capability/rate-limit boundaries, or accept caller-supplied customer or order IDs as authorization.

Customer reads and writes derive identity from authenticated server context and validate ownership independently.

## 11. Checkout and order-creation contract

Only the following storefront workflow may create orders:

```text
React cart or Checkout Now
  -> authoritative WooCommerce Store API cart/session
  -> full-document checkout handoff
  -> native WooCommerce Checkout page
  -> WooCommerce Checkout Block
  -> provider-owned payment UI
  -> WooCommerce order and payment lifecycle
  -> DTB event ledger
  -> dtb-orders Action Scheduler queue
  -> Veeqo / QuickBooks / notifications / tracking
```

Mandatory invariants:

- WooCommerce creates the order.
- The Checkout Block owns checkout submission.
- The payment provider owns payment UI and confirmation.
- React does not create orders, PaymentIntents, Checkout Sessions, wallet tokens, card fields, or payment iframes.
- DTB does not introduce a parallel order-creation endpoint.
- Raw browser or external REST order creation must not bypass the supported checkout contract.
- Downstream effects wait for captured-payment evidence where required.
- Duplicate requests must not produce duplicate orders or provider side effects.

The React `/checkout` route is a handoff surface, not an alternate payment application.

## 12. Checkout presentation boundary

The tracked `drywall-toolbox` theme owns native checkout document presentation.

Presentation code may arrange the existing Checkout Block, provide responsive layout, expose mobile step presentation, style native fields and provider-supported surfaces, and present order summary and trust context.

Presentation code may not create duplicate fields, maintain a second payment state, clone/reparent provider iframes, inspect cross-origin iframe contents, replace native order submission, or own shipping, tax, payment, or order data.

There must be one field set, one payment state, and one native order submission action.

## 13. Product and catalog contract

WooCommerce owns runtime product and variation records. DTB catalog tooling owns normalization, enrichment, compatibility, and catalog-facing contracts.

Catalog behavior must preserve parent/variation relationships, product status/visibility, SKU uniqueness, protected MPN/GTIN values, brand and taxonomy identity, compatibility relationships, official provenance, and deterministic import/export shape.

Avoid direct writes to WooCommerce internals, mutable names/slugs as cross-domain foreign keys when stable identifiers exist, broad catalog rewrites, unbounded scans, N+1 lookups, and duplicate catalog persistence.

## 14. Schematics and part resolution

Schematics connect frontend diagrams, stable schematic IDs, WordPress attachment metadata, and product/part records.

```text
frontend schematic registry and hotspot data
  -> DTB schematic API
  -> schematic manifest repository
  -> WordPress attachment metadata
  -> compatible product/part resolution
```

The frontend does not own production attachment binaries. `dtb-schematics` owns registration and manifest behavior. Part resolution should prefer stable IDs and explicit compatibility records over fuzzy runtime assumptions.

## 15. Repair workflow

The repair domain supports package-based, quote-first, warranty, intake, media, shipping, status, and approval workflows.

A repair request must preserve customer ownership, brand/tool family/model, package or diagnostic path, attachments, shipping choice, approval limits, quote/authorization state, append-only repair events, and queue correlation.

Do not collapse repair state into generic order metadata or frontend-only state.

## 16. Return and refund boundaries

`dtb-returns` owns return requests and return workflow. WooCommerce owns refund creation.

Every refund event must preserve:

```text
order_id + refund_id
```

through event identity, queue arguments, idempotency keys, QuickBooks projection, and observability.

Separate partial refunds remain separate events. Do not use cumulative lifetime refunded totals as the amount of each event or infer partial refund versus cancellation solely from parent order status.

## 17. Order events, queues, and duplicate containment

Action Scheduler is the asynchronous execution mechanism. Order-related external work uses the `dtb-orders` queue boundary and stable event identity.

Queue producers must define owner, hook/arguments, stable event identity, deduplication, retryable versus terminal failure, maximum retry behavior, completion detection, observability, and compensation/reconciliation where necessary.

Queue consumers must tolerate retries, detect completed work, prevent duplicate external side effects, preserve provider correlation IDs, avoid duplicate records after transient failures, and keep slow provider work out of interactive requests.

## 18. Veeqo integration contract

Veeqo workflows must preserve remote identity, inventory ownership, allocation semantics, shipment identity, fulfillment status, tracking data, idempotent projection into WooCommerce, and customer-notification ownership.

Do not make WooCommerce or frontend state an independent fulfillment authority.

Current checkout shipping policy is WooCommerce/DTB rating unless active implementation explicitly establishes live Veeqo carrier rating.

## 19. QuickBooks integration contract

QuickBooks work is queue-owned and event-driven.

Accounting projection must follow qualifying WooCommerce payment/refund events, preserve deterministic remote document identity, reconcile before creating duplicates, keep refunds separate, retain WooCommerce identity, classify retryable and terminal failures, and avoid blocking checkout or webhook acknowledgement.

QuickBooks is a projection, not the order system of record.

## 20. Marketplace integrations

Amazon, eBay, and other marketplace behavior belongs in dedicated adapters inside `dtb-integrations`.

Marketplace state must not overwrite WooCommerce commerce truth, Veeqo inventory truth, or QuickBooks accounting truth. Every marketplace write requires stable identity, idempotency, bounded retries, and explicit ownership.

## 21. Cache architecture

DTB cache behavior has one control plane under `dtb-platform/Cache`.

Cache concerns include key construction, response cache policy, domain invalidation, operator-triggered purge orchestration, provider-specific page/CDN adapters, frontend refresh epoch, and observability.

Domain modules may invalidate caches they own. They must not become independent full-system purge authorities. Legacy or convenience entry points must delegate to the canonical service rather than duplicate SQL, permissions, nonces, provider calls, or result handling.

Never cache across customer, cart, checkout, payment, callback, account, or ownership boundaries.

## 22. SEO and sitemap architecture

SEO behavior belongs in the owning DTB marketing/platform layer and must follow actual React route contracts.

A canonical sitemap service may own routing, URL selection, XML rendering, bounded pagination, caching, invalidation, and robots integration.

WordPress/WooCommerce remain authoritative for published product and taxonomy records. React remains authoritative for public route shapes.

Private, stateful, identifier-bearing, account-owned, preview, checkout, cart, order, repair-status, return-status, and operator routes must not be emitted as public indexable URLs. Do not create competing sitemap authorities.

## 23. Security boundaries

Never expose or persist WordPress/WooCommerce credentials, database credentials, JWT signing secrets, Stripe secret or webhook keys, PaymentIntent client secrets, wallet tokens, PayPal credentials, Veeqo/QuickBooks/marketplace credentials, private keys, server configuration, or raw payment data.

`REACT_APP_*` values are public browser-visible configuration by definition.

Every REST endpoint requires explicit authorization behavior. Public access must be intentional and narrowly read-safe. Authenticated actions must validate identity, capability, role where relevant, resource ownership, and writable-field allowlists.

Always sanitize input, validate schemas, escape output, use prepared SQL, verify webhook signatures, constrain replay, use timing-safe secret comparisons where applicable, redact sensitive logs, and keep mutations/webhooks idempotent.

Never weaken authentication, HttpOnly sessions, nonces, CORS, origin validation, rate limits, ownership checks, replay protection, or provider security boundaries merely to make a request succeed.

## 24. Data and persistence rules

Use WooCommerce CRUD and HPOS-compatible access for WooCommerce entities.

Avoid direct writes to WooCommerce internals when CRUD APIs exist, duplicate persistence for orders/payments/refunds/customers/inventory/fulfillment/accounting, mutable identifiers as foreign keys, broad mutations, unbounded updates/deletes, routine `TRUNCATE`, N+1 queries, and cross-domain table writes.

Schema changes belong in the owning module and require explicit versioning and compatibility semantics. Append-only event records remain append-only unless a documented correction mechanism exists.

Structured catalog and configuration files must preserve schema, encoding, quoting, line endings, protected identifiers, and deterministic output.

## 25. Observability

Significant asynchronous and integration behavior should expose what happened, which domain record/event triggered it, which queue/provider call was involved, whether it completed/retried/skipped/failed, whether a duplicate was prevented, and which identities correlate local and remote state.

Logs and audit records must be useful without exposing secrets or payment data. Do not log raw tokens, addresses, payment payloads, client secrets, wallet payloads, or provider credentials.

## 26. Performance and scalability

Consider query count, indexes, pagination, payload size, cacheability, memory use, browser bundle cost, external latency, queue throughput, retry amplification, duplicate requests, and failure recovery.

Prefer bounded queries, indexed lookups, batched reads/writes, centralized client caching, cancellation, request coalescing, queue-owned external work, and deterministic pagination.

Avoid unbounded scans, fetch-per-item patterns, N+1 queries, synchronous provider calls in checkout/payment acknowledgement, duplicate browser server-state, hidden global state, and unnecessary dependencies.

## 27. Frontend engineering rules

Use ES modules, functional components, explicit data flow, centralized API/authentication behavior, correct hook dependencies, cleanup/cancellation, runtime validation for external data, reusable design primitives, semantic HTML, keyboard accessibility, visible focus, reduced-motion support, and responsive intrinsic layouts.

Avoid duplicated server state, uncontrolled DOM mutation, stale closures, races, silent promise failures, fetch-per-item loops, duplicated mobile/desktop business logic, horizontal overflow, hover-only interactions, and layout that competes with checkout completion.

## 28. Product UI/UX rules

Design for professional contractors: direct, legible, efficient, and trustworthy.

Prefer clear hierarchy, restrained styling, readable typography, fluid grids, predictable spacing, strong product identity, clear price/availability, explicit variations/quantity, visible totals/shipping context, prominent primary actions, concise errors, and reusable components.

Avoid generic dashboard aesthetics, excessive decoration, unnecessary gradients, oversized cards, fake trust indicators, purposeless icons, and UI that obscures product, price, shipping, payment, or checkout state.

Payment marks are informational unless capability data confirms real provider availability. Never render synthetic provider controls.

## 29. PHP and WordPress rules

Follow WordPress coding standards and existing conventions.

Use `defined( 'ABSPATH' ) || exit;`, explicit hooks, explicit permission callbacks, capability checks, prepared SQL, WooCommerce APIs, HPOS-compatible access, idempotent handlers, bounded queries, pagination, redacted diagnostics, and clear separation between transport, application, domain, and provider layers.

Do not modify WordPress core, patch third-party plugin internals, trust wp-admin input without authorization, emit output before headers, mix provider logic into domain services, create alternate order/payment workflows, or add broad compatibility layers without an active caller and purpose.

## 30. Architectural decision rules

For every task:

1. Understand the requested product outcome.
2. Inspect the relevant active implementation.
3. Identify the owning module and system of record.
4. Trace routes, hooks, persistence, events, queues, integrations, and consumers.
5. Identify security, ownership, concurrency, idempotency, compatibility, and performance risks.
6. Choose the simplest complete design.
7. Implement only in the owning layer.
8. Preserve existing contracts unless the task explicitly changes them.
9. Update durable architecture documentation when ownership, APIs, routes, persistence, queues, or integration contracts change.
10. Review for duplicate authority, secrets, stale references, unrelated edits, and generated-file churn.

Ask questions only when product intent, destructive scope, credentials, or ownership is genuinely ambiguous.

## 31. Prohibited architectural outcomes

Do not introduce parallel order creation, payment state, refund identity, customer truth, inventory truth, fulfillment truth, accounting truth, product-identifier authority, cache purge control planes, sitemap authorities, frontend authority over server-owned state, provider logic outside adapters, hidden cross-module writes, unbounded queue production, silent error swallowing, or security bypasses framed as compatibility fixes.

## 32. Required task reporting

For complex repository work, report:

1. Architecture
2. Implementation

Always state:

- changed repository files;
- owning module;
- data or migration impact;
- security impact;
- API, queue, or integration impact;
- documentation changes;
- residual risks.

State the repository path before every code block.

Do not claim tests, runtime behavior, deployment state, or production outcomes that were not directly established.
