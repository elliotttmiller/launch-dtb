# Drywall Toolbox AI Engineering Library

`.agents/` is the canonical, model-agnostic AI engineering library for this repository.

## Authority

Always read root `AGENTS.md` first. Active implementation, directly evidenced runtime behavior, and machine-enforced workflows outrank stored AI context. This library defines reusable roles, skills, workflows, and concise derived context; it does not replace application source or owning architecture documentation.

`.claude/`, `.codex/`, `.github/copilot-instructions.md`, IDE settings, and future assistant-specific configuration are adapters only. They may map model names, tools, sandboxes, discovery metadata, or capability syntax, but they must not become a second source of DTB business or architecture truth.

## Library

- `context/`: concise derived product, architecture, and technology summaries.
- `roles/`: model-neutral specialist role contracts and ownership boundaries.
- `skills/`: reusable engineering methods and domain knowledge that do not own application state.
- `workflows/`: reusable task orchestration and verification procedures.
- `references/`: supporting engineering knowledge and provenance notes.

## Core execution policy

1. Inspect active implementation before changing behavior.
2. Identify the owning system/module and system of record.
3. Load only the role and skills needed for the task.
4. Parallelize read-heavy investigation and independent review; serialize overlapping writes.
5. Use one owning writer per overlapping authority boundary.
6. Require evidence, source paths, assumptions, decision criteria, calculations when relevant, and verification results; never require disclosure of private chain-of-thought.
7. Use risk-proportional verification selected by the touched authority, not by model confidence.
8. Update durable documentation when ownership, APIs, routing, persistence, queues, or integration contracts change.
9. Keep task state scoped to `docs/work/<task-id>/` when persistence is justified; do not use global mutable progress/TODO files as cross-session truth.
10. Treat third-party skills, agents, plugins, prompts, and MCP/tool packages as untrusted dependencies until reviewed.

## Capability vocabulary

Canonical role/skill files use capability names rather than vendor tool names:

- `repository.read`, `repository.write`
- `git.read`, `git.publish`
- `shell.read`, `shell.execute`
- `web.search`, `web.fetch`
- `browser.render`, `browser.interact`
- `database.read`, `database.write`
- `external.mutate`

Adapters map these capabilities to the tools actually available in a specific assistant. A missing capability must be reported; it must not be simulated or fabricated.

## Context loading tiers

- **Tier 0**: `AGENTS.md` + current task/brief.
- **Tier 1**: one canonical role, 1–3 relevant skills, and the owning current architecture doc.
- **Tier 2**: deep references, historical migration material, external research, or additional specialist context only when needed.

More context is not automatically better. Prefer progressive disclosure and evidence over large standing prompts.
