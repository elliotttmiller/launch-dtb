# Drywall Toolbox Copilot Adapter

This file is a tool adapter, not an architecture authority.

1. Read and obey root `AGENTS.md`.
2. Read `.agents/README.md` and `.agents/registry.json` for the canonical model-neutral execution system.
3. For substantial work, resolve intent, domain, flags and risk through the registry before loading role/skill context. Use `node scripts/ai/resolve-task.mjs` when shell execution is available; otherwise reproduce the registry resolution exactly.
4. Load only the resolved workflow, owning role and resolved skills. Apply the resolved independent reviewers before completion.
5. Active implementation and directly evidenced runtime behavior outrank all stored context.
6. Do not recreate DTB business, checkout, security, queue, provider, ownership or routing rules in this file.
7. Preserve one writer per overlapping authority boundary. Review/exploration roles do not mutate production code.
8. Never expose credentials, provider secrets, payment data or server configuration.
9. If Copilot lacks a capability required by a canonical role/skill, state that limitation rather than inventing evidence.

Assistant-specific syntax and product behavior may change; DTB architecture and routing must not depend on it.
