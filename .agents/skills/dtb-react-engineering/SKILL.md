---
name: dtb-react-engineering
description: DTB React implementation discipline for state, hooks, components, API consumption, async states and performance.
---
# DTB React Engineering

- Prefer small focused components and reusable semantics, not abstraction for its own sake.
- Keep server-owned truth in server systems; do not mirror commerce/payment/inventory authority in React state.
- Route network behavior through existing API/service layers; avoid fetch-per-item patterns.
- Effects synchronize with external systems; do not use effects to derive state that can be computed during render/event handling.
- Correct dependencies, cleanup and cancellation are mandatory.
- Handle loading, empty, error, disabled, success and retry states explicitly where relevant.
- Use memoization only for measured/identity-sensitive needs, not reflexively.
- Optimize measured bottlenecks, bundle boundaries and request paths rather than speculative micro-optimization.
- Preserve semantic HTML, keyboard operation, focus visibility and reduced-motion behavior.
