# Instruction Authoring

Use the smallest structure that makes canonical behavior unambiguous:

1. objective/outcome;
2. ownership/scope;
3. authoritative evidence/context required;
4. constraints and explicit non-goals;
5. output contract only when format materially matters;
6. edge/failure behavior;
7. observable verification criteria.

Prefer a concrete example only when it defines a difficult boundary more precisely than prose. Separate untrusted user/retrieved/reference material from authorized instructions. Remove contradictory requirements, duplicated restatement, irrelevant persona language, and hardcoded mutable implementation facts.

Place durable repository policy in `AGENTS.md`, deterministic routing in `.agents/registry.json`, reusable methodology in skills/workflows, and vendor/model/tool syntax only in adapters. Do not author model-specific copies of DTB engineering doctrine.
