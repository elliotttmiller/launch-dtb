# Catalog Pricing Manager

## Purpose

Catalog Pricing is the DTB wp-admin workspace for maintaining product pricing economics without creating a parallel commerce authority.

The MVP implementation is deliberately bounded:

- view WooCommerce product and variation prices;
- view WooCommerce native Cost of Goods values;
- maintain DTB MAP amount and source metadata on the WooCommerce product record;
- calculate gross profit, gross margin, markup, and target-margin price;
- enforce configured MAP as an absolute advertised-price floor;
- optimize only products that already have official MAP configured during the staged MVP rollout;
- review MAP violations and below-target-margin products;
- apply explicitly selected recommendations through WooCommerce CRUD;
- maintain one default target gross-margin setting.

It does **not** scrape competitors, perform real-time market monitoring, dynamically reprice products, run supplier-authenticated browser automation, infer missing MAP, or introduce a pricing rules engine.

## Ownership

- WooCommerce owns runtime products, variations, regular prices, sale prices, effective prices, and native Cost of Goods.
- `products/launch/official/dtb_official_catalog.csv` remains the canonical catalog source artifact.
- `dtb-catalog-platform` owns pricing calculations, MAP enforcement policy, the pricing read model, admin REST controller, and pricing workspace.
- `dtb-platform` owns the shared DTB admin page registry, capability registry, shell, asset policy, and BrikPanel-compatible component layer.
- `scripts/supplier-catalog/` owns deterministic operational tooling for extracting, matching, projecting, auditing, and remediating supplier/MAP evidence in the canonical catalog. Scripts do not become runtime commerce services.

No separate pricing product table or parallel price authority is introduced.

## MAP contract

`_dtb_map_price` is optional because official MAP is not yet available for every catalog product. Absence of MAP is a data-coverage state, not permission to infer a value.

When a positive official MAP value exists, DTB's MVP policy is strict:

```text
regular price >= MAP
sale price    >= MAP, when a sale price exists
```

A price may not be one currency minor unit below configured MAP.

MAP is therefore a **hard constraint**, not a soft recommendation. It is evaluated independently of COGS availability or target-margin status.

Products without MAP remain visible in the Products/Data workspace as `MAP not configured` but are excluded from optimizer application until official MAP evidence is configured.

### Runtime enforcement

`PricingManagerService.php` attaches to WooCommerce's `woocommerce_before_product_object_save` lifecycle and enforces configured MAP before a price-owning product or variation is persisted.

The enforcement:

- raises an existing regular price below MAP to MAP;
- raises an existing sale price below MAP to MAP;
- recalculates the effective WooCommerce price after correction;
- does not create a retail price for an otherwise unpriced/reference product merely because MAP exists;
- does not independently price variable parents because their price presentation is projected from child variations.

The same invariant is applied explicitly inside the Catalog Pricing write path so the admin response reflects the value WooCommerce will persist.

## Data contract

The workspace reads price-owning records only:

- simple/other independently priced WooCommerce products;
- individual variations for variable products.

Variable parents are not independently repriced because their displayed prices are projections of their variations.

DTB-owned product metadata:

- `_dtb_map_price` — optional positive official MAP amount;
- `_dtb_map_source` — optional short operator-facing evidence/source label.

DTB-owned option:

- `dtb_catalog_pricing_target_margin` — default target gross margin percentage; defaults to `30`.

## MVP calculation contract

For effective selling price `P`, product cost `C`, and target gross margin `M` expressed as a decimal:

```text
gross profit = P - C
gross margin = (P - C) / P
markup       = (P - C) / C
target price = C / (1 - M)
```

### Target-price rounding

Target price is a minimum economic target. A normal nearest-cent rounding operation can round the mathematical result downward and leave the realized gross margin fractionally below the requested target.

The MVP therefore rounds the target-margin calculation **upward to the next WooCommerce currency minor unit**.

For USD:

```text
target price = CEILING(C / (1 - M), $0.01)
```

### MAP-configured regular-price recommendation

For a product with current regular price `R`, configured MAP `A`, and target price `T` when COGS is available:

```text
optimization target = max(A, T)
recommended regular = max(R, A, T)
```

When COGS is unavailable:

```text
recommended regular = max(R, A)
```

This intentionally prevents the MVP optimizer from lowering an existing price merely because the target-margin equation produces a smaller number. The target-margin equation provides an economic target, not an instruction to discount a product that is already priced above it.

### Sale-price recommendation

Promotional pricing remains a separate WooCommerce concern. The MVP does not force sale prices to the regular-price target margin; it only enforces the non-negotiable MAP constraint:

```text
recommended sale = max(current sale, MAP)
```

If there is no sale price, the optimizer does not create one.

## Recommendation states

The read model emits explicit operator-facing states/reason codes:

- `MAP_FLOOR_VIOLATION` — configured regular, sale, or effective price is below MAP; optimize immediately.
- `BELOW_TARGET_MARGIN` — MAP-compliant price is below the target-margin price; optimize regular price upward.
- `ACTIVE_SALE` — MAP-compliant active sale; review rather than treating the promotion as ordinary base-price optimization.
- `MISSING_COGS` — MAP is configured and compliant, but target-margin optimization cannot be calculated; hold.
- `MAP_NOT_CONFIGURED` — not optimizer-eligible during the staged MVP rollout.
- `MISSING_PRICE` — MAP may exist but there is no independently owned regular price to optimize automatically.
- `PRICE_HEALTHY` — current price is MAP-compliant and does not require an upward MVP recommendation.

