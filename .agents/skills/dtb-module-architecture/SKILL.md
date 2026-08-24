---
name: dtb-module-architecture
description: Design new DTB domains/modules by extending proven ownership and composition patterns rather than inventing parallel architecture.
---
# DTB Module Architecture

Inspect the composition root and closest sibling module before proposing structure. Decide whether the requirement belongs in an existing module before creating a new one. Define product outcome, owner/system of record, persistence, REST/auth contract, events/queues, provider adapters, operator/customer surfaces, failure/retry/recovery semantics and durable documentation.

Reuse platform auth, permission, queue, event, cache, design and admin primitives. New modules must not become shadow authorities for commerce, inventory, fulfillment, accounting, payments or protected catalog identifiers.
