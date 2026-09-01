-- =============================================================================
-- DTB WooCommerce — PRODUCTION CATALOG + MEDIA FULL RESET v2
-- Database:  dbb5qa8fmosn28
-- Prefix:    vaa_
-- WordPress/WooCommerce versions: verify in the target runtime before execution
-- HPOS:      enabled
-- Revised:   2026-08-31
--
-- DESTRUCTIVE SCOPE
--   Deletes all WooCommerce products and variations.
--   Deletes all registered WordPress media attachments and attachment metadata.
--   Deletes product categories, tags, brands, shipping classes, and pa_* terms.
--   Deletes product reviews, downloadable-product permissions, and product lookup rows.
--   Preserves users, customers, coupons, settings, pages/posts, orders, HPOS order
--   tables, order items, Action Scheduler, DTB operational tables, and physical files.
--
-- IMPORTANT
--   1. Export a complete database backup before running.
--   2. This script is hard-coded for database dbb5qa8fmosn28 and prefix vaa_.
--   3. Execute STEP 0 first and stop unless every required table is PRESENT.
--   4. Run steps in order. Helper tables intentionally persist between executions.
--   5. SQL does not delete files from wp-content/uploads.
--   6. Existing order records may retain historical product IDs that no longer resolve.
--   7. Product-ID mappings in third-party integration tables are preserved and must be
--      separately audited before importing replacement products.
-- =============================================================================


-- =============================================================================
-- STEP 0 — DATABASE / PREFIX / REQUIRED-TABLE PREFLIGHT
-- Expected database: dbb5qa8fmosn28
-- Expected prefix:   vaa_
-- STOP if the database differs or any required table reports MISSING.
-- =============================================================================

USE `dbb5qa8fmosn28`;

SELECT DATABASE() AS current_database;

SELECT
    CASE
        WHEN DATABASE() = 'dbb5qa8fmosn28' THEN 'PASS'
        ELSE 'STOP - WRONG DATABASE'
    END AS database_guard;

SELECT
    required.expected_table,
    CASE WHEN actual.TABLE_NAME IS NULL THEN 'MISSING' ELSE 'PRESENT' END AS status,
    actual.ENGINE,
    actual.TABLE_COLLATION
FROM (
    SELECT 'vaa_posts' AS expected_table
    UNION ALL SELECT 'vaa_postmeta'
    UNION ALL SELECT 'vaa_comments'
    UNION ALL SELECT 'vaa_commentmeta'
    UNION ALL SELECT 'vaa_terms'
    UNION ALL SELECT 'vaa_termmeta'
    UNION ALL SELECT 'vaa_term_taxonomy'
    UNION ALL SELECT 'vaa_term_relationships'
    UNION ALL SELECT 'vaa_options'
    UNION ALL SELECT 'vaa_wc_product_meta_lookup'
    UNION ALL SELECT 'vaa_wc_product_attributes_lookup'
    UNION ALL SELECT 'vaa_wc_category_lookup'
    UNION ALL SELECT 'vaa_wc_download_log'
    UNION ALL SELECT 'vaa_woocommerce_downloadable_product_permissions'
    UNION ALL SELECT 'vaa_woocommerce_attribute_taxonomies'
) required
LEFT JOIN information_schema.TABLES actual
    ON actual.TABLE_SCHEMA = DATABASE()
   AND actual.TABLE_NAME = required.expected_table
ORDER BY required.expected_table;

SELECT DISTINCT
    SUBSTRING_INDEX(TABLE_NAME, '_posts', 1) AS detected_prefix
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME LIKE '%_posts'
ORDER BY detected_prefix;


-- =============================================================================
-- STEP 0.5 — PROTECTED DATA SNAPSHOT
-- Save these values. STEP 25 must report the same values.
-- =============================================================================

SELECT
    (SELECT COUNT(*) FROM vaa_wc_orders) AS hpos_orders_before,
    (SELECT COUNT(*) FROM vaa_wc_orders_meta) AS hpos_order_meta_before,
    (SELECT COUNT(*) FROM vaa_woocommerce_order_items) AS order_items_before,
    (SELECT COUNT(*) FROM vaa_woocommerce_order_itemmeta) AS order_item_meta_before,
    (SELECT COUNT(*) FROM vaa_actionscheduler_actions) AS scheduled_actions_before,
    (SELECT COUNT(*) FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME LIKE 'vaa_dtb\_%') AS dtb_tables_before;


