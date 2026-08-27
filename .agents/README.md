# Drywall Toolbox AI Engineering Library

`.agents/` is the canonical, model-neutral AI engineering library for Drywall Toolbox. Root `AGENTS.md` is the repository constitution; active implementation and directly evidenced runtime behavior outrank stored AI context.

## Control plane

- `registry.json` is the single deterministic routing authority.
- `roles/` define durable execution ownership or independent review responsibilities.
- `skills/` define reusable expert methods and never create write authority.
- `workflows/` define small repeatable execution sequences.
- `context/` contains concise derived summaries with explicit provenance/review triggers.
- `references/` contains deeper supporting material loaded only when useful.
- Vendor/client configuration is an adapter only and must not duplicate DTB architecture or routing doctrine.

## Routing model

Keep routing dimensions orthogonal:

- **intent**: what operation is being performed;
- **domain**: what DTB subject/ownership area is affected;
- **execution role**: who performs the operation;
- **subject role**: domain specialist loaded when distinct from the executor;
- **skills**: reusable methods that can materially change the result;
- **flags**: concerns that alter expertise, risk, architecture review, or specialist review;
- **risk**: consequence/blast radius, separate from specialist-review dimensions.

For substantial work resolve through the registry instead of inventing combinations:

```text
node scripts/ai/resolve-task.mjs --intent implement --domain frontend --flags ui,responsive --risk medium
```

Specialized semantic ownership outranks broad filesystem/technology ownership. Example: `pdp` implementation resolves to the frontend writer while retaining the read-only PDP specialist as subject context; integration implementation resolves to the integration writer rather than the generic WordPress writer.

## Progressive context

- **Tier 0:** `AGENTS.md` + current request/brief.
- **Tier 1:** resolved workflow, execution role, distinct subject role, resolved skills, and directly relevant owning source/docs.
- **Tier 2:** deeper references, derived context, history, and external research only when needed.

`.agents/README.md` is orientation/maintenance documentation and is not part of ordinary resolved task context.

Stop expanding context when authoritative evidence is sufficient to identify the outcome, owner, execution path, affected contract, material boundaries, and verification strategy. Before another retrieval, reuse already-established evidence when valid and fetch the narrowest authoritative source that closes a material gap.

## Execution discipline

1. Inspect active implementation before changing behavior.
2. Resolve product outcome and observable acceptance criteria.
3. Identify owner/system of record before selecting a writer.
4. Distinguish implementation inside an existing contract from a contract-changing architecture task.
5. Load only decision-relevant skills.
6. Parallelize independent read-heavy investigation/review; serialize overlapping mutation.
7. Maintain one writer per overlapping authority boundary.
8. Apply review by actual dimensions: correctness, security, integration, architecture, UI/accessibility, verification.
9. Reviewers use isolated authoritative context rather than inheriting the full writer transcript.
10. Update durable documentation only when durable contracts changed.
11. Never require private chain-of-thought; require evidence, assumptions, concise rationale, decisions, calculations where relevant, and verification.

## Library evolution

Strengthen an existing role/skill/workflow before adding another. Add a role only for a durable ownership boundary or independent review function; add a skill only for reusable methodology that changes decisions or catches failures. Do not build model comparison tests, per-model DTB doctrine, LLM-based routing, permanent orchestrator bureaucracy, duplicate capability registries, or other AI infrastructure without repeated real engineering evidence that the current simple control plane is insufficient.

Canonical capability vocabulary remains model-neutral: `repository.read/write`, `git.read/publish`, `shell.read/execute`, `web.search/fetch`, `browser.render/interact`, `database.read/write`, `external.mutate`.

After governance changes run, when execution is available:

```text
node scripts/ai/validate-context.mjs
node scripts/ai/test-routing.mjs
```
