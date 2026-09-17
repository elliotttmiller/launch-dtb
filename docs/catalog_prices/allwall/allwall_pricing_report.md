# All-Wall catalog pricing audit

Checked: 2026-09-17T01:42:21Z

## Scope

- Catalog records examined: 756
- Eligible price-owning SKUs: 650
- Variable parents excluded: 105
- Brands represented: Columbia Tools, Dura-Stilts, LEVEL5, Platinum Drywall Tools, SurPro, TapeTech
- All-Wall pages fetched: 1669 (limited to the active DTB brand scope)

## Results

- Verified product matches: 362
- Possible matches requiring review: 0
- Not found with this public, identifier-led audit: 288
- Verified publicly displayed All-Wall prices: 362

## Identifier findings

The audit extracts the displayed `MPN` from All-Wall pages in the active DTB-brand scope and writes it to `allwall_sku`. All-Wall's retailer-internal SKU is neither extracted nor exported. A match is approved whenever the punctuation-normalized displayed MPN exactly equals a DTB SKU; no brand, title, URL, length, product-condition, prefix, or other gate is applied.

## Limitations

This is a public sitemap/PDP extraction with no authentication or access-control bypass. An exact MPN match establishes the match; a missing public MPN remains NOT_FOUND. Prices are volatile public observations and should be rechecked before commercial action.
