# Catalog SEO Pre-Generation Pipeline

## Purpose

`scripts/catalog/catalog_seo_pre_generation.py` is the deterministic preparation stage for DTB product-description and SEO enrichment. It does **not** generate product copy and it does **not** mutate `products/launch/official/dtb_official_catalog.csv`.

The canonical catalog remains the source of truth. The pre-generation stage converts each catalog row into a derived, reviewable evidence packet so a later editorial/generation pass can write product-specific copy without inventing facts, mutating protected identifiers, or applying a single prose template to the catalog.

## Ownership

- `products/launch/official/dtb_official_catalog.csv` owns canonical catalog facts and protected identifiers.
- `scripts/catalog/official_catalog_schema.py` owns canonical catalog structural validation.
- `scripts/catalog/catalog_seo_pre_generation.py` owns deterministic normalization, evidence extraction, editorial classification, and pre-generation QA only.
- WooCommerce remains commerce persistence authority.
- Frontend SEO rendering remains owned by `frontend/src/components/shared/SEOHead.jsx` and `frontend/src/utils/schema.js`.

Generated pre-generation artifacts are disposable derived data. They are not an alternate catalog.

## Required execution order

1. Validate the canonical catalog with `official_catalog_schema.validate_catalog()`.
2. Normalize whitespace/HTML into read-only generation text.
3. Snapshot and hash protected identity fields.
4. Classify product complexity from canonical product-kind and product identity data.
5. Extract structured evidence: brand, SKU, MPN, GTIN, category, family, model, specs, compatibility, includes, variation ownership.
6. Determine whether the row is an independent generation target. Variations are not independent indexable content authorities.
7. Evaluate existing description and SEO metadata for length, repetitive filler, claims requiring evidence, duplicate metadata, and canonical conflicts.
8. Emit a generation packet plus findings. Do not rewrite the source catalog.

## Protected identity

The pre-generation packet captures and hashes the fields that a later generation stage must never modify implicitly, including SKU, GTIN, brand identity, MPN/manufacturer SKU, product-kind/category identity, parent/variation identity, schematic identity, and slug.

Any later application stage must compare the packet's `protected_identity_sha256` against the current source row before applying generated content. A mismatch means the source changed and the proposal must be regenerated or manually reconciled.

## Product classes

Classification controls information depth and allowed section shape, not wording. Current classes are:

- `commodity_hardware`
- `replacement_component`
- `replacement_assembly`
- `tool_accessory`
- `primary_finishing_tool`
- `automatic_equipment`
- `stilts`
- `kit_set`
- `general_product`

Word ranges are editorial guidance only. They are not minimum-content targets or hard limits. The downstream writer must stop when additional prose stops adding product-specific purchasing information.

## Evidence and claim handling

The stage preserves current copy as source evidence but flags language classes that require authoritative support before reuse, including precision-manufacturing claims, industrial/professional-grade claims, performance superlatives, fit guarantees, undocumented material-quality claims, and productivity/downtime claims.

A finding does not automatically declare a claim false. It means the downstream writer must either verify it against authoritative evidence or omit it.

## SEO normalization

The stage evaluates:

- missing/oversized SEO titles;
- missing/oversized meta descriptions;
- duplicate and highly similar meta descriptions;
- focus-keyword gaps;
- explicit canonical overrides against the React storefront authority `/products/:slug`.

An empty canonical override is preferred when the deterministic storefront route is correct. A redundant matching override is flagged for cleanup. A conflicting override is a high-severity pre-generation finding.

## Variation policy

Variation rows are included in derived packets for context, but `generation_eligible` is false. Product SEO authority stays with the parent unless a future product-family contract explicitly introduces independently indexable variation routes.

## Outputs

Default output directory: `products/dev/seo-pre-generation/`

- `generation-packets.jsonl` — one immutable evidence/guardrail packet per catalog row.
- `pre-generation-findings.csv` — deterministic QA findings for review and prioritization.
- `pre-generation-summary.json` — source SHA-256, row counts, classifications, confidence distribution, finding counts, and output paths.

The output directory is ignored by Git because it is derived and reproducible.

## Commands

PowerShell:

```powershell
.\scripts\catalog\prepare-catalog-seo.ps1
```

Fail a controlled workflow when high/critical findings remain:

```powershell
.\scripts\catalog\prepare-catalog-seo.ps1 -FailOnBlocking
```

Python:

```text
python scripts/catalog/catalog_seo_pre_generation.py
```

Tests:

```text
python -m unittest scripts.catalog.tests.test_catalog_seo_pre_generation
```

## Downstream generation contract

A later content-generation/application stage must:

1. consume only packets whose `generation_eligible` is true;
2. preserve every protected identity field;
3. use `authoritative_facts` as the fact boundary;
4. treat source descriptions as reference copy, not proof of unsupported claims;
5. omit sections without useful supported content;
6. never expand copy to satisfy a minimum word count;
7. independently optimize description, short description, SEO title, and meta description;
8. avoid templated sentence scaffolding across products;
9. require research/manual review when confidence or evidence is insufficient;
10. re-run canonical catalog validation and protected-identity verification before applying approved content.
