# SEO Batch 001 — Columbia Replacement Parts

**Status:** Generated, pending review. No canonical catalog rows are modified by this artifact.

This first generation batch deliberately mixes commodity hardware, assemblies, seals, blades, wheels, gears, brackets, and taper/pump/handle parts. The purpose is to validate the editorial standard across materially different replacement-part types before scaling to the remaining catalog.

## Source and ownership

- Generation basis: the user-supplied `dtb_official_catalog 2.csv` used in this catalog SEO workstream.
- Canonical target authority remains `products/launch/official/dtb_official_catalog.csv`.
- Before any apply step, protected product identity must be revalidated against the canonical target catalog.
- This batch is a proposal/review artifact under `products/dev/`; it is not an alternate catalog authority and does not write WooCommerce.

## Guardrails applied

- Product-specific writing; no prose template or minimum word count.
- No SKU, MPN, brand, slug, product-kind, taxonomy, compatibility, variation, or schematic identity changes.
- Copy is bounded to the supplied catalog evidence: brand, part number/model, Tool Groups, and condition.
- Unsupported claims were removed rather than paraphrased. This includes generic `OEM`, `precision-engineered`, `professional-grade`, `factory fit`, `peak performance`, durability, productivity, and similar claims that were not established by the generation evidence.
- Description and Short Description have separate jobs: the short field identifies the part quickly; the full Description gives a concise service/fit context without repeating a long feature essay.
- Specifications remain the authority for structured facts; descriptions do not reproduce the whole specification table.
- SEO titles are individually edited and kept at or below 60 characters in this batch.
- Meta descriptions are individually edited and kept at or below 160 characters in this batch.
- Every current `/product/.../` canonical override in this batch is proposed to be cleared. The storefront's deterministic `/products/:slug` route remains canonical authority unless an approved exception is documented.
- No variation-level indexable authority is created.

## Products generated

| SKU | Product | Description words | SEO title chars | Meta chars | Canonical action |
|---|---|---:|---:|---:|---|
| FA232 | 6-32 Hex Nut | 31 | 45 | 136 | Clear conflicting override |
| FA280 | #10 Belleville Washer | 37 | 54 | 137 | Clear conflicting override |
| FA202 | 1/16 X 1/2 in Cotter Pin | 31 | 54 | 135 | Clear conflicting override |
| FA313 | 1/4-20 X 1/4 Socket Head Set Screw | 37 | 54 | 136 | Clear conflicting override |
| CT72 | Cable | 30 | 53 | 144 | Clear conflicting override |
| CT42A | Diamond Blade | 27 | 46 | 146 | Clear conflicting override |
| FFB36 | Box Wheel | 29 | 42 | 128 | Clear conflicting override |
| HNSA-14 | Handle Link Assembly | 29 | 55 | 131 | Clear conflicting override |
| HH12 | Brake Spring | 27 | 44 | 133 | Clear conflicting override |
| MP23 | Mud Pump Seal | 27 | 45 | 129 | Clear conflicting override |
| MP33 | Filler Gasket | 31 | 45 | 128 | Clear conflicting override |
| CT31 | Chain Tension & Guide Bracket | 26 | 59 | 130 | Clear conflicting override |
| CR2 | Roller | 29 | 56 | 123 | Clear conflicting override |
| CT125A | Bearing | 25 | 57 | 131 | Clear conflicting override |
| MP3 | Pump Flapper Valve | 31 | 49 | 133 | Clear conflicting override |
| CT67 | Ratchet Gear | 27 | 44 | 131 | Clear conflicting override |
| HH10B | Bottom Cap | 26 | 55 | 129 | Clear conflicting override |
| CT70 | Drive Shaft | 28 | 59 | 125 | Clear conflicting override |
| AH4 | Side Blade | 27 | 52 | 140 | Clear conflicting override |
| CT87A | Bracket Brace | 27 | 57 | 124 | Clear conflicting override |

## QA result

- 20/20 generated rows have SEO titles <= 60 characters.
- 20/20 generated rows have meta descriptions <= 160 characters.
- 20/20 generated descriptions avoided the flagged unsupported-claim classes used by the pre-generation guard.
- No protected product identity is intentionally changed.
- Canonical field is blank in every proposal so `SEOHead` can resolve the deterministic storefront canonical from `/products/:slug`.
- All rows remain `generated_pending_review`; the official catalog is intentionally untouched.

## Review standard

Approve a row only when its proposed copy improves clarity and purchasing confidence without introducing facts beyond the evidence packet. If richer functional, material, fit, compatibility, or performance copy is desired for a product, escalate that SKU for manufacturer-source research rather than padding the description.

After Batch 001 is approved, the apply stage should update only: `Short description`, `Description`, `_dtb_seo_title`, `_dtb_seo_description`, `_dtb_seo_focus_kw`, and `_dtb_seo_canonical`, while rechecking protected identity immediately before the write.
