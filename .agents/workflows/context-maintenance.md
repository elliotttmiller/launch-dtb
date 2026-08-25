# Context Maintenance Workflow

Context is derived from implementation; it never overrides higher-precedence source/runtime evidence.

## When to update
Update AI context only when a reusable engineering rule, architecture/ownership contract, model-neutral skill/role, or concise derived summary actually changed. Do not churn context for ordinary implementation details already discoverable from source.

## Sequence
1. Correct active implementation and owning durable documentation first.
2. Update `AGENTS.md` only for repository-wide policy, authority or precedence changes.
3. Update canonical `.agents/` role/skill/workflow only when reusable AI behavior changes.
4. Update concise `.agents/context` summaries after durable sources are correct; keep mutable details minimal.
5. Update vendor adapters only for vendor capability/model/tool/discovery mapping changes.
6. Check for duplicated rules, stale pointers, vendor coupling, role write overlap, unnecessary new files and context bloat.
7. Run `node scripts/ai/validate-context.mjs` and `node scripts/ai/test-routing.mjs` when execution is available; otherwise report that validation was not executed.

## Simplicity rule
Prefer editing or deleting existing context over adding another source. Do not copy mutable implementation facts into multiple assistant prompts. Do not introduce new agent infrastructure unless repeated real work demonstrates a failure the existing simple control plane cannot solve.

Exit when each concern has one authoritative home and adapters remain thin.