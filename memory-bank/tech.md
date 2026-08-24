# Drywall Toolbox — Technology Summary

Status: derived context. Active implementation/package manifests and `AGENTS.md` outrank this file.

Stable stack family:

- React 19 JavaScript/JSX storefront with React Router and Webpack.
- Tailwind/CSS custom-property design tokens plus feature styles and intrinsic responsive layout.
- WordPress/WooCommerce backend with PHP must-use plugins.
- WooCommerce CRUD/HPOS-compatible commerce access.
- Action Scheduler for async work.
- Veeqo/QuickBooks/marketplace/provider adapters in DTB integration boundaries.
- GitHub Actions and deterministic scripts for CI/operations.

A package appearing in `frontend/package.json` establishes dependency presence, not architectural ownership or active usage. In particular, frontend Stripe libraries must not be interpreted as evidence that React owns native WooCommerce checkout payment UI. Trace imports/execution before asserting usage.

Use package manifests/source for exact versions and current dependencies.
