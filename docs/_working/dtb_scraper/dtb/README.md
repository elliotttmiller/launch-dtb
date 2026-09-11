# DTB Competition Price Catalog

This tooling produces one simple business-facing CSV that lines up Drywall Toolbox products with the three supported competitor prices.

## Primary output

```text
reports/competitor-catalog/dtb_competitor_price_catalog.csv
```

Columns:

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

The CSV contains every row from:

```text
products/launch/official/dtb_official_catalog.csv
```

in official catalog order.

DTB `Regular price` and `Sale price` are copied directly from the official catalog without recomputing or replacing them.

Competitor prices are populated only when `match_official_catalog_to_competitors.py` has a verified retailer match for that DTB row. If a retailer cannot be safely correlated, that retailer's price cell remains blank.

No fuzzy fill-ins, averages, medians, inferred prices, tolerance pricing, or synthetic values are written to the competition catalog.

## Competitors

- Al's Taping Tools — `https://www.alstapingtools.com/`
- Wall Tools — `https://walltools.com/`
- All-Wall — `https://www.all-wall.com/`

The scraper keeps site-specific identifier semantics:

- All-Wall: manufacturer part number / MPN.
- Al's Taping Tools: storefront SKU as exposed.
- Wall Tools: storefront SKU with only verified prefixes `LEV5-`, `DURA-`, `SURP-`, `TAPE-`, and `COLM-` stripped case-insensitively.

Manufacturer-scoped identity, approved brand-scoped aliases, and contradiction checks remain in place so unrelated products are not forced into a price column.

## Rebuild from existing scrape outputs

```powershell
python run_competitor_pricing_pipeline.py
```

The normal rebuild intentionally has only two application steps after tests:

```text
match_official_catalog_to_competitors.py
create_competition_catalog.py
```

`match_official_catalog_to_competitors.py` performs safe DTB-to-retailer correlation from the existing per-site competitor catalogs.

`create_competition_catalog.py` projects those verified matches into the eight-column business CSV.

## Refresh competitor data

A pipeline rebuild does not scrape the live competitor sites. To refresh source prices first, run:

```powershell
python competitor_catalog_scraper.py
python run_competitor_pricing_pipeline.py
```

The live scraper is read-only against competitor storefronts and writes the per-site catalog evidence consumed by the matcher.

## Truthfulness rule

A blank competitor price means:

> No safely verified competitor price is currently available for that DTB catalog row.

Blank cells are intentional. The workflow must never invent a competitor price merely to make the table look complete.

## Ownership and safety

`products/launch/official/dtb_official_catalog.csv` remains the canonical DTB launch catalog source artifact. WooCommerce remains the runtime commerce authority.

This competitor tooling is read-only research/reporting infrastructure. It does not update WooCommerce, orders, payments, inventory, fulfillment, accounting, or protected DTB identifiers.