MAP violation detection takes precedence over missing COGS and active-sale presentation so compliance problems are never hidden by another data state.

## Optimizer application contract

The browser is not pricing authority.

When an administrator selects optimizer rows, the client sends product identity and the expected current regular price. The server reloads the fresh WooCommerce product, recalculates its pricing snapshot, verifies that MAP is configured and the product still requires action, and only then applies the server-calculated recommendation.

The MVP optimizer therefore cannot be used to apply arbitrary client-supplied recommendation prices.

## Canonical catalog operation

`scripts/supplier-catalog/enforce_map_pricing.py` applies the same MVP formulas to `products/launch/official/dtb_official_catalog.csv`.

It is preview-only by default. The operation:

1. validates the canonical catalog before analysis;
2. ignores rows with no configured `Meta: _dtb_map_price`;
3. uses `Decimal` currency arithmetic;
4. calculates target price with upward cent rounding;
5. raises regular prices to `max(current regular, MAP, target price)` when COGS exists;
6. raises regular prices to `max(current regular, MAP)` when COGS is missing;
7. raises existing sale prices below MAP to MAP;
8. never lowers an existing price;
9. never invents MAP for an unconfigured row;
10. writes a detailed JSON audit report;
11. with `--apply`, creates a rollback snapshot, writes atomically, and revalidates the full catalog.

Operational usage from a repository checkout:

```text
python scripts/supplier-catalog/enforce_map_pricing.py
python scripts/supplier-catalog/enforce_map_pricing.py --apply
```

The default target margin is `30.00%`; `--target-margin` may be used when the approved MVP pricing policy changes.

The catalog operation is intentionally separate from runtime WordPress execution. It prevents a later canonical-catalog import from reintroducing known below-MAP pricing.

## Runtime flow

```text
official MAP evidence
        │
        ▼
extract / protected-identifier match / MAP projection
        │
        ▼
canonical catalog Meta: _dtb_map_price
        │
        ├───────────────┐
        │               │
        ▼               ▼
WooCommerce import   MAP pricing audit/remediation
        │               │
        ▼               └── canonical catalog remains MAP-safe
WooCommerce product / variation
        │
        ├── regular + sale + effective price
        ├── native Cost of Goods
        └── DTB MAP metadata
                │
                ▼
       PricingManagerService
        │              │
        │              └── WooCommerce pre-save MAP floor
        ▼
       short-lived pricing index
        │
        ▼
        admin REST endpoints
        │
        ▼
      BrikPanel DTB workspace
      Products | Optimizer | Data
        │
        ▼
      explicit admin selection
        │
        ▼
      server recomputation
        │
        ▼
        WooCommerce CRUD save
```

The read index is a two-minute transient containing arrays only. Top-level WooCommerce products are loaded in bounded batches of 100; variable parents contribute child variation records. Product updates invalidate the transient.

## Admin REST surface

Namespace: `dtb/v1`

- `GET /admin/pricing/products` — filtered, sorted, paginated pricing records; supports `map_only` for the MVP optimizer.
- `GET /admin/pricing/data` — catalog coverage, brands, MAP coverage, and target-margin policy.
- `GET /admin/pricing/product/{id}` — fresh product pricing snapshot.
- `POST /admin/pricing/product/{id}` — update regular/sale price and DTB MAP fields through the bounded pricing write path.
- `POST /admin/pricing/settings` — update default target gross margin.
- `POST /admin/pricing/apply` — server-recalculate and apply up to 100 explicitly selected MAP-configured recommendations.

All routes use the existing `dtb_manage_catalog_pricing` capability. Administrators and the DTB Catalog Manager role receive that capability through the canonical DTB capability registry.

## UI contract

The page is registered as `dtb-pricing-manager` in the existing DTB Tool Library and uses `dtb_admin_shell_open()` / `dtb_admin_shell_close()`.

BrikPanel remains responsible for global wp-admin chrome and theme tokens. The pricing workspace contributes only page-scoped layout and interaction styles through `dtb-pricing-manager.css` and `dtb-pricing-manager.js`.

The three MVP surfaces are:

1. **Products** — searchable/filterable pricing table, explicit MAP-violation/MAP-missing states, plus a compact pricing drawer.
2. **Optimizer** — MAP-configured recommendations only, with `Needs action`, `MAP violations`, and `Below target margin` views plus explicit selection/apply.
3. **Data** — COGS/MAP coverage and the single target-margin policy setting.

## Staged rollout

The MVP deliberately starts with the products for which official MAP is already configured.

As additional manufacturer MAP evidence is extracted and confirmed through protected identifier matching, those products become optimizer-eligible automatically after the MAP value reaches WooCommerce through the catalog workflow.

MAP-missing products are not guessed, bulk-filled, or optimized against an invented constraint.

## Deferred work

The MVP deliberately defers these concerns until there is a concrete operational need:

- competitor/industry price analysis;
- scheduled repricing;
- autonomous price publication;
- category-specific pricing strategies;
- demand elasticity and forecasting;
- complex fee, shipping, returns, or lifecycle models;
- inferred MAP or fuzzy matching as mutation authority.

Those features must not be added merely to make the workspace appear more sophisticated.
