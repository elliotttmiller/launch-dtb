# DTB Competition Price Catalog

This working toolset produces one simple, read-only competitor price comparison for Drywall Toolbox products using Al's Taping Tools, Wall Tools, and All-Wall.

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

`Regular Price` and `Sale Price` are copied directly from `products/launch/official/dtb_official_catalog.csv`.

Competitor prices are populated only when the matcher has a verified retailer correlation. Missing or unverified retailer matches remain blank. Prices are never averaged, estimated, inferred, or synthesized.

## Included products

The competition catalog includes independently purchasable singular products, variations, accessories/stilts, and replacement parts.

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

A blank competitor cell means no safely verified competitor price is currently available for that DTB product. It must not be replaced with a guessed or nearest price.

## Retained report files

`reports/competitor-catalog/` is intentionally kept minimal. After a successful rebuild, only these files are retained:

```text
dtb_competitor_price_catalog.csv

als_taping_tools/catalog.csv
als_taping_tools/products.jsonl
als_taping_tools/failures.jsonl

wall_tools/catalog.csv
wall_tools/products.jsonl
wall_tools/failures.jsonl

all_wall/catalog.csv
all_wall/products.jsonl
all_wall/failures.jsonl
```

The per-retailer `catalog.csv` files are the inputs used by matching. `products.jsonl` preserves successful raw scrape evidence and supports efficient resume/re-export. `failures.jsonl` preserves unresolved scrape failures so missing coverage remains explicit. Other generated diagnostics and historical reports are removed after the final competition catalog is written.

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

`match_official_catalog_to_competitors.py` owns correlation safety and produces temporary verified retailer observations.

`create_competition_catalog.py` owns the business-facing CSV, filters out variable parents and tool sets/kits, and sanitizes the report directory after a successful build.

## Authority and safety

The official DTB catalog remains the canonical DTB product source. WooCommerce remains the commerce authority at runtime. Competitor data is read-only research evidence and does not mutate WooCommerce, pricing, orders, inventory, fulfillment, accounting, or protected identifiers.
