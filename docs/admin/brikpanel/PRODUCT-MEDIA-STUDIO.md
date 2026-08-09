# BrikPanel Product Media Studio

## Purpose

The Product Media Studio is a progressive enhancement of the existing BrikPanel product editor. It gives administrators a focused workspace for ordering parent/simple product images and opening each variation's image gallery without introducing a second product-media persistence layer.

## Ownership

WooCommerce remains authoritative for product and variation media persistence.

- Parent/simple primary image: WooCommerce product image ID.
- Parent/simple gallery: WooCommerce gallery image IDs.
- Variation primary image: WooCommerce variation image ID.
- Additional variation gallery images: the existing BrikPanel `_brikpanel_variation_gallery` compatibility contract used by the storefront integration.

The media studio does not create media records, product records, variation records, or alternate gallery tables.

## UI contract

The existing Product images card is progressively upgraded into two views:

1. **Product gallery** — existing parent/simple product gallery controls, with larger tiles, explicit ordering, primary-image state, direct upload, and WordPress Media Library selection.
2. **Variations** — a compact visual index of existing variation galleries. Each row delegates to the existing BrikPanel variation gallery editor, preserving its add/remove/preview/reorder behavior and save payload.

The first ordered image is presented as the primary image. Existing BrikPanel save behavior remains authoritative.

## Compatibility

The enhancement intentionally operates over the existing DOM and events exposed by `brikpanel-product-editor.js`. This keeps third-party product fields, variation fields, inventory, pricing, COGS, vendor fields, and the product save transaction unchanged.

The admin media studio is loaded only on `admin_page_brikpanel-product-editor`. Storefront variation-gallery behavior remains separately controlled by `brikpanel_variation_gallery_enabled`.

## Security

No new mutation endpoint is introduced. Existing BrikPanel nonce, capability, attachment validation, and WooCommerce save paths remain in force.

## Deployment

Deploy these files together:

- `brikpanel-variation-gallery.php`
- `brikpanel-product-media-studio.js`
- `brikpanel-product-media-studio.css`

They are expected to be colocated in the deployed BrikPanel plugin directory because the integration resolves the new assets with `plugin_dir_url(__FILE__)` and `plugin_dir_path(__FILE__)`.
