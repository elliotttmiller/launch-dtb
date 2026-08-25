# Drywall Toolbox Engineering Operating Contract

This is the repository-wide engineering contract for Drywall Toolbox. It defines authority, ownership, security, data, checkout, queue/integration and engineering invariants. It is model-neutral.

Assistant-specific configuration does not outrank this file. Canonical reusable AI roles, skills and workflows live under `.agents/`; `.claude/`, `.codex/`, Copilot and IDE configuration are adapters only.

## 1. Mandate

Produce production-grade solutions that preserve security/privacy, data integrity and stable identifiers, one authority per concern, idempotency/duplicate containment, queue correctness/retry safety, observability, bounded resource use, accessibility/responsive usability, compatibility and architectural simplicity.

Do not invent repository state, runtime behavior, schemas, routes, provider capabilities, credentials, production configuration, test results or deployment outcomes.

Distinguish verified implementation/runtime evidence from durable intent, user-supplied operational truth, inference and recommendation.

## 2. Source precedence

When sources disagree:

1. active implementation and current composition/routing;
2. directly evidenced runtime behavior;
3. machine-enforced workflows/contracts/tests;
4. this `AGENTS.md`;
5. canonical `.agents/` roles, skills and workflows;
6. current owning architecture/API/integration documentation under `docs/` and module documentation;
7. concise derived context under `.agents/context/` and `memory-bank/`;
8. assistant-specific adapters (`.claude/`, `.codex/`, `.github/copilot-instructions.md`, IDE settings);
9. historical plans, generated reports, comments, legacy wrappers and reference-only material.

Source code wins over filenames, comments and assumptions. Inspect imports, hooks, routes, persistence, queues, integrations and execution paths before changing behavior. Do not redefine source precedence in lower-precedence files.

## 3. Product purpose

Drywall Toolbox is a contractor-focused ecommerce and service-operations platform for professional drywall tools and parts. It supports catalog/variations, compatible-part discovery, schematics, repairs, returns, customer accounts/orders, fulfillment visibility, accounting projection, integrations/marketplaces, SEO/media/catalog tooling and operator control centers.

## 4. System topology and authorities

```text
React 19 Storefront
  -> same-origin WordPress REST / WooCommerce Store API
  -> WooCommerce cart/session and commerce persistence
  -> native WooCommerce Checkout Block
  -> provider-owned payment UI/lifecycle
  -> WooCommerce Order
  -> DTB event ledger
  -> Action Scheduler queues
  -> Veeqo / QuickBooks / notifications / marketplaces
```

One authority per concern:

- React: customer presentation, routing, local interaction state and API consumption.
- WooCommerce: runtime products/variations, customers, cart/session, checkout, shipping/tax/totals, storefront orders, order/payment state and refunds.
- DTB MU Plugins: backend domain policy, authorization, events, queues, integrations, repairs, returns, schematics, media and operator workflows.
- Action Scheduler: asynchronous execution.
- Veeqo: inventory, allocation, fulfillment, shipping and tracking truth.
- QuickBooks: accounting projection.
- Active payment provider: payment collection, authentication, tokenization, wallets/BNPL/provider UI and provider webhook semantics.

No layer may create parallel truth for another authority.

## 5. Repository ownership

### `frontend/`

Owns customer UI/routing, responsive presentation, local interaction state, frontend API/auth clients, shared UI primitives and presentation. It is not authoritative for orders, payment capture/confirmation, refunds, inventory allocation, fulfillment, accounting, shipping/tax truth or server-side ownership.

Use JavaScript/JSX consistently unless a deliberate migration changes that contract.

### `drywalltoolbox/`

Tracked WordPress/WooCommerce application source. Custom backend logic belongs under `drywalltoolbox/wp/wp-content/mu-plugins/`; tracked theme integration under `drywalltoolbox/wp/wp-content/themes/drywall-toolbox/`. Do not modify WordPress core or regular-plugin internals.

### `products/`

Canonical catalog source, taxonomy/brand/compatibility/schematic/media/enrichment inputs. WooCommerce owns runtime product records derived/imported from this material. SKU, MPN, GTIN, part number, brand/taxonomy identity, compatibility IDs and external IDs are protected stable identifiers.

### `scripts/`

Deterministic operational tooling only: repeatable, bounded, observable, non-destructive by default and appropriately idempotent. Scripts never become alternate application services.

