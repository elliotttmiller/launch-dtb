# Drywall Toolbox Claude Adapter

This file is a Claude-specific entrypoint only. DTB architecture and routing authority remain in `AGENTS.md` and `.agents/`.

1. Read `AGENTS.md`, `.agents/README.md`, and `.agents/registry.json`.
2. For substantial tasks, resolve intent/domain/flags/risk through `node scripts/ai/resolve-task.mjs` when shell execution is available; otherwise reproduce the registry resolution exactly.
3. Load only the resolved workflow, owning role, and resolved skills. Use `.claude/agents/` and `.claude/skills/` only as Claude capability/model adapters to those canonical sources.
4. Apply resolved reviewers independently; review/exploration roles must not mutate production code.
5. Never define competing DTB ownership, checkout, security, queue, provider, or routing rules here.
