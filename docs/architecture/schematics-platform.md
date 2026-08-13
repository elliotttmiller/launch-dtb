# Schematics Platform — Architecture and Handoff

Status: repository implementation complete (Phases 1-9). No live WordPress database exists anywhere in this project; nothing below describes verified live/production runtime behavior. All claims are about repository source code.

## 1. Architecture

### 1.1 Final source of truth

One authoritative domain record per schematic: the `dtb_schematic` custom post type, persisted through `Infrastructure/SchematicRecordRepository.php` and mutated only through `Application/ManageSchematicRecord.php`. Nothing else — not WordPress attachment flags, not the legacy manifest cache, not frontend hardcoded registries — determines whether a schematic exists, what pages it has, or whether it is published.

WordPress attachments, hotspot datasets, product/part relationships, the public API, the wp-admin Pipeline Suite, and the React storefront are all projections of this record.

`_dtb_is_schematic` and the old `_dtb_schematic_id` / `_dtb_schematic_page` / `_dtb_schematic_type` attachment-meta triad are no longer written anywhere in `dtb-schematics`. They are read only as **migration input** by `Application/ReconcileSchematicSource.php` (to detect drift against pre-existing attachments during a reconciliation pass) — never as an ongoing write target and never as an independent definition of schematic existence.

### 1.2 Final runtime record model

- `Domain/SchematicRecordEntity.php` — the schematic entity (canonical ID, lifecycle, brand, category, title, aliases, pages, preview policy, hotspot dataset reference, product relationships, provenance, versions).
- `Domain/SchematicPageDefinition.php` — ordered page value objects (page ID, number, label, attachment ID, source filename/checksum, media type, dimensions, hotspot dataset link, lifecycle state).
- `Domain/SchematicLifecycleStatus.php` — draft / incomplete / ready / published / retired, with explicit transition rules (`Domain/SchematicPublicationRules.php`).
- `Domain/SchematicHotspotDataset.php`, `Domain/SchematicPart.php`, `Domain/SchematicPartRelationship.php` — hotspot/part domain shapes (v2 schema: `parts_catalog` unique parts, `hotspots` physical occurrences, many-to-one hotspot→part).
- `Domain/SchematicAssetDisposition.php` — the closed set of explicit dispositions used by reconciliation (active/synchronized, source-only, uploaded-but-unattached, attached-but-unidentified, registered-to-wrong-schematic/page, duplicate, missing binary/attachment/metadata, legacy, superseded, retired, ambiguous).

### 1.3 Final source-to-storefront data flow

```text
products/launch/media/schematics/            canonical source package (read-only from this module)
  -> Infrastructure/SchematicSourceManifestReader.php   deterministic source reader
  -> Application/ReconcileSchematicSource.php           reconciliation engine (dry-run default, bounded, resumable)
  -> Infrastructure/SchematicRecordRepository.php        dtb_schematic domain record + pages (single authority)
  -> Infrastructure/SchematicAttachmentRepository.php    WordPress attachment projection
  -> Infrastructure/SchematicHotspotDatasetReader.php     hotspot JSON dataset (frontend/public/brands/**/schematic_data.json — still the sole real hotspot data source; no live migration to a backend-owned dataset store has run)
  -> Application/ResolveSchematicPartOccurrences.php      exact product/part resolution (bounded, batched — never per-hotspot)
  -> Application/GenerateSchematicResponse.php            response assembly
  -> Rest/SchematicPublicApiController.php                GET /dtb/v1/schematics, GET /dtb/v1/schematics/{id}
  -> frontend/src/pages/SchematicsPage.jsx                React storefront (catalog + viewer)
  -> Admin/PipelineSuite/*                                 wp-admin operational interface (same records, same response shape for previews)
```

### 1.4 Module ownership

- `drywalltoolbox/wp/wp-content/mu-plugins/dtb-schematics/` — schematic domain records, reconciliation, hotspot/product relationships, public API, wp-admin Pipeline Suite, schematic cache invalidation.
- `products/` — canonical schematic source package (filenames, checksums, aliases; read-only from this module).
- `frontend/src/pages/SchematicsPage.jsx` + `components/schematics-v2/*` + related hooks — customer-facing presentation, routing, viewer, hotspot rendering. Owns no availability/publication/product-resolution decisions.
- WooCommerce — remains authoritative for products/variations; `dtb-schematics` owns only the schematic↔product relationship.
- `dtb-media` — unrelated; not schematic-registration authority (confirmed no dependency either direction).

