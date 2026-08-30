# WordPress checkout theme runtime

## Authority

The public React storefront does not make WordPress themes authoritative for customer commerce. WooCommerce remains the checkout/order/payment authority. The tracked WordPress theme `drywalltoolbox/wp/wp-content/themes/drywall-toolbox` owns only the native WooCommerce checkout document shell and its presentation assets/templates.

The shared WordPress runtime must deploy that theme directory to `wp/wp-content/themes/drywall-toolbox`. The active WordPress `template` and `stylesheet` options should normally be `drywall-toolbox` when native checkout is enabled.

## Missing-theme protection

`dtb-deployment/Infrastructure/ThemeRuntimeGuard.php` protects runtime availability when WordPress options reference a deleted theme directory. It filters the resolved `template` and `stylesheet` values only when all of the following are true:

1. the configured theme slug does not resolve to an installed theme directory with `style.css`;
2. the tracked `drywall-toolbox` theme is installed and valid.

The guard then uses `drywall-toolbox` for that request. It does not write WordPress options, does not override a valid installed theme, and does not invent a theme if the canonical DTB theme is also missing.

This is a failover mechanism, not the normal activation workflow. Operators should still activate `Drywall Toolbox` in WordPress and verify the database options after deployment.

## Staging checkout routing

The staging React storefront is mounted at `/staging`. Its public checkout URL remains `/staging/checkout/`, but `drywalltoolbox/staging/.htaccess` internally executes the shared WordPress controller at `/wp/index.php?pagename=checkout`. The browser must not be externally redirected to the production storefront root merely to reach WooCommerce.

Production remains root-mounted at `/checkout/` and is internally routed to the same shared WordPress checkout controller.

## Deployment checklist

Deploy these together when checkout/theme runtime changes:

- `drywalltoolbox/wp/wp-content/themes/drywall-toolbox/`
- `drywalltoolbox/wp/wp-content/mu-plugins/dtb-deployment/`
- `drywalltoolbox/staging/.htaccess` for staging routing changes
- the corresponding frontend build when checkout URL generation changes

After deployment verify:

1. `wp-content/themes/drywall-toolbox/style.css` exists on the server;
2. WordPress Appearance reports `Drywall Toolbox` as installed and active;
3. `/staging/checkout/` renders WooCommerce in staging without a 30x escape to `/checkout/`;
4. `/checkout/` renders WooCommerce in production routing;
5. checkout remains private/no-store;
6. payment fields and order creation remain provider/WooCommerce-owned.