-- =============================================================================
-- STEP 1 — SESSION SETTINGS + IDEMPOTENT HELPER CLEANUP
-- =============================================================================

SET SQL_SAFE_UPDATES = 0;

DROP TABLE IF EXISTS _dtb_reset_product_ids;
DROP TABLE IF EXISTS _dtb_reset_attachment_ids;
DROP TABLE IF EXISTS _dtb_reset_comment_ids;
DROP TABLE IF EXISTS _dtb_reset_download_permission_ids;
DROP TABLE IF EXISTS _dtb_reset_term_taxonomy_ids;


-- =============================================================================
-- STEP 2 — PRE-RESET COUNTS
-- =============================================================================

SELECT
    (SELECT COUNT(*) FROM vaa_posts WHERE post_type = 'product') AS products,
    (SELECT COUNT(*) FROM vaa_posts WHERE post_type = 'product_variation') AS product_variations,
    (SELECT COUNT(*) FROM vaa_posts WHERE post_type = 'attachment') AS registered_attachments,
    (SELECT COUNT(*)
       FROM vaa_comments c
       INNER JOIN vaa_posts p ON p.ID = c.comment_post_ID
      WHERE p.post_type IN ('product', 'product_variation')) AS product_comments,
    (SELECT COUNT(*) FROM vaa_wc_product_meta_lookup) AS product_meta_lookup_rows,
    (SELECT COUNT(*) FROM vaa_wc_product_attributes_lookup) AS attribute_lookup_rows,
    (SELECT COUNT(*) FROM vaa_wc_category_lookup) AS category_lookup_rows,
    (SELECT COUNT(*) FROM vaa_term_taxonomy WHERE taxonomy = 'product_cat') AS product_categories,
    (SELECT COUNT(*) FROM vaa_term_taxonomy WHERE taxonomy = 'product_tag') AS product_tags,
    (SELECT COUNT(*)
       FROM vaa_term_taxonomy
      WHERE taxonomy IN ('pa_brand', 'product_brand', 'pwb-brand', 'yith_product_brand')) AS brand_terms,
    (SELECT COUNT(*) FROM vaa_term_taxonomy WHERE taxonomy LIKE 'pa\_%') AS attribute_terms,
    (SELECT COUNT(*) FROM vaa_woocommerce_attribute_taxonomies) AS global_attribute_definitions;


-- =============================================================================
-- STEP 3 — STAGE PRODUCT AND VARIATION IDS
-- =============================================================================

CREATE TABLE _dtb_reset_product_ids (
    ID BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (ID)
) ENGINE=InnoDB;

INSERT INTO _dtb_reset_product_ids (ID)
SELECT ID
FROM vaa_posts
WHERE post_type IN ('product', 'product_variation');

SELECT COUNT(*) AS staged_products_and_variations
FROM _dtb_reset_product_ids;


-- =============================================================================
-- STEP 4 — STAGE ALL REGISTERED ATTACHMENT IDS
-- WARNING: this intentionally stages every Media Library attachment.
-- =============================================================================

CREATE TABLE _dtb_reset_attachment_ids (
    ID BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (ID)
) ENGINE=InnoDB;

INSERT INTO _dtb_reset_attachment_ids (ID)
SELECT ID
FROM vaa_posts
WHERE post_type = 'attachment';

SELECT COUNT(*) AS staged_attachments
FROM _dtb_reset_attachment_ids;


-- =============================================================================
-- STEP 5 — STAGE PRODUCT COMMENT / REVIEW IDS
-- =============================================================================

CREATE TABLE _dtb_reset_comment_ids (
    comment_ID BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (comment_ID)
) ENGINE=InnoDB;

INSERT INTO _dtb_reset_comment_ids (comment_ID)
SELECT c.comment_ID
FROM vaa_comments c
INNER JOIN _dtb_reset_product_ids p
    ON p.ID = c.comment_post_ID;

SELECT COUNT(*) AS staged_product_comments
FROM _dtb_reset_comment_ids;


-- =============================================================================
-- STEP 6 — STAGE DOWNLOADABLE PRODUCT PERMISSION IDS
-- =============================================================================

CREATE TABLE _dtb_reset_download_permission_ids (
    permission_id BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (permission_id)
) ENGINE=InnoDB;

INSERT INTO _dtb_reset_download_permission_ids (permission_id)
SELECT dp.permission_id
FROM vaa_woocommerce_downloadable_product_permissions dp
INNER JOIN _dtb_reset_product_ids p
    ON p.ID = dp.product_id;