## 2. Implementation (Phase 9 changes)

### 2.1 Backend — dtb-schematics

Deleted (dead, zero live callers confirmed by grep across the whole repository):

- `Admin/SchematicEditorPage.php` (1200-line monolith; its `dtb_schematics_render_page()` had already been renamed/disconnected in Phase 6, and this phase confirmed all its `wp_ajax_dtb_schematics_*` handler *calls* were inline JS inside that same unreachable render function — no external caller existed).
- `Admin/SchematicSyncPage.php` (1674-line monolith; defined the AJAX handlers that `SchematicEditorPage.php`'s dead inline JS called — `dtb_schematics_list/get/save/remove/purge/search_products/smart_link_products/audit/import_csv/register_staged_images/import_preflight/export` — confirmed zero live callers anywhere else in the repo).
- `Infrastructure/SchematicMediaRepository.php`, `Infrastructure/SchematicManifestRepository.php` — legacy attachment-flag/manifest query layer.
- `Rest/SchematicMediaController.php`, `Rest/SchematicManifestController.php` — legacy `/dtb/v1/schematics/media` and `/dtb/v1/schematics/manifest` routes. Confirmed via full-repo grep that the only remaining frontend consumer of these routes was the already-dead `pages/Schematics.jsx` tree (removed in this phase — see §2.3); the live `SchematicsPage.jsx` only calls the new `/dtb/v1/schematics` + `/dtb/v1/schematics/{id}` endpoints.
- `Application/BuildSchematicManifest.php` — manifest-assembly function `dtb_get_schematic_media_manifest()`, used only by the two deleted REST controllers.
- `Application/SyncSchematicMedia.php` — attachment save/delete hooks that only existed to invalidate the now-deleted legacy manifest cache.
- `Validation/SchematicManifestValidator.php`, `Validation/SchematicMediaValidator.php`, `Services/SchematicMediaService.php` — legacy attachment-meta CRUD helpers (`dtb_get_schematics()`, `dtb_format_schematic()`, `dtb_save_schematic_meta()`) with zero callers outside themselves after the admin pages above were removed.

Edited (dead code removed from otherwise-live files, not wholesale deletion):

- `Application/RegisterSchematicUploads.php` — removed the entire `dtb_schematics_register_uploads()` batch-registration function and its `dtb_schematics_ajax_register_by_filename()` AJAX handler (both dead: the only caller was the deleted `SchematicEditorPage.php`'s "Import & Audit" tab). Kept every filename-parsing helper (`dtb_schematics_parse_upload_filename`, `dtb_schematics_retired_upload_reason`, `dtb_schematics_find_attachment_by_relative_file`, SKU/verbose/Dura-Stilts parsers, the retired-SKU denylist) — these are the live, sole implementation used by `Application/ReconcileSchematicSource.php`'s attachment-creation path.
- `Application/ManageSchematicRecord.php` — `dtb_schematics_invalidate_domain_cache()` no longer calls the deleted `dtb_schematics_manifest_repo_delete_cache()`; it now only bumps the public catalog/publication version, which is the sole cache-invalidation mechanism `Rest/SchematicPublicApiController.php` consumes.
- `Admin/SchematicAdminMenu.php` — removed the stale "attachments flagged with `_dtb_is_schematic`" header comment, the now-orphaned `DTB_MANIFEST_TRANSIENT` constant and `dtb_schematics_get_brand_options()` helper (both zero-caller after the deletions above), and the `wp_enqueue_media()` hook that existed only for the deleted editor's media picker. Kept the shared `dtb_schematics_can_manage()` capability check, which the Pipeline Suite still uses.
- `Admin/PipelineSuite/SuiteShell.php`, `Rest/SchematicPublicApiController.php`, `Admin/PipelineSuite/PublicationScreen.php` — updated stale comments that described the now-removed legacy admin pages/routes as still present or "pending Phase 7."
- `bootstrap.php` — removed all `dtb_module_require()` calls for the deleted files.

Backend — dtb-platform (cross-module health probes, corrected to match reality):

- `dtb-platform/SystemManager/SystemHealthService.php` — `dtb_system_schematic_health_summary()` previously probed removed functions (`dtb_register_schematics_endpoint`, `dtb_get_schematics`, `dtb_get_schematic_media_manifest`) and a nonexistent one (`dtb_schematic_supported_brands`), and checked for the removed `/dtb/v1/schematics/media` and `/manifest` routes. Now probes the real live surface (`dtb_register_schematics_public_api_routes`, `dtb_schematic_record_repo_query`, `dtb_schematics_resolve_product_ids_for_schematic`, `dtb_schematic_is_supported_brand`) and the real route paths (`/dtb/v1/schematics`, `/dtb/v1/schematics/(?P<schematic_id>...)`).
- `dtb-platform/SystemManager/IntegrationHealthService.php` — the `dtb-schematics` module-presence probe list referenced function/class names that never matched any real symbol in this codebase (`dtb_schematic_media_register_routes`, `DTB_SchematicManifestController`, etc. — these were probably always-false placeholder probes). Replaced with real, currently-defined symbols.

Legacy attachment-flag retirement: confirmed via grep that **no code in `dtb-schematics` writes** `_dtb_is_schematic`, `_dtb_schematic_id`, `_dtb_schematic_page`, or `_dtb_schematic_type` anywhere after this phase. The only remaining references are read-only, inside `Application/ReconcileSchematicSource.php`, used exclusively to detect drift against pre-existing legacy-tagged attachments during a reconciliation pass — an explicitly legitimate migration-input use, not a parallel authority.

### 2.2 Hotspot artifacts

Deleted 5 non-canonical hotspot JSON files (backups/malformed/abandoned drafts), each confirmed to (a) coexist with a canonical `schematic_data.json` in the same directory and (b) have zero references anywhere in backend or frontend source:

- `frontend/public/brands/TapeTech/Schematics/07TT/schematic_data_004.json`
- `frontend/public/brands/TapeTech/Schematics/48TT/schematic_data.backup-20260414-065412.json`
- `frontend/public/brands/TapeTech/Schematics/88TTE/schematic_data_1.json`
- `frontend/public/brands/TapeTech/Schematics/88TTE/schematic_data_2.json`
- `frontend/public/brands/Level5/Schematics/CornerFinishers/3.5-inch-Corner-Finisher/schematic_data1.json`

The 93 canonical `schematic_data.json` files were **not** touched — they remain the sole real hotspot data source, read by `Infrastructure/SchematicHotspotDatasetReader.php`. No live WP DB migration of hotspot data has occurred.

### 2.3 Frontend

Deleted (confirmed dead: zero live imports, unreachable from `App.jsx` routing, which resolves `/schematics` to `pages/SchematicsPage.jsx`):

- `frontend/src/pages/Schematics.jsx` (3,322-line old monolith)
- `frontend/src/components/schematics/BrandSelector.jsx`, `ToolSelector.jsx`, `SchematicHotspotCard.jsx` (imported only by the dead monolith; the empty `components/schematics/` directory was removed once emptied)
- `frontend/src/api/schematics.js`, `frontend/src/hooks/useSchematicMedia.js` (legacy manifest-fetch client, imported only by the dead monolith)
- `frontend/src/utils/schematicPageLabelRuntime.js`, `frontend/src/utils/mobileSchematicNavRuntime.js` (global DOM/history runtimes; install calls already removed from `main.jsx` in an earlier phase, files themselves now removed)
- `frontend/src/utils/schematicProductLookup.js` — newly-confirmed-dead in this phase (built for the old schematic selector's product-photo lookup; zero importers anywhere in `frontend/src`)

Kept (confirmed live, unrelated to the old schematics viewer):

- `frontend/src/data/schematicMappings.js` — imported by `Repairs.jsx` and `ProductDetail.jsx`.
- `frontend/src/data/productSchematicLinks.generated.js` — generated by `scripts/catalog/gen_sku_schematic_map.py`; imported by `schematicMappings.js` (still live).
- `frontend/src/data/schematicBrands.js` — imported by `components/storefront/StorefrontHeader.jsx`.

Comment cleanup: `frontend/src/main.jsx`'s stale note about `schematicPageLabelRuntime`/`mobileSchematicNavRuntime` "pending Phase 9 removal" updated to reflect that removal.

### 2.4 Documentation and configuration

- `.gitignore` — corrected two stale comment blocks: one referencing a nonexistent `dtb-schematics-api.php` single-file mu-plugin (superseded by the `dtb-schematics/` module years before this phase, comment never updated), one referencing the just-deleted `frontend/src/hooks/useSchematicMedia.js`.
- `AGENTS.md` §14 — rewritten to describe the actual current pipeline (domain record → reconciliation → attachments/hotspots/products → public API → storefront) instead of the pre-rebuild "frontend registry → manifest repository" flow.
- This document (`docs/architecture/schematics-platform.md`) — new.

## 3. Data impact

- No records were created or migrated by this phase — Phase 9 is legacy removal and reintegration, not a migration run. Phases 2-3 (prior work) already implemented the domain model and reconciliation engine; this phase did not re-run any commit-mode reconciliation.
- Asset dispositions: the static verification harness (`scripts/catalog/reconcile_schematics_dry_run_harness.php`) was re-run after all changes and still reports the same clean result as before this phase: 126 manifest rows parsed, 84 resolved, 42 explicitly retired, 0 unresolved, 0 missing binaries, 0 checksum mismatches, 0 duplicate schematic/page keys.
- Aliases preserved: no alias data was touched; `Data/SkuSchematicMap.php` (generated, live input to reconciliation) is unchanged.
- Attachment relationships: no attachment writes were performed (no live WP DB exists to write to). The code paths that *would* write attachments (`Application/ReconcileSchematicSource.php`) are unchanged in behavior — only the now-dead duplicate write path in `RegisterSchematicUploads.php` was removed.
- Records retired: none (no live runtime).
- Genuinely unresolved schematic identities: none newly discovered by this phase.

## 4. API and cache impact

- Routes added: none in this phase.
- Routes changed: none in this phase.
- Routes removed: `GET /dtb/v1/schematics/media`, `GET /dtb/v1/schematics/manifest` — both confirmed to have zero live consumers before removal.
- Compatibility delegates: none created or retained — the removed routes had no verified active consumer, so no delegate was needed (per spec: "Retain old API routes only where a verified active consumer still requires them").
- Response contracts: unchanged for the live routes (`GET /dtb/v1/schematics`, `GET /dtb/v1/schematics/{schematic_id}`), owned by `Rest/SchematicPublicApiController.php` + `Application/GenerateSchematicResponse.php`.
- Invalidation behavior: unchanged in effect — `dtb_schematics_invalidate_domain_cache()` bumps the public catalog/publication version, which is what the public API's cache headers and versioned media URLs key off. The redundant call to the now-deleted legacy manifest cache was removed; it was never functionally required by the live route.

## 5. Documentation

- Architecture: this document.
- Source-package contract: unchanged, documented in `Application/RegisterSchematicUploads.php`'s header comment and `scripts/catalog/normalize_schematic_filenames.py`.
- Schematic lifecycle: `Domain/SchematicLifecycleStatus.php`, `Domain/SchematicPublicationRules.php`.
- Pipeline Suite workflow: `Admin/PipelineSuite/*` (Overview, Inventory, Detail, Assets, Hotspot Data, Product Relationships, Reconciliation, Publication, Activity, Configuration) — unchanged in this phase except the two comment corrections in §2.1.

## 6. Residual risks (external dependencies / unresolved decisions only)

- No live WordPress database migration has been run anywhere in this project. The first live `wp dtb schematics reconcile --commit` run (or equivalent admin "Register Missing Attachments" / "Reconcile Selected Records" operation) needs operator supervision on a real WP environment — this is an operational/deployment step outside this repository's implementation scope, not unfinished code.
- Hotspot datasets remain filesystem JSON under `frontend/public/brands/**/schematic_data.json` rather than a backend-owned dataset store; this is the existing, intentional architecture (per the Phase 9 brief: "these JSON files are still the only real data and must be preserved"), not a gap.
- The wp-admin Pipeline Suite's "Frontend Drift" comparison (`Admin/PipelineSuite/PublicationScreen.php`) is a best-effort, repository-checkout-only scan of two presentation-only frontend data files for schematic-ID string literals — it cannot observe a live deployed frontend's actual runtime state. This is an inherent limitation of a static, no-live-environment repository, not an in-scope defect.

## 7. Environment status

Everything in this document describes repository source code as committed to this working tree. No WordPress admin action, database write, REST request, or deployment occurred. `php -l` was run against every PHP file in `dtb-schematics` plus the two edited `dtb-platform` files (54 files, 0 syntax errors). `npm run build` and `npm run lint` were run in `frontend/` after all changes (build succeeded; lint reported only pre-existing, unrelated warnings/errors in `Repairs.jsx`, `ProductDetail.jsx`, and `ProductsCatalogPlatform.jsx` — none in any schematics file). The static reconciliation harness was re-run and matched its pre-Phase-9 output exactly.
