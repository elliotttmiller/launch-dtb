# Schematics Hotspot Resolution Pipeline

## Authority

The Hotspot Resolver is one bounded launch-remediation pipeline. `frontend/public/brands/**/schematic_data*.json` remains schematic hotspot source truth, live WooCommerce remains product/variation identity authority, and DTB Schematics owns normalized hotspot projections and schematic-part relationships. The pipeline never rewrites protected SKU, MPN, GTIN, or brand identity and never creates a parallel runtime catalog.

## Operator workflow

The supported wp-admin workflow is:

1. **Build full resolution plan**: read-only analysis of all authoritative schematic sources and live WooCommerce identity state.
2. **Review complete pre-apply plan**: inspect source integrity, exact proposed mappings, active unresolved hotspots, catalog-only gaps, source failures, and remediation manifests.
3. **Export artifacts**: complete JSON report plus catalog-corrections, source-corrections, and manual-review CSV files generated from the same plan.
4. **Approve**: explicit operator approval is available only when the plan has deterministic writes and no fatal, failed, or truncated-plan blocker.
5. **Freshness verification**: immediately before Apply, the server rebuilds the plan from authoritative state and requires its material fingerprint to equal the reviewed plan.
6. **Apply**: the existing schematic operation runner acquires the shared commit lease and reruns the established hotspot synchronization/resolution pipeline. Browser-supplied mappings are never replayed.
7. **Post-apply verification**: the same plan builder reports actual writes and remaining remediation work and can export post-apply artifacts.

`Application/BuildHotspotResolutionPlan.php` is the plan/report composition layer. It consumes the existing optimizer result and does not introduce another resolver. `Admin/Diagnostics/HotspotResolutionPipeline.php` supersedes the older operator-facing Hotspot Workflow page registration while retaining the existing audit, migration, resolver, optimizer, operation-run, and lease services as internal dependencies.

## Resolution contract

Automatic relationship writes remain limited to the established deterministic resolver contract: preserved explicit mappings/not-sold states, exact WooCommerce SKU, exact brand plus strong MPN, unique same-brand formatting-only SKU identity, and explicit compatibility relationships. Fuzzy/title evidence, cross-brand guesses, weak numeric diagram callouts, and ambiguous candidates remain unresolved.

## Plan and artifacts

A plan contains its schema version, mode, reviewability, material fingerprint, coverage metrics, exactly-resolvable audit signal, projected/applied new mapping counts, active and catalog-only unresolved counts, proposed/applied mappings, blockers, reason counts, source errors, per-record results, and remediation artifacts.

Generated artifacts are review outputs rather than application state:

- `report_json`: complete machine-readable plan/run report;
- `catalog_csv`: catalog identity corrections that must be handled by the owning catalog/WooCommerce workflow;
- `source_csv`: source identity/source availability/reference corrections that must be handled in the authoritative schematic source;
- `manual_csv`: ambiguous evidence requiring explicit human review.

The pipeline does not mutate repository-controlled source JSON or canonical catalog files from production wp-admin.

## Security and failure behavior

Build, export, approval, and Apply require `dtb_manage_schematics`. Mutating actions use WordPress nonces. Run access is operator scoped. Apply requires a completed operator-owned dry-run, explicit approval, a non-empty deterministic mutation set, no blocking integrity condition, and an exact freshly recomputed plan fingerprint. Mutation continues to use the process-wide schematic commit lease and heartbeat. A stale, failed, or truncated plan fails closed before writes.
