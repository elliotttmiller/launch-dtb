ROLE AND MANDATE

Act as the Distinguished Principal Engineer, Systems Architect, WordPress/WooCommerce Backend Engineer, Senior React Engineer, Data Pipeline Engineer, and Senior Product UI/UX Engineer responsible for rebuilding the complete Drywall Toolbox schematics platform.

Repository:

D:\AMD\projects\launch-dtb

Execute this task completely from active-source discovery through architecture consolidation, implementation, data migration, wp-admin rebuilding, frontend rebuilding, legacy removal, and final handoff.

This is not:

- an audit-only task;
- a planning-only task;
- a mockup-only task;
- a visual hotspot editor;
- a diagram-design application;
- a superficial UI redesign;
- an isolated image-registration fix.

Inspect the active implementation and then make the required production-grade changes in the owning modules.

Do not stop after documenting problems or building only one layer. Complete the source-to-storefront pipeline.

Do not introduce temporary patches, duplicated authorities, unfinished compatibility layers, placeholder implementations, dead code, deferred TODOs, or parallel old/new systems.


PRIMARY OBJECTIVE

Completely refactor, redesign, rebuild, optimize, migrate, and reintegrate the Drywall Toolbox schematics architecture across:

1. canonical schematic source data;
2. schematic image assets;
3. filename and alias resolution;
4. WordPress media attachments;
5. authoritative schematic domain records;
6. page and preview relationships;
7. hotspot datasets;
8. schematic-part relationships;
9. WooCommerce product projections;
10. public schematic REST APIs;
11. manifest generation and cache behavior;
12. React schematic catalog and navigation;
13. React diagram viewer and hotspot presentation;
14. wp-admin Schematics Pipeline Suite;
15. source-to-frontend reconciliation and drift management;
16. publication and retirement workflows;
17. legacy-data migration;
18. obsolete-code and duplicate-authority removal.

The completed system must have:

- one canonical schematic source package;
- one authoritative backend schematic domain model;
- one synchronized wp-admin operational interface;
- one public API contract;
- one frontend consumption path;
- one coherent lifecycle from source asset to customer-facing schematic.


REPOSITORY AND OWNERSHIP CONTEXT

Follow the repository AGENTS.md and active source precedence.

Canonical ownership boundaries:

products/
- owns canonical catalog and schematic source material;
- owns stable source identities, filenames, aliases, hotspot datasets, and generation inputs.

drywalltoolbox/wp/wp-content/mu-plugins/dtb-schematics/
- owns schematic domain records;
- owns schematic registration and reconciliation;
- owns page-to-attachment relationships;
- owns schematic manifests and APIs;
- owns hotspot/media relationships;
- owns schematic-to-part relationships;
- owns publication and retirement state;
- owns schematic-specific cache invalidation;
- owns the wp-admin Schematics Pipeline Suite.

frontend/
- owns customer-facing schematic presentation;
- owns routing and URL state;
- owns catalog, brand, category, and tool-selection UI;
- owns diagram viewing, page switching, zoom, hotspots, part presentation, responsive behavior, and API consumption;
- does not own production schematic availability, attachment identity, publication state, or product resolution.

WooCommerce:
- remains authoritative for runtime products and variations.

dtb-catalog-platform:
- remains authoritative for broader catalog normalization and compatibility behavior.

dtb-media:
- may provide shared media utilities;
- must not become the authority for schematic registration or schematic records.

WordPress attachments:
- remain runtime media records;
- must not independently determine whether a schematic exists.

Do not modify WordPress core or third-party plugin internals.


CURRENT SOURCE AND RUNTIME CONTEXT

Live schematic binaries are located under:

/wp/wp-content/uploads/2026/schematics/

The supplied repository copy is currently located under:

products/launch/media/schematics/

Historical source and tooling may also reference:

products/schematics/

Inspect all active consumers, generators, scripts, ignore rules, imports, and deployment workflows before establishing the final source location.

Do not leave multiple independently maintained asset directories.

Previously established source conventions include:

{brand}_{sku-or-stable-alias}_sch-page-{NNN}.webp

Not every schematic corresponds to one unique sellable SKU.

Preserve:

- shared schematic identities;
- schematic-only assets;
- intentional aliases;
- legacy identities still required by active data;
- TapeTech 07TT multipage assets;
- distinct Columbia HMP-2022 and TBMP-2022 pump assets.


STARTING IMPLEMENTATION EVIDENCE

Treat the following as established starting evidence, but confirm active source before changing behavior:

- The source asset package contains approximately 126 WebP diagrams.
- The public manifest represents fewer files and schematics than the frontend expects.
- The live public manifest currently supplies no explicit preview images.
- Manifested assets lack width and height metadata.
- wp-admin can report “No schematics found” while storefront schematics remain available.
- Filename registration and manual wp-admin saving currently write different attachment metadata.
- The public manifest identifies records through _dtb_schematic_id.
- The wp-admin list identifies records through _dtb_is_schematic.
- The current removal workflow can remove an item from the admin list while leaving it in the public manifest.
- The main React schematic page contains an oversized hardcoded registry and combines routing, media, hotspots, product lookups, gestures, dialogs, and rendering.
- A second frontend mapping registry is incomplete relative to the main registry.
- Placeholder fallback can prevent the first valid diagram page from becoming the card preview.
- The hotspot v2 schema permits multiple physical occurrences per part.
- The current renderer may retain only the first hotspot occurrence for a part.
- wp-admin product mappings are not the primary product-resolution path used by the storefront.
- The frontend can perform product requests after individual hotspot interactions.
- Global DOM mutation and click-interception runtimes duplicate behavior that should be owned by React.


