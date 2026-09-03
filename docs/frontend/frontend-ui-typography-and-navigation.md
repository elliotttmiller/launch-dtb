# Frontend Typography and Navigation Contract

Last verified against active source: 2026-09-03.

## Typography ownership

The React storefront uses two customer-facing type roles:

- Geist is the display face for semantic headings (`h1` through `h6`), elements with `role="heading"`, title/heading/headline/eyebrow/kicker component classes, and primary desktop navigation tabs.
- Nunito is the body and UI face for descriptions, supporting copy, form fields, controls, prices, totals, SKUs, and other commerce detail.

`frontend/src/styles/global-typography.css` is the final cascade authority. It defines `--dtb-font-display` and `--dtb-font-body`, retains legacy body aliases for compatibility, and is imported last by `frontend/src/main.jsx`. New title-like non-heading elements must use an existing title/eyebrow/kicker class convention or the explicit `dtb-title-eyebrow` utility. Supporting copy must not opt into the display font.

Both font families are requested together in `frontend/index.html`. Static server error pages use the same hierarchy through `frontend/error-page.html` and `frontend/public/errors/error.css`.

## Repair package category navigation

`frontend/src/pages/RepairPackages.jsx` owns category state, URL synchronization, focus movement, and active-indicator measurement. `frontend/src/styles/repair-packages.css` owns the sticky horizontal rail and visual states.

The interaction combines a measured sliding active surface with a dark feature-tab rail. Arrow Left/Right wraps between categories; Home and End select the first and last categories. The active tab remains the only tab in the sequential tab order, and the active panel is labelled by that tab. Narrow viewports keep the rail horizontally scrollable instead of compressing or truncating the category set.

## Desktop primary navigation animation

`frontend/src/components/storefront/StorefrontDesktopNavigation.jsx` owns the desktop mega-menu interaction lifecycle and timing. `frontend/src/styles/storefront-desktop-navigation.css` remains the visual styling authority for the tabs, sheet surface, cards, and content primitives.

The five desktop dropdowns (`products`, `brands`, `parts`, `repairs`, and `schematics`) behave as one persistent viewport-centered mega-menu surface. Moving between dropdown tabs does not destroy and recreate the outer sheet. The shell remains mounted and stable while only the inner renderer changes, preventing the flash caused by independent dropdown surfaces becoming visible and hidden in the same interaction.

Pointer interaction uses explicit hover intent. Opening a closed mega menu waits briefly before committing so incidental pointer travel does not flash a sheet. Switching between dropdown tabs while the sheet is already engaged uses a shorter intent delay. Leaving the combined navigation/sheet interaction region uses a longer forgiving close delay that is cancelled when the pointer re-enters. Keyboard focus and explicit click/toggle interactions do not inherit the pointer-intent delay.

Initial sheet opening uses a restrained opacity plus small translate/scale settle motion. Cross-tab transitions keep the outer shell stationary and fade/translate only the inner content. The shared shell uses one stable desktop width rather than resizing between Products, Brands, Parts, Repairs, and Schematics. This continuity is intentional and must not be replaced with per-tab mount/unmount animation or instantaneous visibility changes.

Primary desktop nav tabs use a single pseudo-element overlay interaction. The visible tab control is intentionally compact and centered inside the 98px header rather than stretching to the full header height: the standard desktop control is 44px tall with tight horizontal padding, an 8px radius, and overflow clipping. The surrounding dropdown wrapper remains full-height so pointer intent and the tab-to-sheet bridge keep their forgiving interaction area without making the visible overlay oversized. The `::before` overlay covers only this compact control surface, uses `rgba(166, 166, 166, 0.2)`, begins at `opacity: 0` and `scale(0)`, and expands from center to `opacity: 1` and `scale(1)` over 0.4 seconds. Hover, keyboard focus, the active route, and an open dropdown use the same expanded overlay state so there is only one tab-hover visual authority. Full-header-height overlays and the former centered bordered/shadowed pill animation must not be reintroduced.

All navigation motion is suppressed when `prefers-reduced-motion: reduce` is active. Interaction state and accessibility semantics remain functional without animation.

## Desktop mega-menu loading presentation

`frontend/src/components/storefront/StorefrontDesktopNavigation.jsx` owns the loading presentation for catalog-backed desktop dropdowns (`products`, `brands`, and `parts`). When those asynchronous collections have not produced renderable menu items yet, the normal hero remains visible and the content region renders a quiet structural skeleton with a small progress indicator instead of generic status copy.

Customer-facing mega-menu loading UI must not render phrases such as "temporarily unavailable", "still loading", retry instructions, or equivalent generic failure-like text. Loading remains exposed to assistive technology through `role="status"`, `aria-busy`, and an accessible status label without placing that label visually in the sheet.

The loader uses subtle motion only: a compact progress ring plus low-contrast skeleton pulsing. When `prefers-reduced-motion: reduce` is active, continuous loader animation is omitted while the loading structure and busy semantics remain intact.
