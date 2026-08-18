# Schematics Hotspot Resolution Pipeline

## Authority

The Hotspot Resolver is one bounded launch-remediation pipeline. `frontend/public/brands/**/schematic_data*.json` remains schematic hotspot source truth, live WooCommerce remains product/variation identity authority, and DTB Schematics owns normalized hotspot projections and schematic-part relationships. The pipeline never rewrites protected SKU, MPN, GTIN, or brand identity and never creates a parallel runtime catalog.

## Operator workflow

The supported wp-admin workflow is:

1. **Build full resolution plan**: read-only analysis of all authoritative schematic sources and live WooCommerce identity state.
2. **Review complete pre-apply plan**: inspect source integrity, exact proposed mappings, active unresolved hotspots, catalog-only gaps, terminal dispositions, source failures, and remediation manifests.
3. **Export artifacts**: complete JSON report plus catalog-corrections, source-corrections, and manual-review CSV files generated from the same plan.
4. **Approve**: explicit operator approval is available only when the plan has a complete deterministic write set and no fatal, failed, or truncated-plan blocker.
5. **Freshness verification**: immediately before Apply, the server rebuilds the plan from authoritative state and requires its material fingerprint and applicability to equal the reviewed plan.
6. **Apply**: the existing schematic operation runner acquires the shared commit lease and reruns the established hotspot synchronization/resolution pipeline. Browser-supplied mappings are never replayed.
7. **Post-apply verification**: the same plan builder reports actual writes and remaining remediation work and can export post-apply artifacts.

`Application/BuildHotspotResolutionPlan.php` is the plan/report composition layer. It consumes the existing optimizer result and does not introduce another resolver. `Admin/Diagnostics/HotspotResolutionPipeline.php` is the single operator-facing workflow while the existing reader, audit, migration, resolver, optimizer, operation-run, and lease services remain internal dependencies.

## Resolution contract

Automatic relationship writes remain limited to the established deterministic resolver contract: preserved explicit mappings/not-sold states, exact WooCommerce SKU, exact brand plus strong MPN, unique same-brand formatting-only SKU identity, and explicit compatibility relationships. Fuzzy/title evidence, cross-brand guesses, weak numeric diagram callouts, and ambiguous candidates remain unresolved.

The planning layer may classify and explain unresolved evidence, but it may not broaden this automatic write contract.

## Semantic source classification

Legacy schematic datasets sometimes place diagram notes, equivalence lists, quantities, adhesive instructions, or cross-references in fields historically interpreted as SKU-like values. The plan builder therefore performs a non-mutating semantic classification before generating remediation artifacts.

Examples include `SEE ... DETAIL` navigation rows, multiple part numbers joined by `=`, quantity expressions such as `X 2`, and notes containing terms such as `LOCTITE`, `SECURED WITH`, or `INSTALL WITH`. These are routed to source correction/reference dispositions rather than being represented as missing WooCommerce products.

This classification changes only the remediation plan. It does not rewrite source JSON and does not create product identity.

## Terminal dispositions

Every unresolved resolution group receives exactly one terminal planning disposition and a non-empty required action:

- `catalog_identity_correction`: strong source product identity exists, but WooCommerce/catalog identity cannot be deterministically resolved;
- `source_identifier_correction`: source identity is missing or too weak to map safely;
- `source_instruction_not_product`: the source SKU-like value is actually a note, quantity, equivalence list, or assembly instruction;
- `reference_only`: schematic navigation/reference data rather than a product identity;
- `source_unavailable`: approved schematic source is missing/unreadable;
- `source_projection_sync`: source projection drift requires review/synchronization;
- `manual_review_required`: bounded evidence exists but is not sufficient for an automatic write.

The plan also retains the optimizer's raw reason counts so diagnosis provenance is not lost.

## Plan and artifacts

Plan schema version 2 contains mode, reviewability, material fingerprint, coverage metrics, exactly-resolvable audit signal, projected/applied new mapping counts, active and catalog-only unresolved counts, proposed/applied mappings, blockers, raw reason counts, terminal disposition counts, normalized resolution groups, source errors, per-record results, and remediation artifacts.

`can_apply` is true only when there are no blocking integrity failures, the projected deterministic write count is greater than zero, and the retained explicit repair rows exactly equal that projected count. A partial/truncated write plan cannot be approved.

Generated artifacts are review outputs rather than application state:

- `report_json`: complete machine-readable plan/run report;
- `catalog_csv`: catalog identity corrections that must be handled by the owning catalog/WooCommerce workflow;
- `source_csv`: source identity, source semantic, source availability, reference, or projection corrections that must be handled in the authoritative schematic source;
- `manual_csv`: ambiguous evidence requiring explicit human review.

CSV artifacts include terminal disposition, issue provenance, source identity, impact, affected schematics, bounded candidate evidence, and a required action. `required_action` is never intentionally emitted blank.

The pipeline does not mutate repository-controlled source JSON or canonical catalog files from production wp-admin.

## Security and failure behavior

Build, export, approval, and Apply require `dtb_manage_schematics`. Mutating actions use WordPress nonces. Run access is operator scoped. Apply requires a completed operator-owned dry-run, explicit approval, a complete non-empty deterministic mutation set, no blocking integrity condition, and an exact freshly recomputed plan fingerprint. Mutation continues to use the process-wide schematic commit lease and heartbeat. A stale, failed, incomplete, or truncated plan fails closed before writes.
