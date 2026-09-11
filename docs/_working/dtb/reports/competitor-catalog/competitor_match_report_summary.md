# Competitor Match Report

## What We Learned

- We reviewed **756** official DTB catalog products.
- We found competitor matches for **586 products**, or about **78%** of the catalog.
- **170 products** still need more competitor research or manual lookup.
- The matcher found **1,201 total competitor match rows** across All-Wall, Al's Taping Tools, and Wall Tools.
- **1,006 matches** are strong enough to use as confirmed evidence.
- **195 matches** should be reviewed before they are used for pricing decisions.

## Plain-English Statuses

- **Confirmed Match**: SKU/MPN matched exactly, or the product names are nearly identical.
- **Likely Match**: brand and title are strongly similar, but a person should still spot-check before pricing use.
- **Needs Review**: the identifier, brand, title, or variation has something inconsistent.
- **No Match Found**: no reliable competitor match was found for that DTB product.

## Best Next Uses

1. Use `competitor_match_reader_view.csv` as the main business-facing view.
2. Use `competitor_match_price_gaps.csv` to find pricing opportunities.
3. Use `competitor_match_review_queue.csv` as the manual cleanup queue.
4. Use `dtb_official_competitor_matches.csv` only when an audit trail is needed.

## Best-Match Status Breakdown

| Status | Products |
|---|---:|
| Confirmed Match | 558 |
| Likely Match | 13 |
| Needs Review | 15 |
| No Match Found | 170 |

## Best-Match Competitor Breakdown

| Competitor | Best Matches |
|---|---:|
| All-Wall | 406 |
| Al's Taping Tools | 69 |
| Wall Tools | 111 |
