# Article-Derived Principles Applied to DTB

The 2026 reference set reviewed for the AI workspace contributed these model-neutral techniques:

## Context engineering

- Treat files, memory, tools, retrieval, examples and task state as part of the model environment.
- Separate permanent rules from transient task state.
- Prefer progressive disclosure and targeted context over giant standing prompts.
- Keep evidence higher-precedence than stored summaries.

## Complete UX flows

- Design flows, not isolated screens.
- Include relevant loading, validation, failure, auth/provider challenge, cancellation, recovery and success states.
- Explain architecture with state/sequence diagrams when that improves shared understanding.
- Convert approved visual references into reusable design-system rules, not screenshot-specific implementation.

## Structured UI critique

Apply ordered specialist passes: accessibility; information hierarchy; commerce clarity; content; interaction/state completeness; responsive integrity.

## React engineering

Use focused reusable components, intentional local/shared state, explicit async states and measured optimization. Avoid reflexive memoization and duplicated server truth.

## Responsive CSS

Prefer intrinsic relationships (`clamp`, `minmax`, auto-fit/auto-fill, container queries, aspect ratio, dynamic viewport units, logical properties, responsive media and user-preference queries) over breakpoint/override accumulation.

## Architecture decisions

Treat architecture as placement of work among browser/server/build-time/authoritative systems. State what, why, trade-offs and rejected alternatives. Do not adopt BFFs, micro-frontends, SSR/RSC, islands or edge execution without an evidenced DTB need.

## Lean AI systems

Before creating behavior ask: does it need to exist, does it already exist, does the browser/platform/provider already own it, and can the solution be simpler? Use specialists when isolation/independent review materially helps; avoid agent multiplication for work with no parallel benefit.

## External skill safety

Third-party AI skills/agents/plugins can contain executable behavior or prompt injection. Inspect source, permissions, dependencies, network/filesystem access and instructions before use; prefer extracting useful technique into DTB-owned knowledge.

## Reasoning portability

Do not require private chain-of-thought disclosure. Require auditable artifacts instead: evidence, calculations, assumptions, decision criteria, alternatives, concise rationale and verification.
