# Implementation Workflow

Use for fixes/features/changes where an owning writer will modify repository source.

## 1. Frame the task
Extract observable acceptance criteria, constraints, non-goals, and any user-specified scope. Identify unknowns that can be resolved from source before asking for more information.

## 2. Establish current behavior
Read `AGENTS.md` and inspect active implementation. Use the explorer when ownership/execution is unfamiliar or cross-cutting. Trace concrete entry points, persistence, queues/providers, consumers and tests needed to understand blast radius.

## 3. Confirm ownership and risk
Name the system of record and owning module. Do not implement in a convenient non-owner. Use the architect when the change affects ownership, persistence, API contracts, event/queue identity, checkout/payment/refund, providers, migrations, composition, or another cross-system invariant. Load only relevant skills.

## 4. Design the smallest complete change
Preserve existing contracts unless intentionally changing them. Account for authorization, validation, idempotency, concurrency, retries, partial failure, cleanup/cancellation, compatibility and recovery when relevant. Prefer extending existing primitives over introducing new infrastructure.

## 5. Implement through the owner
One writer per overlapping authority boundary. Keep provider-specific logic in adapters and generated outputs owned by their generators. Avoid unrelated cleanup unless it is required for a safe implementation.

## 6. Review and verify
Apply risk-selected review: code, security, integration, and/or UI critique. Verify the final implementation against acceptance criteria using existing targeted checks and runtime/browser evidence where available. Do not claim unexecuted checks passed.

## 7. Close cleanly
Update durable docs only when contracts/ownership/APIs/routing/persistence/queues/integrations changed. Inspect the final diff for duplicate authority, secrets, protected-identifier changes, generated-source mistakes, debug artifacts and unrelated churn. Report changed files, owner, data/security/API/queue/integration/docs impact, verification and residual risk.

Parallelize independent investigation/review; serialize overlapping mutation.