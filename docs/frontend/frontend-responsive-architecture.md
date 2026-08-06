# Frontend Responsive Architecture

## Ownership

`frontend/` owns customer-facing routing, rendering, responsive layout, accessibility, interaction state, design primitives, and API presentation. It does not own authoritative commerce state, pricing, inventory, orders, payments, refunds, tax, shipping, or fulfillment.

## Rendering hierarchy

The storefront uses this layout hierarchy:

```text
viewport
  -> #root application shell
    -> fixed storefront header
    -> main.main-content
      -> route page frame
        -> constrained container
          -> layout primitive
            -> domain component
    -> footer
    -> overlays and drawers
```

Each layer has one responsibility. The application shell owns document flow and the fixed-header offset. Page frames own route surfaces. Containers own readable widths and viewport gutters. Layout primitives own composition. Domain components own their internal presentation.

## Canonical files

- `frontend/src/styles/storefront-tokens.css`: brand, semantic, spacing, typography, content-width, motion, safe-area, and layer tokens.
- `frontend/src/styles/responsive-foundation.css`: document normalization, intrinsic media behavior, accessibility, app sizing, and reusable layout primitives.
- `frontend/src/styles/storefront-shell.css`: header offset, main flow, surfaces, and shared shell motion.
- `frontend/src/styles/unified-responsive.css`: the only global cross-route responsive authority. It owns viewport geometry, responsive stacking, touch density, safe areas, overflow containment, and domain breakpoint behavior.
- `frontend/src/styles/storefront-visibility.css`: stable storefront visibility decisions that are not responsive layout rules.
- `frontend/src/components/layout/LayoutPrimitives.jsx`: React composition API for page frames, containers, sections, stacks, clusters, grids, split layouts, and sidebars.

## Cascade contract

`frontend/src/main.jsx` loads styles in this order:

1. utilities and document base;
2. design tokens and responsive foundation;
3. feature/component base styles;
4. typography authorities;
5. `unified-responsive.css` as the final and exclusive responsive layer.

Do not add another global mobile, tablet, desktop, fix, patch, mockup, polish, cleanup, or final-authority stylesheet. Add stable base appearance to the owning feature stylesheet. Add cross-route viewport behavior to the correct section of `unified-responsive.css`.

## Layout contracts

### Containers

Use `Container` or `.dtb-container` instead of recreating page padding and `max-width` declarations. Supported sizes are `narrow`, `default`, `wide`, `full`, and `fluid`.

### Vertical composition

Use `Section` for route sections and `Stack` for vertical rhythm. Spacing should come from `--dtb-space-*` tokens, not unrelated page-specific values.

### Inline composition

Use `Cluster` for wrapping actions, metadata, filters, badges, and button groups. Controls must wrap without forcing viewport overflow.

### Repeating content

Use `AutoGrid` for product cards, package cards, feature groups, and other repeating content. The grid is intrinsic and uses `auto-fit` with a content minimum rather than a device-specific column matrix.

### Two-column composition

Use `SplitLayout` for product-detail and checkout-style primary/secondary layouts. Use `SidebarLayout` for filters and navigation. Both collapse to one intrinsic column when their content no longer fits.

### Component responsiveness

Reusable components should respond to their allocated width. Apply `dtb-component-region` to establish an inline-size container, then use container queries for internal changes. Viewport media queries remain appropriate for application-shell and route-level composition.

## Responsive invariants

1. Flex and grid children containing dynamic content use `min-width: 0`.
2. Media is intrinsically constrained and reserves an intentional aspect ratio where layout stability matters.
3. Horizontal scrolling exists only inside explicit rails, selectors, drawers, or data regions.
4. Root overflow containment is defensive only; components must still constrain their own width and dynamic content.
5. Page gutters and maximum widths come from shared tokens and containers.
6. Forms preserve a minimum 16px mobile text size without broad descendant `!important` rules.
7. Hover treatment is enabled only for devices that support hover and fine pointing.
8. Reduced-motion preferences remove nonessential transitions and animation.
9. Mobile and desktop use the same semantic component and domain state unless the interaction model is materially different.
10. Feature styles may refine a component but must not redefine the global viewport, root, body, or application shell.
11. Checkout rules are presentation-only and never alter WooCommerce, payment-provider, order, pricing, inventory, tax, shipping, or session ownership.
12. Schematic responsive rules must preserve image bounds and hotspot coordinate ownership.

## Domain sections in the unified authority

`unified-responsive.css` is organized by stable domain boundaries:

- document and shared route containers;
- header, drawers, overlays, and safe areas;
- catalog listing, product grid, and filters;
- product-detail shell and related products;
- cart and checkout presentation boundaries;
- account dashboard;
- repairs, returns, support, and tracking;
- schematics;
- tablet, mobile, narrow-mobile, coarse-pointer, and reduced-motion adaptations.

Selectors must be scoped to stable route or component classes. Avoid DOM-position selectors, wildcard class matching, and broad universal descendant overrides.

## CSS rules

Do not add:

- files named or described as fixes, patches, mockups, polish, cleanup, overrides, or final authority;
- wildcard class selectors such as `[class*="drawer"]`;
- universal descendant overrides such as `.component *` for sizing;
- `transition: all`;
- arbitrary `z-index` escalation;
- fixed content heights for dynamic text;
- negative margins for primary page layout;
- desktop/mobile duplicate React trees for presentation-only differences;
- page-specific rules in `index.css`;
- additional root overflow suppression;
- responsive behavior in runtime JavaScript when CSS can express the same layout.

## Change workflow

When changing responsive UI:

1. Identify the owning component and its feature stylesheet.
2. Keep base appearance in the feature stylesheet.
3. Use shared tokens and layout primitives for new composition.
4. Place only cross-route viewport behavior in `unified-responsive.css`.
5. Preserve accessibility, safe-area, reduced-motion, checkout ownership, schematic coordinates, and dynamic-content overflow behavior.
6. Remove superseded selectors instead of adding a later override.
7. Update this document when the cascade, ownership, or domain boundaries change.
