# UI Experience Design Workflow

Use for material customer-facing design/redesign. `ui-design`/`redesign` intents load design-system, responsive, and UX-flow methods; `ui-critique` remains an explicit review concern rather than automatic writer context.

## Understand before styling
Identify user goal, entry/exit, authoritative systems, active components/tokens, content/data constraints, current states, and responsive composition. Preserve commerce/provider ownership and product truth.

## Model required states
Define relevant happy, alternate, loading/pending, empty, validation, auth/session-expired, server/provider failure, cancellation/back, retry/recovery, duplicate-submission, and terminal-success states. Each state needs an owner and real transition trigger; UI must not imply unconfirmed server/payment/order state.

## Design systemically
Reuse existing primitives/tokens first. Establish hierarchy, density, component responsibilities, state semantics, and responsive behavior. Prefer one semantic composition with intrinsic layout. New primitives/tokens require repeated semantic purpose rather than screenshot-specific pixel matching.

## Responsive/accessibility
Define behavior across narrow/intermediate/wide widths, keyboard/focus, touch/coarse pointer, reduced motion, text expansion/zoom, long/dynamic content, safe areas, and overflow as relevant.

## Critique and verify
Run independent critique when requested/appropriate in order: accessibility -> information hierarchy -> commerce clarity -> content -> state completeness -> responsive integrity. Verify with rendering/interactions when capability exists and clearly identify what was not rendered.
