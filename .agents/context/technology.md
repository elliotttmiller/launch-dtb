---
status: derived
owner: repository-governance
scope: technology-family
review_triggers:
  - major-stack-change
---
# DTB Technology Context

Stable technology family:

- React 19 / JavaScript and JSX storefront.
- React Router and Webpack build pipeline.
- CSS/Tailwind/design-token based presentation with responsive intrinsic layout.
- WordPress/WooCommerce backend and DTB must-use plugins in PHP.
- WooCommerce CRUD/HPOS-compatible commerce access.
- Action Scheduler for asynchronous application work.
- Veeqo, QuickBooks and marketplace/provider adapters under DTB integration ownership.
- Deterministic repository scripts for repeatable validation and operational tooling where implemented.

Dependency presence does not establish architectural authority. A package may remain installed for a limited/non-authoritative surface; verify imports and active execution paths before inferring usage or ownership.

GitHub-hosted automation availability is account/environment dependent and is not an application architecture requirement. Exact versions, route lists, provider activation, module inventory and deployment/runtime state are intentionally omitted because they are mutable source/runtime facts.
