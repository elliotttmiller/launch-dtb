# Schematics Hotspot Resolver Workflow

## Purpose

The temporary Hotspot Resolver is one end-to-end operator workflow for auditing and repairing schematic hotspot-to-product relationships. It is not a catalog authority, does not create a parallel schematic persistence model, and is intentionally limited to the launch remediation task.

## Authorities

- `frontend/public/brands/**/schematic_data*.json` is schematic hotspot source truth and is read only through the approved dataset reader, normalization, source-grouping, and merge pipeline.
- WooCommerce is authoritative for product identity and commerce persistence.
- DTB Schematics owns hotspot normalization, deterministic relationship resolution, diagnostics, explicit operator overrides, and schematic persistence.
- SKU, MPN, GTIN, brand identity, and other protected catalog identifiers are never rewritten by this workflow.

## Single operator workflow

The Hotspot Resolver exposes one gated sequence rather than separate audit, diagnostic, synchronization, and optimizer tools:

1. **Generate full pre-apply report** — mandatory read-only execution of the complete resolver pipeline. It audits every authoritative schematic record, current source-file integrity, normalized projection drift, deterministic mapping potential, unresolved relationships, source errors, root causes, and bounded review evidence. It writes nothing.
2. **Review and approve** — the completed pre-apply report is rendered in wp-admin with explicit projected mapping counts, source integrity metrics, root-cause counts, and a prioritized remediation queue. Apply is unavailable until a successful preview exists. The operator must explicitly check the approval control for that preview run.
3. **Approve & apply full resolver** — commit mode of the same application pipeline. It acquires the shared schematic commit lease, synchronizes hotspot projections through the existing migration service, and persists only deterministic exact SKU, exact brand+MPN, or explicit compatibility relationships. Existing explicit overrides and intentionally-not-sold states remain protected.
4. **Post-apply review / export** — the same page reports actual new mappings written and remaining unresolved work. Either pre-apply or post-apply state can be exported as a complete JSON report.

The workflow deliberately does not expose separate source-audit and optimizer panels. Their existing application services remain implementation dependencies rather than independent operator workflows.

## Pre-apply report contract

The pre-apply report must distinguish facts from projections:

- `exactly_resolvable` is a source/catalog audit signal and may include relationships already resolved before the run.
- `projected_exact_repairs` is the number of currently unresolved relationships that the read-only run predicts can become resolved through the deterministic contract.
- source drift, read failures, unavailable source files, structural hotspot findings, unresolved relationships, and root-cause groups are reported separately.
- review candidates are evidence only. Candidate display suppresses similarity-only cross-brand noise; it does not expand the automatic resolver contract.

A successful pre-apply report is required before Apply, and the approval POST is capability protected, nonce protected, and tied to the operator-owned preview run ID.

## Apply contract

Apply reruns the authoritative pipeline against current runtime state; it does not replay arbitrary browser-supplied mappings from the preview. This preserves source/WooCommerce ownership and avoids treating the report as a mutation payload.

Apply may only:

- synchronize the normalized schematic hotspot projection through the existing migration service; and
- persist part relationships produced by the existing deterministic resolver contract.

Apply may not create or delete products, rewrite SKU/MPN/GTIN/brand identifiers, auto-link fuzzy/title candidates, or bypass explicit operator/not-sold states.

## Report export

The JSON export is capability protected, nonce protected, and restricted to the operator that owns the selected resolver run. Schema version 2 identifies whether the export is `pre_apply` or `apply` and includes:

- run identity, mode, status, timestamps, and errors;
- authority and safe-write contract;
- projected or actual new exact mappings;
- exact-source signal and remaining unresolved relationship count;
- resolver metrics, per-record outcomes, source errors, normalized root-cause counts, and the complete remediation queue retained by the resolver;
- a fresh full-scope source-truth audit across the same authoritative schematic population.

Export is read-only.

## Security and failure behavior

The page, preview, approval/apply, and export require `dtb_manage_schematics`. Mutating Apply continues to use the shared process-wide schematic commit lease. Arbitrary filesystem paths are not accepted. If source data is unavailable, unreadable, structurally invalid, or drifted, the workflow reports the condition instead of fabricating a mapping. If the commit lease is lost, the operation runner stops further mutations.