SELECT COUNT(*) AS staged_download_permissions
FROM _dtb_reset_download_permission_ids;


-- =============================================================================
-- STEP 7 — STAGE CATALOG-OWNED TAXONOMY ROWS
-- Preserves product_type and product_visibility.
-- Preserves global attribute definitions in vaa_woocommerce_attribute_taxonomies.
-- =============================================================================

CREATE TABLE _dtb_reset_term_taxonomy_ids (
    term_taxonomy_id BIGINT UNSIGNED NOT NULL,
    term_id BIGINT UNSIGNED NOT NULL,
    taxonomy VARCHAR(64)
        CHARACTER SET utf8mb4
        COLLATE utf8mb4_unicode_520_ci
        NOT NULL,
    PRIMARY KEY (term_taxonomy_id),
    KEY idx_term_id (term_id),
    KEY idx_taxonomy (taxonomy)
) ENGINE=InnoDB;

INSERT INTO _dtb_reset_term_taxonomy_ids (
    term_taxonomy_id,
    term_id,
    taxonomy
)
SELECT
    term_taxonomy_id,
    term_id,
    taxonomy
FROM vaa_term_taxonomy
WHERE taxonomy IN (
    'product_cat',
    'product_tag',
    'product_shipping_class',
    'pa_brand',
    'product_brand',
    'pwb-brand',
    'yith_product_brand'
)
OR taxonomy LIKE 'pa\_%';

SELECT taxonomy, COUNT(*) AS staged_terms
FROM _dtb_reset_term_taxonomy_ids
GROUP BY taxonomy
ORDER BY taxonomy;


-- =============================================================================
-- STEP 8 — DELETE PRODUCT COMMENT META
-- =============================================================================

DELETE cm
FROM vaa_commentmeta cm
INNER JOIN _dtb_reset_comment_ids c
    ON c.comment_ID = cm.comment_id;

SELECT COUNT(*) AS remaining_staged_comment_meta
FROM vaa_commentmeta cm
INNER JOIN _dtb_reset_comment_ids c
    ON c.comment_ID = cm.comment_id;


-- =============================================================================
-- STEP 9 — DELETE PRODUCT COMMENTS / REVIEWS
-- =============================================================================

DELETE c
FROM vaa_comments c
INNER JOIN _dtb_reset_comment_ids staged
    ON staged.comment_ID = c.comment_ID;

SELECT COUNT(*) AS remaining_staged_comments
FROM vaa_comments c
INNER JOIN _dtb_reset_comment_ids staged
    ON staged.comment_ID = c.comment_ID;


-- =============================================================================
-- STEP 10 — DELETE PRODUCT POSTMETA
-- =============================================================================

DELETE pm
FROM vaa_postmeta pm
INNER JOIN _dtb_reset_product_ids p
    ON p.ID = pm.post_id;

SELECT COUNT(*) AS remaining_product_postmeta
FROM vaa_postmeta pm
INNER JOIN _dtb_reset_product_ids p
    ON p.ID = pm.post_id;


-- =============================================================================
-- STEP 11 — DELETE PRODUCT TERM RELATIONSHIPS
-- =============================================================================

DELETE tr
FROM vaa_term_relationships tr
INNER JOIN _dtb_reset_product_ids p
    ON p.ID = tr.object_id;

SELECT COUNT(*) AS remaining_product_term_relationships
FROM vaa_term_relationships tr
INNER JOIN _dtb_reset_product_ids p
    ON p.ID = tr.object_id;


-- =============================================================================
-- STEP 12 — DELETE PRODUCT LOOKUP DATA
-- =============================================================================

DELETE lookup
FROM vaa_wc_product_meta_lookup lookup
INNER JOIN _dtb_reset_product_ids p
    ON p.ID = lookup.product_id;

DELETE lookup
FROM vaa_wc_product_attributes_lookup lookup
INNER JOIN _dtb_reset_product_ids p
    ON p.ID = lookup.product_id
    OR p.ID = lookup.product_or_parent_id;

-- Fully derived from catalog taxonomy relationships.
DELETE FROM vaa_wc_category_lookup;

