# Context Maintenance Workflow

Context is derived from implementation, never the reverse.

When architecture/ownership/contracts change:

1. update active implementation and owning durable docs;
2. update `AGENTS.md` only if repository-wide policy/authority changes;
3. update canonical `.agents/` roles/skills/workflows when reusable AI behavior changes;
4. update concise derived context only after the durable source is correct;
5. update vendor adapters only when capability/tool mapping changes;
6. run `node scripts/ai/validate-context.mjs`.

Never copy a mutable implementation fact into many assistant-specific prompts. Prefer a canonical pointer to the owning source.
