# Schematics Platform

Status: active repository architecture. Runtime data and deployment state must be verified in a real WordPress environment.

## 1. Authority and ownership

`dtb-schematics` owns schematic identity, lifecycle, page relationships, hotspot datasets, product relationships, reconciliation, public projections, and the wp-admin control center.

The private `dtb_schematic` custom post type is the sole authority for whether a schematic exists and what it contains. It is persisted through `Infrastructure/SchematicRecordRepository.php` and mutated through application services. WordPress attachments, hotspot datasets, linked WooCommerce product IDs, REST responses, wp-admin views, and React screens are projections of that record.

WooCommerce remains authoritative for products and variations. On SiteGround, `wp-content/uploads/2026/schematics/` is the primary read-only runtime binary source. Other upload years are fallback candidates; the 2026 directory wins filename collisions. A local repository checkout may use `products/launch/media/schematics/` for deterministic development verification. React owns storefront presentation only.

Filesystem discovery treats only original diagram filenames as source rows. WordPress-generated responsive derivatives (`-{width}x{height}`, `-scaled`, and `-rotated`) remain attachment projections and are excluded, preventing attachment generation from changing the reconciliation manifest between batches.

## 2. Source-to-storefront flow

```text
SiteGround wp-content/uploads/2026/schematics/
  (or local products/launch/media/schematics/ verification source)
  -> SchematicSourceManifestReader
  -> RunSchematicOperation
  -> ReconcileSchematicSource / MigrateSchematicHotspotDatasets
  -> WordPress attachment projection
  -> dtb_schematic record and normalized hotspot/product relationships
  -> publication validation and catalog-version invalidation
  -> GET /dtb/v1/schematics
  -> GET /dtb/v1/schematics/{schematic_id}
  -> React SchematicsPage
```

The live public API is limited to the collection and detail routes above. The private CPT is not public REST storage, and the frontend does not decide availability or publication.

Schematic brand IDs use one canonical contract across API records, generated links, header navigation, and route state: `columbia`, `tape-tech`, `sur-pro`, `platinum`, `dura-stilts`, and `level5`. Customer-facing names are stored separately. Legacy route aliases such as `columbia-taping-tools`, `tapetech`, `surpro`, `platinum-drywall-tools`, `durastilts`, and `level-5` are accepted only as inbound compatibility values and are replaced with their canonical query value in the browser.

Hotspot source JSON is read from the approved `frontend/public/brands/**/schematic_data*.json` repository source or its deployment-equivalent `/brands` root. The hotspot reader validates references against those fixed roots, enforces file/part/occurrence bounds, understands legacy and v2 source schemas, normalizes geometry, and never fabricates missing coordinates.

## 3. Schematics and Hotspots control center

The primary wp-admin interface is `Admin/Workspace/Workspace.php`. It is intentionally a small control center, not a diagram editor or hotspot-authoring studio.

Its primary surfaces are:

- Dashboard: bounded health summary and records needing attention.
- Catalog: searchable, paginated authoritative records with lifecycle and readiness.
- Record: pages/attachments, normalized hotspot state, exact product-link state, publication requirements, preview, and record-scoped operations.
- Operations and history: global reconciliation preview/commit and append-only operational results.

The `Admin/Diagnostics/HotspotResolver.php` surface supports hotspot/part diagnosis while source data is being reconciled. It does not introduce a second source of truth. `Application/DiagnoseSchematicHotspots.php` operates against authoritative schematic relationships and delegates all writes through `Application/ManageSchematicRecord.php`. Automatic repair is limited to the existing deterministic resolution contract: explicit preserved override, exact SKU, exact brand plus protected MPN, and explicit compatibility relationship. Fuzzy/title candidates are review-only and require an explicit operator decision.