SELECT
    (SELECT COUNT(*)
       FROM vaa_wc_product_meta_lookup lookup
       INNER JOIN _dtb_reset_product_ids p ON p.ID = lookup.product_id) AS remaining_product_lookup,
    (SELECT COUNT(*)
       FROM vaa_wc_product_attributes_lookup lookup
       INNER JOIN _dtb_reset_product_ids p
          ON p.ID = lookup.product_id
          OR p.ID = lookup.product_or_parent_id) AS remaining_attribute_lookup,
    (SELECT COUNT(*) FROM vaa_wc_category_lookup) AS remaining_category_lookup;


-- =============================================================================
-- STEP 13 — DELETE DOWNLOAD LOGS AND PERMISSIONS
-- =============================================================================

DELETE log_row
FROM vaa_wc_download_log log_row
INNER JOIN _dtb_reset_download_permission_ids p
    ON p.permission_id = log_row.permission_id;

DELETE permission_row
FROM vaa_woocommerce_downloadable_product_permissions permission_row
INNER JOIN _dtb_reset_download_permission_ids p
    ON p.permission_id = permission_row.permission_id;

SELECT COUNT(*) AS remaining_staged_download_permissions
FROM vaa_woocommerce_downloadable_product_permissions permission_row
INNER JOIN _dtb_reset_download_permission_ids p
    ON p.permission_id = permission_row.permission_id;


-- =============================================================================
-- STEP 14 — DELETE PRODUCT AND VARIATION POSTS
-- =============================================================================

DELETE post_row
FROM vaa_posts post_row
INNER JOIN _dtb_reset_product_ids p
    ON p.ID = post_row.ID;

SELECT COUNT(*) AS remaining_products_and_variations
FROM vaa_posts
WHERE post_type IN ('product', 'product_variation');


-- =============================================================================
-- STEP 15 — REMOVE REFERENCES TO ATTACHMENTS FROM SURVIVING POSTMETA
--
-- Prevents pages, posts, settings, or other surviving post objects from retaining
-- broken _thumbnail_id values pointing at attachment records deleted in STEP 17.
-- Product postmeta was already removed in STEP 10.
-- =============================================================================

DELETE pm
FROM vaa_postmeta pm
INNER JOIN _dtb_reset_attachment_ids a
    ON CAST(pm.meta_value AS UNSIGNED) = a.ID
WHERE pm.meta_key = '_thumbnail_id';

SELECT ROW_COUNT() AS surviving_thumbnail_references_deleted;


-- =============================================================================
-- STEP 16 — DELETE ATTACHMENT POSTMETA AND TERM RELATIONSHIPS
-- =============================================================================

DELETE pm
FROM vaa_postmeta pm
INNER JOIN _dtb_reset_attachment_ids a
    ON a.ID = pm.post_id;

DELETE tr
FROM vaa_term_relationships tr
INNER JOIN _dtb_reset_attachment_ids a
    ON a.ID = tr.object_id;

SELECT
    (SELECT COUNT(*)
       FROM vaa_postmeta pm
       INNER JOIN _dtb_reset_attachment_ids a ON a.ID = pm.post_id) AS remaining_attachment_meta,
    (SELECT COUNT(*)
       FROM vaa_term_relationships tr
       INNER JOIN _dtb_reset_attachment_ids a ON a.ID = tr.object_id) AS remaining_attachment_relationships;


-- =============================================================================
-- STEP 17 — DELETE ALL REGISTERED ATTACHMENT POSTS
-- Physical files remain on disk.
-- =============================================================================

DELETE post_row
FROM vaa_posts post_row
INNER JOIN _dtb_reset_attachment_ids a
    ON a.ID = post_row.ID;

SELECT COUNT(*) AS remaining_registered_attachments
FROM vaa_posts
WHERE post_type = 'attachment';


-- =============================================================================
-- STEP 18 — DELETE RELATIONSHIPS FOR STAGED CATALOG TAXONOMIES
-- =============================================================================

DELETE tr
FROM vaa_term_relationships tr
INNER JOIN _dtb_reset_term_taxonomy_ids staged
    ON staged.term_taxonomy_id = tr.term_taxonomy_id;

SELECT COUNT(*) AS remaining_staged_taxonomy_relationships
FROM vaa_term_relationships tr
INNER JOIN _dtb_reset_term_taxonomy_ids staged
    ON staged.term_taxonomy_id = tr.term_taxonomy_id;


-- =============================================================================
-- STEP 19 — DELETE TERM META FOR STAGED CATALOG TERMS
-- =============================================================================

DELETE tm
FROM vaa_termmeta tm
INNER JOIN _dtb_reset_term_taxonomy_ids staged
    ON staged.term_id = tm.term_id;