NON-NEGOTIABLE TARGET ARCHITECTURE

Implement this architecture:

Canonical Schematic Source Package
    -> Deterministic Source Reader
    -> Reconciliation and Migration Service
    -> Authoritative dtb-schematics Domain Records
    -> WordPress Attachment Relationships
    -> Hotspot and Product Projections
    -> Public Catalog and Detail APIs
    -> React Storefront
    -> wp-admin Schematics Pipeline Suite

A schematic must exist once as an authoritative domain record.

The following must be projections of that record:

- source files;
- WordPress attachments;
- diagram pages;
- previews;
- hotspot datasets;
- parts;
- WooCommerce relationships;
- public manifest entries;
- API responses;
- wp-admin inventory;
- storefront catalog cards;
- storefront diagram viewers.

Do not retain:

- separate definitions of schematic existence;
- competing frontend production registries;
- attachment flags as a parallel domain authority;
- fuzzy identity matching during customer requests;
- duplicate public part-resolution systems;
- per-hotspot WooCommerce request loops;
- normal workflows that require manual cache purging;
- global DOM manipulation used to repair React-rendered UI;
- obsolete legacy implementations without an active consumer.


AUTHORITATIVE SCHEMATIC DOMAIN MODEL

Create one stable schematic domain record containing at least:

- immutable canonical schematic ID;
- source schema version;
- lifecycle status;
- brand ID;
- brand display name;
- category ID;
- category display name;
- customer-facing title;
- model or tool identity where applicable;
- description where appropriate;
- aliases;
- ordered page definitions;
- preview policy;
- linked tool products;
- hotspot dataset relationships;
- part relationships;
- source provenance;
- source/catalog version;
- public publication version;
- created and updated metadata.

Each schematic page must contain:

- stable page ID;
- page number;
- page label;
- attachment ID;
- source filename;
- source checksum or immutable asset version;
- media type;
- width;
- height;
- responsive media sources where available;
- hotspot dataset relationship;
- page lifecycle state.

Use explicit lifecycle states such as:

- draft;
- incomplete;
- ready;
- published;
- retired.

Publication eligibility must be derived from the authoritative record and its required relationships.

Do not use `_dtb_is_schematic` as an independent definition of schematic existence.

Use the simplest WordPress-compatible persistence model that creates one authority. A private `dtb_schematic` custom post type with an owning repository and application-service layer is appropriate unless active implementation contains a stronger established domain-record mechanism.

Do not expose raw persistence details directly to controllers, admin presentation code, or frontend consumers.


CANONICAL SOURCE PACKAGE

Create one deterministic source package under `products/`.

The source package must contain:

- one canonical record per schematic;
- stable schematic IDs;
- stable brand and category IDs;
- ordered page definitions;
- source filenames;
- source checksums or versions;
- canonical aliases;
- preview policy;
- hotspot dataset references;
- product and part references;
- lifecycle status;
- source provenance;
- explicit asset dispositions.

Select one authoritative source directory and update all active generators, scripts, imports, documentation, and consumers.

Do not retain both:

- `products/schematics/`
- `products/launch/media/schematics/`

as independent authorities.

Large media binaries may be managed outside ordinary Git history if required, but the following must remain versioned and deterministic:

- canonical source manifest;
- schematic identities;
- filenames;
- page ordering;
- aliases;
- checksums;
- relationships;
- expected output.

Do not infer a sellable SKU for every schematic.

Preserve schematic-only aliases and shared diagram identities explicitly.


RECONCILIATION AND MIGRATION PIPELINE

Implement one deterministic schematic reconciliation service and operational script.

The reconciliation engine must compare:

1. canonical source records;
2. canonical source binaries;
3. configured staged/live upload-directory contents;
4. WordPress media attachments;
5. legacy attachment metadata;
6. authoritative schematic domain records;
7. page relationships;
8. hotspot datasets;
9. product and variation projections;
10. public API output;
11. frontend expectations still present during migration.

Every discovered asset must receive one explicit disposition:

- active and synchronized;
- source-only;
- uploaded but unattached;
- attached but unidentified;
- registered to the wrong schematic;
- registered to the wrong page;
- duplicate schematic/page;
- missing source binary;
- missing WordPress attachment;
- missing media metadata;
- legacy;
- superseded;
- retired;
- ambiguous and unresolved.

The operational script must:

- default to dry-run;
- use bounded batches;
- be resumable;
- be idempotent;
- preserve protected identifiers;
- detect collisions before writes;
- produce structured results;
- create or update authoritative schematic records;
- create or connect WordPress attachments;
- generate missing attachment metadata;
- connect attachments to the correct schematic page;
- associate hotspot datasets;
- refresh exact product projections;
- retire obsolete records explicitly;
- invalidate schematic caches after successful changes.

Do not implement permanent dual writes between legacy attachment metadata and the new domain repository.

