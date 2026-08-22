# HostGator WordPress runtime architecture

## Environment boundaries

Drywall Toolbox runs two independent WordPress environments in the same
HostGator account and database. They share no WordPress tables or auth-cookie
scope.

| Environment | Public storefront | Physical WordPress URL | Table prefix | Server directory |
| --- | --- | --- | --- | --- |
| Staging | `https://drywalltoolbox.com/staging/2972` | `https://drywalltoolbox.com/staging/2972/wp` | `staging_kf5_` | `/public_html/drywalltoolbox/staging/2972/wp/` |
| Production | `https://drywalltoolbox.com` | `https://drywalltoolbox.com/wp` | `kf5_` | `/public_html/drywalltoolbox/wp/` |

Native admin and login URLs remain in the physical WordPress namespace:

- staging: `/staging/2972/wp/wp-admin/` and `/staging/2972/wp/wp-login.php`;
- production: `/wp/wp-admin/` and `/wp/wp-login.php`.

The document-root Apache files may expose convenience aliases, but WordPress
must generate admin, login, plugin, nonce, and POST destinations from
`WP_SITEURL`. Do not change `WP_SITEURL` to the React storefront URL.

## Configuration ownership

- `wp-config.php` is server-owned, ignored by Git, and contains secrets.
- `wp-config-staging-sample.php` is the tracked HostGator staging contract.
- `wp-config-sample.php` is the tracked future HostGator production contract.
- `htaccess.hostgator-staging` and `htaccess.hostgator` at the application root
  own the React, REST, checkout, and WordPress alias routing for each deployment.
- the matching files under `drywalltoolbox/wp/` own only the nested WordPress
  runtime routing and dynamic-response cache policy.

Never copy the staging runtime configuration into production. The staging
prefix and cookie path are deliberate containment boundaries.

## Database and URL synchronization

The HostGator MySQL connection uses database `benconkl_drywalltoolbox`, a
cPanel-owned database user assigned to that database, and host `localhost`.
Credentials remain only in the server-owned `wp-config.php`.

`WP_HOME` and `WP_SITEURL` constants are authoritative at runtime. The matching
`home` and `siteurl` option rows should contain the same values so removing the
constants during recovery does not expose stale routing. URL replacement must
use WP-CLI or another serialization-aware WordPress migration tool; do not run
raw SQL replacement over serialized option or metadata values.

The narrowly scoped identity scripts are:

- `scripts/wordpress/sync-hostgator-staging.sql` for the current staging move;
- `scripts/wordpress/sync-hostgator-production.sql` for the later approved launch.

Each script shows the current values, updates only `home` and `siteurl`, and
shows the resulting values in one transaction. The production script must not
be run while staging is being prepared.

For staging, the expected option values are:

```text
home    = https://drywalltoolbox.com/staging/2972
siteurl = https://drywalltoolbox.com/staging/2972/wp
```

For production, the expected option values are:

```text
home    = https://drywalltoolbox.com
siteurl = https://drywalltoolbox.com/wp
```

## Cookie and cache boundaries

Production WordPress auth cookies use `/` because native `/wp/wp-admin/`, root
REST aliases, and the storefront share the production session. Staging cookies
use `/staging/2972/`, which covers the staging SPA, REST aliases, and physical
WordPress admin without being sent to production routes.

Do not define `COOKIE_DOMAIN` for this same-host topology. Host-only cookies
avoid unnecessary subdomain sharing. Dynamic admin, login, REST, cart, checkout,
account, callback, and authenticated requests must remain private and uncacheable.
Static content-addressed assets may use long-lived public caching.

## Secret handling

Never upload a backup configuration into a web-accessible directory. Apache
denies common backup names as defense in depth, but the authoritative control is
keeping backups outside `public_html`. Any database, WordPress application,
WooCommerce API/webhook, JWT, Veeqo, QuickBooks, GitHub, or deployment secret
that was pasted into a browser, chat, log, or repository must be rotated in its
own provider and then updated only in the server-owned configuration.
