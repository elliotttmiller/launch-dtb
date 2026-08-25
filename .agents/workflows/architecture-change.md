# Architecture Change Workflow

Use when ownership, APIs, routing, persistence, event/queue identity, provider contracts, checkout/payment/refund behavior, module composition, migration, or deployment/runtime boundaries materially change. Architecture work is read-only until a design is selected.

## Current-state evidence
Trace the active path and identify owner/system of record, data lifecycle, public/internal interfaces, authorization, events/queues, provider boundaries, consumers, failure/retry behavior and durable docs. Resolve source/document conflicts using repository precedence.

## Decision frame
State the concrete problem and acceptance criteria. Define invariants that must remain true. Evaluate the smallest viable approaches against:

- ownership and duplicate truth;
- security/authorization/privacy;
- data integrity and protected identities;
- concurrency/idempotency/replay;
- failure/retry/recovery and observability;
- performance/latency and query/request cost;
- migration/backward compatibility/rollback;
- operational/deployment complexity;
- maintainability and future removal cost.

Prefer changing/extending the current owner. New modules, persistence, BFFs, micro-frontends, SSR/RSC migrations, edge execution, or parallel services require a concrete DTB constraint and a demonstrated advantage over simpler alternatives.

## Required design output
Before implementation provide: current-state evidence; selected owner/system of record; explicit interface/data/event contracts; invariants; affected systems; security/data/concurrency/performance impact; migration and rollback/recovery semantics; verification strategy; documentation changes; and materially plausible rejected alternatives.

## Exit condition
Architecture is ready for implementation only when ownership is singular, identities and failure semantics are explicit, no parallel truth is introduced, and the selected design is the simplest complete solution for the demonstrated constraint.