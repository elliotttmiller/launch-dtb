# Veeqo Control Center Deployment Runbook

## Preconditions

- branch is current with `main`
- CI PHP/JavaScript/static wiring validation passes
- Veeqo credential rotation is complete if a credential was previously exposed
- production resource IDs are known and independently verified
- Action Scheduler is healthy for `dtb-orders` and `dtb-integrations`
- managed-file backup/restore path is verified

## Deploy

1. Build the immutable bounded deployment artifact.
2. Confirm the artifact contains all changed `dtb-integrations/Veeqo` files and no runtime-owned secrets/state.
3. Create independent SiteGround file and database backups.
4. Review the complete dependency-consistent Veeqo module change set.
5. Transfer the complete reviewed artifact manually through FileZilla.
6. Clear applicable SiteGround caches through Site Tools.
7. Run root, health, wp-admin, REST, and checkout smoke checks.

Do not manually upload only `bootstrap.php` or only the admin assets. Composition changes must be transferred as one complete dependency-consistent change set.

## Post-deploy validation

1. Load `/wp/wp-admin/admin.php?page=dtb-veeqo-control-center`.
2. Confirm `page=dtb-veeqo-operations` redirects to the canonical page.
3. Confirm the page loads `wp-api-fetch` and no REST-client error is shown.
4. Confirm all control-center routes reject unauthenticated requests.
5. Run connection validation and verify the intended resource IDs.
6. Queue a dry inventory run.
7. Review all exception classes.
8. Queue one real reconciliation.
9. Verify representative simple and variation SKUs in WooCommerce and Store API/cart.
10. Place one controlled paid order and verify exactly-once Veeqo projection.
11. Inspect Action Scheduler and `veeqo-wc-integration` logs.
12. Confirm the legacy `dtb_veeqo_inventory_sync` event is absent.

## Rollback triggers

- wp-admin fatal or missing Veeqo module dependency
- incorrect configured warehouse
- unexplained mass stock changes
- duplicate Veeqo order side effect
- Action Scheduler retry amplification
- credential material in browser/REST/log output
- checkout stock mismatch after reconciliation

## Rollback procedure

1. Stop identified pending Veeqo actions; do not bulk-delete unrelated historical actions.
2. Restore the previous complete DTB-managed artifact from the independently verified backup.
3. Keep `VeeqoRuntimePolicy.php` or an equivalent retirement guard active.
4. Never restore legacy WP-Cron inventory projection, public bulk inventory, or automatic webhook registration.
5. Correct configuration.
6. Run a fresh dry reconciliation and controlled real reconciliation.
7. Verify representative products before reopening checkout.

Database and external Veeqo state are operator-owned. File rollback does not reverse already-projected stock or external orders.
