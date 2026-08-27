---
name: dtb-ai-context-engineering
description: Model-neutral context engineering for high-signal DTB objectives, progressive disclosure, bounded retrieval, evidence sufficiency, reviewer isolation, and context observability without capability loss.
---
# DTB AI Context Engineering

## Objective
Maximize useful engineering signal per context token and tool operation. Optimize relevance, authority, and evidence sufficiency rather than raw prompt length.

## Progressive construction
Tier 0 is `AGENTS.md` + task. Tier 1 is the resolved workflow, execution role, distinct subject role, required skills, and directly relevant owning source/docs. Tier 2 is deeper references, derived context, history, and external research only when a material gap requires them. `.agents/README.md` is orientation/maintenance documentation, not normal task context.

## Retrieval discipline
Before fetching, ask whether current authoritative evidence already resolves the question. Reuse valid established evidence. Otherwise search by behavior/symbol, select the narrowest authoritative path/range/object, and expand only if still insufficient. Prefer bounded/paginated/filterable results and relevant log/time windows. Do not repeatedly refetch unchanged evidence solely to restate it.

## Evidence sufficiency
Stop expanding when outcome, owner/system of record, execution path, affected contract, material security/data/event/provider boundaries, implementation evidence, and verification strategy are established as applicable. Continue only for missing material facts, conflicting authorities, unverified required boundaries, verification needs, or credible alternatives that could change the decision.

## Context quality
Avoid duplicated instructions, stale summaries, irrelevant files, giant standing prompts, repeated vendor wrappers, copied mutable facts, obsolete tool results, and unrelated prior-task state. Preserve verified facts, decisions, identities, affected paths, unresolved risk, and verification status when compacting. Never require private chain-of-thought.

## Reviewer isolation
Independent reviewers should receive constitutional policy, reviewer role/skill, acceptance criteria, final diff/change, and affected authoritative contracts/source—not the complete writer transcript.

## Observability
Track/report context-pack size and material growth where tooling permits. Use warnings before hard limits. Never remove security invariants, critical failure modes, required verification, or specialist review merely to reduce tokens.
