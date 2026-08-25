---
name: dtb-react-engineering
description: Production React engineering for DTB state ownership, components, hooks, API boundaries, async behavior, accessibility and measured performance.
---
# DTB React Engineering

## Apply when
Use for React components, hooks, routing, client state, server/API consumption, async interactions, performance-sensitive rendering, or frontend refactors. The owning frontend engineer remains the writer.

## State and data discipline
Classify every value before storing it: server-owned truth, URL/navigation state, local interaction state, derived state, or transient request state. Do not mirror WooCommerce/payment/inventory authority into long-lived React state. Derive values during render when possible; use effects only to synchronize with external systems.

Route network work through existing API/service clients. Prefer request aggregation over fetch-per-item behavior. Handle abort/cancellation, stale response races, duplicate submissions, retries, and component teardown explicitly when concurrent interactions are possible. Treat server responses as untrusted external data and validate assumptions at boundaries.

## Component design
Split by responsibility and semantic reuse, not arbitrary line counts. Keep presentation independent from domain transport details. Prefer composition over configurable mega-components and avoid abstractions before a stable repeated pattern exists. Preserve one semantic tree across responsive presentation unless behavior genuinely differs.

Hooks must have correct dependencies, cleanup, stable ownership, and no stale closures. Do not use effect chains as an implicit state machine when explicit event/state modeling is clearer. Memoization is for measured or identity-sensitive needs, not routine decoration.

## User-state completeness
For async/customer-facing features account for relevant loading, empty, pending, disabled, error, success, retry, cancellation, and stale/session-expired states. Preserve semantic HTML, accessible names, keyboard operation, visible focus, and reduced-motion behavior.

## Performance and verification
Measure before optimizing. Inspect bundle/request/render cost when a change plausibly affects them; prefer route/component boundaries and request-path fixes over micro-optimizations. Verify affected routes, async/error paths, cleanup/races, and accessibility; use browser evidence when available. Report anything not rendered or executed rather than inferring success.