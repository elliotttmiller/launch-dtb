# TSW authenticated supplier catalog scraper

This tool discovers products from TSW Fast brand catalog pages, opens every
individual product detail page, and exports the authoritative detail-page name,
part number, account-specific cost, manufacturer, and full product description.
It uses a dedicated local Chromium profile, so credentials and cookies are never
written to source files or the CSV.

Only use it with an account and catalog data you are authorized to access.
Keep request rates conservative and comply with the supplier's terms.

## Results layout

- `results/cost/` contains supplier-cost exports and cost-migration reports.
- `results/shipping/` contains TSW product-data extraction reports, catalog-match
  analysis, confirmed/review/unmatched subsets, and shipping-spec migration
  reports.

The source workbook and filtered DTB-brand product data remain under
`docs/reference/data/TSW/`; the results directories contain derived artifacts
only.

## Set up

From `D:\AMD\projects\launch-dtb`:

```powershell
python -m venv scripts\supplier-catalog\.venv
scripts\supplier-catalog\.venv\Scripts\python -m pip install -r scripts\supplier-catalog\requirements.txt
scripts\supplier-catalog\.venv\Scripts\python -m playwright install chromium
```

The tracked `catalog-sources.json` contains the requested Columbia Tools,
TapeTech, Dura-Stilts, SurPro, USG Sheetrock® Tools, and filtered TapeTech
EasyClean Automatic Taper Parts sources. Each source has a stable `source_name`,
an exported `brand`, and the complete TSW category `url`.

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

The live CSV is written to `scripts\supplier-catalog\results\cost\tsw-costs.csv` by
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

Overlapping catalog sources are collapsed by normalized brand and SKU only when
their supplier cost and currency agree. The exported CSV intentionally contains
only `brand`, normalized `sku`, `product_name`, `supplier_cost`, and
`product_description_html`. The scraper retains the additional supplier fields
internally for validation and duplicate detection but does not export them.
`supplier_cost` is serialized as an unquoted two-decimal USD number; the text
fields remain quoted for CSV safety.
Costs are supplier account data; keep generated output private.
Products whose names contain `kit`, `trowel`, `knife`, `knives`, `sand`,
`sponge`, or `smoothing blade` (case-insensitive) are excluded from every
supplier source and are not written to the CSV.

Every product is written as exactly one physical CSV line. Newlines embedded in
supplier descriptions and description HTML are converted to spaces at export;
the HTML elements themselves remain intact.

## Supplier cost evidence

`scripts/supplier-catalog/results/cost/tsw-costs.csv` is raw supplier evidence and is
not a WooCommerce import file. Do not rewrite its supplier SKUs or copy its TSW
namespace prefixes into canonical product identifiers.

The scraper removes TSW distributor namespace prefixes before writing the CSV.
Prefix removal is allowlisted by exported brand, never inferred:
`CTT` for Columbia Tools, `TTT` for current TapeTech products, `AME` for legacy
AMES products grouped into TSW's TapeTech category, `DSS` for Dura-Stilts,
`SUR` for SurPro, and `USG` for USG Sheetrock® Tools. The supplier CSV therefore
stores manufacturer part numbers, and the catalog analyzer never mutates canonical
SKU or MPN values. Cost evidence is projected only through confirmed catalog
mappings; it is not authority for retail price, product identity, inventory, or
fulfillment.

TSW currently exposes USG Sheetrock Tools through the dedicated
`https://www.tswfast.com/category/brand_USG` catalog route. Supplier listing
identifiers use the `USG` distributor namespace (for example `USG340506`), so
the cost export normalizes that evidence to the manufacturer identifier
(`340506`) before catalog matching. The global product-name exclusions still
apply; adding the USG source does not make knives, trowels, sanding products,
kits, sponges, or smoothing blades eligible for the cost export.

## Launch catalog matching analysis

Cross-reference the cleaned supplier catalog with the canonical launch catalog:

```powershell
scripts\supplier-catalog\.venv\Scripts\python scripts\supplier-catalog\analyze_launch_catalog_matches.py
```

The analysis confirms matches only when the supplier SKU uniquely resolves to a
brand-compatible protected catalog identifier. Exact, likely, and possible name
matches are emitted as review candidates and never promoted to confirmed product
identity. Results are written to `results/shipping/tsw-launch-catalog-match-analysis.csv`
with summary counts in `results/shipping/tsw-launch-catalog-match-report.json`.
Reviewed identifier exceptions are stored explicitly in
`approved-launch-catalog-matches.json`; the analyzer validates that each mapping
resolves to exactly one brand-compatible launch-catalog row.

For focused review, every analysis run also writes three temporary subsets under
`results/shipping/`: confirmed products, products with no match, and products requiring
review. Each subset retains the complete analysis schema and is regenerated from
the authoritative analysis statuses.

After confirmed mappings have been reviewed, project their supplier costs into
the launch catalog with:

```powershell
scripts\supplier-catalog\.venv\Scripts\python scripts\supplier-catalog\migrate_confirmed_supplier_costs.py
```

The migration uses WooCommerce core's `Cost of goods` CSV field, which maps to
the product `cogs_value` property when the Cost of Goods Sold feature is enabled.
It updates only unique confirmed catalog SKUs, fails closed on missing or
duplicate targets and conflicting costs, and writes an audit report under
`results/cost/`.

## TSW shipping and product specifications

Extract the requested DTB brands from the read-only TSW product-data workbook:

```powershell
.\scripts\supplier-catalog\extract_tsw_product_data.ps1
```

The extractor validates the workbook schema and selects only explicit `TTT`
(TapeTech), `CTT` (Columbia Tools), `DSS` (Dura-Stilts), and `SUR` (SurPro)
product prefixes. It preserves every source shipping/specification field, adds a
derived `Brand` column, rejects duplicate product identifiers, and writes the
filtered CSV beside the source workbook with an audit report under `results/shipping/`.
The output also excludes trowels, knives, kits, sanders/sanding products, and
apparel while retaining tool-part uses of words such as `cap` and `short`.

After regenerating and reviewing the confirmed launch-catalog mappings, preview
the shipping/specification projection with:

```powershell
scripts\supplier-catalog\.venv\Scripts\python scripts\supplier-catalog\migrate_confirmed_shipping_specs.py
```

Apply the validated projection with the explicit `--apply` flag. The migrator
updates only the WooCommerce `Weight (lbs)`, `Length (in)`, `Width (in)`, and
`Height (in)` fields for unique confirmed catalog SKUs. Blank supplier
measurements never erase catalog values, and exact zero measurements are treated
as unavailable source sentinels and counted in the report. Negative, nonnumeric,
or nonfinite measurements, duplicate targets, or missing targets stop the run. An audit report is written to
`results/shipping/tsw-shipping-spec-migration-report.json`.
