# Schematics Hotspot Resolution Pipeline

## Authority

The Hotspot Resolver is one bounded launch-remediation pipeline. `frontend/public/brands/**/schematic_data*.json` remains schematic hotspot source truth, live WooCommerce remains product/variation identity authority, and DTB Schematics owns normalized hotspot projections plus schematic-part relationships. The pipeline never creates a parallel runtime catalog and never rewrites protected SKU, MPN, GTIN, or brand identity.

The repository `products/` tree remains canonical catalog source data. A deployed WordPress host is not assumed to contain a Git checkout, so production does not invent product identity from unavailable repository files. Catalog/source correction outputs identify upstream ownership without turning wp-admin into a second catalog editor.

## Single operator workflow

The supported wp-admin workflow is deliberately small:

1. **Build full resolution plan** — one read-only pass across authoritative schematic sources, persisted schematic state, and live WooCommerce identity.
2. **Review complete pre-apply plan** — inspect source integrity, deterministic proposed mappings, active unresolved hotspots, catalog-only gaps, terminal dispositions, source failures, and the consolidated audit export.
3. **Approve & Apply** — available only for a complete deterministic mapping set with no integrity blocker. The shared operation runner requires the approved plan fingerprint, acquires the schematic commit lease, rebuilds authoritative state while the lease is held, and aborts before writes unless the fresh material fingerprint still matches.
4. **Review committed result** — inspect the operation result and export it from the same pipeline surface.

Exports are artifacts of this workflow, not separate resolver workflows.

`Application/BuildHotspotResolutionPlan.php` is the plan/report composition layer. `Application/ExportHotspotResolutionWorkbook.php` projects that same plan into the consolidated operator workbook. `Admin/Diagnostics/HotspotResolutionPipeline.php` is the consolidated operator transport. Source readers, migration/resolution services, operation-run persistence, and the process-wide commit lease remain application dependencies.

## Deterministic resolution contract

Automatic part relationships remain limited to the established resolver contract:

1. preserve explicit product/variation mappings and intentionally-not-sold states;
2. exact WooCommerce SKU;
3. exact protected MPN plus same-brand identity;
4. unique same-brand formatting-only SKU identity;
5. explicit compatibility relationships by exact protected identity;
6. otherwise unresolved.

Fuzzy/title evidence, cross-brand guesses, weak numeric diagram callouts, and ambiguous candidates do not auto-apply. Review evidence may explain an unresolved identity but cannot become mutation authority.

## Source integrity contract

The source audit reads only approved schematic-data references through the established source resolver, reader, normalization, grouping, and merge path.

The canonical repository tree is `frontend/public/brands`. Frontend builds copy
that tree without transformation to `dist/brands` for production and
`dist-staging/brands` for staging. On SiteGround, the approved runtime root is
`public_html/brands` when `WP_ENVIRONMENT_TYPE` is `production`, and
`public_html/staging/brands` when it is `staging` (including a WordPress
installation already rooted below `public_html/staging`). A nonstandard host
layout may define the server-only absolute
`DTB_SCHEMATIC_HOTSPOT_SOURCE_ROOT`; request URLs never select filesystem
authority. The production and staging build validations fail unless every
`schematic_data*.json` source is valid JSON and is emitted at the same
case-sensitive relative path with identical bytes.

Each authoritative source group is classified independently:

- `ok` — complete readable source with no drift or structural issue;
- `attention` — readable source with projection/source relationship drift but no structural hotspot corruption;
- `partial` — at least one source member/read failed while other data was available;
- `invalid` — source contains dangling hotspot references, invalid hotspot coordinates, duplicate hotspot IDs, or page mismatches;
- `missing` — no approved source can be associated with the schematic;
- `error` — approved source references exist but none can be read into a usable dataset.

`partial` and `invalid` are fail-closed Apply blockers. A partial multi-file source must never be interpreted as authoritative because omitted source members can make legitimate persisted relationships appear absent. Structural hotspot defects must be corrected at the schematic source before mapping mutations are approved.

When requested internally, the audit can expose the deterministic `projected_parts` relationship projection generated from the same normalized source dataset used by the migration/resolution path. The normal bounded audit does not carry this larger projection unnecessarily.

## Terminal unresolved dispositions

Every unresolved group receives one terminal planning disposition and a non-empty required action:

