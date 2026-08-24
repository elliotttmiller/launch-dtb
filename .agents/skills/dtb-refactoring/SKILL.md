---
name: dtb-refactoring
description: Evidence-based, incremental refactoring method for existing DTB code without changing system ownership.
---
# DTB Refactoring

Refactoring is a method, not a write authority. The owning frontend/backend/checkout/catalog engineer performs changes.

Map real consumers first. Separate behavior changes from structural changes. Prefer small reversible steps, existing sibling patterns and concrete simplifications over speculative design patterns. Address demonstrated duplication, deep nesting, mixed responsibilities, stale/dead code and measurable bottlenecks. Do not invent universal line-count thresholds as hard rules; use complexity and responsibility as the decision criteria.

When tests are absent, define explicit manual/contract verification rather than pretending a safety net exists.
