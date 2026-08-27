# Component and screen inventory

Use this inventory to keep Stitch exploration complete and consistent. It describes design coverage; active React components remain the implementation authority.

## Foundations

- Logo variants and clear space
- Color and semantic states
- Geist type scale and numeric styles
- Fluid spacing and containers
- Radius, border, elevation, and layer scale
- Icon sizing and product imagery rules
- Focus, reduced motion, forced colors, and safe areas

## Global shell

- Utility/header shell
- Desktop product/category navigation and mega menu
- Mobile header, hamburger, search dock, and navigation drawer
- Search autocomplete and result cards
- Account and cart triggers
- Footer navigation and policy context
- Skip link, page transition, and route loading fallback

## Core primitives

- Primary, Checkout Now, secondary, ghost, destructive, and icon buttons
- Input, textarea, select, checkbox, radio, quantity stepper, and slider
- Field help, validation, and error summary
- Breadcrumb, tabs, accordion, dropdown, tooltip, badge, and chip
- Card, section, divider, hero banner, and empty state
- Skeleton, spinner, inline progress, alert, toast, and confirmation
- Drawer, bottom sheet, dialog, backdrop, close affordance, and sticky action bar

## Catalog and product

- Home hero and quick links
- Category/brand tiles and trusted-brand rail
- Product grid and product card
- Search result product card
- Listing toolbar, result count, sort, filter panel, applied filters
- Product gallery and thumbnails
- Product title, brand, price, SKU/MPN, availability, variation selector
- Quantity, Add to Cart, Checkout Now, reviews, technical specifications
- Related products and compatible parts
- Quick-view/modal behavior

### Category hero media contract

Category hero presentation is owned by `frontend/src/components/catalog/CategoryHero.jsx` and `frontend/src/styles/category-hero.css`; category metadata and hero-image selection remain backend/catalog concerns. Every category route uses one unified bounded hero composition with restrained radius/elevation, left-side text hierarchy, a compact icon-plus-count treatment, and right-side category photography. The hero surface itself remains transparent so the page canvas and the authored hero-image background form one continuous visual background rather than introducing a separate painted card color.

Desktop category hero photography fills the right half of the bounded hero composition. The hero container owns the vertical geometry and the media viewport fills that height; both the outer hero surface and media viewport remain transparent. Images use `object-fit: cover` with centered positioning so they fill the slot without distortion or letterboxing. Category hero masters should be authored for a wide, shallow crop close to `3:1`, with approximately 8–10% crop-safe perimeter around important product geometry. Narrow layouts may use a taller viewport rather than forcing the desktop crop onto mobile.

Responsive image metadata should allow the browser to select an appropriate source from the backend-provided `srcset`; presentation code must not stretch the bitmap or rely on source-image dimensions to determine page layout.

### Category thumbnail media contract

Canonical category thumbnails live in `products/launch/media/categories/thumbnails/` and are generated deterministically by `scripts/catalog/generate-category-thumbnails.py` from canonical product media. Deployment may mirror the same filenames under `/wp-content/uploads/2026/categories/thumbnails/`; the frontend resolver owns that public URL mapping.

Category thumbnail files contain only isolated tool/category artwork on a transparent WebP background. They are tightly cropped with modest transparent safety padding and retain a source aspect ratio appropriate to the represented tool. A fixed 348x128 source canvas, baked white matte, component border, or presentation background must not be encoded into these assets.

Frontend category media containers own visible surface color, viewport dimensions, padding, responsive geometry, and `object-fit: contain` fitment. Shop by Tool Type cards use one unified compact white-card geometry, restrained border/elevation, fixed media viewport, strong two-line maximum label hierarchy, and muted product count. The same canonical thumbnail may therefore be reused by Shop by Tool Type cards and desktop category navigation without requiring surface-specific image variants.

## Schematics and parts

- Brand/tool selectors
- Exact part-number search
- Schematic list/loading/error/empty states
- Diagram viewer, toolbar, variant selector, zoom controls, hotspot, and part card
- Mobile full-height viewer and safe-area controls

## Commerce and account

- Cart sheet and cart page
- Cart item, quantity pending state, subtotal, and checkout action
- Native checkout presentation and return states
- Order confirmation and order tracking
- Login, register, password recovery, and protected-route feedback
- Account hub, order/repair/return/activity cards, addresses, and settings

## Service workflows

- Repair landing, scoped step navigation, intake form, packages, quote/approval, shipping, tracking, and status
- Return portal and return status
- Support/contact and support status
- FAQ, calculators, policies, shipping policy, and error pages

## Required state matrix

Every async or mutating component should account for:

| State | Design requirement |
|---|---|
| Initial | Clear default affordance and hierarchy |
| Hover | Fine-pointer enhancement only |
| Focus | Strong visible keyboard focus |
| Active | Immediate pressed response |
| Disabled | Reduced emphasis with reason/context where needed |
| Loading | Stable dimensions and accessible status |
| Empty | Explanation and one relevant next action |
| Error | Plain-language cause/recovery without lost input |
| Success | Confirmation adjacent to the initiating action |
