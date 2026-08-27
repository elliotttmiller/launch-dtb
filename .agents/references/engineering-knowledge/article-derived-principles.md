# Reviewed Engineering Principles Applied to DTB

This reference records model-neutral techniques retained from reviewed external engineering/context material. It does not establish architecture or routing.

## Context engineering

- Treat instructions, files, retrieval, tools, examples, and task state as one information environment.
- Separate permanent policy from task-specific evidence/state.
- Prefer progressive disclosure and just-in-time retrieval over giant standing prompts.
- Reuse established evidence before repeating retrieval.
- Stop expanding context once authoritative evidence is sufficient for the decision.
- Keep primary evidence higher authority than derived summaries.
- Isolate independent reviewer context from irrelevant writer history.
- Measure context growth without treating shortest-context as the objective.

## Complete UI/UX flows

- Design workflows rather than isolated screenshots.
- Include material loading, validation, failure, auth/provider challenge, cancellation, recovery, duplicate-submission, and success states.
- Convert approved visual direction into reusable design-system/component/responsive rules rather than screenshot-specific CSS.

## Structured UI critique

Apply specialist critique by relevant dimensions: accessibility, hierarchy, commerce clarity, content truth, interaction/state completeness, and responsive integrity. Critique is a review concern and need not be loaded into every UI writer context.

## React engineering

Use focused components, explicit local/server-state ownership, complete async states, cancellation/race handling, and measured optimization. Avoid duplicated server truth and reflexive abstractions/memoization.

## Responsive engineering

Prefer intrinsic relationships, fluid constraints, container-aware components, responsive media, logical properties, safe-area/dynamic viewport support, and user-preference queries over breakpoint/override accumulation.

## Architecture decisions

Distinguish implementation inside an existing contract from changing ownership/API/persistence/event/provider/runtime contracts. State the demonstrated constraint, authority, identities, failure semantics, trade-offs, and credible rejected alternatives. Do not adopt new services/BFFs/micro-frontends/rendering modes/edge execution without an evidenced DTB need.

## Lean AI engineering

Before adding AI infrastructure ask whether the mechanism already exists, whether strengthening canonical knowledge is sufficient, and whether the proposed subsystem solves a recurring demonstrated failure. Avoid model-specific doctrine, model comparison tests/scorecards, LLM-based routing when deterministic routing works, permanent orchestrator bureaucracy, and duplicate capability registries.

## External skill safety

Treat third-party AI skills/agents/plugins/MCP packages as untrusted dependencies. Inspect source, permissions, instructions, dependencies, filesystem/network access, credential needs, mutation capability, update mechanism, and side effects before use. Prefer extracting durable useful technique into DTB-owned canonical knowledge.

## Auditable reasoning artifacts

Do not require private chain-of-thought. Require source evidence, assumptions, calculations where relevant, decision criteria, concise rationale, materially credible alternatives, and verification.