The resolver also includes a read-only source-truth audit implemented by `Application/AuditSchematicHotspotSources.php`. It reads current `frontend/public/brands` hotspot files through the same approved source locator, reader, normalization, source grouping, and dataset-merge semantics used by `MigrateSchematicHotspotDatasets.php`. It compares current source interpretation to the persisted normalized projection and reports source drift, source-only/stored-only parts, dangling hotspot part references, invalid coordinates, duplicate hotspot identities, page mismatches, source read failures, and exact-resolution potential. Source audit findings never mutate the source files, WooCommerce products, protected identifiers, or schematic records.

The bounded optimizer is implemented by `Application/OptimizeSchematicHotspots.php` and `Admin/Diagnostics/HotspotOptimizerPanel.php`. It is invoked from the Hotspot Resolver and runs through `RunSchematicOperation.php` as `optimize_hotspots`. Preview mode performs no writes. Apply mode acquires the existing process-wide schematic commit lease, audits the current approved source data, runs the existing hotspot migration for every bounded authoritative record, refreshes deterministic part resolution, then classifies every remaining unresolved relationship into an operator work queue. Repeated part identities are collapsed across schematics so one catalog/source problem is shown once with its total relationship and hotspot impact.

The optimizer never creates WooCommerce products and never rewrites SKU, MPN, brand, or other protected catalog identifiers. Its commit path is restricted to the existing schematic dataset/relationship writes already owned by `MigrateSchematicHotspotDatasets.php` and `ManageSchematicRecord.php`. Exact SKU, exact brand+MPN, preserved explicit override, intentionally-not-sold state, and explicit compatibility remain the only automatic resolution mechanisms. MPN/brand conflicts, formatting similarities, title candidates, missing source identifiers, and absent catalog matches are diagnostic evidence only and are emitted with a required operator resolution.

When an expected source file is missing or unreadable, source projection is reported as `Not evaluable`, never `Aligned`. The optimizer records that source as an outstanding source-level issue and does not fabricate a part-level diagnosis from stale persisted data.

The dashboard reports whether the SiteGround 2026 directory is detected, its bounded image count, the effective source mode, and direct links to the public catalog endpoint and `/schematics` storefront route. It never exposes an absolute server path.

The control center does not accept arbitrary filesystem paths, edit diagram graphics, edit hotspot coordinates, create products, or write post meta directly. It delegates mutations to application services and presents operator-scoped run results.

The Image Sync tool also exposes a fixed `Schematic diagrams — uploads/2026/schematics` pathway. It is an operator entry point only: its `Register & Link Schematics` action requires both Image Sync and Schematics permissions and delegates bounded preview/apply batches to `dtb_schematic_run_operation()`. Product-media registration and WooCommerce gallery services never process the schematic directory.

## 4. Operation contract

`Application/RunSchematicOperation.php` is the shared command boundary for wp-admin and reconciliation CLI work. Supported operation kinds are:

- `reconcile`: bounded source/attachment/record reconciliation;
- `migrate_hotspots`: normalize a selected record's source dataset and resolve its parts;
- `refresh_products`: refresh a selected record's exact WooCommerce product projection;
- `optimize_hotspots`: one-time all-record hotspot source synchronization, deterministic resolution, and unresolved-root-cause classification;
- `publish`, `retire`, and `refresh_public_projection`: lifecycle/public projection mutations serialized by the same commit lease.

Every operation has a UUID run identity, operator identity, dry-run/commit mode, bounded request and result payload, completion state, and activity record. Completed run options are non-autoloaded and retained through a bounded index. Optimizer output includes aggregate source/part/hotspot metrics, projected or applied exact repairs, source errors, root-cause counts, and a bounded resolution work queue. Run results are available only to the initiating operator.

Commit operations acquire a process-wide compare-and-swap lease. The owning run renews that lease between bounded records and stops before further writes if owner-verified renewal fails. Concurrent admin/CLI commits are rejected. WP-CLI reconciliation and hotspot migration use the same command boundary and lease. Dry runs use isolated in-memory cursor state and never read, reset, advance, or save the shared commit cursor.

Reconciliation never retires records by default. Retirement by source omission requires a separate explicitly reviewed full-pass policy; ordinary admin and CLI reconciliation pass `retire_uncovered => false`.

