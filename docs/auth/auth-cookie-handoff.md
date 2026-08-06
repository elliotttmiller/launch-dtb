# DTB auth cookie handoff repair

This change hardens storefront authentication when browsers retain multiple `dtb_auth` cookies with the same name across legacy host/domain variants.

## Runtime contract

- Production storefront auth remains an HttpOnly, Secure, host-only cookie at `/`.
- Same-origin requests use `SameSite=Lax`; explicitly allowlisted cross-origin previews use `SameSite=None`.
- Cookie lookup must inspect every raw `Cookie` header candidate and select the first cryptographically valid, unexpired JWT.
- PHP's collapsed `$_COOKIE['dtb_auth']` value is only a fallback when no raw candidate is available.
- Bearer authentication remains the final fallback.
- Authentication diagnostics expose counts and source only; token material is never logged or returned.
- Privileged native WordPress/WooCommerce identity conflict containment remains unchanged.

## Operator validation

After deployment and cache clearing, use a clean browser profile and verify:

1. `POST /wp-json/dtb/v1/auth/login` returns `success: true` and `session.cookie_queued: true`.
2. The following `POST /wp-json/dtb/v1/auth/validate` returns `authenticated: true`, `session.auth_source: cookie`, and `session.token_valid: true`.
3. A request containing an empty or invalid legacy `dtb_auth` value before a valid value still authenticates successfully.
4. Logout clears the canonical host-only cookie and the current host's legacy domain-scoped variants.
5. Customer checkout remains blocked when the same browser is concurrently authenticated as a privileged WordPress user.

Related: `docs/auth/wp-admin-customer-cookie-boundary.md` documents the separate wp-admin/native-WordPress-cookie boundary that protects administrator login from a concurrent customer session.

## Rollback

Restore the previous `Auth/AuthRoutes.php`, clear SiteGround caches, clear browser site data for the host, and repeat login/validate checks.
