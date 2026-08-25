# Engineering Review Workflow

Review the final diff/source, not remembered conversation state. Reviewers remain independent and read-only.

## Establish intent
Identify intended behavior, acceptance criteria, owner/system of record, affected contracts and blast radius. Read enough surrounding code to understand callers, consumers, persistence, generated-source relationships and existing guards.

## Compose review by risk
- Always perform cross-cutting correctness/ownership review for material changes.
- Add security review for auth/authorization, payment, webhooks, files/uploads/URLs, operator mutation, secrets or sensitive/customer data.
- Add integration review for queues/events, providers, webhooks, external side effects, retries or projections.
- Add UI design/responsive/accessibility critique for customer-facing presentation/interaction changes.
- Use independent verification to report what actually executes/passes.

## Finding standard
A finding needs source evidence, a concrete trigger/precondition, consequence, affected path/symbol, severity and smallest safe correction boundary. Search surrounding implementation before reporting to avoid false positives. Do not turn preference or speculative future risk into a production bug. Empty findings are valid.

Prioritize security/authorization, duplicate authority, order/payment/refund integrity, protected identifiers/data loss, idempotency/concurrency/retry safety, API compatibility, deterministic runtime failures and unsafe migrations. Keep maintainability/performance/style advisory unless materially harmful.

## Reconcile and report
Reconcile duplicate/conflicting findings against active source and `AGENTS.md`. Report blocking findings first, then advisory findings, validation evidence, unverified runtime behavior, ownership/data/security/API/queue/integration/docs impact, unrelated churn and residual risk.