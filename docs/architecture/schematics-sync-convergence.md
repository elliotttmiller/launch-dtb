# Schematics synchronization and convergence

## Authority

DTB Schematics owns schematic records, page relationships, normalized hotspot projections, part relationships, lifecycle, and the public schematic API. WooCommerce remains product identity authority. Source image binaries under `wp-content/uploads/{year}/schematics` are reconciliation inputs; `frontend/public/brands/**/schematic_data*.json` is hotspot-source truth. Neither source tree is a second runtime schematic catalog.

## Operator workflow

The supported wp-admin workflow is:

1. Preview schematic synchronization.
2. Apply schematic synchronization in bounded resumable batches.
3. Preview hotspot JSON synchronization.
4. Apply hotspot JSON synchronization.
5. Resolve any deterministic product-link gaps through the existing resolver/optimizer workflow.
6. Review Catalog readiness and the public `/dtb/v1/schematics` projection.

All commits go through `Application/RunSchematicOperation.php` and the process-wide schematic commit lease.

## Post-operation convergence

`Application/ConvergeSchematicProjection.php` runs after committed reconciliation, hotspot migration, product-link refresh, and hotspot optimization while the commit lease is still held.

For every touched canonical schematic it:

- refreshes the linked-product projection from the authoritative part relationships;
- re-evaluates canonical source-page requirements when the source package is available;
- re-evaluates runtime publication requirements;
- moves unhealthy non-retired records to `incomplete`;
- moves healthy records through `ready` to `published` when necessary; and
- refreshes an already-published public projection when the committing operation changed projection inputs.

This closes the previous ordering gap where hotspot migration could resolve part/product relationships after reconciliation had already refreshed `linked_products`, leaving an otherwise valid schematic unpublished or publicly stale until a later manual operation.

The source manifest is parsed and identity-resolved once per request during convergence. All-record hotspot synchronization therefore does not repeatedly rescan the complete source package for each schematic.

A readiness-blocked convergence is surfaced as a partial/failed operator run so wp-admin cannot report a green success state when a touched record still cannot reach a usable storefront projection.

## Failure behavior

Convergence never fabricates identifiers, fuzzy-matches products, retires records, or bypasses lifecycle checks. Retired records remain retired. Missing or invalid runtime requirements fail closed. An unavailable operational source package by itself does not unpublish an otherwise healthy existing record; runtime availability is evaluated from the authoritative record and required relationships.

## Idempotency

All convergence steps reuse existing idempotent application services. Re-running reconciliation, hotspot synchronization, or product linking is expected to converge on the same authoritative state without duplicate records, duplicate page relationships, or duplicate public side effects.
