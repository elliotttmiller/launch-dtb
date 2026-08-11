---
name: dtb-engineering-review
description: Structured DTB pre-merge engineering review workflow. Use for PR/diff review, architecture verification, security review, validation planning, or release-readiness evidence.
---

# DTB engineering review

Use this workflow for material diffs and pull requests.

1. Read root `AGENTS.md` and obtain the actual diff.
2. Delegate independent read-heavy review where useful: `code_reviewer` for architecture/contracts, `security_reviewer` for trust boundaries, and `integration_reviewer` for queue/provider changes.
3. Wait for all requested review agents and reconcile duplicate/conflicting findings against active source.
4. Run `test_verifier` for relevant existing checks when execution is available.
5. Classify findings as blocking or advisory. Blocking categories include security boundary violations, duplicate system authority, payment/order/refund contract breaks, data corruption/identifier instability, non-idempotent external side effects, and unauthorized destructive behavior.
6. Verify documentation is updated when architecture, ownership, APIs, routing, persistence, queues or integration contracts have changed.
7. Return a concise merge-readiness summary with findings, validation evidence, unverified runtime behavior, changed ownership boundaries, data/migration impact, security impact, API/queue/integration impact, documentation impact and residual risk.