Reconciliation finalizes a canonical record only after its final manifest row has been processed. Finalization persists canonical brand/category IDs and customer-facing brand/category/title metadata, fills family metadata, refreshes linked WooCommerce IDs, migrates the normalized hotspot dataset, resolves parts through exact identifiers, compares every expected manifest page/checksum, and evaluates live attachment descriptions. Only a record with public attachment URLs, complete source pages, required normalized hotspot data, and no unresolved part relationships advances through ready to published. A previously published record that no longer satisfies the contract is moved to incomplete and excluded from both collection and detail API projections.

## 5. Security and write boundaries

- The admin page and every mutation require `dtb_schematics_can_manage()` and a WordPress nonce.
- The one-time optimizer apply action additionally requires an explicit server-validated confirmation value and the shared commit lease.
- Commit and lifecycle transitions require explicit server-validated confirmation.
- Record-scoped operations validate that the requested authoritative record exists.
- Operation names are allowlisted; selected IDs and batches are capped.
- Product relationships use exact WooCommerce identifiers. No fuzzy matching runs in public requests or automatic resolver writes.
- Review-only resolver/optimizer candidates never modify protected product SKU, MPN, brand, or other catalog identity fields.
- Public REST behavior and response shapes are unchanged by the control-center rebuild.
- Run results are readable only by the initiating operator.
- Errors and activity data are bounded; no credentials, payment data, or arbitrary browser-supplied paths are stored.
- Source manifest entries must be plain supported image filenames, attachment sources must remain inside WordPress uploads, and hotspot JSON references must resolve under approved `frontend/public/brands/` or deployment-equivalent `/brands` roots.
- Hotspot files and normalized part/hotspot counts have explicit resource limits. Failed normalized-dataset persistence compensates by restoring the prior record projection.
- The source-truth diagnostic is read-only and bounded; resolver mutations still pass through application services and the canonical schematic capability/nonce boundary.

## 6. Persistence and data impact

The rebuild introduces no new public schema and no catalog identifier migration. It adds non-autoloaded WordPress options for bounded operation-run results, a completed-run index, and the active commit lease. Existing schematic records, page definitions, hotspot datasets, activity rows, WooCommerce products, and public API shapes are preserved.

The source audit adds no persistence. It derives its report from current approved hotspot source files, persisted normalized schematic data, authoritative record page/part relationships, and read-only WooCommerce resolution lookups.

The optimizer adds no new domain persistence. Preview runs only store the existing bounded operation-run result/history. Apply runs may update normalized hotspot datasets and schematic part relationships through the established migration/application services, and record a `hotspot_one_time_optimizer` activity entry. WooCommerce product/catalog data is read-only throughout the optimizer.

No live reconciliation or migration is implied by repository changes. A commit action in wp-admin or WP-CLI is still an explicit runtime operation.

## 7. Recovery and rollback

- A failed run retains its bounded result and error for operator review.
- The commit lease expires after a bounded interval, is renewed only by its owning run, and can be replaced only through compare-and-swap logic.
- Dry-run results do not mutate the reconciliation cursor or domain data.
- Re-running attachment and record reconciliation relies on existing idempotent source identity and application services.
- The optimizer is retry-safe at the schematic layer because it delegates source synchronization to checksum/projection-aware hotspot migration and preserves explicit/not-sold decisions.
- Publication and retirement use the established lifecycle services; no direct CPT/meta rollback path is introduced.
- Code rollback restores the prior module files but does not reverse a commit already performed against a live database. Runtime data recovery must use the recorded run/activity evidence and WordPress backup procedures.

## 8. Operational limitations

This repository does not contain a live WordPress database. PHP syntax and static reconciliation checks can validate wiring and source identity, but they do not prove wp-admin rendering, database locking, attachment writes, WooCommerce resolution, or public REST responses in production. Those behaviors require a staged WordPress smoke run with real data and operator credentials.
