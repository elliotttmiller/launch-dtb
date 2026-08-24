# Engineering Review Workflow

Review the actual diff, not remembered conversation state.

1. Run cross-cutting contract review.
2. Add security review for auth, payment, webhook, file, operator mutation or sensitive-data changes.
3. Add integration review for queues, providers, event identity or external side effects.
4. Add UI critique/responsive validation for customer-facing presentation changes.
5. Run independent verification using existing checks.
6. Reconcile duplicate/conflicting findings against active source and `AGENTS.md`.
7. Report blocking findings, advisory findings, validation evidence, unverified runtime behavior, ownership/data/security/API/queue/integration/docs impact and residual risk.
