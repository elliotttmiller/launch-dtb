---
name: dtb-module-architecture
description: DTB architecture method for distinguishing implementation from contract change and placing durable behavior in the smallest correct existing owner.
---
# DTB Module Architecture

## Contract-change gate
Architecture review is required when materially changing system/domain ownership, persistence authority/schema lifecycle, public/cross-module APIs, event/queue identity, checkout/payment/refund boundaries, provider contracts, composition, migration strategy, or runtime/deployment boundaries. Merely touching a database, queue, provider, or checkout-related file is not itself an architecture change.

## Start with ownership
Inspect active composition and the closest execution path. Establish product outcome, authoritative system, lifecycle, identities, data ownership, consumers, and demonstrated constraint. Ask first whether the existing owner can satisfy the requirement without weakening cohesion.

## Contract design
Define owner/system of record; inputs/outputs; identity; authorization/ownership; persistence/lifecycle; events/queues/idempotency; provider boundary; failure/retry/recovery; observability; migration/compatibility/rollback; and durable docs as relevant.

Reuse platform auth, event, queue, cache, REST, design, and operator primitives. Keep provider transport out of domain services. Never create shadow authority for WooCommerce commerce, Veeqo fulfillment/inventory, QuickBooks accounting, payment providers, or protected catalog identities.

## Complexity gate
Do not create a module/service/store/control plane for a helper, thin pass-through, temporary migration, or speculative future capability. Prefer explicit composition and narrow dependencies. New boundaries require coherent responsibility/lifecycle and a demonstrated safety/maintainability advantage over simpler placement.