SELECT COUNT(*) AS remaining_staged_termmeta
FROM vaa_termmeta tm
INNER JOIN _dtb_reset_term_taxonomy_ids staged
    ON staged.term_id = tm.term_id;


-- =============================================================================
-- STEP 20 — DELETE STAGED TERM TAXONOMY ROWS
-- =============================================================================

DELETE tt
FROM vaa_term_taxonomy tt
INNER JOIN _dtb_reset_term_taxonomy_ids staged
    ON staged.term_taxonomy_id = tt.term_taxonomy_id;

SELECT COUNT(*) AS remaining_staged_term_taxonomy_rows
FROM vaa_term_taxonomy tt
INNER JOIN _dtb_reset_term_taxonomy_ids staged
    ON staged.term_taxonomy_id = tt.term_taxonomy_id;


-- =============================================================================
-- STEP 21 — DELETE ONLY NOW-ORPHANED STAGED TERMS
-- Shared terms still registered to another taxonomy are preserved.
-- =============================================================================

DELETE term_row
FROM vaa_terms term_row
INNER JOIN _dtb_reset_term_taxonomy_ids staged
    ON staged.term_id = term_row.term_id
LEFT JOIN vaa_term_taxonomy surviving
    ON surviving.term_id = term_row.term_id
WHERE surviving.term_id IS NULL;

SELECT COUNT(*) AS remaining_orphaned_staged_terms
FROM vaa_terms term_row
INNER JOIN _dtb_reset_term_taxonomy_ids staged
    ON staged.term_id = term_row.term_id
LEFT JOIN vaa_term_taxonomy surviving
    ON surviving.term_id = term_row.term_id
WHERE surviving.term_id IS NULL;


-- =============================================================================
-- STEP 22 — VERIFY PRESERVED GLOBAL ATTRIBUTE DEFINITIONS
-- Empty is valid if this installation has no registered global attributes.
-- =============================================================================

SELECT
    attribute_id,
    attribute_name,
    attribute_label,
    attribute_type,
    attribute_orderby,
    attribute_public
FROM vaa_woocommerce_attribute_taxonomies
ORDER BY attribute_id;


-- =============================================================================
-- STEP 23 — RESET PRESERVED WC SYSTEM TAXONOMY COUNTS
-- =============================================================================

UPDATE vaa_term_taxonomy
SET count = 0
WHERE taxonomy IN ('product_type', 'product_visibility');

SELECT
    tt.taxonomy,
    t.name,
    tt.count
FROM vaa_term_taxonomy tt
INNER JOIN vaa_terms t
    ON t.term_id = tt.term_id
WHERE tt.taxonomy IN ('product_type', 'product_visibility')
ORDER BY tt.taxonomy, t.name;


-- =============================================================================
-- STEP 24 — FLUSH CATALOG / MEDIA TRANSIENTS AND DERIVED CACHE OPTIONS
--
-- This intentionally avoids broad patterns such as "%product_cat%" that may
-- match durable plugin configuration. Only known transient/cache namespaces
-- and the WooCommerce attribute-taxonomy cache option are removed.
-- =============================================================================

DELETE FROM vaa_options
WHERE option_name LIKE '\_transient\_wc\_%'
   OR option_name LIKE '\_transient\_timeout\_wc\_%'
   OR option_name LIKE '\_transient\_woocommerce\_%'
   OR option_name LIKE '\_transient\_timeout\_woocommerce\_%'
   OR option_name LIKE '\_site\_transient\_wc\_%'
   OR option_name LIKE '\_site\_transient\_timeout\_wc\_%'
   OR option_name LIKE '\_transient\_wp\_product%'
   OR option_name LIKE '\_transient\_timeout\_wp\_product%'
   OR option_name LIKE '\_transient\_wp\_get\_attachment%'
   OR option_name LIKE '\_transient\_timeout\_wp\_get\_attachment%'
   OR option_name LIKE '\_transient\_wc\_product\_image%'
   OR option_name LIKE '\_transient\_timeout\_wc\_product\_image%'
   OR option_name = 'wc_attribute_taxonomies'
   OR option_name LIKE 'woocommerce\_cache\_%';

SELECT ROW_COUNT() AS cache_option_rows_deleted;


-- =============================================================================
-- STEP 25 — FINAL CATALOG + PROTECTED-DATA VERIFICATION
--
-- Catalog/media counts should be zero.
-- Protected counts must match STEP 0.5.
-- =============================================================================

