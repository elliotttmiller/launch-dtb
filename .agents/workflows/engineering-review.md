# Engineering Review Workflow

Review final diff/source and authoritative surrounding implementation, not remembered conversation state. Reviewers remain independent and read-only.

## Establish intent
Identify acceptance criteria, owner/system of record, affected contracts, and blast radius. Read only enough callers/consumers/persistence/generated-source relationships/guards to establish consequences.

## Compose by actual dimensions
- Correctness review for material implementation.
- Security review for auth/authorization, sensitive/customer data, payment, webhooks, uploads, remote URLs, operator mutation, secrets, or security controls.
- Integration review for queues/events/providers/webhooks/external effects/retries/projections.
- Architecture review for contract-changing work, not merely because a queue/provider/database is touched.
- UI/accessibility critique for material customer-facing presentation/interaction.
- Verification for what actually executes/passes.

Risk determines minimum rigor; flags determine specialist dimensions. Critical risk does not automatically imply every specialist reviewer.

## Finding standard
Require source evidence, concrete trigger/precondition, consequence, path/symbol, severity, and smallest safe correction boundary. Search surrounding implementation before reporting. Preferences/speculative future risk are not production defects; empty findings are valid.

## Context isolation
Provide reviewer with `AGENTS.md`, reviewer role/skills, acceptance criteria, final diff, and affected authoritative source/contracts. Do not automatically inherit writer exploration, rejected branches, unrelated skills, or unrelated tool output.

## Report
Blocking findings first, then advisory findings, validation evidence, unverified behavior, material impact, and residual risk.
