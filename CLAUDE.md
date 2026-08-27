# Drywall Toolbox Claude Adapter

This file is a Claude-specific entrypoint only. DTB architecture, engineering policy, and routing authority remain in root `AGENTS.md` and canonical `.agents/`.

1. Read `AGENTS.md`.
2. For substantial tasks resolve intent/domain/flags/risk through `node scripts/ai/resolve-task.mjs` when shell execution is available; otherwise reproduce `.agents/registry.json` resolution exactly.
3. Load only the resolved workflow, execution role, distinct subject role, and resolved skills. Read `.agents/README.md` only when understanding or maintaining the AI workspace itself.
4. Apply resolved reviewers independently using final diff/source and bounded authoritative context; review/exploration roles do not mutate production source.
5. Active implementation and directly evidenced runtime behavior outrank stored AI context.
6. `.claude/agents/` and `.claude/skills/` are capability/discovery adapters to canonical sources only; do not duplicate DTB business, checkout, security, queue, provider, ownership, or routing doctrine.
7. If a required capability is unavailable, report the limitation rather than inventing evidence.
