# Catalog Pricing Manager

## Purpose

Catalog Pricing is the DTB wp-admin workspace for maintaining product pricing economics without creating a parallel commerce authority.

The initial implementation is intentionally small:

- view WooCommerce product and variation prices;
- view WooCommerce native Cost of Goods values;
- maintain a DTB MAP amount and short source label on the WooCommerce product record;
- calculate gross profit, gross margin, markup, and a deterministic target-margin price;
- review products below the configured target margin or MAP;
- apply explicitly selected regular-price changes through WooCommerce CRUD;
- maintain one default target gross-margin setting.

It does **not** scrape competitors, perform real-time market monitoring, dynamically reprice products, run supplier-authenticated browser automation, or introduce a pricing rules engine.

## Ownership

- WooCommerce owns runtime products, variations, regular prices, sale prices, effective prices, and native Cost of Goods.
- `dtb-catalog-platform` owns the pricing-manager read model, calculations, MAP metadata, policy setting, admin REST controller, and workspace page.
- `dtb-platform` owns the shared DTB admin page registry, capability registry, shell, asset policy, and BrikPanel-compatible component layer.
- Supplier catalog scripts remain deterministic operational tooling. They may project confirmed costs into the canonical catalog/WooCommerce workflow but do not become runtime application services.

## Data contract

The workspace reads price-owning records only:

- simple/other independently priced WooCommerce products;
- individual variations for variable products.

Variable parents are not independently repriced because their displayed prices are projections of their variations.

DTB-owned product metadata:

- `_dtb_map_price` — optional MAP amount;
- `_dtb_map_source` — optional short operator-facing evidence/source label.

DTB-owned option:

- `dtb_catalog_pricing_target_margin` — default target gross margin percentage; defaults to `30`.

No separate pricing product table is introduced.

## Calculation contract

For a product with effective selling price `P`, cost `C`, and target margin `M` expressed as a decimal:

```text
gross profit = P - C
gross margin = (P - C) / P
markup       = (P - C) / C
target price = C / (1 - M)
```

When MAP exists, the optimizer suggestion is the greater of target price and MAP.

The calculation is advisory until an administrator explicitly applies a price.

## Runtime flow

```text
WooCommerce product / variation
        │
        ├── regular + sale + effective price
        ├── native Cost of Goods
        └── DTB MAP metadata
                │
                ▼
       PricingManagerService
                │
       short-lived read index
                │
        admin REST endpoints
                │
                ▼
      BrikPanel DTB workspace
      Products | Optimizer | Data
                │
        explicit admin save
                │
                ▼
        WooCommerce CRUD save
```

The read index is a two-minute transient containing arrays only. Top-level WooCommerce products are loaded in bounded batches of 100; variable parents contribute their child variation records. Product updates invalidate the transient.

## Admin REST surface

Namespace: `dtb/v1`

- `GET /admin/pricing/products` — filtered, sorted, paginated pricing records.
- `GET /admin/pricing/data` — catalog coverage, brands, and target-margin policy.
- `GET /admin/pricing/product/{id}` — fresh product pricing snapshot.
- `POST /admin/pricing/product/{id}` — update regular price and DTB MAP fields.
- `POST /admin/pricing/settings` — update default target gross margin.
- `POST /admin/pricing/apply` — apply up to 100 explicitly selected regular-price recommendations.

All routes use the existing `dtb_manage_catalog_pricing` capability. Administrators and the DTB Catalog Manager role receive that capability through the canonical DTB capability registry.

## UI contract

The page is registered as `dtb-pricing-manager` in the existing DTB Tool Library and uses `dtb_admin_shell_open()` / `dtb_admin_shell_close()`.

BrikPanel remains responsible for global wp-admin chrome and theme tokens. The pricing workspace contributes only page-scoped layout and interaction styles through `dtb-pricing-manager.css` and `dtb-pricing-manager.js`.

The three initial surfaces are:

1. **Products** — searchable/filterable pricing table plus a compact pricing drawer.
2. **Optimizer** — deterministic below-target / below-MAP recommendations with explicit selection and apply.
3. **Data** — source coverage and the single target-margin policy setting.

## Deferred work

The initial workspace deliberately defers these concerns until there is a concrete operational need:

- automated MAP document ingestion;
- supplier-cost refresh orchestration from wp-admin;
- competitor/industry price analysis;
- scheduled repricing;
- autonomous price publication;
- category-specific rule builders;
- complex fee, shipping, returns, or elasticity models.

Those features must not be added merely to make the workspace appear more sophisticated.
