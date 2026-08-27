# Drywall Toolbox Codex Adapter

`.codex/` configures Codex-specific model, sandbox, MCP and command-policy behavior. It is not a DTB architecture, routing, or domain-knowledge authority.

Read root `AGENTS.md` first. For substantial work resolve through `scripts/ai/resolve-task.mjs` / `.agents/registry.json`, then load only the resolved workflow, execution role, distinct subject role, and skills. Read `.agents/README.md` only for AI-library orientation/maintenance.

- Codex agent files map canonical roles to client configuration; they do not duplicate domain/routing contracts.
- Apply resolved reviewers independently with bounded final-diff/source context.
- Review/exploration roles remain read-only; serialize overlapping writes.
- Active implementation/evidenced runtime behavior outrank stored context.
- MCP/tool configuration must not embed credentials.
- `.codex/rules/` supplements client command policy but never replaces repository authorization/provider security.
- Run `node scripts/ai/validate-context.mjs` and `node scripts/ai/test-routing.mjs` after AI-governance changes when execution is available.
