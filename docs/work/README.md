# Scoped Engineering Work Context

Use this directory only for substantial work that benefits from durable cross-session state. Small/local tasks do not need a work package.

Preferred structure:

```text
docs/work/<task-id>-<slug>/
  brief.md
  evidence.md
  decisions.md
  status.md
  verification.md
```

- `brief.md`: objective, acceptance criteria, non-goals, owner and scope.
- `evidence.md`: source paths/symbols, runtime/external evidence and unresolved facts.
- `decisions.md`: chosen design, invariants, alternatives rejected and migration/recovery semantics.
- `status.md`: completed/in-progress/blockers only; never duplicate architecture contracts here.
- `verification.md`: checks run, outcomes, unverified runtime behavior and residual risk.

Work packages are task state, not architecture authority. When work completes, durable conclusions move to owning documentation and stale task state may be archived/removed according to repository policy.
