# Implementation Workflow

1. Extract acceptance criteria and non-goals.
2. Read `AGENTS.md` and inspect active source.
3. Use `explorer` when ownership/execution path is not already established.
4. Identify owner/system of record and classify blast radius.
5. Use `architect` when work crosses systems, persistence, APIs, queues, checkout/payment, providers or migration contracts.
6. Load only relevant domain skills.
7. Implement through one owning writer per overlapping boundary.
8. Apply risk-selected review: code, security, integration, UI critique as relevant.
9. Run independent verification using existing checks.
10. Update durable docs when contracts changed.
11. Inspect final diff for duplicate authority, secrets, unrelated churn and generated output.

Parallelize read-heavy investigation/review; serialize overlapping mutation.
