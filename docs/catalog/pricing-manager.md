# Catalog Pricing Manager

## Purpose

Catalog Pricing is DTB's wp-admin decision workspace for product pricing economics. WooCommerce remains the authority for persisted regular, sale, and effective prices and native Cost of Goods. `dtb-catalog-platform` owns deterministic pricing policy resolution, calculations, guardrails, recommendations, audit context, and the operator-triggered application workflow.

The production MVP is intentionally rules-based rather than autonomous. It does not scrape competitors, estimate elasticity, forecast demand, or publish unattended price changes.

## Ownership

- WooCommerce owns products, variations, prices, sale state, and native Cost of Goods.
- `products/launch/official/dtb_official_catalog.csv` remains the canonical catalog source artifact.
- `dtb-catalog-platform/Services/PricingPolicy.php` owns pricing-policy defaults and category → brand → global inheritance.
- `dtb-catalog-platform/Services/PricingManagerEngine.php` owns calculations, hard-floor enforcement, recommendation states, and WooCommerce CRUD mutations.
- `PricingManagerService.php` is the stable compatibility entry point for the active engine.
- `scripts/supplier-catalog/` remains deterministic offline catalog-analysis/remediation tooling and is not runtime commerce authority.

No separate product-price table or parallel price authority is introduced.

## Economic formulas

For selling price `P`, Cost of Goods `C`, and margin `M` expressed as a decimal:

```text
gross profit = P - C
gross margin = (P - C) / P
markup       = (P - C) / C
margin price = C / (1 - M)
```

Margin-derived prices are ceiling-rounded to the next WooCommerce currency minor unit so a persisted price cannot round below the requested margin.

## Policy hierarchy

Each price-owning product or variation resolves one policy using the deepest supported category first, then brand, then global fallback:

```text
supported category policy
        ↓ otherwise
supported brand policy
        ↓ otherwise
global launch policy
```

The launch evidence source is the committed canonical MAP + COGS analysis with a minimum sample size of five observations for category/brand policies.

Global fallback:

```text
minimum gross margin  30.50%
target gross margin   33.50%
```

Supported brand policies:

| Brand | Minimum | Target | Evidence |
|---|---:|---:|---:|
| Columbia Tools | 32.00% | 34.50% | 91 |
| TapeTech | 29.00% | 30.50% | 49 |

Supported category policies:

| Category | Minimum | Target | Evidence |
|---|---:|---:|---:|
| Angle Heads | 31.00% | 33.00% | 8 |
| Corner Rollers | 33.00% | 36.00% | 7 |
| Flat Box Handles | 31.00% | 33.00% | 29 |
| Flat Boxes | 30.00% | 33.50% | 24 |
| Loading Pumps | 25.00% | 30.50% | 5 |
| Predator Family | 34.00% | 34.00% | 9 |
| Compound Applicators | 33.50% | 34.50% | 13 |
| Compound Tubes | 26.50% | 31.00% | 13 |
| Corner Flushers | 38.50% | 40.50% | 15 |
| Semi-Automatic Taping Tool Accessories | 31.00% | 31.50% | 7 |

Categories without sufficient evidence fall back to brand policy rather than manufacturing a weak category target.

## Hard constraints

For every product with valid positive COGS:

```text
regular price >= COGS
sale price    >= COGS, when a sale exists
```

The production economic floor is stronger than break-even:

```text
minimum-margin price = COGS / (1 - minimum margin)
hard floor            = max(COGS, minimum-margin price, MAP when configured)
```

Existing regular and sale prices may not persist below that hard floor through normal WooCommerce product-save lifecycle events. Variable parents are not independently priced because their price presentation is derived from variations.

MAP remains optional because not every manufacturer/SKU has confirmed official MAP. Missing MAP is never inferred. When configured, MAP is an additional absolute floor; it is not an optimizer-eligibility requirement.

## Target recommendation

The preferred base-price target is:

```text
target-margin price = COGS / (1 - target margin)
preferred price     = max(hard floor, target-margin price, MAP when configured)
recommended regular = max(current regular price, preferred price)
```

The production MVP is raise-only. A current healthy price above the preferred target is held rather than discounted.

For an existing sale:

```text
recommended sale = max(current sale, hard floor)
```

The base optimizer does not create a sale. Active promotions that are already above all hard floors remain review states rather than being treated as ordinary base-price optimization.

## Change guardrails

Global configurable defaults:

