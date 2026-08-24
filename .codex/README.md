# Drywall Toolbox Codex Adapter

`.codex/` configures Codex-specific model, sandbox, MCP and command-policy behavior. It is not a DTB architecture, routing or domain knowledge authority.

Read root `AGENTS.md` first, then `.agents/README.md` and `.agents/registry.json`. Canonical roles, skills, workflows and routing live under `.agents/`.

## Rules

- Resolve substantial tasks through `node scripts/ai/resolve-task.mjs` before loading role/skill context.
- Codex agent files map canonical roles to Codex model/sandbox settings; they do not duplicate domain or routing contracts.
- Load only the resolved workflow, owning role and resolved skills; apply the resolved reviewers independently.
- Review/exploration roles remain read-only. Parallelize read-heavy investigation; serialize overlapping writes.
- Active implementation and evidenced runtime behavior win over stored context.
- Project MCP/tool configuration must not embed credentials.
- `.codex/rules/` supplements, but does not replace, repository authorization and provider security.
- Run `node scripts/ai/validate-context.mjs` and `node scripts/ai/test-routing.mjs` after AI governance/routing changes.
