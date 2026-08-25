# UI Experience Design Workflow

Use for material customer-facing UI design/redesign. Do not design isolated screenshots when the feature represents a task or journey. Load `dtb-design-system`, `dtb-ux-flow-engineering`, `dtb-responsive-ui-engineering`, and `dtb-ui-design-critique` as relevant to the scope.

## Understand before styling
Identify the user goal, entry/exit points, authoritative systems, current components/tokens, content/data constraints, and existing responsive composition. Preserve commerce/provider ownership.

## Model required states
For stateful experiences define relevant happy, alternate, loading/pending, empty, validation, authentication/authorization, stale/session-expired, server/provider failure, cancellation/back, retry/recovery, duplicate-submission and terminal success states. Define ownership and transition trigger for each; UI state must not imply unconfirmed server/payment/order state.

## Design the system, not the screenshot
Use existing primitives/tokens first. Establish hierarchy, content density, component responsibilities, states and responsive behavior. Prefer one semantic composition with intrinsic layout. New primitives/tokens need a repeated semantic purpose, not merely pixel matching.

## Critique and refine
Run critique in order: accessibility -> information hierarchy -> commerce clarity -> content -> interaction/state completeness -> responsive integrity. Fix material foundational issues before polishing downstream layers.

## Verify
Where capabilities permit, check keyboard/focus, labels/semantics, reduced motion, touch/coarse pointer, long/dynamic content, loading/error states, zoom/text expansion, intermediate widths, safe areas and horizontal overflow. Clearly state what was not rendered/verified.

Exit when the user task is clear and recoverable across required states, visual language remains consistent, and responsive/accessibility behavior has observable acceptance criteria.