# Schematic Media Runtime and Registration

## Ownership

- React owns schematic navigation, hotspot rendering, page state, and API consumption.
- `dtb-schematics` owns schematic attachment registration, metadata, manifest construction, cache invalidation, and parts resolution.
- WordPress uploads own schematic image binaries.
- `dtb-media` owns product-image registration/linking only; schematic registration is surfaced in its admin screen but executed by `dtb-schematics`.

## Production runtime

1. The storefront fetches `GET /wp-json/dtb/v1/schematics/media`.
2. The manifest maps stable schematic IDs and page numbers to WordPress attachment URLs.
3. Browser image requests load from `wp-content/uploads/2026/schematics/` through WordPress attachment URLs.
4. Schematic image binaries must not be copied into the frontend production artifact.

## Registration filename contract

Files in `wp-content/uploads/2026/schematics/` must use one of these deterministic names:

- `{schematic-id}--page-{n}.webp`
- `{schematic-id}--preview.webp`

Supported image extensions are WebP, JPEG, PNG, AVIF, and GIF. Stable schematic IDs must match frontend definitions exactly.

## WP Admin workflow

Open **DTB Tools → DTB Image Sync** and use **DTB Schematic Media Registration**.

1. Keep the path `2026/schematics`.
2. Run a dry run first.
3. Resolve every invalid filename and duplicate identity.
4. Run registration in bounded batches.
5. Verify `/wp-json/dtb/v1/schematics/media` contains every expected schematic page.

Registration is idempotent by `_wp_attached_file`. Existing attachments are updated with canonical DTB schematic metadata. Files are not moved, copied, renamed, deleted, or linked as WooCommerce product images.

## Metadata contract

- `_dtb_schematic_id`
- `_dtb_schematic_type` (`diagram` or `preview`)
- `_dtb_schematic_page`
- `_dtb_schematic_source_path`

The manifest transient is invalidated after a successful write batch.

## Rollback

Restore the prior `dtb-schematics` module files and database backup. Existing binaries under uploads remain untouched. If only attachment metadata was added, remove or restore those attachment records from the database backup and purge the schematic manifest transient.
