# Connected Official Veeqo MCP Tool Inventory

Catalog captured 2026-10-08. **92 callable tools** were advertised by the connected Veeqo MCP integration. This is a discovery snapshot, not an API specification or an assertion of account permissions. Tool schemas and availability can change.

## Operating model

- Use the existing official Veeqo MCP connector directly from ChatGPT for provider-native operations.
- Use MCP DTB WordPress Abilities API for WordPress/WooCommerce/DTB domain operations, including the protected kit conversion workflow.
- Do not automatically mirror these tools into WordPress, expose the wp-config Veeqo API key, or add a second Veeqo transport.
- Official provider tool availability does not override DTB order/payment/catalog identity authority. Respect the canonical Store API checkout/order pipeline.
- For high-impact mutations require explicit user authorization, inspect source records, apply operation-specific preconditions, and perform independent readback; uncertain outcomes must not be blindly retried.

## Catalog

| Tool | DTB operator routing |
|---|---|
| `veeqo_create_batch` | Veeqo-owned state change: explicit approval, preflight and readback |
| `veeqo_list_channels` | Official Veeqo operation: use according to permissions and operation effects |
| `veeqo_get_channel` | Official Veeqo operation: use according to permissions and operation effects |
| `veeqo_get_account_capabilities` | Official Veeqo operation: use according to permissions and operation effects |
| `veeqo_get_user_profile` | Official Veeqo operation: use according to permissions and operation effects |
| `veeqo_get_profit_analysis` | Official Veeqo operation: use according to permissions and operation effects |
| `veeqo_get_product_profitability` | Official Veeqo operation: use according to permissions and operation effects |
| `veeqo_list_orders` | Official Veeqo operation: use according to permissions and operation effects |
| `veeqo_get_order_details` | Official Veeqo operation: use according to permissions and operation effects |
| `veeqo_list_inventory_items` | Official Veeqo operation: use according to permissions and operation effects |
| `veeqo_get_inventory_item` | Official Veeqo operation: use according to permissions and operation effects |
| `veeqo_list_sellables` | Official Veeqo operation: use according to permissions and operation effects |
| `veeqo_get_sellable` | Official Veeqo operation: use according to permissions and operation effects |
| `veeqo_list_warehouses` | Official Veeqo operation: use according to permissions and operation effects |
| `veeqo_list_users` | Official Veeqo operation: use according to permissions and operation effects |
| `veeqo_get_team_report` | Official Veeqo operation: use according to permissions and operation effects |
| `veeqo_search_customers` | Official Veeqo operation: use according to permissions and operation effects |
| `veeqo_list_purchase_orders` | Official Veeqo operation: use according to permissions and operation effects |
| `veeqo_get_shipping_configs` | Official Veeqo operation: use according to permissions and operation effects |
| `veeqo_get_shipping_rates` | Official Veeqo operation: use according to permissions and operation effects |
| `veeqo_get_allocation_rates` | Official Veeqo operation: use according to permissions and operation effects |
| `veeqo_list_printing_templates` | Official Veeqo operation: use according to permissions and operation effects |
| `veeqo_get_printing_preferences` | Official Veeqo operation: use according to permissions and operation effects |
| `veeqo_get_stock_entries` | Official Veeqo operation: use according to permissions and operation effects |
| `veeqo_get_stock_history` | Official Veeqo operation: use according to permissions and operation effects |
| `veeqo_get_product_tags` | Official Veeqo operation: use according to permissions and operation effects |
| `veeqo_get_customer_details` | Official Veeqo operation: use according to permissions and operation effects |
| `veeqo_list_delivery_methods` | Official Veeqo operation: use according to permissions and operation effects |
| `veeqo_list_tags` | Official Veeqo operation: use according to permissions and operation effects |
| `veeqo_get_tracking_events` | Official Veeqo operation: use according to permissions and operation effects |
| `veeqo_get_purchase_order_details` | Official Veeqo operation: use according to permissions and operation effects |
| `veeqo_get_order_returns` | Official Veeqo operation: use according to permissions and operation effects |
| `veeqo_list_suppliers` | Official Veeqo operation: use according to permissions and operation effects |
| `veeqo_add_order_note` | Official Veeqo operation: use according to permissions and operation effects |
| `veeqo_add_customer_note` | Official Veeqo operation: use according to permissions and operation effects |
| `veeqo_update_line_item_note` | Official Veeqo operation: use according to permissions and operation effects |
| `veeqo_set_product_tags` | Official Veeqo operation: use according to permissions and operation effects |
| `veeqo_update_sellable_identity` | DTB-owned or identity-sensitive: do not invoke directly for storefront-owned records; follow canonical DTB workflow |
| `veeqo_create_customer` | Official Veeqo operation: use according to permissions and operation effects |
| `veeqo_update_customer` | Official Veeqo operation: use according to permissions and operation effects |
| `veeqo_cancel_order` | DTB-owned or identity-sensitive: do not invoke directly for storefront-owned records; follow canonical DTB workflow |
| `veeqo_create_order` | DTB-owned or identity-sensitive: do not invoke directly for storefront-owned records; follow canonical DTB workflow |
| `veeqo_create_product` | DTB-owned or identity-sensitive: do not invoke directly for storefront-owned records; follow canonical DTB workflow |
| `veeqo_bulk_tag_orders` | Official Veeqo operation: use according to permissions and operation effects |
| `veeqo_bulk_tag_products` | Official Veeqo operation: use according to permissions and operation effects |
| `veeqo_update_stock_level` | DTB-owned or identity-sensitive: do not invoke directly for storefront-owned records; follow canonical DTB workflow |
| `veeqo_buy_shipping_label` | Veeqo-owned state change: explicit approval, preflight and readback |
| `veeqo_buy_shipping_labels_bulk` | Veeqo-owned state change: explicit approval, preflight and readback |
| `veeqo_get_bulk_shipment_result` | Official Veeqo operation: use according to permissions and operation effects |
| `veeqo_update_allocation_package` | Veeqo-owned state change: explicit approval, preflight and readback |
| `veeqo_update_allocation_ship_date` | Veeqo-owned state change: explicit approval, preflight and readback |
| `veeqo_set_allocation_packed` | Veeqo-owned state change: explicit approval, preflight and readback |
| `veeqo_create_purchase_order` | Veeqo-owned state change: explicit approval, preflight and readback |
| `veeqo_allocate_order` | Veeqo-owned state change: explicit approval, preflight and readback |
| `veeqo_cancel_allocation_shipment` | Veeqo-owned state change: explicit approval, preflight and readback |
| `veeqo_merge_orders` | DTB-owned or identity-sensitive: do not invoke directly for storefront-owned records; follow canonical DTB workflow |
| `veeqo_unmerge_orders` | DTB-owned or identity-sensitive: do not invoke directly for storefront-owned records; follow canonical DTB workflow |
| `veeqo_merge_sellables` | DTB-owned or identity-sensitive: do not invoke directly for storefront-owned records; follow canonical DTB workflow |
| `veeqo_book_shipment` | Veeqo-owned state change: explicit approval, preflight and readback |
| `veeqo_get_shipment` | Official Veeqo operation: use according to permissions and operation effects |
| `veeqo_get_shipment_label` | Official Veeqo operation: use according to permissions and operation effects |
| `veeqo_cancel_shipment` | Veeqo-owned state change: explicit approval, preflight and readback |
| `veeqo_update_order_shipping_address` | DTB-owned or identity-sensitive: do not invoke directly for storefront-owned records; follow canonical DTB workflow |
| `veeqo_list_listings` | Official Veeqo operation: use according to permissions and operation effects |
| `veeqo_allocate_order_lines` | Veeqo-owned state change: explicit approval, preflight and readback |
| `veeqo_deallocate_allocation` | Veeqo-owned state change: explicit approval, preflight and readback |
| `veeqo_bulk_update_prices` | DTB-owned or identity-sensitive: do not invoke directly for storefront-owned records; follow canonical DTB workflow |
| `veeqo_generate_order_document` | Veeqo-owned state change: explicit approval, preflight and readback |
| `veeqo_generate_pick_list` | Veeqo-owned state change: explicit approval, preflight and readback |
| `veeqo_create_picking_group` | Veeqo-owned state change: explicit approval, preflight and readback |
| `veeqo_get_picking_group` | Official Veeqo operation: use according to permissions and operation effects |
| `veeqo_assign_picking_group_picker` | Veeqo-owned state change: explicit approval, preflight and readback |
| `veeqo_generate_product_labels` | Veeqo-owned state change: explicit approval, preflight and readback |
| `veeqo_generate_stock_transfer_document` | Veeqo-owned state change: explicit approval, preflight and readback |
| `veeqo_generate_purchase_order_document` | Veeqo-owned state change: explicit approval, preflight and readback |
| `veeqo_list_print_jobs` | Official Veeqo operation: use according to permissions and operation effects |
| `veeqo_get_print_result` | Official Veeqo operation: use according to permissions and operation effects |
| `veeqo_list_batches` | Official Veeqo operation: use according to permissions and operation effects |
| `veeqo_get_batch` | Official Veeqo operation: use according to permissions and operation effects |
| `veeqo_get_order_payment` | Official Veeqo operation: use according to permissions and operation effects |
| `veeqo_find_orders_by_batch` | Official Veeqo operation: use according to permissions and operation effects |
| `veeqo_update_batch` | Veeqo-owned state change: explicit approval, preflight and readback |
| `veeqo_archive_batch` | Veeqo-owned state change: explicit approval, preflight and readback |
| `veeqo_add_allocations_to_batch` | Veeqo-owned state change: explicit approval, preflight and readback |
| `veeqo_remove_allocations_from_batch` | Veeqo-owned state change: explicit approval, preflight and readback |
| `veeqo_create_order_tag` | Official Veeqo operation: use according to permissions and operation effects |
| `veeqo_create_product_tag` | Official Veeqo operation: use according to permissions and operation effects |
| `veeqo_update_order_tag` | Official Veeqo operation: use according to permissions and operation effects |
| `veeqo_update_product_tag` | Official Veeqo operation: use according to permissions and operation effects |
| `veeqo_delete_order_tag` | Official Veeqo operation: use according to permissions and operation effects |
| `veeqo_delete_product_tag` | Official Veeqo operation: use according to permissions and operation effects |
| `veeqo_summarize_shipping_label_costs` | Official Veeqo operation: use according to permissions and operation effects |

## Native kits

The official connector inventory listed here does not expose a native `veeqo_kit_import` tool. Use `dtb-veeqo-kits/import-preview`, `dtb-veeqo-kits/import-convert` (approval required), and `dtb-veeqo-kits/read` through the DTB WordPress Abilities API. The DTB import service retains parent-specific reservation, exact ID/SKU verification, BOM fingerprint enforcement, and post-write readback.

## Authority warning

The account-level Veeqo permission to execute a provider command is not DTB application authorization to change an existing WooCommerce order, product identifier, price, payment, refund, or inventory projection. Provider-native fulfilment actions should preserve downstream correlation and never create a parallel checkout/order path.
