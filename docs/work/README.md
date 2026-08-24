# Scoped Engineering Work Context

Use this directory only for substantial work that benefits from durable cross-session state. Small/local tasks do not need a work package.

Preferred structure:

```text
docs/work/<task-id>/
  task.json
  brief.md
  evidence.md
  verification.md
```

- `task.json`: machine-readable task identity and routing result from `.agents/registry.json`.
- `brief.md`: objective, acceptance criteria, non-goals, scope, and material decisions.
- `evidence.md`: source paths/symbols, runtime/external evidence, and unresolved facts.
- `verification.md`: checks run, outcomes, unverified behavior, and residual risk.

Create and validate a durable task package with:

```text
node scripts/ai/create-task.mjs --id <task-id> --title "<title>" --intent <intent> --domain <domain> [--flags a,b] [--risk low|medium|high|critical]
node scripts/ai/validate-task.mjs --id <task-id>
```

Do not use work packages as another planning bureaucracy. If a task changes so materially that its routing/ownership no longer describes the work, create a new task package rather than layering a lifecycle/orchestration system onto the old one.

Work packages are temporary task context, not architecture authority. Durable conclusions belong in the owning documentation; stale completed task packages may be archived or removed when useful.
