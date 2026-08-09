# BrikPanel Product Media Studio

## Purpose

The Product Media Studio is a progressive enhancement of the existing BrikPanel product editor. It gives administrators a focused workspace for ordering parent/simple product images and managing each variation's complete image gallery without introducing a second product-media persistence layer.

## Ownership

WooCommerce remains authoritative for product and variation media persistence.

- Parent/simple primary image: WooCommerce product image ID.
- Parent/simple gallery: WooCommerce gallery image IDs.
- Variation primary image: WooCommerce variation image ID.
- Additional variation gallery images: native WooCommerce gallery image IDs on the variation where supported.
- Compatibility mirror: `_brikpanel_variation_gallery`, retained for older BrikPanel consumers.
- Complete variation-gallery read model: the DTB canonical variation-gallery resolver, with WooCommerce/BrikPanel attachment-backed media merged as the editable fallback.

The media studio does not create media records, product records, variation records, alternate gallery tables, or a second variation-gallery save endpoint.

## UI contract

The existing Product images card is progressively upgraded into two views:

1. **Product gallery** — the existing parent/simple product gallery controls, with larger tiles, explicit ordering, primary-image state, direct upload, and WordPress Media Library selection.
2. **Variations** — a compact visual index of existing variation galleries. **Manage** opens the Media Studio variation-gallery manager, not WordPress Media Library. The manager provides an ordered working copy with add, remove, primary-image, and drag/reorder controls. WordPress Media Library opens only from the manager's explicit **Add images** action.

The first ordered image is the variation primary image. Remaining ordered images are persisted through BrikPanel's existing product-save payload and server-side WooCommerce variation save path.

Before `brikpanel-product-editor.js` initializes its private state, the integration enriches `window.brikpanelProductData.variations[].images` with the same canonical gallery resolved for the storefront. URL-only resolver entries are mapped back to WordPress attachment IDs when possible because BrikPanel's product-save contract persists attachment IDs.

The Media Studio hydrates its variation cards and manager working copies from those normalized `brikpanelProductData.variations[].images` arrays. The Product gallery tab count remains the number of parent/simple gallery images. The header media summary is the aggregate of parent product images plus every variation gallery image.

## BrikPanel state bridge

The current BrikPanel product editor keeps `state.variations` private inside its JavaScript module. Its `openVarImagePicker()` implementation owns the existing `state.variations[idx].images` mutation and the variation-row thumbnail refresh, but current BrikPanel versions open `wp.media()` directly and no longer provide the older custom gallery dialog.

The Product Media Studio therefore owns the visual variation-gallery manager while preserving BrikPanel's private state contract:

1. The manager edits an isolated working copy of ordered `{id, url}` image objects.
2. **Cancel** discards the working copy without mutating BrikPanel state.
3. **Done** temporarily supplies a scoped `wp.media` facade containing the ordered working-copy selection.
4. The studio invokes only BrikPanel's direct variation-image handler. BrikPanel's existing `select` callback then updates its private `state.variations[idx].images` and rebuilds the compact variation image cell.
5. The original `wp.media` implementation is restored immediately after that synchronous hand-off.

This bridge exists solely because the live BrikPanel editor does not expose a public variation-media state API. It does not create an alternate persistence path. If BrikPanel later exposes a stable public setter for variation images, the facade bridge should be replaced with that API.

## Compatibility

The enhancement operates over the existing product editor DOM, `window.brikpanelProductData`, variation rows, WooCommerce attachment IDs, and BrikPanel's existing product-save transaction. Third-party product fields, variation fields, inventory, pricing, COGS, vendor fields, and checkout/order workflows are unaffected.

The canonical hydration bridge runs in `admin_footer` after the editor page has emitted `window.brikpanelProductData` and before WordPress prints footer-enqueued editor scripts. This ordering is required so BrikPanel initializes with the complete attachment-backed variation galleries.

The admin media studio is loaded only on `admin_page_brikpanel-product-editor`. Storefront variation-gallery behavior remains separately controlled by `brikpanel_variation_gallery_enabled`.

## Security

No new mutation endpoint is introduced. Existing BrikPanel nonce, capability, attachment validation, and WooCommerce save paths remain in force. Canonical gallery hydration is restricted to the product editor screen and requires edit permission for the current product.

## Deployment

Deploy these files together from `docs/admin/brikpanel/products/`:

- `brikpanel-product-editor.php`
- `brikpanel-variation-gallery.php`
- `brikpanel-product-media-studio.js`
- `brikpanel-product-media-studio.css`

For the variation-manager restoration itself, the changed runtime files are the Media Studio JS and CSS. They are expected to be colocated with `brikpanel-variation-gallery.php`, which resolves the asset URLs with `plugin_dir_url(__FILE__)` and `plugin_dir_path(__FILE__)`.
