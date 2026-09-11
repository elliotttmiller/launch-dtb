# DTB Competition Price Catalog

This working toolset produces a simple, read-only competitor price comparison for Drywall Toolbox products using:

- Al's Taping Tools
- Wall Tools
- All-Wall

The primary deliverable is:

```text
reports/competitor-catalog/dtb_competitor_price_catalog.csv
```

## Primary CSV

The CSV intentionally contains only:

```text
SKU
Brand
Product
Regular Price
Sale Price
Al's Taping Tools Price
Wall Tools Price
All-Wall Price
```

`Regular Price` and `Sale Price` are copied directly from:

```text
products/launch/official/dtb_official_catalog.csv
```

Competitor prices are populated only when the existing matcher has a verified retailer correlation. Missing or unverified retailer matches remain blank. Prices are never averaged, estimated, inferred, or synthesized.

## Included products

The competition catalog is intentionally narrow. It includes independently purchasable catalog rows such as singular tools, accessories/stilts, variations, and replacement parts.

Included WooCommerce product types:

```text
simple
variation
```

Excluded:

```text
variable parent products
tool sets
kits
```

Tool sets/kits are identified primarily by `Meta: _dtb_product_kind` values `toolset` or `kit`, with category fallback checks for older catalog rows.

## Matching rule

A competitor price is written only after safe product identity verification. Matching remains manufacturer-scoped and protects meaningful manufacturer identifier punctuation. Explicit approved brand-scoped aliases may be used; fuzzy or uncertain correlations do not populate competitor price cells.

A blank competitor cell means:

> No safely verified competitor price is currently available for this DTB product.

That blank is intentional and must not be replaced with a guessed or nearest price.

## Execution

```powershell
python -m unittest discover -s tests -v
python run_competitor_pricing_pipeline.py
```

The normal rebuild is deliberately small:

```text
match_official_catalog_to_competitors.py
create_competition_catalog.py
```

`match_official_catalog_to_competitors.py` owns correlation safety and produces the verified retailer observations used by the final catalog.

`create_competition_catalog.py` owns the simple business-facing CSV and filters out variable parents and tool sets/kits.

## Authority and safety

The official DTB catalog remains the canonical DTB product source. WooCommerce remains the commerce authority at runtime. Competitor data is read-only research evidence and does not mutate WooCommerce, pricing, orders, inventory, fulfillment, accounting, or protected identifiers.
