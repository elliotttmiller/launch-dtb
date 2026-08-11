# Drywall Toolbox Codex Engineering Library

This directory is the project-scoped Codex control plane for `elliotttmiller/launch-dtb`.
It adapts the repository's existing engineering contract to Codex without creating a second architecture authority.

## Authority

Always read and obey root `AGENTS.md`. Active implementation and evidenced runtime behavior remain higher-precedence than agent definitions, skills, or documentation. `.codex/`, `.claude/`, and `.github/copilot-instructions.md` are tool adapters, not systems of record.

## Design principles

- One authority per business concern.
- One writer per overlapping ownership boundary.
- Parallelize read-heavy exploration, review, test analysis, and triage; serialize overlapping writes.
- Use narrow custom agents instead of generic personas.
- Keep reviewers read-only.
- Inherit the parent session's approval/sandbox policy for implementation agents rather than weakening it in project config.
- Keep credentials and provider secrets in user/workspace secret stores, never in repository config.
- Prefer active source inspection over assumptions or filename-based inference.
- Treat generated output as derived unless the repository proves otherwise.

## Agent routing

| Agent | Primary role | Write policy |
| --- | --- | --- |
| `dtb_explorer` | Trace implementation, ownership, hooks, routes, queues, persistence, integrations | Read-only |
| `dtb_architect` | Cross-system ownership and contract decisions | Read-only |
| `frontend_react` | `frontend/` React storefront implementation | Parent sandbox |
| `wp_backend` | DTB MU-plugin / tracked theme backend implementation | Parent sandbox |
| `commerce_checkout` | Checkout, payment, order identity, captured-payment and refund contract | Parent sandbox |
| `catalog_data` | Canonical `products/` data and deterministic catalog generators | Parent sandbox |
| `integration_reviewer` | Veeqo, QuickBooks, Action Scheduler, webhooks and provider adapters | Read-only |
| `code_reviewer` | Cross-cutting AGENTS.md contract review of actual diffs | Read-only |
| `security_reviewer` | Focused authorization, secret, replay, injection and ownership review | Read-only |
| `test_verifier` | Independent validation using existing project checks | No source edits |

## Recommended orchestration

For non-trivial work, use `dtb_explorer` first when the owning path is not already established. Add `dtb_architect` when the change crosses systems of record, modules, persistence, APIs, queues, checkout/payment, or provider contracts. Route implementation to exactly one owning writer wherever practical. Run `code_reviewer` after material changes; add `security_reviewer` for auth/payment/webhook/operator mutations and `test_verifier` for independent validation.

Examples:

- Checkout/UI: `dtb_explorer` -> `commerce_checkout` (+ `frontend_react` only for a separately owned SPA/PDP surface) -> `code_reviewer` -> `test_verifier`.
- Veeqo/QuickBooks: `dtb_explorer` + `integration_reviewer` -> `dtb_architect` if contracts change -> `wp_backend` -> `code_reviewer`.
- Catalog identifiers/imports: `dtb_explorer` -> `catalog_data` -> `code_reviewer`.
- Frontend UX: `dtb_explorer` when needed -> `frontend_react` with `$dtb-design-system` -> `code_reviewer`.

## Skills

Codex discovers repository skills under `.agents/skills/`. DTB adapters there intentionally reuse the mature `.claude/skills` knowledge and explicitly keep root `AGENTS.md` plus active source authoritative. This avoids copying large skill bodies into parallel tool-specific stores.

## MCP integrations

The project config enables only the first-party OpenAI Developer Docs MCP server, non-required and read-oriented, so Codex can validate current Codex/OpenAI configuration behavior without embedding credentials.

Do not commit GitHub, Figma, Sentry, database, hosting, Stripe, Veeqo, QuickBooks, WooCommerce, or other authenticated MCP credentials. Configure authenticated integrations in the user/workspace layer and use environment-variable or OAuth-backed credential mechanisms. Project-scoped additions require explicit ownership, least privilege, approval behavior, and a documented operational need.

## Rules

`.codex/rules/default.rules` is intentionally conservative. It forbids a small set of destructive shell/database patterns and prompts for external publication/deployment-style actions. Rules supplement the sandbox; they do not replace repository authorization, code review, CI, or provider security.

## Hooks

No executable project hook is enabled initially. Codex hooks are powerful but project hooks are executable code requiring a trust review. Add a hook only when a deterministic repository-owned script has a concrete policy need, bounded inputs/outputs, cross-platform behavior, tests, and no secret exposure. Prefer rules for simple command-policy controls.

## Validation expectations

Never claim a command passed unless it was actually run. Use only checks that exist in the checked-out source. Inspect the final diff for scope creep, secrets, generated output, ownership violations, and accidental identifier changes.
