# Veeqo Control Center Release Notes

- Replaces the monolithic Veeqo Operations page with a first-class Veeqo control center in wp-admin.
- Adds Overview, Orders, Inventory, Fulfillment, Operations, and Settings workflows.
- Uses batched WooCommerce/DTB projections for routine dashboard reads.
- Adds exact-SKU live Veeqo inspection without exposing credentials.
- Adds durable, single-flight, chunked inventory operations with retry and recovery.
- Routes order retries through the canonical `dtb-orders` queue.
- Removes duplicate inventory projection/admin implementations.
- Retires historical WP-Cron, product-save mapping, automatic webhook registration, and duplicate settings ownership.
- Removes historical credential fields from WordPress options.
- Excludes unverified direct stock-adjustment and shipment mutation APIs.
