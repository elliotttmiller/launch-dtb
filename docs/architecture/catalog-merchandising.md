# Catalog merchandising architecture

## Purpose

Drywall Toolbox uses a contractor-intent merchandising layer to improve product discovery without creating a second catalog taxonomy, compatibility source, product store, pricing source, inventory source, or bundle authority.

The merchandising layer answers presentation questions such as:

- what job is the contractor trying to perform;
- what tool family should they inspect next;
- what type of system or set fits the buying intent;
- which authoritative product details should the contractor review for a high-consideration purchase.

It does not redefine canonical catalog identity.

## Authority

The existing ownership model remains unchanged:

- `products/` owns canonical catalog source material, taxonomy, compatibility, brands, identifiers, and enrichment inputs.
- WooCommerce owns runtime products, variations, prices, and commerce persistence.
- Veeqo owns inventory, allocation, fulfillment, shipping, and tracking truth.
- `dtb-catalog-platform` owns DTB catalog-domain normalization, compatibility, catalog APIs, and catalog projections.
- `frontend/` owns customer-facing merchandising composition and interaction state only.

Merchandising metadata must never become the authority for SKU, MPN, GTIN, category identity, compatibility, product composition, pricing, availability, or warranty truth.

## Frontend composition

Dedicated category routes retain the existing composition:

```text
CategoryHero
  -> CategoryMerchandising (only when an explicit presentation profile exists)
  -> ShopByToolType (authoritative WooCommerce child categories)
  -> existing search / filters / sorting
  -> existing product grid
```

`frontend/src/data/categoryMerchandising.js` contains bounded presentation metadata for contractor intent. It may define labels, explanations, buying-guide copy, and candidate category slugs used to resolve links against category metadata already supplied by the catalog.

Where a contractor-intent card resolves to an authoritative child category with a routable slug, navigation uses the existing category URL builder. If no authoritative child category is present, the card remains informational rather than inventing a category, synthesizing a route, or changing catalog filtering.

## Tool-set merchandising

Tool Sets are treated as a high-consideration buying context, not as a separate product authority. The storefront may explain purchasing intents such as complete automatic systems, taping sets, flat-finishing sets, corner-finishing sets, starter systems, and production systems.

These intent cards are informational unless they resolve to an authoritative category route. They do not implement product comparison, synthetic filters, inferred set membership, or frontend-owned bundle composition.

Actual set contents, current price, availability, savings, warranty, and compatibility must come from authoritative product/catalog data before those facts are rendered as product-specific claims. Contractors are directed to the live catalog and product details for those commerce facts.

## Repair merchandising relationship

Repair marketing is presentation-only. `frontend/src/pages/RepairLanding.jsx` explains existing repair capabilities and links into the existing repair package, intake, and tracking routes.

The repair landing page must not introduce service states, turnaround promises, approval semantics, warranty decisions, shipping truth, or pricing that the `dtb-repair-service` domain cannot produce or enforce.

Repair-specific visual refinements used by `RepairLanding.jsx` are loaded after the base repair stylesheet and before responsive overrides so accessibility/contrast fixes participate in the active cascade without changing repair-domain behavior.

## Accessibility and performance

Contractor-intent navigation must preserve semantic links and headings, visible keyboard focus, mobile-first layouts, reduced-motion behavior, and non-hover access to information.

The merchandising layer must not introduce per-card network requests. Category intent renders from data already available to the route. Any future compatibility or availability enhancement must batch or reuse existing catalog contracts rather than creating N+1 fetch patterns.
