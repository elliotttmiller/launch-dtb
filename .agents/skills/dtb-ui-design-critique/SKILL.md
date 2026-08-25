---
name: dtb-ui-design-critique
description: Evidence-based six-pass critique for DTB customer interfaces, emphasizing accessibility, hierarchy, commerce clarity, state completeness and responsive integrity.
---
# DTB UI Design Critique

Critique the actual implementation/render or clearly identified mockup. Do not use generic aesthetics as authority. Evaluate in this order so foundational failures are not hidden by polish:

1. **Accessibility** — semantics, names/labels, contrast, keyboard/focus order/visibility, target sizing, color dependence, reduced motion, zoom/text expansion.
2. **Information hierarchy** — first scan, grouping, density, whitespace, type scale, product identity, primary/secondary/destructive action priority.
3. **Commerce clarity** — verified product/variation, price/availability, quantity, totals, shipping context, payment options, trust/recovery information and validation.
4. **Content** — concise contractor-oriented labels/instructions/errors, terminology consistency, action specificity, no fabricated claims.
5. **Interaction/state completeness** — default/hover/focus/pressed/disabled/loading/empty/error/pending/success/cancel/retry and any feature-specific state.
6. **Responsive integrity** — intrinsic behavior, intermediate widths, long/dynamic content, media geometry, safe areas, touch/coarse pointer, horizontal overflow, and absence of duplicated device-only trees.

## Finding standard
Tie each issue to a user task or failure: what is hard to perceive, understand, operate, trust, recover from, or complete. Distinguish correctness/accessibility blockers from conversion/usability improvements and visual preference. Do not prescribe a redesign when a small token/layout/content correction solves the issue.

Use the existing DTB design system. Return prioritized findings, evidence/affected component, user impact, recommended correction boundary, and acceptance criteria.