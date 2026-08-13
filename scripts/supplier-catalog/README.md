# TSW authenticated supplier catalog scraper

This tool discovers products from TSW Fast brand catalog pages, opens every
individual product detail page, and exports the authoritative detail-page name,
part number, account-specific cost, manufacturer, and full product description.
It uses a dedicated local Chromium profile, so credentials and cookies are never
written to source files or the CSV.

Only use it with an account and catalog data you are authorized to access.
Keep request rates conservative and comply with the supplier's terms.

## Set up

From `D:\AMD\projects\launch-dtb`:

```powershell
python -m venv scripts\supplier-catalog\.venv
scripts\supplier-catalog\.venv\Scripts\python -m pip install -r scripts\supplier-catalog\requirements.txt
scripts\supplier-catalog\.venv\Scripts\python -m playwright install chromium
```

The tracked `catalog-sources.json` contains the requested Columbia Tools,
TapeTech, Dura-Stilts, SurPro, and filtered TapeTech EasyClean Automatic Taper
Parts sources. Each source has a stable `source_name`, an exported `brand`, and
the complete TSW category `url`.

`exclude_name_contains` is an optional array of case-insensitive product-name
substrings. The EasyClean source uses `["Kit"]`; filtering happens only after
the individual product page supplies the authoritative product name.

## Sign in

```powershell
scripts\supplier-catalog\.venv\Scripts\python scripts\supplier-catalog\scrape_tsw_catalog.py --login
```

A browser opens at TSW's login page. Sign in normally, including any challenge
TSW requires. The script detects the authenticated session and stores it only
inside the ignored `.browser-profile` directory. Do not use a normal personal
browser profile for this tool.

## Scrape

```powershell
scripts\supplier-catalog\.venv\Scripts\python scripts\supplier-catalog\scrape_tsw_catalog.py
```

The live CSV is written to `scripts\supplier-catalog\results\tsw-costs.csv` by
default and atomically refreshed after every processed product. It is always a
valid, readable CSV containing all successfully included rows completed so far.
The command exits nonzero if a session is logged out, a page fails, a duplicate
SKU conflicts, or a product price remains unresolved. `Call for price` is kept
as a valid nonnumeric supplier response and is reported separately.

Progress is also atomically checkpointed beside the live CSV after every
individual product, including products excluded by source rules. If TSW fails
or the session expires, rerun the same command after signing in; completed
products are resumed rather than requested again. The checkpoint is removed
only after the final CSV is written successfully.
Malformed supplier detail links automatically retry through TSW's stable
`/product/{part-number}` route.

Useful options:

```text
--headed                 show the browser while scraping
--delay-seconds 0.5      pause between individual product pages
--timeout-seconds 30     per-page/authentication timeout
--allow-missing-prices   export unresolved prices instead of failing
```

The `source_name` column keeps overlapping catalog sources distinguishable. The
description is exported twice: `product_description` contains readable plain
text, while `product_description_html` preserves paragraphs, lists, and other
detail-page markup. Other columns include `brand`, `sku`, `product_name`,
`manufacturer`, `supplier_cost`, `currency`, `price_display`, `price_unit`,
`product_url`, `image_url`, `source_catalog_page`, and `scraped_at_utc`. Costs are
supplier account data; keep generated output private.

Every product is written as exactly one physical CSV line. Newlines embedded in
supplier descriptions and description HTML are converted to spaces at export;
the HTML elements themselves remain intact.

## Normalize costs for the production catalog

`scripts/supplier-catalog/results/tsw-costs.csv` is raw supplier evidence and is
not a WooCommerce import file. Do not rewrite its supplier SKUs or copy its TSW
namespace prefixes into canonical product identifiers.

Run the deterministic reconciliation step after a successful scrape:

```powershell
scripts\supplier-catalog\.venv\Scripts\python scripts\supplier-catalog\normalize_tsw_costs.py
```

The normalizer reads the raw TSW export and the canonical
`products/launch/official/dtb_woocommerce_official_catalog.csv`, then writes:

- `results/tsw-costs-normalized.csv` — normalized supplier costs with explicit
  catalog match status and the matched canonical SKU/MPN when exactly one match
  exists.
- `results/tsw-costs-normalization-report.json` — counts plus complete unmatched
  and ambiguous supplier-SKU lists for review.

TSW uses distributor namespace prefixes rather than the manufacturer identifiers
stored in the DTB catalog. Prefix removal is allowlisted, never inferred:
`CTT` for Columbia Tools, `TTT` for TapeTech, `DSS` for Dura-Stilts, and `SUR`
for SurPro. The stripped value is comparison-only; the normalizer never mutates
canonical SKU or MPN values.

Catalog reconciliation checks both `SKU` and supported `MPN` columns using a
comparison-only identifier normalization. Brand compatibility is also enforced,
so an identifier collision across manufacturers cannot silently match. Exactly
one compatible catalog row is required for `matched` status. Zero candidates are
`unmatched`; multiple candidates are `ambiguous`.

The command fails closed when unmatched or ambiguous rows remain. Use
`--allow-unmatched` only for an intentional audit/export where unresolved rows
will be reviewed manually. Overlapping TSW source catalogs are collapsed only
when supplier SKU, cost, and currency agree; conflicting supplier records stop
the run instead of choosing a price silently.

The normalized output is a reconciliation artifact, not authority for retail
price, product identity, inventory, fulfillment, or WooCommerce persistence.
Supplier cost can be projected into the production catalog only after the match
report has been reviewed and any pricing/margin policy has been applied by the
owning catalog workflow.