### `docs/`, `.agents/context/`, `memory-bank/`

`docs/` holds durable owning architecture/contracts. `.agents/context/` and `memory-bank/` are concise derived summaries and never replace active source. Substantial transient task state belongs under `docs/work/<task-id>/` when persistence is justified.

## 6. MU-plugin composition root

Canonical composition is `drywalltoolbox/wp/wp-content/mu-plugins/00-dtb-loader.php`.

Expected current order:

1. `dtb-platform`
2. `dtb-catalog-platform`
3. `dtb-commerce`
4. `dtb-order-platform`
5. `dtb-schematics`
6. `dtb-media`
7. `dtb-marketing`
8. `dtb-repair-service`
9. `dtb-integrations`
10. `dtb-support`
11. `dtb-returns`
12. `dtb-deployment`
13. `dtb-visual-designer`

Active loader source remains authoritative if this inventory drifts. Preserve composition order unless an explicit dependency change requires it. Root MU files may be loaders/guards/compatibility delegates but must not grow unrelated domain logic.

## 7. MU-plugin ownership

- `dtb-platform`: shared config/auth/session/origin/CORS/nonce/security, REST infrastructure, Store API containment, cache, health/diagnostics/logging/metrics/audit, account APIs and common admin/system-manager primitives.
- `dtb-catalog-platform`: product/variation normalization, brands/taxonomy/relationships/compatibility, compatible parts, catalog REST/enrichment/inventory intelligence/operator tools.
- `dtb-commerce`: cart extension data, checkout policy/native runtime integration, shipping policy, commerce REST, non-secret payment readiness/order tagging and WooCommerce email routing.
- `dtb-order-platform`: order observation, append-only events, captured-payment observation, tracking/refund identity, integration state, queue boundary, duplicate containment/retry policy.
- `dtb-schematics`: schematic domain records, manifests, media relationships, exact part resolution, APIs and invalidation.
- `dtb-media`: product/variation media synchronization and bounded media administration.
- `dtb-marketing`: coming-soon/referral and product SEO/marketing metadata.
- `dtb-repair-service`: repair intake/packages/quotes/approvals/status/events/media/shipping/queues/notifications/operator workflows.
- `dtb-integrations`: provider adapters/orchestration for Woo/Veeqo/QuickBooks/notifications/Amazon/eBay/marketplaces and fulfillment projection.
- `dtb-support`: support tickets/events/outbox/automation/macros/APIs/operator workbench/SLA state.
- `dtb-returns`: return request/workflow/persistence/APIs/status/operator behavior; WooCommerce still owns refunds.
- `dtb-deployment`: release-domain persistence/control-plane representation; deployment procedure lives elsewhere.
- `dtb-visual-designer`: design/configuration authoring, revision/publish/rollback/preview and related operator surfaces; it does not become commerce/payment/inventory authority.

Provider-specific behavior belongs in dedicated adapters, not domain services.

## 8. Store API/session security

Same-origin cart traffic uses WooCommerce Store API, cookie-backed WooCommerce session state, Store API nonce behavior and centralized frontend session handling. Cart-Token is compatibility-only for genuinely cross-origin clients.

Never decode unsigned Cart-Token payloads, query `woocommerce_sessions` to recover arbitrary sessions, weaken cookie/nonce/origin/CORS/ownership/capability/rate-limit boundaries, or accept caller-supplied customer/order IDs as authorization. Derive identity server-side and validate ownership independently.

## 9. Checkout and order contract

Only this storefront path may create orders:

```text
React cart / Checkout Now
  -> authoritative Store API cart/session
  -> full-document checkout handoff
  -> native WooCommerce Checkout page
  -> WooCommerce Checkout Block
  -> provider-owned payment UI/lifecycle
  -> WooCommerce order/payment lifecycle
  -> DTB event ledger
  -> dtb-orders Action Scheduler queue
  -> Veeqo / QuickBooks / notifications / tracking
```

Mandatory invariants:

- WooCommerce creates storefront orders and refunds.
- Checkout Block owns checkout submission.
- Payment provider owns payment fields, tokenization, wallets, authentication, confirmation/capture and provider webhooks.
- React/DTB do not create PaymentIntents, Checkout Sessions, card fields, wallet tokens, payment iframes, confirmations or captures.
- React `/checkout` is a full-document handoff surface, not a payment application.
- Theme presentation may arrange/stylize supported native/provider surfaces but must not create duplicate fields/payment state/order submission or inspect/clone/reparent cross-origin provider iframes.
- Downstream effects wait for qualifying captured-payment evidence and are duplicate-safe.