```text
no-change threshold          1.00%
manual-review threshold     25.00%
blocked-change threshold    50.00%
```

Normal target-margin opportunities below the no-change threshold are held to avoid price churn. Normal target changes at or above the review threshold require operator review; changes at or above the blocked threshold are blocked for data/price review.

Hard violations — below COGS, below minimum margin, or below MAP — remain actionable even when the correction is large. Their severity and reason codes make the data anomaly explicit before bulk application.

## Recommendation contract

The engine emits both a primary reason and the complete set of applicable reason codes. Core reason codes include:

- `REGULAR_BELOW_COGS`
- `SALE_BELOW_COGS`
- `EFFECTIVE_BELOW_COGS`
- `BELOW_MINIMUM_MARGIN`
- `MAP_FLOOR_VIOLATION`
- `BELOW_TARGET_MARGIN`
- `MISSING_COGS`
- `MAP_NOT_CONFIGURED`
- `MISSING_PRICE`
- `ACTIVE_SALE`
- `CHANGE_BELOW_THRESHOLD`
- `LARGE_CHANGE_REVIEW`
- `MAX_CHANGE_EXCEEDED`
- `CATEGORY_POLICY_APPLIED`
- `BRAND_POLICY_APPLIED`
- `GLOBAL_POLICY_APPLIED`
- `PRICE_HEALTHY`

Operator actions are `optimize`, `hold`, `review`, or `blocked`. Severity is `critical`, `high`, `medium`, or `info`.

## Missing-data behavior

| Available data | Behavior |
|---|---|
| Price + COGS + MAP | Full economic optimization plus MAP enforcement |
| Price + COGS | Economic optimization; MAP remains unknown |
| Price + MAP, no COGS | MAP hard-floor enforcement only |
| Price only | Hold; economic optimization is unavailable |
| Missing regular price | Blocked |

Missing MAP is never converted to zero and never guessed.

## Runtime application

The browser is not pricing authority. Selected/bulk operations send product identity plus the expected current regular price. The server reloads the fresh WooCommerce object, recomputes policy and recommendation, checks for concurrent price changes, and only then writes through WooCommerce CRUD.

The WooCommerce pre-save hook applies the hard floor again immediately before persistence. Product writes clear relevant product transients and invalidate the two-minute pricing read index.

## Optimize All Eligible Products

The whole-catalog action is preview-first and operator-triggered. Preview reports:

- total price-owning records;
- COGS/MAP coverage;
- prices that will increase;
- below-COGS critical records;
- below-minimum-margin records;
- MAP violations;
- healthy holds;
- review/blocked records;
- missing COGS/MAP coverage;
- estimated aggregate regular-price increase;
- active global guardrail policy.

Only `optimize` records are queued into the server-owned run snapshot. Apply operates in bounded batches of 50. Every product is recalculated immediately before mutation. A stale current regular price becomes a conflict rather than being overwritten.

Per-product mutations and completed whole-catalog runs use the existing DTB admin audit infrastructure and record pricing-policy/reason context.

## Admin REST surface

Namespace: `dtb/v1`

- `GET /admin/pricing/products`
- `GET /admin/pricing/data`
- `GET /admin/pricing/product/{id}`
- `POST /admin/pricing/product/{id}`
- `POST /admin/pricing/settings`
- `POST /admin/pricing/apply`
- `POST /admin/pricing/optimize-all/preview`
- `POST /admin/pricing/optimize-all/apply`

The existing `dtb_manage_catalog_pricing` capability remains the administrative boundary.

## Admin workspace

The BrikPanel-based workspace keeps three surfaces:

1. **Products** — pricing economics, hard-floor/status visibility, policy source, filters, and bounded editing.
2. **Optimizer** — COGS/minimum-margin/MAP/target recommendations, severity, policy explanation, explicit selection/apply, and whole-catalog preview/apply.
3. **Data** — COGS/MAP coverage plus global fallback margin and change-guardrail configuration. Evidence-backed category and brand defaults remain code-owned policy until a concrete need justifies a larger rule editor.

## Deferred work

The current implementation deliberately defers:

- live competitor scraping and automatic undercutting;
- elasticity estimation;
- machine-learning/reinforcement-learning pricing;
- demand forecasting;
- inventory markdown optimization;
- unattended scheduled repricing;
- inferred MAP;
- a generalized no-code rules-builder.

Those features require stronger business evidence and should not be added merely to increase apparent sophistication.
