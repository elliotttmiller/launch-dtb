# SiteGround launch overlay

`launch/live/` is the assembled deployment overlay for `https://elliottm4.sg-host.com`. It is ignored by Git, rebuilt from canonical source paths, and is not an independent source tree or complete server backup.

## Ownership

- `frontend/` is the canonical React source. A production build is copied to `launch/live/`.
- `drywalltoolbox/.htaccess` is the canonical public-root router and is copied to `launch/live/.htaccess`.
- `drywalltoolbox/wp/.htaccess`, `drywalltoolbox/wp/index.php`, `drywalltoolbox/wp/wp-content/mu-plugins/`, and `drywalltoolbox/wp/wp-content/themes/` are canonical backend source. `launch/live/wp/` still assembles them locally for a complete overlay preview, but production promotion of this exact set of paths is owned by the Release Management platform (`.github/workflows/release-siteground.yml`, built around the official SiteGround Git repository) — see `docs/deployment/release-management-architecture.md`. Do not hand-transfer these paths through FileZilla; use System Manager (Drywall Toolbox > System Manager) or dispatch the workflow directly.
- WordPress core, regular plugins, uploads, caches, logs, `sgs_encrypt_key.php`, and `wp-config.php` are runtime-owned. They are intentionally excluded from source control and normal deployment payloads.

## Domain contract

The SiteGround installation uses:

```text
WP_HOME    = https://elliottm4.sg-host.com
WP_SITEURL = https://elliottm4.sg-host.com/wp
```

The public document root serves the React application. Root aliases route `/wp-json/`, `/wp-admin/`, `/wp-login.php`, `/checkout/`, WooCommerce callbacks, and order-payment endpoints into the physical `/wp` WordPress installation before the SPA fallback.

The temporary SiteGround host remains non-indexable until payment and launch acceptance are complete. Do not enable search indexing merely because the frontend build succeeds.

## Assembly

From the repository root:

```powershell
./launch/scripts/assemble-siteground.ps1
```

The assembly script installs dependencies, lints and builds the frontend, then reconstructs `launch/live/` from `dist/` and the bounded `drywalltoolbox/` deployment mirror. Use `-SkipInstall` or `-SkipBuild` only when the corresponding dependency/build output is already current. Do not copy server secrets or runtime-owned WordPress trees into a deployment artifact.

Do not upload `dist-staging/` to `public_html/`. The staging build is compiled for `/staging/2972/` and will produce 404s for root-deployed assets such as `/staging/2972/assets/js/main.js`.

## Manual FileZilla deployment — frontend and site root only

Scope: the frontend build and site-root files (`index.html`, root `.htaccess`, `.user.ini`, `logos/`) — everything in `launch/live/` **outside** `wp/`. Remote file transfer for this scope is operator-managed through FileZilla and is intentionally outside the repository. The repository contains no remote-transfer workflow, transport script, credential contract, or production connection helper for this path.

Before each transfer:

1. Build and validate `launch/live/` from canonical source.
2. Create independent SiteGround file and database backups.
3. Review the complete bounded overlay and confirm that runtime-owned paths are absent.
4. Transfer the complete dependency-consistent change set with FileZilla, scoped to the site root only; do not upload isolated composition files or anything under `wp/`.
5. Clear required SiteGround caches through Site Tools.
6. Run the runtime acceptance checks below.

FileZilla connection details and credentials are operator-owned and must not be committed, documented in repository files, or pasted into support messages.

## Production `/wp` application tree deployment — Release Management platform

Scope: `.htaccess`, `index.php`, `wp-content/mu-plugins/`, `wp-content/themes/` inside the production `/wp` install. This set of paths is promoted exclusively through `.github/workflows/release-siteground.yml`, an operator-dispatched GitHub Actions workflow built around the official SiteGround Git repository — never through FileZilla, and never automatically on push or merge. Deploy, monitor, and roll back through the System Manager (wp-admin → Drywall Toolbox → System Manager) or by dispatching the workflow directly in GitHub Actions.

Required one-time operator setup (see `docs/deployment/release-management-architecture.md` for full detail):

- GitHub Actions repository secrets: `SITEGROUND_GIT_REMOTE`, `SITEGROUND_GIT_BRANCH`, `SITEGROUND_GIT_SSH_PRIVATE_KEY`, `SITEGROUND_GIT_KNOWN_HOSTS`, `DTB_DEPLOYMENT_WEBHOOK_SECRET`.
- `wp-config.php` constants: `DTB_DEPLOYMENT_WEBHOOK_SECRET` (must match the GitHub secret above) and, to enable one-click dispatch/drift detection from System Manager, `DTB_GITHUB_DEPLOYMENT_TOKEN`.

## Required runtime actions

Code cannot safely perform these host/database/payment actions:

1. Back up the SiteGround files and database.
2. Set WordPress `home` to `https://elliottm4.sg-host.com` and `siteurl` to `https://elliottm4.sg-host.com/wp`; verify with `wp option get home` and `wp option get siteurl`. In the runtime-owned `/wp/wp-config.php`, before WordPress loads, define the matching root REST/auth-cookie topology:

   ```php
   define( 'WP_HOME', 'https://elliottm4.sg-host.com' );
   define( 'WP_SITEURL', 'https://elliottm4.sg-host.com/wp' );
   define( 'COOKIEPATH', '/' );
   define( 'SITECOOKIEPATH', '/' );
   define( 'ADMIN_COOKIE_PATH', '/' );
   define( 'DTB_ENABLE_WOO_ADMIN_REST_NONCE_COMPAT', true );
   define( 'DTB_ENABLE_ROOT_AUTH_COOKIE_MIGRATION', true );
   ```

   The nonce compatibility flag restores only verified same-site, cookie-authenticated admin reads after an expired `wp_rest` nonce. Its only allowed non-GET request is WooCommerce's read-only payment-provider discovery action; payment-setting mutations remain protected. The root-cookie migration flag reissues the current valid WordPress session token once at `/` when wp-admin is still running from an older `/wp` cookie. After changing cookie paths, clear SiteGround caches, remove existing browser cookies for the host, and sign in again.
3. Dry-run a serialized-data-aware old-origin replacement, then apply only after reviewing counts:

   ```text
   wp search-replace 'https://drywalltoolbox.com' 'https://elliottm4.sg-host.com' --all-tables-with-prefix --precise --dry-run
   ```

4. Activate the `headless-base` theme and verify the complete DTB MU-plugin composition root.
5. Keep SiteGround Speed Optimizer active. DTB uses its public `sg_cachepress_purge_cache()` contract; SiteGround CDN purge remains a Site Tools operation.
6. Configure the official WooCommerce Stripe Payment Gateway for the SiteGround domain, connect the Stripe account, enable the approved payment methods, register/verify webhooks, and verify Apple Pay domain association if eligible. DTB never stores those credentials.
7. Run session-preserving cart, authentication, checkout, payment, webhook replay, order-once, refund, Veeqo, and QuickBooks acceptance checks before removing the launch gate or enabling indexing.

## Current verified runtime gap

On 2026-07-21, the public root served the coming-soon document while root `/wp-json/`, `/checkout/`, and `/wp-admin/` returned 404. WordPress responded only through `/wp/?rest_route=/`. The official Stripe extension was present but its gateway was disabled, the Stripe account was not connected, and webhook readiness was unknown. A local build or file upload must not be represented as launch readiness until these runtime checks pass.
