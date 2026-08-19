# Official Catalog Enrichment Pipeline

## Decision

The production catalog-enrichment workflow is intentionally small. The canonical CSV is validated and analyzed first; external systems acquire evidence; only explicit evidence-backed migrators may change canonical fields.

The routine full-catalog preparation command is:

```powershell
.\scripts\catalog\run-official-catalog-enrichment.ps1
```

It performs only deterministic, local, non-mutating stages:

```text
dtb_official_catalog.csv
  -> structural validation
  -> enrichment-quality audit
  -> evidence-bounded content/SEO preparation
  -> reviewable derived artifacts
```

This command does not scrape external sites, call an AI model, alter prices, mutate WooCommerce, or rewrite the official CSV.

## Why the workflow is separated

Not every catalog integration has the same authority or operational cost. Combining authenticated supplier scraping, competitor crawling, media conversion, pricing optimization, editorial generation, and CSV mutation into one unattended command would obscure provenance and make failures difficult to isolate.

The production boundary is therefore:

1. **Core preparation** — deterministic and safe to run against the whole official catalog.
2. **Evidence acquisition** — external/read-only integrations run only when their evidence domain is needed.
3. **Proposal/review** — candidate facts or generated copy remain derived data until validated.
4. **Apply** — only field-specific, fail-closed migrators may update canonical catalog fields.
5. **Revalidate** — every applied change must pass the canonical validator again.

## Integration classification

### Mandatory core stages

#### `validate_official_catalog.py`

Role: blocking structural contract.

Retain. This is the first gate for every full-catalog workflow.

#### `audit_official_catalog_enrichment.py`

Role: read-only completeness and relationship-quality report.

Retain. It identifies missing or malformed enrichment without guessing replacement values.

#### `catalog_seo_pre_generation.py`

Role: deterministic normalization and evidence-packet preparation for editorial/SEO work.

Retain. It protects identity, separates product facts from domain knowledge, and emits review findings without generating or applying copy.

### External evidence acquisition

#### TSW supplier catalog workflow (`scripts/supplier-catalog/`)

Role: authorized supplier evidence for cost and shipping/specification fields.

Retain, but keep outside the routine core runner because it requires authenticated external access and its evidence applies only to specific fields. Matching must remain identifier-first and review-gated. Confirmed field-specific migrators are the only permitted write path.

#### `competitor_price_research.py`

Role: read-only market-price evidence from the approved competitor set.

Retain as optional research. It must not write DTB price, MAP, identifiers, descriptions, taxonomy, compatibility, or catalog facts. Competitor observations inform operator decisions only.

#### `competitor_endpoint_probe.py`

Role: diagnostic discovery of public structured competitor endpoints.

Do not include in normal catalog runs. It is engineering diagnostic tooling used when a production competitor adapter must be investigated or repaired. Once an adapter is stable, repeatedly running the probe adds complexity without enriching the catalog.

### Runtime systems outside CSV enrichment

#### Catalog Pricing Manager

Role: WooCommerce runtime pricing economics, hard-floor enforcement, recommendations, and operator-controlled application.

Keep separate. It is not a CSV enrichment stage and should never be chained into the offline catalog-preparation runner. Competitor research may inform policy review, but the pricing manager recomputes from WooCommerce-owned runtime values and code-owned policy.

#### Veeqo

Role: inventory, allocation, fulfillment, shipping and tracking authority.

Do not treat Veeqo inventory as catalog enrichment. Shipping dimensions may be projected into canonical product fields only through an explicit evidence-backed migration when that contract is supported; live inventory remains Veeqo-owned.

#### Media tooling

Role: deterministic media cleanup, conversion and product-media synchronization.

Keep separate from semantic catalog enrichment. Media processing can be run after identity/mapping is stable, but it should not gate description/specification enrichment and must not become a product-fact authority.

## AI/editorial boundary

Generated product copy is a proposal, not product evidence.

The existing pre-generation contract correctly separates:

- protected identity;
- authoritative product facts;
- existing reference copy;
- reusable drywall-domain knowledge;
- untrusted competitor context.

A production generation/application stage must consume only eligible packets, preserve the protected-identity digest, and write only approved editorial fields. It must not generate SKU, MPN, GTIN, brand identity, taxonomy identity, compatibility, parent/variation identity, price, or canonical routing policy.

The repository currently has a deterministic preparation boundary; a single canonical generation/apply entrypoint should be preferred over multiple independent AI writers if/when the generation service is committed to this repository.

## Approved full process

```text
A. PREPARE (always)
   validate official CSV
   -> enrichment-quality audit
   -> content/SEO evidence packets

B. ACQUIRE EVIDENCE (only as needed)
   supplier evidence -> confirmed cost/shipping/spec candidates
   competitor research -> price observations only
   official manufacturer research -> product-fact candidates

C. REVIEW
   exact identifier match first
   -> provenance retained
   -> ambiguous/fuzzy candidates remain review-only
   -> no missing field is filled merely for completeness

D. APPLY
   field-specific migrator
   -> rollback snapshot
   -> allowlisted writable fields
   -> fail closed on stale/missing/duplicate identity

E. VERIFY
   rerun structural validator
   -> rerun enrichment audit
   -> regenerate downstream evidence packets when protected identity/content changed
```

## What should not be built

Do not add:

- a second product database or generic enrichment store;
- a universal autonomous scraper that directly edits the CSV;
- an AI stage that decides protected identifiers or compatibility;
- automatic competitor-price undercutting;
- one giant script that logs into suppliers, crawls competitors, generates content, reprices products and writes the catalog in a single transaction;
- duplicate normalization logic in every integration;
- fuzzy matching as an automatic mutation authority.

## Output locations

The core runner writes disposable derived artifacts under:

```text
products/dev/catalog-enrichment/
```

Expected outputs:

- `catalog-enrichment-audit.json`
- `seo-pre-generation/generation-packets.jsonl`
- `seo-pre-generation/pre-generation-findings.csv`
- `seo-pre-generation/pre-generation-summary.json`
- `run-summary.json`

These files are operational artifacts, not canonical product truth.

## Mutation rule

A catalog integration may mutate `dtb_official_catalog.csv` only when all of the following are true:

1. the field belongs in the canonical catalog;
2. the source is authoritative for that field;
3. the target product resolves deterministically;
4. the writable columns are explicitly allowlisted;
5. blank/unavailable evidence cannot erase a known value unintentionally;
6. a rollback snapshot is created;
7. the canonical validator passes after the mutation;
8. the migration emits a durable audit report.

If any condition is not satisfied, the integration must remain read-only and emit a proposal/review artifact instead.
