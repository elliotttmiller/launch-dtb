---
name: dtb-engineering-review
description: Evidence-driven DTB review method for correctness, ownership, security, integrations, architecture, verification and actionable finding quality.
---
# DTB Engineering Review

## Review target
Review final diff/source plus the minimum authoritative surrounding code/contracts needed to establish consequences. Do not review remembered conversation state or produce findings to satisfy a quota.

## Dimensions
Correctness is the default material-change review. Add security, integration, architecture, UI/accessibility, and verification only when the actual boundary warrants them. Risk sets minimum rigor; specialist flags set dimensions. Critical risk alone does not make an unrelated security or integration reviewer useful.

## Evidence method
Trace changed input/identity -> validation/authorization -> state transition/persistence -> events/queues/providers -> consumer/result. Check null/error/retry/replay/concurrency/partial-failure/bounds/cleanup/migration cases that are materially reachable.

## Findings
A finding requires source evidence, concrete trigger/precondition, consequence, affected path/symbol, severity, and smallest safe correction boundary. Search surrounding implementation to avoid false positives. Do not call style/preferences or speculative future consumers production defects. Empty findings are valid.

## Independence
Reviewer context is isolated to `AGENTS.md`, reviewer role/skills, acceptance criteria, final change, and affected authoritative source/contracts. Do not inherit the writer's entire exploration transcript by default.

## Verification distinction
Static review identifies credible defects; verification establishes what actually executes/passes. Never convert an unexecuted expectation into a passing result.