Legacy fields may be read during migration, but all ongoing writes must pass through the authoritative `dtb-schematics` application service.


BACKEND REBUILD

Refactor `dtb-schematics` into explicit layers.

DOMAIN

Own:

- schematic entity;
- schematic page entity or value object;
- lifecycle states;
- preview policy;
- asset relationships;
- hotspot dataset relationships;
- part relationships;
- publication rules.

APPLICATION

Own operations such as:

- create schematic;
- update schematic;
- reconcile source package;
- attach page;
- replace page attachment;
- detach page;
- reorder pages;
- associate hotspot dataset;
- refresh product projections;
- publish schematic;
- update published projection;
- retire schematic;
- generate catalog response;
- generate detail response;
- invalidate schematic-domain caches.

INFRASTRUCTURE

Own:

- WordPress schematic repository;
- WordPress attachment repository;
- source-package reader;
- source-directory scanner;
- hotspot dataset reader;
- WooCommerce exact product resolver;
- manifest/catalog cache;
- bounded operation state;
- reconciliation result persistence.

TRANSPORT

Own:

- public REST controllers;
- wp-admin REST or AJAX controllers;
- request mapping;
- response serialization;
- admin operation endpoints.

ADMIN PRESENTATION

Own:

- Pipeline Suite shell;
- overview;
- inventory;
- schematic details;
- assets;
- hotspot data;
- product relationships;
- reconciliation;
- publication/frontend state;
- activity history;
- configuration reference.

Do not combine persistence, file scanning, import orchestration, HTML rendering, large inline scripts, and transport logic in monolithic PHP files.

Keep transport controllers thin and place business behavior in application/domain services.


PUBLIC API REBUILD

Provide one public collection endpoint:

GET /dtb/v1/schematics

Return customer-facing catalog and navigation data:

- schema version;
- catalog version;
- canonical schematic ID;
- title;
- brand;
- category;
- preview;
- page count;
- relevant presentation metadata.

Provide one public detail endpoint:

GET /dtb/v1/schematics/{schematic_id}

Return:

- schema version;
- catalog version;
- canonical identity;
- title;
- brand;
- category;
- ordered pages;
- stable page IDs;
- page labels;
- responsive image sources;
- image dimensions;
- hotspot data or a versioned hotspot resource;
- resolved customer-facing part summaries;
- product URLs where available;
- explicit unresolved/unavailable part state.

Do not expose:

- local filesystem paths;
- unpublished records;
- administrative notes;
- raw WordPress metadata;
- implementation-specific WooCommerce internals.

Replace attachment-query ordering and last-write-wins page ownership with deterministic record ordering and unique page relationships.

Retain old API routes only where a verified active consumer still requires them. Compatibility routes must delegate to the new application service and must not maintain another implementation.

Implement one coherent public cache policy using:

- catalog/publication version;
- ETag or Last-Modified where appropriate;
- one consistent public cache directive;
- schematic-domain invalidation;
- versioned media URLs where possible.

Do not emit contradictory private, no-store, no-cache, and public cache instructions together.


HOTSPOT PIPELINE

Standardize hotspot data on the v2 model:

- `parts_catalog` contains unique parts;
- `hotspots` contains physical diagram occurrences;
- multiple hotspot occurrences may reference the same part.

Every hotspot occurrence must preserve:

- stable hotspot ID;
- page ID;
- part reference;
- normalized coordinates;
- optional label/display metadata.

Do not collapse occurrences into one hotspot per part.

Migrate active legacy coordinate datasets into the canonical structure.

Remove deployable hotspot artifacts that have no active purpose, including:

- backups;
- malformed JSON;
- BOM-corrupted alternate copies;
- abandoned drafts;
- redundant datasets;
- files not referenced by a canonical schematic record.

Hotspot data must be loaded only for the selected schematic or page, whether embedded in the detail response or retrieved through a versioned page resource.

Do not import every hotspot dataset into the initial React route bundle.


PRODUCT AND PART RESOLUTION

WooCommerce remains authoritative for runtime products and variations.

`dtb-schematics` owns the relationship between schematic parts and WooCommerce identities.

Each part projection must preserve:

- canonical part reference;
- manufacturer part number;
- exact SKU where available;
- brand;
- customer-facing title;
- WooCommerce product or variation ID;
- customer product URL;
- resolution method;
- resolution state;
- hotspot occurrence count.

Use this resolution order:

1. explicit WooCommerce product or variation ID;
2. exact SKU;
3. exact brand plus protected manufacturer part number;
4. explicit compatibility relationship;
5. unresolved.

Support an explicit intentionally-not-sold state.

Do not use fuzzy matching during customer-facing requests.

Resolve products in bounded backend batches.

Do not issue one WooCommerce lookup per hotspot interaction.

Consolidate, delegate, or retire competing schematic-part endpoints and metadata maps. Do not leave multiple product-relationship authorities.


COMPLETE WP-ADMIN SCHEMATICS PIPELINE SUITE

Build a production-grade Schematics Pipeline Suite inside `dtb-schematics`.

The Suite is not a visual schematic editor, image-annotation canvas, or hotspot-coordinate authoring tool.

It is the unified operational interface for:

- inventory;
- source discovery;
- asset registration;
- attachment management;
- record reconciliation;
- page tracking;
- hotspot dataset tracking;
- product relationship management;
- publication;
- previews;
- frontend/backend synchronization;
- drift detection;
- operation history.

Operators must not need to understand raw post-meta keys, generated PHP arrays, JSON implementation details, or cache internals.


PIPELINE SUITE INFORMATION ARCHITECTURE

Organize the Suite into:

1. Overview
2. Schematics Inventory
3. Sync and Reconciliation
4. Assets and Attachments
5. Hotspot Data
6. Product Relationships
7. Publication and Frontend
8. Activity and Operations
9. Configuration Reference

All screens must be coordinated views over the same authoritative records.


SUITE OVERVIEW

Display meaningful operational totals:

- canonical schematic records;
- published schematics;
- storefront-visible schematics;
- source assets;
- WordPress attachments;
- diagram pages;
- missing pages;
- unidentified assets;
- duplicate page assignments;
- explicit previews;
- first-page preview fallbacks;
- missing hotspot datasets;
- unresolved product relationships;
- frontend drift;
- retired records.

Display a compact pipeline flow:

Source
    -> Attachments
    -> Records
    -> Pages
    -> Hotspots
    -> Products
    -> API
    -> Frontend

For every stage, show:

- synchronized count;
- attention-required count;
- missing count;
- link to the relevant filtered interface.

Display recent operations:

- source scans;
- registrations;
- reconciliations;
- page changes;
- product projection refreshes;
- publication changes;
- retirement;
- frontend projection refreshes.

Every metric must lead to an actionable view. Avoid non-functional dashboard decoration.


SCHEMATICS INVENTORY

Display every authoritative schematic record.

Each row must include:

- preview;
- canonical ID;
- title;
- brand;
- category;
- model/tool identity;
- lifecycle status;
- page count;
- page-completion state;
- hotspot dataset state;
- unique part count;
- hotspot occurrence count;
- resolved product count;
- unresolved product count;
- API publication state;
- frontend synchronization state;
- source/catalog version;
- last modified time.

Provide filters for:

- brand;
- category;
- lifecycle status;
- source state;
- attachment state;
- page state;
- hotspot state;
- product-resolution state;
- publication state;
- frontend synchronization state.

Provide search across:

- canonical ID;
- title;
- aliases;
- model;
- source filename;
- attachment filename;
- SKU;
- manufacturer part number.

Provide useful saved views:

- Ready to Publish
- Published
- Incomplete
- Missing Assets
- Missing Pages
- Missing Hotspot Data
- Unresolved Products
- Frontend Drift
- Retired

Provide deliberate bulk operations:

- reconcile selected;
- register missing attachments;
- regenerate media metadata;
- refresh product projections;
- regenerate previews;
- publish eligible records;
- retire selected;
- refresh public projection;
- export selected records.

Bulk operations must state their exact scope and results.


SCHEMATIC DETAIL WORKSPACE

Opening a schematic must show its complete source-to-storefront state.

SUMMARY

Show:

- canonical ID;
- title;
- brand;
- category;
- lifecycle status;
- source/catalog version;
- publication version;
- public API state;
- frontend state.

PIPELINE

Show the state of:

- canonical source record;
- source files;
- WordPress attachments;
- page relationships;
- hotspot datasets;
- product projections;
- public API;
- frontend catalog;
- frontend viewer.

PAGES

For every ordered page, show:

- stable page ID;
- page number;
- label;
- thumbnail;
- source filename;
- attachment ID;
- dimensions;
- media type;
- preview usage;
- hotspot count;
- publication state.

HOTSPOT DATA

Show:

- dataset location or authoritative resource;
- schema version;
- dataset version/checksum;
- pages represented;
- unique part count;
- hotspot occurrence count;
- repeated occurrences;
- missing part references;
- relationship to diagram pages;
- synchronization state.

PRODUCT RELATIONSHIPS

Show:

- exact relationships;
- resolution method;
- unresolved parts;
- intentionally unavailable parts;
- WooCommerce product and variation IDs;
- customer product URLs;
- occurrence counts.

PREVIEW

Provide:

- catalog-card preview;
- category-placement preview;
- desktop viewer preview;
- mobile viewer preview;
- page switching;
- hotspot overlay;
- customer part-summary interaction.

The preview must consume the same response shape and presentation rules as the storefront.

ACTIVITY

Show:

- source changes;
- attachment operations;
- page operations;
- hotspot dataset changes;
- product projection changes;
- publication and retirement changes;
- public/frontend projection changes.

This workspace is for management and inspection. It must not provide visual hotspot-coordinate editing.


ASSETS AND ATTACHMENTS

Display every discovered schematic asset with:

- source filename;
- canonical filename;
- checksum/version;
- file size;
- media type;
- inferred brand;
- inferred alias or SKU;
- inferred page;
- matched schematic ID;
- WordPress attachment state;
- publication state;
- explicit disposition.

Use dispositions such as:

- synchronized;
- source-only;
- uploaded but unattached;
- attached but unidentified;
- mapped to wrong schematic;
- mapped to wrong page;
- duplicate;
- legacy;
- superseded;
- retired;
- ambiguous;
- missing from source;
- missing from uploads.

Provide actions to:

