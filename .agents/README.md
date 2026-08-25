# Drywall Toolbox AI Engineering Library

`.agents/` is the canonical, model-agnostic AI engineering library for this repository.

## Authority
Always read root `AGENTS.md` first. Active implementation, directly evidenced runtime behavior, and machine-enforced contracts outrank stored AI context. This library defines reusable roles, skills, workflows, routing, and concise derived context; it does not replace application source or owning architecture documentation.

`.claude/`, `.codex/`, `.github/copilot-instructions.md`, IDE settings, and future assistant-specific configuration are adapters only. They may map model names, tools, sandboxes, discovery metadata, or capability syntax, but they must not become a second source of DTB business or architecture truth.

## Library model
- `registry.json`: deterministic intent/domain/risk/flag routing contract.
- `roles/`: ownership or independent-review specialists. Roles answer **who is responsible and what standard applies**.
- `skills/`: reusable expert methods. Skills answer **how to perform the work well** and do not create write authority.
- `workflows/`: small repeatable sequences for implementation, architecture, review, UI work, research and context maintenance.
- `context/`: concise derived product/architecture/technology summaries; verify mutable facts in source.
- `references/`: supporting knowledge/provenance loaded only when useful.

## Execution
For substantial work resolve through the registry rather than inventing role/skill combinations:

```text
node scripts/ai/resolve-task.mjs --intent implement --domain frontend --flags ui,responsive --risk medium
```

Use a durable `docs/work/<task-id>/` package only when cross-session state is genuinely useful. Small/local work needs no task package.

## Expert behavior standard
Canonical roles and skills should be concise but substantive. They should provide domain-specific evidence methods, decision criteria, invariants/failure modes, verification expectations and output quality—not generic persona language. Add detail when it changes decisions or catches failures; do not add prose merely to sound sophisticated.

1. Inspect active implementation before changing behavior.
2. Identify owner/system of record and execution path.
3. Resolve workflow/role/skills/reviewers for substantial work.
4. Load only relevant context; retrieve deeper evidence on demand.
5. Parallelize independent read-heavy work and serialize overlapping writes.
6. Use one owning writer per overlapping authority boundary.
7. Require evidence, source paths, assumptions/calculations when relevant, concise rationale and verification; never require private chain-of-thought.
8. Apply risk-proportional security/integration/UI review and independent verification.
9. Update durable documentation only when architecture/contracts changed.
10. Treat third-party AI extensions as untrusted until reviewed.
11. Prefer strengthening an existing mechanism over adding a new AI-workspace subsystem.

## Capability vocabulary
Canonical files describe capabilities rather than vendor tool names: `repository.read/write`, `git.read/publish`, `shell.read/execute`, `web.search/fetch`, `browser.render/interact`, `database.read/write`, `external.mutate`. Adapters map these to available tools. Missing capabilities must be reported, not simulated. Do not build a separate capability registry unless recurring incompatibility proves it necessary.

## Progressive context
- **Tier 0:** `AGENTS.md` + current request/brief.
- **Tier 1:** resolved workflow, role, distinct subject owner, relevant skills and current owning docs/source.
- **Tier 2:** deep references, history and external research only when needed.

More context and infrastructure are not automatically better. Prefer evidence, progressive disclosure and the simplest complete mechanism.