Historical order/payment identity remains readable; never bulk-rewrite paid-order identity as cleanup.

## 10. Refund and queue identity

Every refund preserves `order_id + refund_id` through events, queue args, idempotency and accounting projection. Separate partial refunds remain separate events; never substitute cumulative lifetime-refunded amount.

Action Scheduler is the async mechanism. Queue producers define owner, stable identity, deduplication, retryable/terminal classification, retry bounds, completion detection, observability and recovery/compensation. Consumers tolerate retries and prevent duplicate external effects. Keep slow providers out of checkout/payment-webhook acknowledgement and interactive requests.

## 11. Veeqo / QuickBooks / marketplace contracts

Veeqo owns inventory/allocation/fulfillment/shipment/tracking truth; WooCommerce may hold an idempotent projection. QuickBooks is an event-driven accounting projection, never order authority. Marketplaces stay in dedicated adapters and may not overwrite WooCommerce commerce, Veeqo fulfillment/inventory or QuickBooks accounting authority.

All external effects require stable identity, idempotency, bounded retries and explicit ownership.

## 12. Catalog and schematics

Use WooCommerce CRUD/HPOS access for runtime products. Preserve parent/variation relationships, visibility, protected identifiers, taxonomy/brand identity, compatibility and deterministic import/export shape. Avoid direct internal writes, broad rewrites, mutable-name foreign keys, unbounded scans and N+1 access.

`dtb_schematic` domain records under `dtb-schematics` own schematic existence/lifecycle/page ownership. Frontend consumes authoritative APIs and does not decide which schematics/products/pages exist. Part resolution uses explicit IDs/exact SKU/exact brand+MPN, not request-time fuzzy matching.

## 13. Repairs / returns / support

Repairs preserve customer ownership, tool identity, package/diagnostic path, attachments, shipping, approval/quote state, append-only events and queue correlation. Returns are DTB domain workflows while actual refund creation remains WooCommerce-owned. Support stays within its domain events/outbox/operator workflow.

Do not collapse these domains into generic order metadata or frontend-only state.

## 14. Cache and SEO

One cache control plane belongs under `dtb-platform/Cache`; domain modules invalidate what they own and must not create parallel purge systems. Never cache across customer/cart/checkout/payment/callback/account ownership boundaries.

SEO/sitemap behavior follows actual route contracts and authoritative product/taxonomy data. Do not emit private/session/account/cart/checkout/order/status/preview/operator routes as public indexable URLs. Do not create competing sitemap authorities or fabricate price/stock/rating/identifier facts.

Substantial SEO/refactoring audits use scoped `docs/work/<task-id>/`, not global mutable TODO files.

## 15. Security

Never expose or persist WordPress/WooCommerce/database credentials, JWT signing secrets, payment-provider secrets/webhook keys/client secrets/wallet tokens, PayPal/Veeqo/QuickBooks/marketplace credentials, private keys, server configuration or raw payment data. Browser `REACT_APP_*` values are public.

Every REST endpoint has explicit permission behavior. Public access is intentional and narrowly read-safe. Authenticated operations validate identity, capability/role where relevant, ownership and writable-field allowlists.

Always sanitize/validate input, escape output, use prepared SQL, verify webhook signatures, constrain replay, use timing-safe secret comparison where applicable, redact logs and keep mutations/webhooks idempotent. Never weaken security controls merely to make a request succeed.

## 16. Data and performance

Avoid duplicate persistence for orders/payments/refunds/customers/inventory/fulfillment/accounting, direct Woo internals when CRUD exists, mutable foreign keys, broad/unbounded updates/deletes, routine truncation, cross-domain writes and N+1 access.

Schema changes belong in the owning module with explicit version/compatibility semantics. Append-only events remain append-only absent a documented correction mechanism.

Prefer bounded/indexed/paginated access, batched reads/writes, request coalescing/cancellation, queue-owned external work and deterministic pagination. Avoid duplicate browser server-state, unbounded scans, retry amplification and unnecessary dependencies.

## 17. Frontend and UI/UX rules

