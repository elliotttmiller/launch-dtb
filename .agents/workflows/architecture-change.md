# Architecture Change Workflow

Use when ownership, APIs, routing, persistence, queue/event identity, provider contracts, composition or deployment contracts change.

Required output before implementation:

- current owner/system of record with source evidence;
- problem statement and acceptance criteria;
- invariants that must remain true;
- recommended owning layer and explicit contract;
- security/data/concurrency/idempotency/performance impact;
- migration/compatibility/rollback or recovery semantics;
- materially rejected alternatives and why;
- documentation that must change.

Do not adopt BFFs, micro-frontends, SSR/RSC migrations, edge execution, new persistence or parallel services because they are fashionable. Require a concrete DTB constraint that the added architecture solves better than the current system.