- register a valid source asset;
- connect an existing attachment;
- assign an unresolved asset to a schematic/page;
- regenerate WordPress attachment metadata;
- replace a page attachment;
- mark a legacy asset retired;
- open the owning schematic;
- inspect the reconciliation difference.

Display schematic-specific attachment details:

- attachment ID;
- public URL;
- attached source path;
- owning schematic;
- page ID;
- page number;
- diagram/preview type;
- dimensions;
- media type;
- checksum/version;
- public usage state.

Identify:

- orphaned attachment metadata;
- attachments lacking domain records;
- domain pages lacking attachments;
- multiple attachments claiming one page;
- incomplete image metadata;
- attachments belonging to retired records.

All operations must update the authoritative record and its public projection coherently.


HOTSPOT DATA MANAGEMENT

The Hotspot Data area manages, tracks, previews, replaces, and exports hotspot datasets.

It must not visually create, drag, reposition, or delete hotspot coordinates.

For each schematic/page, display:

- dataset source;
- schema version;
- dataset checksum/version;
- linked schematic;
- linked page;
- unique part count;
- hotspot occurrence count;
- repeated occurrence count;
- product-resolution summary;
- source synchronization state;
- public/frontend state.

Provide a read-only diagram preview with:

- diagram image;
- hotspot overlay;
- zoom;
- pan;
- page switching;
- hotspot selection;
- resolved part summary.

Provide data-management actions:

- associate an existing dataset;
- replace a dataset from canonical source;
- refresh dataset metadata;
- export canonical dataset;
- open the source record;
- view unresolved parts;
- preview through the storefront renderer.

Never summarize repeated occurrences as one hotspot per part.


PRODUCT RELATIONSHIP MANAGEMENT

Provide a unified schematic-part relationship interface.

For every part, display:

- canonical part reference;
- manufacturer part number;
- SKU;
- title;
- brand;
- hotspot occurrence count;
- pages containing occurrences;
- WooCommerce product/variation ID;
- product status;
- customer URL;
- relationship method;
- resolution state.

Use states such as:

- explicit product ID;
- exact SKU;
- exact brand and part number;
- compatibility relationship;
- intentionally not sold;
- unresolved.

Allow operators to:

- find an exact WooCommerce product;
- accept an explicit relationship suggestion;
- manually select the correct product;
- clear an incorrect relationship;
- mark intentionally unavailable;
- open the WooCommerce product;
- open all schematics using the part;
- refresh selected projections.

Do not create a separate product catalog inside `dtb-schematics`.


SYNC AND RECONCILIATION INTERFACE

Create one interface for comparing:

- canonical source records;
- source binaries;
- staged/live uploads;
- WordPress attachments;
- authoritative schematic records;
- page relationships;
- hotspot datasets;
- product relationships;
- public API output;
- frontend expectations.

For every discrepancy, display:

- schematic and page identity;
- source state;
- WordPress state;
- domain-record state;
- API state;
- frontend state;
- expected state;
- proposed action;
- affected records;
- publication impact.

Group discrepancies into:

- source drift;
- attachment drift;
- identity drift;
- page drift;
- hotspot drift;
- product drift;
- API drift;
- frontend drift.

Provide scoped operations:

- Scan Source
- Compare Source to WordPress
- Register Missing Attachments
- Reconcile Schematic Records
- Refresh Product Projections
- Rebuild Public Projection
- Refresh Frontend Catalog State
- Reconcile Selected Records
- Export Reconciliation Report

Do not provide an unexplained “Sync Everything” operation.

Each operation must report:

- examined;
- unchanged;
- changed;
- skipped;
- unresolved;
- next required action.


PUBLICATION AND FRONTEND SYNCHRONIZATION

Provide one view of records that are:

- drafts;
- incomplete;
- ready;
- published;
- retired;
- present in the API;
- absent from the API;
- represented in the frontend;
- missing from frontend navigation;
- referenced by the frontend but absent from the backend.

Provide actions:

- Preview Draft
- Publish
- Update Published Projection
- Retire
- Refresh Public Projection
- Open Storefront
- Copy Deep Link
- View API Record

Publishing must update:

- authoritative lifecycle state;
- public catalog projection;
- schematic detail projection;
- relevant cache version;
- frontend-consumable state.

Retirement must remove the schematic from public catalog responses while preserving its administrative record, history, and source provenance.


FRONTEND DRIFT DETECTION

Detect disagreement including:

- frontend IDs absent from the API;
- API IDs absent from frontend navigation;
- expected pages missing from the API;
- unexpected pages;
- missing previews;
- stale hardcoded definitions;
- obsolete aliases;
- brand/category mismatches;
- broken deep-link inference;
- missing hotspot datasets;
- frontend product links differing from backend projections.

The permanent architecture must remove the need for a complete hardcoded frontend production registry.

Any remaining frontend configuration must be presentation-only and clearly separated from authoritative availability.


ACTIVITY AND OPERATIONS

Track pipeline operations such as:

- source scan;
- source-package change;
- attachment registration;
- attachment reassignment;
- media metadata generation;
- schematic reconciliation;
- hotspot dataset replacement;
- product projection refresh;
- publication;
- retirement;
- public projection refresh;
- frontend synchronization.

Display:

- operation ID;
- type;
- initiating operator;
- start and completion time;
- affected schematic count;
- examined/changed/skipped/unresolved counts;
- source/catalog version;
- resulting publication version;
- concise result.

