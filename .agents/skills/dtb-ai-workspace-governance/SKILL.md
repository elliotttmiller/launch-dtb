---
name: dtb-ai-workspace-governance
description: Govern DTB model-neutral routing, roles, skills, workflows, context, validation and vendor adapters while preventing duplicate authority, drift, context bloat and AI-workspace overengineering.
---
# DTB AI Workspace Governance

## Classification
`AGENTS.md` owns constitutional policy. `registry.json` owns deterministic routing. A role exists only for durable execution responsibility or independent review. A skill is reusable methodology and never write authority. A workflow is a small repeatable sequence. Derived context summarizes primary sources. Vendor adapters map client capability/configuration only.

## Routing semantics
Keep intent, domain, execution role, subject role, skills, flags, risk, and reviewers orthogonal. Specialized semantic ownership outranks generic filesystem ownership. Subject specialists may remain read-only while a different registered writer performs implementation. Risk expresses consequence; flags select specialist review dimensions.

## Evolution gate
Before adding anything, search existing coverage and determine whether strengthening/deleting an existing mechanism solves the deficiency. Add infrastructure only after recurring DTB work demonstrates a real failure. Do not create near-duplicate personas, model-specific doctrine, model scorecards/comparison tests, permanent orchestrators, duplicate capability registries, LLM routing, or global mutable task state.

## Consistency
Routing facts live in the registry, not duplicated role frontmatter/adapters. Canonical files must not depend on vendor/model names. Derived context needs provenance and review triggers. Adapters remain thin and may report missing capabilities rather than simulating them.

## Verification
After governance changes run `node scripts/ai/validate-context.mjs` and `node scripts/ai/test-routing.mjs` when available. Check paths, registry schema, read/write boundaries, subject/execution separation, risk monotonicity, reviewer isolation, contract flags, context size, stale adapters, task manifests, and contradictions with `AGENTS.md`.