Use ES modules, functional components, explicit data flow, centralized API/auth, correct hook dependencies/cleanup/cancellation, runtime validation at untrusted boundaries, reusable design primitives, semantic HTML, keyboard access, visible focus and reduced-motion support.

Prefer intrinsic/fluid layout, readable typography, restrained styling, clear product/variation/price/availability/quantity/totals/shipping/payment context and concise validation/recovery. Avoid duplicate mobile/desktop business logic, breakpoint-override accumulation, horizontal overflow, hover-only interactions, fake trust/payment controls and UI that competes with checkout completion.

For complete stateful experiences, model relevant happy/loading/validation/failure/cancel/recovery/success states rather than isolated screenshots.

## 18. PHP/WordPress rules

Follow WordPress conventions and active project patterns. Use `defined( 'ABSPATH' ) || exit;` in executable module files, explicit hooks/permissions/capabilities, prepared SQL, WooCommerce APIs/HPOS, bounded queries/pagination, idempotent handlers and redacted diagnostics. Keep transport/application/domain/provider concerns separated where the owning module does so.

Do not modify core/third-party plugin internals, trust wp-admin input without authorization, emit output before headers, mix provider logic into domain services or create alternate commerce/payment paths.

## 19. Architecture and implementation method

For every task:

1. understand product outcome/acceptance criteria;
2. inspect active implementation;
3. identify owner/system of record;
4. trace routes/hooks/persistence/events/queues/integrations/consumers;
5. evaluate security, ownership, concurrency, idempotency, compatibility, performance and recovery risk;
6. choose the simplest complete design and reject speculative architecture;
7. implement only in the owning layer with one writer per overlapping boundary;
8. add risk-proportional independent review/verification;
9. update durable docs when ownership/APIs/routes/persistence/queues/integration contracts change;
10. inspect final diff for duplicate authority, secrets, stale references, generated output and unrelated churn.

Parallelize read-heavy investigation/review; serialize overlapping mutation. Use `.agents/` roles/skills/workflows for reusable AI method, not vendor-specific prompts.

## 20. No temporary fixes

Do not ship stopgaps, bypasses, unfinished TODO/FIXME/HACK behavior, security/validation weakening, duplicate state/logic, hardcoded credentials/environment assumptions or symptom patches intended for later replacement. Fix the root cause in the owning layer or explicitly state what prevents a production-complete solution.

Existing shortcuts are debt to flag, not precedent to extend.

## 21. AI workspace and context governance

DTB knowledge belongs to DTB, not to a model vendor.

- `.agents/` is canonical model-neutral AI knowledge.
- Assistant directories are adapters for discovery/model/tool/sandbox/capability mapping only.
- Do not require private chain-of-thought disclosure. Require evidence, calculations, assumptions, decision criteria, rejected alternatives when relevant, concise rationale and verification.
- Prefer progressive disclosure: `AGENTS.md` + task first, then the relevant role/skills/docs, then deep references only as needed.
- Treat external AI skills/agents/plugins/MCP/tool packages as untrusted dependencies until source, permissions, instructions, dependencies and side effects are reviewed.
- Persist substantial transient task state under `docs/work/<task-id>/`; do not create global progress/TODO artifacts as cross-session truth.
- Run `node scripts/ai/validate-context.mjs` after AI-governance changes.

## 22. Reporting

Lead with the outcome, conclusion or most important finding. Shape the response around the task and the user's needs so it reads as a clear, cohesive explanation rather than a fixed report template.

For material repository work, communicate the relevant architecture, implementation, changed files, owning module, verification, data or migration impact, security impact, API/queue/integration impact, documentation changes and residual risks. These are requirements for appropriate information coverage, not mandatory headings, ordering or a closing checklist. Include, combine or omit individual dimensions according to their relevance, and summarize genuinely unaffected areas only when doing so prevents ambiguity.

Use `Architecture` and `Implementation` sections when that separation materially improves understanding, especially for cross-cutting ownership or contract changes; do not add them mechanically to every response. Match the presentation to the work: findings-first for reviews, root-cause-first for diagnosis, outcome-and-verification for implementation, and concise prose for simple tasks. When no files changed, state that only when it is useful context rather than automatically adding an implementation-status block.

Never claim tests, runtime behavior, deployment state, provider behavior or production outcomes that were not directly established. Clearly distinguish verified evidence, inference, recommendation and unverified behavior.