SELECT
    (SELECT COUNT(*) FROM vaa_posts WHERE post_type = 'product') AS remaining_products,
    (SELECT COUNT(*) FROM vaa_posts WHERE post_type = 'product_variation') AS remaining_variations,
    (SELECT COUNT(*) FROM vaa_posts WHERE post_type = 'attachment') AS remaining_attachments,
    (SELECT COUNT(*)
       FROM vaa_comments c
       INNER JOIN vaa_posts p ON p.ID = c.comment_post_ID
      WHERE p.post_type IN ('product', 'product_variation')) AS remaining_product_comments,
    (SELECT COUNT(*) FROM vaa_wc_product_meta_lookup) AS remaining_product_lookup_rows,
    (SELECT COUNT(*) FROM vaa_wc_product_attributes_lookup) AS remaining_attribute_lookup_rows,
    (SELECT COUNT(*) FROM vaa_wc_category_lookup) AS remaining_category_lookup_rows,
    (SELECT COUNT(*) FROM vaa_term_taxonomy WHERE taxonomy = 'product_cat') AS remaining_categories,
    (SELECT COUNT(*) FROM vaa_term_taxonomy WHERE taxonomy = 'product_tag') AS remaining_tags,
    (SELECT COUNT(*)
       FROM vaa_term_taxonomy
      WHERE taxonomy IN ('pa_brand', 'product_brand', 'pwb-brand', 'yith_product_brand')) AS remaining_brand_terms,
    (SELECT COUNT(*) FROM vaa_term_taxonomy WHERE taxonomy LIKE 'pa\_%') AS remaining_attribute_terms,
    (SELECT COUNT(*) FROM vaa_woocommerce_attribute_taxonomies) AS preserved_attribute_definitions,
    (SELECT COUNT(*)
       FROM vaa_term_taxonomy
      WHERE taxonomy IN ('product_type', 'product_visibility')) AS preserved_system_terms,
    (SELECT COUNT(*) FROM vaa_wc_orders) AS hpos_orders_after,
    (SELECT COUNT(*) FROM vaa_wc_orders_meta) AS hpos_order_meta_after,
    (SELECT COUNT(*) FROM vaa_woocommerce_order_items) AS order_items_after,
    (SELECT COUNT(*) FROM vaa_woocommerce_order_itemmeta) AS order_item_meta_after,
    (SELECT COUNT(*) FROM vaa_actionscheduler_actions) AS scheduled_actions_after,
    (SELECT COUNT(*) FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME LIKE 'vaa_dtb\_%') AS dtb_tables_after;


-- =============================================================================
-- STEP 26 — DROP RESET HELPER TABLES
-- Run only after STEP 25 has been reviewed.
-- =============================================================================

DROP TABLE IF EXISTS _dtb_reset_product_ids;
DROP TABLE IF EXISTS _dtb_reset_attachment_ids;
DROP TABLE IF EXISTS _dtb_reset_comment_ids;
DROP TABLE IF EXISTS _dtb_reset_download_permission_ids;
DROP TABLE IF EXISTS _dtb_reset_term_taxonomy_ids;

SET SQL_SAFE_UPDATES = 1;

SELECT 'DTB catalog + Media Library database reset complete.' AS status;


-- =============================================================================
-- POST-RESET OPERATIONAL SEQUENCE
--
-- 1. Purge SiteGround Dynamic Cache and any persistent object cache.
-- 2. Re-register/sync media attachments.
-- 3. Import the canonical WooCommerce catalog with "Update existing products" OFF.
-- 4. Rebuild WooCommerce product lookup tables:
--      wp wc tool run regenerate_product_lookup_tables --user=<ADMIN_ID>
--    If unavailable, use WooCommerce > Status > Tools.
-- 5. Regenerate product attributes lookup:
--      wp wc tool run woocommerce_run_product_attribute_lookup_update_callback --user=<ADMIN_ID>
--    Tool availability varies by WooCommerce version; use the admin tool if absent.
-- 6. Audit preserved Veeqo, QuickBooks, marketplace, search-index, and DTB projection
--    tables for stale product IDs before enabling synchronization workers.
-- 7. Run catalog/API smoke tests before opening storefront traffic.
--
-- NOTE
-- AUTO_INCREMENT values are intentionally not reset. Resetting them provides no
-- integrity benefit, can require table rebuilds/metadata locks, and increases
-- production outage risk on shared hosting.
-- =============================================================================
