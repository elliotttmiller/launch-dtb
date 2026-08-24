# Drywall Toolbox Codex Adapter

`.codex/` configures Codex-specific model, sandbox, MCP and command-policy behavior. It is not a DTB architecture or domain knowledge authority.

Read root `AGENTS.md` first, then `.agents/README.md`. Canonical roles, skills and workflows live under `.agents/`.

## Rules

- Active implementation and evidenced runtime behavior win over stored context.
- Codex agent files map canonical roles to Codex model/sandbox settings; they do not duplicate domain contracts.
- Review/exploration roles remain read-only.
- Parallelize read-heavy investigation; serialize overlapping writes.
- Project MCP/tool configuration must not embed credentials.
- `.codex/rules/` supplements, but does not replace, repository authorization and provider security.
- Run `node scripts/ai/validate-context.mjs` after AI governance changes.
