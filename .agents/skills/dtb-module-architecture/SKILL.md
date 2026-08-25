---
name: dtb-module-architecture
description: DTB architecture method for placing new domain behavior into the smallest correct existing owner or, when justified, a bounded new module.
---
# DTB Module Architecture

## Start with ownership
Inspect the composition root and closest sibling implementation. Determine product outcome, authoritative system, lifecycle, data ownership and consumers. First ask whether an existing module can own the behavior without weakening cohesion; a new directory/module is not a design goal.

## Contract design
For material new behavior define: owner/system of record; public/internal API; identity keys; authorization/ownership; persistence and lifecycle; events/queues and idempotency; provider adapter boundary; customer/operator surfaces; failure/retry/recovery; observability/correlation; migration/compatibility; and durable documentation.

Reuse established platform auth, permissions, event ledger, queue, cache, REST, design and admin primitives. Keep provider payload/transport details out of domain services. New modules must not become shadow authorities for WooCommerce commerce, Veeqo fulfillment/inventory, QuickBooks accounting, payment-provider security/collection, or protected catalog identifiers.

## Complexity gate
Do not create a module for a single helper, thin pass-through, temporary migration, or speculative future capability. Prefer explicit composition and narrow dependencies over service locators/global registries. Define a new boundary only when responsibility/lifecycle/change cadence is coherent and materially improves maintainability or safety.

Document rejected simpler placement when a new module is recommended.