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
- Action Scheduler for asynchronous work.
- Veeqo, QuickBooks and marketplace/provider adapters under DTB integration ownership.
- GitHub Actions and deterministic repository scripts for CI/operations.

Dependency presence does not establish architectural authority. For example, a browser package may remain installed for a non-checkout surface even when provider-owned WooCommerce UI is the checkout authority. Verify imports and active execution paths before inferring usage.

Exact versions, route lists, provider activation, module inventory and deployment state are intentionally omitted because they are mutable source/runtime facts.
