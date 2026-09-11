# Competitor Price Research

## Purpose

DTB has two read-only competitor-research implementations:

1. `scripts/catalog/competitor_price_research.py` — streaming competitor research tooling.
2. `docs/_working/dtb_scraper/dtb/` — the current full-catalog workflow that analyzes the already-completed complete scrape.

Active competitor scope is:

- Al's Taping Tools — `https://www.alstapingtools.com/`
- All-Wall — `https://www.all-wall.com/`
- Wall Tools — `https://walltools.com/`

Neither workflow owns or mutates WooCommerce pricing, Veeqo, QuickBooks, MAP, protected identifiers, or `products/launch/official/dtb_official_catalog.csv`.

## Source of truth

Canonical DTB identity and DTB selling prices come from:

```text
products/launch/official/dtb_official_catalog.csv
```

Competitor data is research evidence only.

Validate the canonical catalog before a new streaming research run:

```powershell
python scripts/catalog/validate_official_catalog.py
```

## Streaming research tool

Install and validate:

```powershell
python -m venv .venv-market
.\.venv-market\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r scripts/catalog/competitor_price_research.requirements.txt
python -m unittest scripts/catalog/tests/test_competitor_price_research.py
python -m unittest scripts/catalog/tests/test_competitor_price_streaming.py
```

Standard run:

```powershell
python scripts/catalog/competitor_price_research.py --verbose
```

Default output directory:

```text
reports/pricing/competitor-market/
```

The streaming scraper is network-I/O bound and uses bounded concurrency, persistent per-worker sessions, bounded retries, rate limiting, durable URL checkpoints, evidence persistence, and resumable execution. It reads structured product data where available and retains normalized evidence rather than raw HTML.

The streaming implementation's own output schema and matching behavior remain implementation-specific to that script. It must not be used to override the stricter full-catalog market-price contract below.

## Current full-catalog workflow

The current complete-catalog analysis workflow is:

```text
docs/_working/dtb_scraper/dtb/
```

It processes the existing complete raw competitor scrape and does not require another crawl merely because matching or market-price semantics change.

Composition root:

```powershell
cd docs/_working/dtb_scraper/dtb
python -m unittest discover -s tests -v
python run_competitor_pricing_pipeline.py
```

Use `--refresh-all-wall-manual-evidence` only when a fresh public read is specifically needed for All-Wall products that lack an MPN:

```powershell
python run_competitor_pricing_pipeline.py --refresh-all-wall-manual-evidence
```

## Pricing target scope

The full-catalog workflow analyzes only independently purchasable canonical DTB rows:

```text
simple     -> included
variation  -> included
variable   -> excluded
```

Variable parents are excluded from matching, review, unmatched counts, market-price establishment, and price-gap reports. A variation may use parent naming context for candidate discovery, but child SKU/MPN/manufacturer identifiers remain authoritative.

## Identity contract

The full-catalog workflow never joins on SKU alone:

```text
identity_key = canonical_brand + "::" + canonical_identifier
```

An automatic match requires known and matching manufacturer identity, a matching canonical identifier, and no independent title or structured-variation contradiction.

Unknown-brand identifier matches, cross-brand collisions, dimensional differences, handedness differences, pack/count differences, generation differences, product-family conflicts, and title/identifier contradictions remain review-only. Fuzzy and near-identical title matches are never auto-accepted.

All-Wall remains MPN-strict. Its retailer store SKU is not substituted when manufacturer MPN is absent. MPN-less All-Wall rows may be retained only as manual evidence.

## Site-level price resolution

Each of the three competitors is resolved independently.

A retailer contributes at most one verified observed price for a product. Same-site duplicate rows are not averaged or median-collapsed:

- identical duplicate prices resolve to one retailer observation;
- differing duplicate prices are a conflict and the retailer does not contribute a market-price observation until reviewed.

## Market price contract

Competitor prices are explicit retailer observations, not values to statistically aggregate.

The full-catalog workflow must never calculate an average, median, midpoint, weighted average, or majority-derived amount and call it the market price.

A market price is established only when verified retailer prices agree exactly and there is no verified conflicting retailer price.

States:

```text
MARKET_PRICE_VERIFIED_3_OF_3
MARKET_PRICE_VERIFIED_2_OF_3
MARKET_PRICE_SINGLE_SOURCE
MARKET_PRICE_CONFLICT
NO_MARKET_EVIDENCE
```

`MARKET_PRICE_VERIFIED_3_OF_3` means all three retailers have verified product identities and publish the same price. The common observed amount is the market price.

`MARKET_PRICE_VERIFIED_2_OF_3` means exactly two verified priced observations are available, both are equal, and there is no verified conflicting third price. The common amount is the market price with weaker two-source evidence.

`MARKET_PRICE_SINGLE_SOURCE` retains one verified retailer price as evidence but does not promote it to market price.

`MARKET_PRICE_CONFLICT` means two or more verified retailer prices disagree. Market price remains blank and the product enters review. No majority, median, or average fallback is permitted.

`NO_MARKET_EVIDENCE` means no verified priced competitor observation exists.

## DTB effective price and delta

The DTB comparison price is:

```text
positive Sale price when populated
otherwise Regular price
```

When and only when a market price has been established:

```text
DTB vs Market Price = DTB effective price - Market Price
```

and:

```text
DTB vs Market Price % = (DTB effective price - Market Price) / Market Price * 100
```

Positive means DTB is higher; negative means DTB is lower; zero means DTB is aligned.

No DTB-vs-market delta is produced when market price is unresolved.

## Full-catalog outputs

Primary artifacts under `docs/_working/dtb_scraper/dtb/reports/competitor-catalog/` include:

- `current_dtb_brand_competitor_products.csv`
- `current_dtb_brand_filter_summary.csv`
- `competitor_price_comparison_by_sku.csv`
- `competitor_price_comparison_review.csv`
- `dtb_official_competitor_matches.csv`
- `dtb_official_competitor_best_matches.csv`
- `dtb_official_competitor_unmatched.csv`
- `dtb_official_competitor_match_summary.csv`
- `competitor_match_reader_view.csv`
- `competitor_match_price_gaps.csv`
- `competitor_match_review_queue.csv`
- `competitor_match_report_summary.md`
- `competitor_match_report.html`

The `best_matches` filename is retained only for compatibility. It contains one aggregate evidence row per eligible DTB pricing target and does not select an arbitrary competitor.

`competitor_match_price_gaps.csv` contains only rows for which a market price was actually established. `competitor_match_review_queue.csv` includes identity-review candidates and verified cross-retailer price conflicts.

## Interpretation boundary

Identical retailer prices prove observed agreement only. They must not be labeled MAP, MSRP, manufacturer-enforced pricing, or another pricing policy without independent policy evidence.

## Ownership

Competitor research is deterministic operational tooling, not an application service and not a commerce authority. WooCommerce owns storefront pricing. Any future automated price mutation requires a separate authorized workflow with validation, policy controls, approval, auditability, rollback, and explicit ownership boundaries.
