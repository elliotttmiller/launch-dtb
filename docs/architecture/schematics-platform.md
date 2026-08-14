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

## 3. Schematics and Hotspots control center

The wp-admin interface is `Admin/Workspace/Workspace.php`. It is intentionally a small control center, not a diagram editor or hotspot-authoring studio.

Its primary surfaces are:

- Dashboard: bounded health summary and records needing attention.
- Catalog: searchable, paginated authoritative records with lifecycle and readiness.
- Record: pages/attachments, normalized hotspot state, exact product-link state, publication requirements, preview, and record-scoped operations.
- Operations and history: global reconciliation preview/commit and append-only operational results.

The dashboard reports whether the SiteGround 2026 directory is detected, its bounded image count, the effective source mode, and direct links to the public catalog endpoint and `/schematics` storefront route. It never exposes an absolute server path.

The control center does not accept arbitrary filesystem paths, edit diagram graphics, edit hotspot coordinates, create products, or write post meta directly. It delegates mutations to application services and presents operator-scoped run results.

The Image Sync tool also exposes a fixed `Schematic diagrams — uploads/2026/schematics` pathway. It is an operator entry point only: its `Register & Link Schematics` action requires both Image Sync and Schematics permissions and delegates bounded preview/apply batches to `dtb_schematic_run_operation()`. Product-media registration and WooCommerce gallery services never process the schematic directory.

## 4. Operation contract

`Application/RunSchematicOperation.php` is the shared command boundary for wp-admin and reconciliation CLI work. Supported operation kinds are:

- `reconcile`: bounded source/attachment/record reconciliation;
- `migrate_hotspots`: normalize a selected record's source dataset and resolve its parts;
- `refresh_products`: refresh a selected record's exact WooCommerce product projection.
- `publish`, `retire`, and `refresh_public_projection`: lifecycle/public projection mutations serialized by the same commit lease.

Every operation has a UUID run identity, operator identity, dry-run/commit mode, bounded request and result payload, completion state, and activity record. Completed run options are non-autoloaded and retained through a bounded index.

Commit operations acquire a process-wide compare-and-swap lease. The owning run renews that lease between bounded records and stops before further writes if owner-verified renewal fails. Concurrent admin/CLI commits are rejected. WP-CLI reconciliation and hotspot migration use the same command boundary and lease. Dry runs use isolated in-memory cursor state and never read, reset, advance, or save the shared commit cursor.

Reconciliation never retires records by default. Retirement by source omission requires a separate explicitly reviewed full-pass policy; ordinary admin and CLI reconciliation pass `retire_uncovered => false`.

## 5. Security and write boundaries

- The admin page and every mutation require `dtb_schematics_can_manage()` and a WordPress nonce.
- Commit and lifecycle transitions require explicit server-validated confirmation.
- Record-scoped operations validate that the requested authoritative record exists.
- Operation names are allowlisted; selected IDs and batches are capped.
- Product relationships use exact WooCommerce identifiers. No fuzzy matching runs in public requests.
- Public REST behavior and response shapes are unchanged by the control-center rebuild.
- Run results are readable only by the initiating operator.
- Errors and activity data are bounded; no credentials, payment data, or arbitrary browser-supplied paths are stored.
- Source manifest entries must be plain supported image filenames, attachment sources must remain inside WordPress uploads, and hotspot JSON references must resolve under `frontend/public/brands/`.
- Hotspot files and normalized part/hotspot counts have explicit resource limits. Failed normalized-dataset persistence compensates by restoring the prior record projection.

## 6. Persistence and data impact

The rebuild introduces no new public schema and no catalog identifier migration. It adds non-autoloaded WordPress options for bounded operation-run results, a completed-run index, and the active commit lease. Existing schematic records, page definitions, hotspot datasets, activity rows, WooCommerce products, and public API shapes are preserved.

No live reconciliation or migration is implied by repository changes. A commit action in wp-admin or WP-CLI is still an explicit runtime operation.

## 7. Recovery and rollback

- A failed run retains its bounded result and error for operator review.
- The commit lease expires after a bounded interval, is renewed only by its owning run, and can be replaced only through compare-and-swap logic.
- Dry-run results do not mutate the reconciliation cursor or domain data.
- Re-running attachment and record reconciliation relies on existing idempotent source identity and application services.
- Publication and retirement use the established lifecycle services; no direct CPT/meta rollback path is introduced.
- Code rollback restores the prior module files but does not reverse a commit already performed against a live database. Runtime data recovery must use the recorded run/activity evidence and WordPress backup procedures.

## 8. Operational limitations

This repository does not contain a live WordPress database. PHP syntax and static reconciliation checks can validate wiring and source identity, but they do not prove wp-admin rendering, database locking, attachment writes, WooCommerce resolution, or public REST responses in production. Those behaviors require a staged WordPress smoke run with real data and operator credentials.
