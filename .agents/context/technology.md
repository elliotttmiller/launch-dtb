---
status: derived
owner: repository-governance
scope: technology-family
source_paths:
  - frontend/package.json
  - drywalltoolbox/wp/wp-content/mu-plugins/00-dtb-loader.php
  - AGENTS.md
review_triggers:
  - major-stack-change
  - build-system-change
  - async-execution-change
---
# DTB Technology Context

Stable technology family:

- React/JavaScript/JSX storefront with React Router and Webpack build pipeline.
- CSS/Tailwind/design-token presentation with responsive intrinsic layout.
- WordPress/WooCommerce backend and DTB must-use plugins in PHP.
- WooCommerce CRUD/HPOS-compatible commerce access.
- Action Scheduler for asynchronous DTB backend work.
- Veeqo, QuickBooks and marketplace/provider adapters under integration ownership.
- Deterministic repository scripts for repeatable validation/operational tooling where implemented.

Dependency presence does not establish architectural authority. Verify imports and execution paths before inferring active usage. Exact versions, provider activation, route lists, module inventory, and deployment/runtime state are intentionally omitted because they are mutable source/runtime facts.
