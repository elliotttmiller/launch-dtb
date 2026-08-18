# Schematics Hotspot Resolver Workflow

## Purpose

The temporary Hotspot Resolver is one end-to-end operator workflow for auditing and repairing schematic hotspot-to-product relationships. It is intentionally limited to launch remediation. It is not a catalog authority and does not create a parallel schematic persistence model.

## Authorities

- `frontend/public/brands/**/schematic_data*.json` is schematic hotspot source truth and is read only through the approved dataset reader, normalization, source-grouping, and merge pipeline.
- Live WooCommerce is authoritative for product/variation identity.
- DTB Schematics owns hotspot normalization, relationship resolution, diagnostics, explicit operator overrides, and schematic persistence.
- SKU, MPN, GTIN, brand identity, and other protected catalog identifiers are never rewritten by this workflow.

Repository catalog files under `products/` may be used by catalog tooling and engineering review, but the wp-admin resolver does not copy them into a second runtime catalog or use them to invent WooCommerce product IDs.

## Single operator workflow

The Hotspot Resolver exposes one gated sequence:

1. **Generate full pre-apply report** — mandatory read-only execution across the complete authoritative schematic population.
2. **Audit the proposed plan** — the report lists every deterministic relationship write with source schematic/part identity, target WooCommerce product, resolution method, and hotspot occurrence impact. Remaining source/catalog problems are shown separately.
3. **Approve the exact plan** — Apply is not offered when the report projects zero writes. The operator must explicitly approve the successful pre-apply run.
4. **Freshness verification** — immediately before mutation, the resolver regenerates the material read-only plan and compares its SHA-256 plan fingerprint with the approved report. If source/catalog state changed, Apply is aborted without writes and a new report is required.
5. **Apply** — the existing application operation runner acquires the shared schematic commit lease, synchronizes current hotspot projections, and persists only deterministic relationships.
6. **Post-apply review/export** — the workflow reports actual writes and remaining remediation work and can export the complete post-apply result.

The former source-audit, diagnostic, and optimizer presentation panels remain implementation dependencies only; they are not separate operator workflows.

## Product identity semantics

Legacy schematic datasets do not have one universal meaning for `display_id`. Some datasets use it as a manufacturer part number while others use a diagram callout/index. Source `sku` is therefore the primary product identity when present.

Automatic resolution order is:

1. preserve an explicit operator-set WooCommerce product/variation ID;
2. preserve an intentionally-not-sold state;
3. exact WooCommerce SKU;
4. exact brand + **strong** manufacturer part number;
5. unique same-brand formatting-only SKU alias;
6. explicit compatibility relationship using exact strong SKU/MPN evidence;
7. unresolved.

A strong MPN must not be a short numeric diagram callout. Purely numeric MPN evidence is accepted only at five or more digits; mixed alpha/numeric manufacturer identifiers remain eligible. This prevents legacy callout numbers such as `1`, `9`, or `14` from being promoted into product identity.

### Formatting-only SKU reconciliation

The formatting-only rule exists for protected identifiers that differ only in punctuation/spacing, for example `CF4L` versus `CF 4L` or `FA324` versus `FA-324`.

It is deliberately narrow:

- source SKU must be strong;
- only a bounded set of punctuation/spacing aliases is generated;
- aliases are resolved through WooCommerce SKU lookup, not a fuzzy catalog scan;
- the candidate's normalized SKU must equal the source normalized SKU;
- candidate brand must equal the schematic brand after known label canonicalization;
- all matching aliases must identify one and only one WooCommerce product/variation;
- multiple product IDs, missing brand evidence, weak numeric identifiers, title similarity, or cross-brand evidence remain unresolved.

The relationship records `resolution_method = normalized_sku`; neither source nor WooCommerce identifiers are changed.

## Pre-apply report contract

The report distinguishes source facts, proposed writes, and remaining remediation:

- `repairs` is the explicit proposed mutation set in Preview and actual applied set after Apply.
- `projected_repairs` / `applied_repairs` are the authoritative new relationship-write counts.
- `projected_normalized_sku_repairs` / `applied_normalized_sku_repairs` identify the formatting-only subset.
- legacy `projected_exact_repairs` / `applied_exact_repairs` remain for report compatibility and represent all deterministic relationship repairs, not only the `exact_sku` method.
- `active_hotspot_unresolved` counts unresolved relationship groups that currently have hotspot occurrences.
- `inactive_catalog_unresolved` separates source/catalog part rows with zero hotspot occurrences so they do not obscure the active hotspot workload.
- `source_reference_only` separates obvious `SEE ... DETAIL` navigation/reference rows from sellable product identity gaps.
- `source_identifier_gap` identifies missing/weak source identifiers such as diagram callout numbers.
- `catalog_identity_gap` means a strong source SKU exists but live WooCommerce cannot deterministically resolve it.
- `sku_format_ambiguous` and strong review candidates are evidence only and are never automatically linked.
- source drift, source read failures, unavailable sources, and structural hotspot findings remain separately visible.

The previous `exactly_resolvable` metric remains an audit signal only and must never be interpreted as a new-write count.

## Apply contract

Apply is unavailable when the approved report projects zero deterministic writes. When writes exist, Apply requires:

- `dtb_manage_schematics`;
- a run-specific WordPress nonce;
- an operator-owned, successful, completed dry-run;
- explicit operator approval;
- a non-empty proposed write set; and
- a fresh runtime plan whose fingerprint exactly matches the approved report.

Apply does not replay browser-supplied product mappings. After the freshness check it reruns the authoritative application pipeline under the shared schematic commit lease.

Apply may only synchronize normalized hotspot projections and persist relationships generated by the deterministic resolver contract. It may not create/delete products, rewrite protected catalog identifiers, cross brands, auto-link fuzzy/title candidates, or override explicit/not-sold operator decisions.

## Export contract

Report schema version 3 identifies `pre_apply` versus `apply` and contains:

- run identity, status, timestamps and errors;
- authority/safe-write contract;
- projected or applied mapping counts;
- formatting-only mapping counts;
- active hotspot versus catalog-only unresolved counts;
- the material plan fingerprint;
- the complete proposed/applied `repairs` set;
- resolver metrics and per-record outcomes;
- source errors and normalized root-cause counts;
- the complete retained remediation queue; and
- a fresh full-scope source-truth audit.

Export is capability/nonce protected, operator scoped, and read-only.

## Security and failure behavior

The page, Preview, approval/Apply, and export require `dtb_manage_schematics`. Mutating Apply uses the process-wide schematic commit lease. Arbitrary filesystem paths are not accepted. Source/catalog ambiguity remains unresolved rather than being guessed. If the approved plan is stale, the freshness check fails closed and makes no write. If the commit lease is lost, the existing operation runner stops subsequent mutations.
