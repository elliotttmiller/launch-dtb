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

