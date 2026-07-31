# Public Domain Authority and Launch Cutover

## Current authority

Until the production launch is explicitly approved, the public storefront,
WordPress home URL, release health checks, and canonical frontend build target
remain:

```text
https://elliottm4.sg-host.com
```

The application is root-mounted. Browser-owned API, authentication, cart,
checkout, repair, media, and asset requests use the current page origin or
root-relative paths. Frontend route consumers do not embed an environment
subdirectory.

`frontend/src/utils/siteUrl.js` is the browser-side public URL authority for
canonical URLs, structured data, reports, and hosted-preview fallbacks.
`REACT_APP_SITE_URL` may override its checked-in current-host default at build
time.

The SiteGround Git remote and server filesystem can continue to contain the
SiteGround account directory name after the public domain changes. They are
deployment infrastructure identifiers, not customer-facing URL authorities.
Do not change `SITEGROUND_GIT_REMOTE` merely because DNS changes.

## Launch cutover boundary

Changing the public domain is an intentional operator-controlled release. It is
not inferred from a push, merge, branch name, browser hostname, or request
header.

The cutover requires one coordinated value set:

- SiteGround domain assignment, DNS, and valid TLS for `drywalltoolbox.com`;
- server-owned `WP_HOME=https://drywalltoolbox.com`;
- server-owned `WP_SITEURL=https://drywalltoolbox.com/wp`;
- server-owned `DRYWALL_ALLOWED_ORIGIN=https://drywalltoolbox.com`;
- frontend build `REACT_APP_SITE_URL=https://drywalltoolbox.com`;
- frontend public API values targeting `https://drywalltoolbox.com` where an
  absolute hosted-preview fallback is required;
- release/readiness public base URL `https://drywalltoolbox.com`;
- root `.htaccess` canonical redirects changed so the SiteGround preview host
  and `www.drywalltoolbox.com` redirect to `https://drywalltoolbox.com`.

Provider-managed callback, webhook, wallet-domain, OAuth, email-link, search
console, analytics, and sitemap settings must be updated and verified against
the new HTTPS origin. Do not change provider settings before the new origin is
reachable and the rollback values are recorded.

## Required launch validation

After the coordinated cutover:

1. Verify `/`, a React deep link, `/wp-admin/`, `/wp-json/dtb/v1/health`,
   `/cart`, and `/checkout/` on `https://drywalltoolbox.com`.
2. Confirm `www` and the SiteGround preview host redirect to the canonical
   domain without redirect loops.
3. Confirm canonical tags, Open Graph URLs, schema URLs, robots.txt, and the
   sitemap use `https://drywalltoolbox.com`.
4. Confirm login, logout, authenticated API requests, WooCommerce cart cookie
   continuity, checkout, payment return, order tracking, repair tracking, and
   customer email links remain same-origin.
5. Validate Stripe webhook delivery and wallet-domain association, QuickBooks
   OAuth/webhooks, and every other configured external callback.
6. Clear SiteGround dynamic, file, and CDN caches only after the complete
   dependency-consistent release is present.

Rollback restores the recorded SiteGround domain/default URL values, the prior
frontend artifact, the prior root routing file, and the prior provider callback
configuration as one coordinated set. A database restore is required only if
the cutover included database URL replacement and must use the independent
pre-cutover backup.