- `catalog_identity_correction` — usable manufacturer identity exists but live WooCommerce does not satisfy the deterministic contract;
- `source_identifier_correction` — source identity is missing or too weak;
- `source_instruction_not_product` — a legacy SKU-like field contains an instruction, quantity, equivalence list, or assembly note;
- `reference_only` — schematic navigation/reference data rather than product identity;
- `source_unavailable` — approved schematic source is missing or unreadable;
- `source_projection_sync` — readable source differs from the persisted projection and requires review;
- `manual_review_required` — bounded evidence exists but is insufficient for an automatic relationship.

These dispositions explain ownership. They do not broaden the automatic resolver and do not mutate repository-controlled source/catalog data from production wp-admin.

## Plan schema and completeness

`Application/BuildHotspotResolutionPlan.php` currently emits plan schema version 3 on the rebased production branch.

The plan contains:

- schematic/source/hotspot coverage metrics;
- exactly-resolvable audit signal;
- projected and applied deterministic mapping counts;
- explicit proposed mapping rows;
- active and catalog-only unresolved counts;
- source unavailable, partial, invalid, and drift state;
- raw optimizer reason counts;
- terminal disposition counts and normalized resolution groups;
- source errors and per-record source status;
- normalized catalog/source/manual remediation projections;
- a material approval fingerprint.

`can_apply` is true only when:

- there is no fatal or failed-record blocker;
- no source group is `partial` or `invalid`;
- no bounded plan output was truncated;
- the projected deterministic mapping count is greater than zero; and
- the retained explicit mapping rows exactly equal the projected mapping count.

The current production optimizer exposes deterministic mapping mutations as its explicit safe write set. The plan therefore does not claim broader relationship-removal/remap coverage that the active implementation does not currently expose.

## Approval fingerprint and commit-time freshness

The material plan fingerprint covers the reviewed mapping targets, terminal unresolved dispositions and impact, per-schematic source status/drift, aggregate source read/unavailable state, and failed-record state.

Every committing `optimize_hotspots` operation requires a valid approved fingerprint. This requirement is enforced in `Application/RunSchematicOperation.php`, not merely in the admin transport.

For a commit, the shared operation runner:

1. creates the operator run;
2. acquires the process-wide schematic commit lease;
3. renews the lease heartbeat;
4. rebuilds a complete fresh dry-run plan from current authoritative source and live WooCommerce while the lease is held;
5. requires the fresh plan to remain applicable;
6. compares the fresh fingerprint to the operator-reviewed fingerprint with `hash_equals`;
7. aborts with zero hotspot-domain writes on any mismatch;
8. invokes the established optimizer/migration path only after the check succeeds.

This closes the review-to-commit race and also prevents another internal caller from bypassing operator-approved plan freshness for a committing hotspot optimizer run.

## Consolidated audit export

The operator-facing export is one XLSX workbook generated from the same run payload and plan used by wp-admin. It contains these worksheets:

- **Summary** — run identity, applicability, coverage, source integrity, disposition counts, reason counts, and blockers;
- **Resolution Plan** — the complete normalized unresolved plan with disposition, identity, impact, evidence, and required action;
- **Catalog Corrections** — catalog/WooCommerce-owned corrections;
- **Source Corrections** — authoritative schematic-source corrections;
- **Manual Review** — ambiguous identities that require explicit review;
- **Deterministic Mappings** — exact proposed product relationships eligible for Apply;
- **Source Audit** — per-schematic source status and interpreted source metrics;
- **Run Metadata** — lossless run and optimizer metadata suitable for technical audit.

The workbook is generated on demand with a native bounded OOXML writer. It requires PHP `ZipArchive`; no new Composer package or parallel spreadsheet dependency is introduced. The temporary workbook is deleted immediately after the authenticated download is streamed.

The complete JSON report remains available as the optional lossless machine-readable representation of the same run. The former three separate CSV download actions are no longer exposed by the consolidated admin workflow.

Workbook/JSON exports are diagnostic and remediation artifacts rather than application state. They do not create WooCommerce products, rewrite protected product identifiers, or edit `frontend/public/brands` or repository catalog files.

## Security and failure behavior

Build, export, approval, and Apply require `dtb_manage_schematics`. Mutating requests use WordPress nonces. Operation-run access is scoped to the initiating operator. Export access uses the same operator-owned run lookup and nonce boundary as the pipeline. Committing hotspot optimizer operations require a valid reviewed fingerprint and the shared commit lease. Stale, failed, partial-source, structurally invalid, mismatched, or truncated plans fail closed before hotspot-domain writes.