Provide filters by:

- operation type;
- operator;
- date;
- result;
- schematic;
- catalog version.


CONFIGURATION REFERENCE

Provide an intentionally controlled configuration reference showing:

- authoritative source-package location;
- staged/live uploads location;
- filename contract;
- supported source formats;
- current source/catalog version;
- public API routes;
- cache/publication version;
- canonical brand IDs;
- canonical category IDs;
- supported hotspot schema versions.

Do not create wp-admin-only environment truth.

Protected paths and identity contracts must remain owned by source/configuration code rather than casually editable text fields.


WP-ADMIN UI/UX

Use the established Drywall Toolbox wp-admin visual language.

The Suite must feel:

- professional;
- compact;
- operational;
- direct;
- information-dense without becoming cluttered;
- responsive;
- status-oriented;
- action-focused.

Use:

- compact tables;
- useful thumbnails;
- meaningful status badges;
- clear filters;
- contextual actions;
- progressive disclosure;
- sticky controls where appropriate;
- meaningful loading states;
- meaningful empty states;
- meaningful error states;
- accessible dialogs;
- semantic buttons and links;
- visible focus;
- keyboard navigation;
- status announcements for asynchronous work.

Avoid:

- oversized cards;
- excessive gradients;
- generic dashboard decoration;
- huge blank areas;
- raw JSON as the primary interface;
- unexplained technical metadata;
- ambiguous “No schematics found” messaging;
- multiple tabs performing overlapping operations.

A genuinely empty inventory must explain:

- whether source assets were discovered;
- whether WordPress attachments exist;
- whether registration has occurred;
- which operation should be run next.


SUITE PERFORMANCE

Use:

- bounded and paginated queries;
- server-side filtering where appropriate;
- debounced search;
- lazy thumbnail loading;
- responsive preview images;
- bounded source scans;
- resumable registration batches;
- cached summary counts;
- request cancellation;
- batched product resolution;
- no fetch-per-row behavior;
- no full catalog reload after every operation;
- no full-size diagram loading in inventory tables.

Long-running operations must use bounded background processing and expose meaningful progress.


LEGACY WP-ADMIN CONSOLIDATION

Inspect current schematic-related areas including:

- Schematics
- Visual Designer
- Image Sync
- Product Mapping
- Catalog Health
- Parts Manager
- Cache Tools
- Import/Export

Move schematic-specific responsibilities into the new Pipeline Suite.

Do not duplicate responsibilities owned by general catalog, product, media, or cache modules.

Where another owning module provides the canonical operation, delegate to or link to that service.

Remove obsolete schematic-specific pages after their active behavior has been absorbed.

Do not leave old and new admin workflows operating indefinitely.


REACT FRONTEND REBUILD

Decompose the existing schematic implementation into focused modules.

Recommended composition:

SchematicsPage
    -> useSchematicRouteState
    -> useSchematicCatalog
    -> SchematicsCatalog
         -> BrandSelector
         -> CategorySelector
         -> ToolSelector
    -> SchematicViewerPage
         -> SchematicHeader
         -> SchematicPageTabs
         -> DiagramViewer
              -> DiagramImage
              -> ZoomControls
              -> HotspotLayer
         -> SchematicPartDialog

The frontend must consume the authoritative public API.

It must not independently decide:

- which schematics exist;
- which pages exist;
- which attachment is current;
- which schematics are published;
- which product a schematic part resolves to.


FRONTEND ROUTING

Preserve the customer-facing `/schematics` route and existing useful deep links unless an intentional compatible route improvement is required.

Use stable URL state:

- brand ID;
- category ID;
- schematic ID;
- page ID or page number;
- explicit variant only where the authoritative record defines one.

A schematic deep link must resolve brand, category, pages, and title from the authoritative catalog/detail API.

Do not require a second incomplete frontend mapping table.

Back navigation must preserve:

schematic
    -> category
    -> brand
    -> schematic catalog

Remove navigation derived from visible-label scraping, global click interception, or uncontrolled DOM state.


FRONTEND CATALOG AND PREVIEW BEHAVIOR

Use this preview priority:

1. explicit curated preview;
2. appropriate linked product image;
3. first published diagram page;
4. clearly labeled preview-unavailable state.

Do not return a generic placeholder as if it were a successful preview.

Cards must show:

- real preview or explicit unavailable state;
- tool title;
- consistent brand/category context;
- page count where useful;
- clear interactive affordance.

Use fluid layouts and the existing DTB tokens, typography, spacing, breakpoints, focus styles, and responsive conventions.

Avoid oversized empty layouts and misleading placeholders.


FRONTEND VIEWER

The viewer must:

- reserve diagram space using real image dimensions;
- load responsive media;
- support desktop and touch zoom/pan;
- provide clear page switching;
- preserve diagram legibility;
- render every hotspot occurrence;
- present parts without losing diagram context;
- show explicit missing-page state;
- show explicit missing-media state;
- show explicit API error state;
- avoid defaulting invalid coordinates to the image center;
- preload only bounded adjacent content.

Use native semantic controls where possible.

Implement page tabs with complete keyboard behavior.

Implement the part details surface as an accessible dialog or mobile drawer using:

