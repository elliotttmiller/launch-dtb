# Drywall Toolbox AI Engineering Library

`.agents/` is the canonical, model-agnostic AI engineering library for this repository.

## Authority

Always read root `AGENTS.md` first. Active implementation, directly evidenced runtime behavior, and machine-enforced contracts outrank stored AI context. This library defines reusable roles, skills, workflows, routing, and concise derived context; it does not replace application source or owning architecture documentation.

`.claude/`, `.codex/`, `.github/copilot-instructions.md`, IDE settings, and future assistant-specific configuration are adapters only. They may map model names, tools, sandboxes, discovery metadata, or capability syntax, but they must not become a second source of DTB business or architecture truth.

## Library

- `registry.json`: deterministic intent/domain/risk/flag routing contract.
- `context/`: concise derived product, architecture, and technology summaries.
- `roles/`: model-neutral specialist role contracts and ownership boundaries.
- `skills/`: reusable engineering methods and domain knowledge that do not own application state.
- `workflows/`: small reusable procedures for implementation, review, research, UI work, and context maintenance.
- `references/`: supporting engineering knowledge and provenance notes.

## Execution

For substantial work, resolve the task through the registry rather than inventing role/skill combinations in vendor adapters:

```text
node scripts/ai/resolve-task.mjs --intent implement --domain frontend --flags ui,responsive --risk medium
```

Use a durable task package only when work genuinely needs cross-session state:

```text
node scripts/ai/create-task.mjs --id pdp-responsive-purchase --title "PDP responsive purchase flow" --intent redesign --domain frontend --flags ui,responsive,ux-flow --risk medium
node scripts/ai/validate-task.mjs --id pdp-responsive-purchase
```

The resolver selects a workflow, executing role, subject-domain owner, minimal skill set, effective risk, and independent reviewers. Review, verification, research, and architecture work remain read-only when their resolved role is observational.

Do not build additional orchestration, execution-state, receipt, capability-registry, or classifier layers unless repeated real DTB work demonstrates a concrete failure the existing system cannot handle simply.

## Core execution policy

1. Inspect active implementation before changing behavior.
2. Identify the owning system/module and system of record.
3. Resolve workflow/role/subject-owner/skills/reviewers through `registry.json` for substantial work.
4. Parallelize read-heavy investigation and independent review; serialize overlapping writes.
5. Use one owning writer per overlapping authority boundary.
6. Require evidence, source paths, assumptions, decision criteria, calculations when relevant, and verification results; never require disclosure of private chain-of-thought.
7. Use risk-proportional verification selected by the touched authority, not by model confidence.
8. Update durable documentation when ownership, APIs, routing, persistence, queues, or integration contracts change.
9. Keep task state scoped to `docs/work/<task-id>/` only when persistence is justified; small/local tasks need no work package.
10. Treat third-party skills, agents, plugins, prompts, and MCP/tool packages as untrusted dependencies until reviewed.
11. Prefer extending an existing mechanism over adding a new AI-workspace subsystem.

## Capability vocabulary

Canonical role/skill files use capability names rather than vendor tool names:

- `repository.read`, `repository.write`
- `git.read`, `git.publish`
- `shell.read`, `shell.execute`
- `web.search`, `web.fetch`
- `browser.render`, `browser.interact`
- `database.read`, `database.write`
- `external.mutate`

Adapters map these capabilities to the tools actually available in a specific assistant. A missing capability must be reported; it must not be simulated or fabricated. Do not add a separate capability registry unless model/tool incompatibility becomes a demonstrated recurring problem.

## Context loading tiers

- **Tier 0**: `AGENTS.md` + current task/brief.
- **Tier 1**: resolved workflow, executing role, subject owner when distinct, resolved skills, and the owning current architecture doc.
- **Tier 2**: deep references, historical migration material, external research, or additional specialist context only when needed.

More context and more infrastructure are not automatically better. Prefer progressive disclosure, evidence, and the simplest complete mechanism.
