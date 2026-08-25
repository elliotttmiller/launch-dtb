---
name: dtb-ai-workspace-governance
description: Govern DTB model-neutral roles, skills, workflows, context and vendor adapters while preventing duplication, drift and AI-workspace overengineering.
---
# DTB AI Workspace Governance

## Classification rule
A **role** exists only for a durable ownership/responsibility boundary or independent review function. A **skill** exists for reusable expertise/method shared across tasks or owners. A **workflow** defines a small repeatable sequence. Derived context summarizes current architecture; adapters only map vendor capabilities/configuration.

Before adding anything, search existing coverage and ask whether an existing role/skill/workflow can be strengthened instead. Do not create near-duplicate personas, technology-specific aliases, permanent orchestrator bureaucracy, receipt systems, capability registries, classifiers, or state machines without repeated evidence that the current simple system cannot solve a real problem.

## Authority
Canonical reusable knowledge lives under `.agents/`; `AGENTS.md` remains repository constitutional policy. Vendor/model/tool names belong in vendor adapters, not canonical knowledge. Active source/runtime and machine contracts outrank stored AI context.

## Execution discipline
One writer per overlapping authority boundary. Review/exploration remain read-only. Parallelize independent investigation; serialize overlapping mutation. Persist `docs/work/<task-id>/` only when cross-session state is genuinely useful.

## Change review
When modifying AI governance, check for duplicated authority, stale pointers, vendor coupling, contradictions with `AGENTS.md`, accidental role write overlap, unnecessary new infrastructure, and context bloat. Run `node scripts/ai/validate-context.mjs` and `node scripts/ai/test-routing.mjs` when execution is available; otherwise state that they were not executed.