- focus entry;
- focus containment;
- Escape close;
- focus return;
- accessible name;
- product state;
- quantity/cart action where available;
- explicit unresolved/unavailable state.

Use dynamic viewport units for full-height mobile overlays.

Respect reduced-motion settings.


FRONTEND DATA STATES

Every asynchronous schematic surface must distinguish:

- initial loading;
- refreshing;
- success;
- empty catalog;
- incomplete record;
- missing page;
- missing image;
- missing hotspot data;
- unresolved product;
- API failure;
- invalid response.

A failed API request must never appear as an ordinary placeholder card or empty schematic.

Scope schematic rendering failures to the schematic route so they do not replace the complete storefront shell.


REMOVE GLOBAL FRONTEND RUNTIMES

Remove the body-wide MutationObserver, history-method patching, direct React DOM label mutation, global schematic click interception, and label-scraped navigation after their required behavior is implemented through React state and handlers.

Do not maintain two navigation or page-label systems.


MEDIA OPTIMIZATION

Preserve high-resolution originals for fullscreen viewing.

Use WordPress or existing shared media capabilities to provide:

- catalog thumbnail;
- standard viewer image;
- high-resolution image;
- width;
- height;
- media type;
- checksum/version;
- responsive `srcset` and `sizes` data where supported.

Do not load original full-resolution diagrams on category-card screens.

Use:

- lazy loading;
- responsive sources;
- reserved aspect ratios;
- selected-page loading;
- at most bounded adjacent-page preloading;
- immutable or versioned media URLs where practical.

Do not build a second general-purpose media platform inside `dtb-schematics`.


ADMIN AND FRONTEND CONTRACT PARITY

The Pipeline Suite and storefront must agree on:

- schematic identity;
- brand;
- category;
- lifecycle/publication state;
- page order;
- page IDs;
- page labels;
- preview;
- image dimensions;
- hotspot occurrences;
- part identity;
- product projection;
- unresolved state;
- customer URLs.

The Suite previews and customer storefront must consume the same authoritative response shape.

Do not maintain separate admin-only and storefront-only conversion rules.


CODE ORGANIZATION

Do not implement the Suite as another monolithic PHP file with embedded HTML, CSS, and extensive inline jQuery.

Separate backend responsibilities into:

- domain entities;
- application services;
- repositories;
- source reader;
- reconciliation engine;
- attachment service;
- hotspot dataset service;
- product relationship service;
- publication service;
- operation-history service;
- controllers;
- serializers.

Separate the admin client into:

- Suite shell;
- overview;
- inventory;
- schematic detail;
- assets;
- hotspot data;
- product relationships;
- reconciliation;
- publication/frontend state;
- activity;
- API client;
- feature-specific styles.

Separate the React storefront into focused hooks and components.

Use existing WordPress and React build conventions.

Do not introduce:

- TypeScript as an isolated addition;
- a new frontend framework;
- an unrelated component library;
- a second design-token system.


LEGACY CLEANUP

After the new pipeline is active, remove:

- duplicate frontend schematic registries;
- fuzzy customer-runtime schematic mapping;
- placeholder-as-preview behavior;
- obsolete attachment-flag authority;
- last-write-wins manifest generation;
- unused schematic product resolvers;
- duplicate compatible-parts behavior;
- per-hotspot WooCommerce request patterns;
- global DOM mutation runtimes;
- global schematic click interception;
- unused public hotspot artifacts;
- stale import and registration workflows;
- dead schematic CSS;
- obsolete inline admin scripts;
- admin pages whose responsibilities moved into the Pipeline Suite.

Compatibility entry points may remain only for verified active consumers and must delegate to the new owning service.


OUT OF SCOPE

Do not expand this task into:

- checkout;
- payments;
- orders;
- refunds;
- Veeqo;
- QuickBooks;
- marketplaces;
- repairs;
- returns;
- support;
- marketing automation;
- unrelated catalog cleanup;
- unrelated media-library redesign;
- unrelated site navigation redesign;
- external monitoring-provider adoption;
- standalone security initiatives;
- deployment-pipeline redesign;
- visual hotspot-coordinate editing;
- image annotation;
- diagram drawing;
- CAD functionality.

Preserve existing authorization, capability, sanitization, and data-integrity behavior required by the source being modified. Do not weaken it.

Do not create separate security, provider-integration, or unrelated validation workstreams.


EXECUTION RULES

1. Read the repository AGENTS.md completely.
2. Inspect active code before relying on filenames, documentation, or historical assumptions.
3. Trace all schematic routes, imports, hooks, APIs, repositories, metadata, scripts, generators, caches, admin actions, and consumers.
4. Identify the owning module before changing behavior.
5. Preserve unrelated worktree changes.
6. Do not modify WordPress core or third-party plugins.
7. Do not hand-edit generated output when an owning generator exists.
8. Preserve protected SKUs, part numbers, aliases, attachment IDs, brand IDs, and canonical schematic IDs.
9. Keep source scans, queries, file operations, and migrations bounded.
10. Keep operational migration tools dry-run by default.
11. Use authoritative repositories and application services for writes.
12. Reinforce the existing DTB design system.
13. Implement permanent owning-layer solutions.
14. Do not leave unfinished compatibility scaffolding.
15. Do not stop while safe, in-scope implementation remains.
16. Ask the user only when a destructive ambiguity or genuinely unresolved schematic identity prevents correct implementation.
17. Do not claim live deployment or production behavior unless directly established.


