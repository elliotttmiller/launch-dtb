---
name: dtb-responsive-ui-engineering
description: Intrinsic, fluid, accessible responsive engineering for DTB React surfaces across continuous available widths.
---
# DTB Responsive UI Engineering

Treat responsiveness as a constraint problem, not three device screenshots.

Trace viewport/container -> page frame -> layout primitive -> domain component -> feature CSS before editing. Diagnose parent width, min-content/max-content, composition, component allocation, viewport geometry, content density or state-dependent failures.

Prefer:

- base mobile composition with progressive `min-width` structural changes;
- intrinsic grid/flex (`minmax`, `auto-fit/auto-fill`, wrapping, `min-width: 0`);
- `clamp()`/`min()`/`max()` for bounded fluid values;
- container queries for reusable component allocation;
- `aspect-ratio` to reserve media space;
- `dvh`/`svh`/`lvh` and safe-area handling for mobile geometry;
- logical properties where direction-aware layout matters;
- real responsive image behavior through the existing media pipeline;
- preference queries for reduced motion/contrast/color behavior when supported.

Do not stack override files or specificity as a debugging strategy. Remove/narrow obsolete conflicting rules. Do not duplicate React trees for presentation-only differences or move CSS-expressible layout into resize JavaScript.

Validate continuous widths, immediately around structural transitions, 200% zoom/text expansion, long realistic content, loading/error/empty/selected states, keyboard/focus, coarse pointer, reduced motion and safe areas.
