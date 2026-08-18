# Schematics Hotspot Resolver Workflow

## Purpose

The temporary Hotspot Resolver is a single operator workflow for validating and repairing schematic hotspot-to-product relationships. It is not a second catalog authority and it does not create a parallel schematic persistence model.

## Authorities

- `frontend/public/brands/**/schematic_data*.json` is the schematic hotspot source truth and is read only through the approved schematic dataset reader, normalization, source-grouping, and merge pipeline.
- WooCommerce is authoritative for product identity and commerce persistence.
- DTB Schematics owns hotspot normalization, relationship resolution, diagnostics, explicit operator overrides, and schematic persistence.
- SKU, MPN, GTIN, brand identity, and other protected catalog identifiers are never rewritten by this workflow.

## Unified operator flow

The Hotspot Resolver page exposes one pipeline with two execution modes and one report action:

1. **Preview full optimizer** — read-only end-to-end analysis. It audits the full authoritative schematic population, evaluates source integrity, tests deterministic product resolution, classifies unresolved relationships, and builds the remediation work queue.
2. **Run one-time optimizer** — the commit mode of the same pipeline. It acquires the existing process-wide schematic commit lease, synchronizes normalized hotspot projections through the existing migration service, and persists only deterministic exact SKU / brand+MPN / explicit compatibility relationships.
3. **Export full report** — exports the selected operator-owned run as a self-contained JSON report together with a complete current source-truth audit across the same authoritative record population.

The former standalone source-audit and resolver presentation panels are not exposed as separate top-level workflows. Their application services remain reusable implementation dependencies.

## Mapping outcome semantics

The UI explicitly distinguishes an audit signal from a write result:

- `exactly_resolvable` means the source/current catalog combination can satisfy the deterministic resolver contract. It can include relationships that were already resolved before the selected run.
- `projected_exact_repairs` is the count that Preview predicts would become newly resolved.
- `applied_exact_repairs` is the count of newly resolved relationships actually written by Apply.
- An Apply run with `applied_exact_repairs = 0` completed without creating any new exact part-to-product mapping, even if `exactly_resolvable` is greater than zero.

## Export contract

The JSON export is capability protected, nonce protected, and restricted to the operator that owns the selected optimizer run. It contains:

- schema version and generation timestamp;
- authority/safety contract;
- run identity, mode, status, timestamps, and error state;
- explicit mapping outcome including whether any new exact mappings were written;
- optimizer metrics, per-record outcomes, source errors, root-cause counts, and the consolidated resolution work queue;
- a complete current source-truth audit with per-record source files, schema/volume, drift, integrity findings, and source-level exact/unresolved signals.

The export is diagnostic only. Exporting never mutates schematic or catalog data.

## Security and failure behavior

The page and export require `dtb_manage_schematics`. Apply continues to use the shared schematic commit lease and existing migration/update services. Fuzzy/review candidates are evidence only and are never auto-linked. Source paths are discovered through the approved schematic source locator/reader and arbitrary client-provided filesystem paths are not accepted.

If source data is unavailable, unreadable, structurally invalid, or drifted, the workflow reports the condition rather than fabricating a mapping. If the commit lease is lost, the existing operation runner stops further mutations.
