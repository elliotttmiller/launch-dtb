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
- `frontend/src/styles/responsive-foundation.css`: document normalization, intrinsic media behavior, accessibility, app sizing, and layout primitives.
- `frontend/src/styles/storefront-shell.css`: header offset, main flow, surfaces, and shared shell motion.
- `frontend/src/components/layout/LayoutPrimitives.jsx`: React composition API for page frames, containers, sections, stacks, clusters, grids, split layouts, and sidebars.
- `frontend/src/styles/mobile-fluid-viewport-authority.css`: bounded compatibility rules for existing components that have not yet migrated. It is not a document-level authority.

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
3. Horizontal scrolling exists only inside explicit rails or data regions.
4. The document must not hide layout defects with global `overflow-x: hidden` or `overflow-x: clip`.
5. Page gutters and maximum widths come from shared tokens and containers.
6. Forms preserve a minimum 16px mobile text size without globally applying `!important`.
7. Hover treatment is enabled only for devices that support hover and fine pointing.
8. Reduced-motion preferences remove nonessential transitions and animation.
9. Mobile and desktop use the same semantic component and domain state unless the interaction model is materially different.
10. Feature styles may refine a component but must not redefine the global viewport, root, body, or application shell.

## CSS ownership

Global entry styles contain only Tailwind setup, base document rules, and document-level workflow UI. Feature styles remain with their owning feature or component. Avoid “final authority,” “fixes,” and viewport-wide override files; migrate those rules into the component that owns the markup.

Do not add:

- wildcard class selectors such as `[class*="drawer"]`;
- universal descendant overrides such as `.component *` for sizing;
- `transition: all`;
- arbitrary `z-index` escalation;
- fixed content heights for dynamic text;
- negative margins for primary page layout;
- desktop/mobile duplicate React trees for presentation-only differences;
- page-specific rules in `index.css`;
- additional global overflow suppression.

## Migration direction

Existing routes may continue using `.page-wrapper` while they are migrated. New or substantially edited route UI should compose `PageFrame`, `Container`, and the appropriate layout primitive. Existing mobile compatibility rules should shrink as their owning components adopt intrinsic layouts and container queries.

The migration order is shell and tokens, shared primitives, shared components, catalog, product detail, cart and checkout, account, repairs and returns, schematics, then remaining informational routes. This ordering follows dependency ownership rather than visual page order.
