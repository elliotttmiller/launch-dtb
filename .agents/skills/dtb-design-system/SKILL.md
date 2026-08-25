---
name: dtb-design-system
description: DTB storefront design-system discipline for tokens, typography, components, motion, accessibility and contractor-focused commerce consistency.
---
# DTB Design System

## Principle
Treat active DTB tokens/components/styles as the existing language to strengthen, not raw material for a second design system. Inspect real source before proposing new primitives, colors, typography, spacing scales, breakpoints, shadows, radii, or motion.

## Design decisions
Prioritize contractor task clarity, product identity, purchase confidence, readable density, predictable interaction, and restrained visual hierarchy. Use semantic controls, visible focus, readable line lengths/type scales, consistent spacing, purposeful layering, and motion that communicates state without delaying task completion.

New tokens/components must solve a repeated semantic need, not merely reproduce one screenshot. Prefer extending a compatible primitive over creating parallel variants. Approved mockups should be reverse-engineered into reusable tokens, component responsibilities, states, responsive rules, and content behavior rather than screenshot-specific CSS.

## Commerce constraints
Product identity, variation, price, availability, quantity, totals, shipping context, payment options and validation must remain visually unambiguous where relevant. Payment/provider surfaces must remain authentic to the active provider contract; do not invent fake logos, trust badges, payment options, availability, ratings, or promotional claims.

## Accessibility and consistency
Color cannot be the only state signal. Preserve semantic hierarchy, accessible names, keyboard/focus behavior, adequate target sizing, reduced motion, and legibility under zoom/text expansion. Check whether a proposed visual change creates a one-off exception that will increase future CSS/component entropy.

For material responsive work also load `dtb-responsive-ui-engineering`; for complete stateful journeys load `dtb-ux-flow-engineering`; for structured critique load `dtb-ui-design-critique`.