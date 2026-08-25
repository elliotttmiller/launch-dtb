---
name: dtb-responsive-ui-engineering
description: Intrinsic, fluid and accessible responsive engineering for DTB interfaces across continuous available widths and adversarial content.
---
# DTB Responsive UI Engineering

## Mental model
Responsiveness is constraint management, not three screenshots. Diagnose the full chain before patching:

```text
viewport/container -> page frame -> layout primitive -> component allocation -> content intrinsic size -> feature styles/state
```

Identify whether failure comes from parent constraints, min/max-content, fixed dimensions, flex/grid allocation, media geometry, safe areas, content density, state changes, or specificity/cascade conflicts.

## Preferred tools
Use intrinsic flex/grid, wrapping, `min-width: 0`, `minmax()`, `auto-fit/auto-fill`, bounded fluid `clamp()/min()/max()`, container queries for reusable components, `aspect-ratio` for media reservation, logical properties, responsive images, and `dvh/svh/lvh` plus safe areas when viewport geometry requires them. Start from the simplest base composition and add structural breakpoints only where content actually needs them.

Do not stack emergency override files or escalating specificity. Remove/narrow obsolete rules. Do not duplicate React trees solely for desktop/mobile presentation or use resize JavaScript for layout CSS can express.

## Robustness criteria
Validate immediately below/above structural transitions and at representative narrow/intermediate/wide widths. Test long names/prices/labels, empty/loading/error/selected states, dynamic controls, image aspect extremes, 200% zoom/text expansion, keyboard focus, coarse pointer/touch targets, reduced motion, safe areas, and horizontal overflow.

Responsive success means hierarchy and task completion remain intact, not merely that elements fit. When rendering tools are unavailable, state the exact widths/states not visually verified.