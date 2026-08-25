---
name: dtb-frontend-architecture-decisions
description: Evidence-based framework for deciding whether frontend work belongs in browser, server, build time or existing platform boundaries.
---
# DTB Frontend Architecture Decisions

Architecture is placement of computation, state and authority—not adoption of fashionable patterns.

## Decision method
Start from a measurable DTB problem: latency, SEO/indexability, bundle cost, consistency, security, data locality, deployment coupling, team ownership, cacheability, provider constraints, or developer-operability. Describe current behavior and bottleneck before proposing a new runtime pattern.

Evaluate the simplest options in order: improve current component/data flow; move work to the existing owning WordPress/MU-plugin layer; adjust build-time behavior; then consider additional runtime architecture only if the earlier options cannot satisfy the requirement.

For BFF, SSR/SSG/ISR, RSC, islands, edge compute, micro-frontends or a framework migration, explicitly evaluate new deployment/runtime dependencies, cache invalidation, auth/session behavior, failure modes, observability, data duplication, ownership, migration cost, rollback, and compatibility with WooCommerce/provider boundaries.

## Defaults
The existing modular React storefront + WordPress/WooCommerce + DTB MU-plugin architecture remains preferred while it meets real constraints. Keep compute near authoritative data when consistency/security dominates; keep presentation/local interaction in the browser. Prefer a modular frontend monolith while one repository/team/deployment boundary remains advantageous.

Recommend added architecture only when the concrete benefit outweighs operational and maintenance cost.