IMPLEMENTATION SEQUENCE

PHASE 1 — SOURCE AND CONSUMER CONSOLIDATION

- inspect all schematic assets, manifests, registries, datasets, scripts, and consumers;
- establish one canonical source package;
- establish stable identities and page definitions;
- classify every source asset;
- preserve intentional aliases and multipage relationships;
- remove independent duplicate source directories.

PHASE 2 — BACKEND DOMAIN FOUNDATION

- implement the authoritative schematic record;
- implement page relationships;
- implement lifecycle states;
- implement repositories and application services;
- replace the split `_dtb_is_schematic` and `_dtb_schematic_id` authority.

PHASE 3 — RECONCILIATION AND MIGRATION

- implement the dry-run reconciliation engine;
- implement bounded idempotent migration;
- create or update domain records;
- connect attachments;
- generate missing media metadata;
- associate hotspot datasets;
- migrate product relationships;
- retire legacy records explicitly.

PHASE 4 — PUBLIC API AND CACHE CONTRACT

- implement collection and detail APIs;
- implement deterministic page and media output;
- implement one cache policy;
- delegate or retire legacy endpoints.

PHASE 5 — HOTSPOT AND PRODUCT CONSOLIDATION

- standardize hotspot schema;
- preserve repeated physical occurrences;
- consolidate exact product resolution;
- remove per-hotspot frontend lookup behavior;
- retire competing product-mapping authorities.

PHASE 6 — WP-ADMIN PIPELINE SUITE

- build the overview;
- build authoritative inventory;
- build schematic detail workspaces;
- build asset and attachment views;
- build hotspot dataset management;
- build product relationship management;
- build reconciliation;
- build publication/frontend synchronization;
- build activity and operation history;
- consolidate obsolete schematic admin pages.

PHASE 7 — REACT STOREFRONT REBUILD

- consume authoritative APIs;
- remove the hardcoded production registry;
- decompose the schematic route;
- rebuild cards and preview fallback;
- rebuild deep-link state;
- rebuild viewer, pages, zoom, hotspots, and part presentation;
- remove global runtime patches.

PHASE 8 — MEDIA OPTIMIZATION

- expose dimensions and responsive sources;
- generate or connect derivatives;
- optimize card and viewer loading;
- establish versioned media behavior.

PHASE 9 — LEGACY REMOVAL AND REINTEGRATION

- remove obsolete code and data paths;
- ensure all active consumers use the new authority;
- update architecture and workflow documentation;
- complete the source-to-storefront integration.


DEFINITION OF COMPLETE

Do not declare the work complete until:

- one canonical schematic source package exists;
- every discovered source asset has an explicit disposition;
- one authoritative schematic domain model exists;
- every published schematic has one coherent source-to-frontend pipeline;
- wp-admin and public APIs use the same authoritative records;
- attachment registration and removal semantics are unified;
- every page has deterministic ownership;
- preview fallback no longer treats a placeholder as valid media;
- hotspot datasets preserve every physical occurrence;
- parts and hotspot occurrences remain separate;
- product relationships use stable exact identifiers;
- per-hotspot product request loops are removed;
- the frontend consumes authoritative schematic APIs;
- deep links resolve without a competing frontend identity registry;
- the customer viewer handles all required pipeline states;
- the Pipeline Suite exposes source, attachment, page, hotspot, product, API, and frontend states;
- operators can reconcile pipeline drift;
- operators can manage publication and retirement;
- the Pipeline Suite provides read-only hotspot and storefront previews;
- no visual hotspot editor has been introduced;
- long-running operations are bounded and report their scope;
- schematic-specific legacy admin tools have been consolidated;
- global frontend DOM/navigation patches are removed;
- no raw WordPress metadata knowledge is required for normal operation;
- no parallel source, backend, admin, API, or frontend schematic authority remains;
- changed architecture, persistence, APIs, lifecycle, and operational workflows are documented.


FINAL HANDOFF FORMAT

Lead with the completed outcome.

Report:

1. Architecture
   - final source of truth;
   - final runtime record model;
   - final source-to-storefront data flow;
   - module ownership.

2. Implementation
   - changed files grouped by module;
   - canonical source changes;
   - backend/domain changes;
   - migration and reconciliation changes;
   - API changes;
   - Pipeline Suite changes;
   - hotspot/product changes;
   - frontend changes;
   - media changes;
   - removed legacy paths.

3. Data impact
   - records created or migrated;
   - asset dispositions;
   - aliases preserved;
   - attachment relationships changed;
   - records retired;
   - genuinely unresolved schematic identities.

4. API and cache impact
   - routes added;
   - routes changed;
   - compatibility delegates;
   - routes removed;
   - response contracts;
   - invalidation behavior.

5. Documentation
   - architecture documents;
   - source-package contract;
   - schematic lifecycle;
   - Pipeline Suite workflow.

6. Residual risks
   - list only external dependencies or unresolved product decisions;
   - do not describe unfinished in-scope work as a residual risk.

7. Environment status
   - distinguish repository implementation from deployment;
   - do not claim live changes that were not performed.