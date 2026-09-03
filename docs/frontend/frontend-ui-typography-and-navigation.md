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

`frontend/src/styles/storefront-desktop-navigation.css` owns the desktop tab and mega-menu sheet transition. The dropdown sheet opens with the existing opacity/translate/scale motion without changing header geometry. Hover, keyboard focus, the current route, and an open mega menu expose the tab's active visual state.

All navigation motion is disabled when `prefers-reduced-motion: reduce` is active.

## Desktop mega-menu loading presentation

`frontend/src/components/storefront/StorefrontDesktopNavigation.jsx` owns the loading presentation for catalog-backed desktop dropdowns (`products`, `brands`, and `parts`). When those asynchronous collections have not produced renderable menu items yet, the normal hero remains visible and the content region renders a quiet structural skeleton with a small progress indicator instead of generic status copy.

Customer-facing mega-menu loading UI must not render phrases such as "temporarily unavailable", "still loading", retry instructions, or equivalent generic failure-like text. Loading remains exposed to assistive technology through `role="status"`, `aria-busy`, and an accessible status label without placing that label visually in the sheet.

The loader uses subtle motion only: a compact progress ring plus low-contrast skeleton pulsing. When `prefers-reduced-motion: reduce` is active, continuous loader animation is omitted while the loading structure and busy semantics remain intact.
