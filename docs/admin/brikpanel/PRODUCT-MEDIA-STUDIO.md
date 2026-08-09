# BrikPanel Product Media Studio

## Purpose

The Product Media Studio is a progressive enhancement of the existing BrikPanel product editor. It gives administrators a focused workspace for ordering parent/simple product images and opening each variation's image gallery without introducing a second product-media persistence layer.

## Ownership

WooCommerce remains authoritative for product and variation media persistence.

- Parent/simple primary image: WooCommerce product image ID.
- Parent/simple gallery: WooCommerce gallery image IDs.
- Variation primary image: WooCommerce variation image ID.
- Additional variation gallery images: the existing BrikPanel `_brikpanel_variation_gallery` compatibility contract used by the BrikPanel save transaction.
- Complete variation-gallery read model: `DTB_VariationGalleryResolver`, which is also used by the DTB storefront REST enrichment path.

The media studio does not create media records, product records, variation records, alternate gallery tables, or a second variation-gallery save endpoint.

## UI contract

The existing Product images card is progressively upgraded into two views:

1. **Product gallery** — existing parent/simple product gallery controls, with larger tiles, explicit ordering, primary-image state, direct upload, and WordPress Media Library selection.
2. **Variations** — a compact visual index of existing variation galleries. Each row delegates to the existing BrikPanel variation gallery editor, preserving its add/remove/preview/reorder behavior and save payload.

The first ordered image is presented as the primary image. Existing BrikPanel save behavior remains authoritative.

Before `brikpanel-product-editor.js` initializes its private state, the integration enriches `window.brikpanelProductData.variations[].images` with the same canonical gallery resolved for the storefront. Resolution merges the DTB variation-gallery resolver, the variation primary image, existing `_brikpanel_variation_gallery` IDs, and native WooCommerce variation gallery IDs when available. URL-only resolver entries are mapped back to WordPress attachment IDs when possible because BrikPanel's existing editor requires attachment IDs for reorder/remove/save semantics.

The Media Studio then hydrates its variation cards from the normalized `brikpanelProductData.variations[].images` arrays. While a variation gallery dialog is open, the studio mirrors the dialog's live image count and first image so add/remove/reorder operations remain accurate before the parent product is saved. The compact variation-row badge is retained only as a compatibility fallback when normalized media data is unavailable.

The Product gallery tab count remains the number of parent/simple gallery images. The header media summary is an aggregate count: parent product images plus every variation gallery image. It is recomputed from the rendered variation cards whenever gallery content changes.

## Compatibility

The enhancement intentionally operates over the existing DOM, product-data object, and events exposed by `brikpanel-product-editor.js`. This keeps third-party product fields, variation fields, inventory, pricing, COGS, vendor fields, and the product save transaction unchanged.

The canonical hydration bridge runs in `admin_footer` after the editor page has emitted `window.brikpanelProductData` and before WordPress prints footer-enqueued editor scripts. This ordering is required so the existing BrikPanel editor copies the complete variation galleries into its own state on initialization.

The admin media studio is loaded only on `admin_page_brikpanel-product-editor`. Storefront variation-gallery behavior remains separately controlled by `brikpanel_variation_gallery_enabled`.

## Security

No new mutation endpoint is introduced. Existing BrikPanel nonce, capability, attachment validation, and WooCommerce save paths remain in force. Canonical gallery hydration is restricted to the product editor screen and requires edit permission for the current product.

## Deployment

Deploy these files together:

- `brikpanel-variation-gallery.php`
- `brikpanel-product-media-studio.js`
- `brikpanel-product-media-studio.css`

They are expected to be colocated in the deployed BrikPanel plugin directory because the integration resolves the media-studio assets with `plugin_dir_url(__FILE__)` and `plugin_dir_path(__FILE__)`.
