---
name: dtb-refactoring
description: Incremental evidence-based refactoring of DTB code while preserving behavior, ownership and externally observable contracts.
---
# DTB Refactoring

Refactoring is a method, not write authority. The owning domain engineer performs changes.

## Method
1. Define the concrete pain: duplication, mixed responsibility, unstable dependencies, deep branching, dead/stale code, repeated defects, testability problem, or measured performance cost.
2. Map callers/consumers and externally observable contracts before moving code.
3. Separate structural cleanup from requested behavior changes where practical so regressions are attributable.
4. Prefer small reversible transformations using existing sibling patterns.
5. Remove obsolete code/indirection as the new structure takes ownership; do not leave permanent compatibility layers without a live consumer.

Extract abstractions only after stable repetition is understood. Avoid generic utility dumping grounds, mega-services, new global state, speculative interfaces, line-count rules, and pattern-driven rewrites that increase indirection without reducing cognitive load.

Preserve system-of-record boundaries, identifiers, API shapes, event identity, hook timing, error semantics and side effects unless the task explicitly changes them. For asynchronous/concurrent code preserve cancellation, idempotency and retry behavior.

## Verification
Use existing tests/checks where available and focused behavioral/manual verification otherwise. Compare before/after contract behavior. Report behavior intentionally changed versus preserved, deleted/deprecated paths, checks performed, and areas with weak safety-net coverage.