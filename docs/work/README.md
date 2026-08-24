# Scoped Engineering Work Context

Use this directory only for substantial work that benefits from durable cross-session state. Small/local tasks do not need a work package.

Preferred structure:

```text
docs/work/<task-id>/
  task.json
  brief.md
  evidence.md
  decisions.md
  status.md
  verification.md
```

- `task.json`: machine-readable task identity and routing result from `.agents/registry.json`.
- `brief.md`: objective, acceptance criteria, non-goals, owner and scope.
- `evidence.md`: source paths/symbols, runtime/external evidence and unresolved facts.
- `decisions.md`: chosen design, invariants, alternatives rejected and migration/recovery semantics.
- `status.md`: completed/in-progress/blockers only; never duplicate architecture contracts here.
- `verification.md`: checks run, outcomes, unverified runtime behavior and residual risk.

Create and validate durable task packages through the deterministic tooling:

```text
node scripts/ai/create-task.mjs --id <task-id> --title "<title>" --intent <intent> --domain <domain> [--flags a,b] [--risk low|medium|high|critical]
node scripts/ai/validate-task.mjs --id <task-id>
```

Do not hand-edit `task.json` to bypass routing. If task intent, domain, flags, or requested risk changes materially, regenerate/update routing through the canonical resolver and keep the manifest coherent.

Work packages are task state, not architecture authority. When work completes, durable conclusions move to owning documentation and stale task state may be archived/removed according to repository policy.
