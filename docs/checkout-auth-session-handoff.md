# Checkout Authentication and Native Session Handoff

Last verified against active source: 2026-07-24.

## Authority

Drywall Toolbox storefront authentication uses the server-issued HttpOnly `dtb_auth` JWT cookie. The browser never receives or persists raw auth tokens in application storage.

Native WooCommerce checkout is a full-document WordPress/WooCommerce surface. For same-origin customer sessions, storefront authentication must therefore also converge on WordPress's native HttpOnly authentication/session stack before or during native checkout initialization.

This compatibility boundary does not change commerce authority:

```text
React storefront auth
  -> POST /wp-json/dtb/v1/auth/login or /register
  -> AuthRoutes issues the HttpOnly dtb_auth JWT (single owner)
  -> POST /wp-json/dtb/v1/auth/validate confirms the storefront session
  -> same-origin non-privileged customer converges to native WordPress auth
  -> WooCommerce natively initializes/migrates its cookie-backed session
  -> full-document /checkout/
  -> WooCommerce Checkout Block
  -> official WooCommerce Stripe Payment Gateway
```

WooCommerce remains authoritative for cart/session, customer/address state, validation, shipping, tax, totals, order creation and order/payment status. The official Stripe gateway remains authoritative for payment rendering, wallets, tokenization, SCA and payment execution.

## Runtime configuration contract

The tracked redacted `drywalltoolbox/wp/wp-config-sample.php` matches the deployed topology:

```text
WP_HOME    = https://elliottm4.sg-host.com
WP_SITEURL = https://elliottm4.sg-host.com/wp

COOKIEPATH        = /
SITECOOKIEPATH    = /
ADMIN_COOKIE_PATH = /
```

WordPress core lives under `/wp`, while `/checkout/`, `/wp-json/`, and `/wp-admin/` are public root aliases. Root cookie scope is therefore a required deployment invariant. The root `.htaccess` must continue routing `/checkout/` into WordPress before the React SPA catch-all and must keep auth/cart/checkout surfaces private/no-store.

## Login and registration return contract

`/checkout/` is not a React checkout runtime. When login or registration was initiated from checkout, successful authentication must return with full-document navigation to the canonical WooCommerce checkout URL. React Router must not render `/checkout` as an intermediate post-auth destination.

The frontend login flow waits for `/auth/validate` before returning from `login()`. This confirms that the browser accepted the server-issued HttpOnly storefront cookie and captures the non-secret native-checkout handoff readiness state returned by the server.

## Native customer-session convergence

`AuthCookieRuntimeHardening.php` does not regenerate or overwrite `dtb_auth`. `AuthRoutes.php` is the single JWT-cookie owner.

For same-origin non-privileged customers, auth login/register/validate responses reconcile native WordPress auth as follows:

1. Validate any existing `wordpress_logged_in_*` cookie cryptographically; cookie presence alone is not trusted.
2. If the valid native cookie already belongs to the verified DTB customer, the session is `aligned` and no cookie is regenerated.
3. If no valid native cookie exists, queue WordPress's supported native HttpOnly auth cookie for the verified customer.
4. Do not manually replay the `wp_login` action. WooCommerce owns guest-session-to-user-session migration during its native session initialization lifecycle.
5. Attach only redacted handoff diagnostics to the auth response (`status`, readiness booleans, and conflict-containment state). No cookie/token values are exposed.

A DTB-only customer who reaches `/checkout/` directly before `/auth/validate` has converged the native cookie is also repaired by `NativeCheckoutIdentityBridge.php` after the HttpOnly DTB JWT is verified. WooCommerce still owns the resulting session migration.

## Identity-conflict containment

A browser can theoretically present two valid but different identities, for example:

```text
dtb_auth -> customer B
wordpress_logged_in_* -> customer A
```

That state must never transfer customer A's cart/session/customer data into customer B.

The hardened contract is:

```text
identity mismatch
  -> discard the browser Woo session/cart markers without preservation
  -> clear/replace the stale native customer auth cookie
  -> converge native identity to the verified non-privileged DTB customer
  -> allow WooCommerce to create/migrate a fresh supported session
  -> emit redacted security diagnostics
```

Cart continuity is intentionally sacrificed on a cross-customer identity conflict because privacy/data isolation outranks cart preservation.

## Normal guest-to-customer cart transition

Normal guest login is not an identity conflict.

WooCommerce's native session handler is allowed to perform its supported guest-session-to-user-session migration when the verified current WordPress user is known before session initialization. DTB does not query arbitrary Woo session rows, copy serialized sessions, fabricate customer IDs, or manually transplant cart data.

After login/logout, the React `CartContext` serializes a Store API cart refresh behind any in-flight cart mutation. The refresh obtains the authoritative Woo cart again and refreshes the Store API Nonce so a stale pre-auth nonce/cart snapshot cannot win a race against the new identity boundary.

## Existing authenticated sessions

`POST /wp-json/dtb/v1/auth/validate` is part of normal storefront auth bootstrap. A valid same-origin DTB customer session that predates native-cookie convergence can establish the missing native WordPress customer cookie once.

Cross-origin preview/development sessions do not receive a native WordPress auth cookie through this bridge.

## Privilege boundary

Storefront auth must never silently create a native administrator/operator WordPress browser session. Users with privileged administration capabilities such as `manage_options` or `edit_users` are excluded from native-cookie minting through both the REST and native-checkout bridges and continue to use normal WordPress administrative authentication.

Logout clears the storefront DTB auth cookie through `AuthRoutes.php` and clears only the same-origin non-privileged native customer cookie through the compatibility layer. Privileged native admin/operator sessions are not cleared by storefront customer-cookie cleanup.

## Source ownership

```text
drywalltoolbox/wp/wp-content/mu-plugins/dtb-platform/Auth/AuthRoutes.php
  -> credentials, JWT issuance/validation, dtb_auth cookie ownership

drywalltoolbox/wp/wp-content/mu-plugins/dtb-platform/Auth/AuthCookieRuntimeHardening.php
  -> no-store response hardening, native-cookie convergence, redacted diagnostics

drywalltoolbox/wp/wp-content/mu-plugins/dtb-platform/Auth/SessionService.php
  -> logout cart-preserving rotation and privacy-safe identity-conflict discard

drywalltoolbox/wp/wp-content/mu-plugins/dtb-platform/Auth/NativeCheckoutIdentityBridge.php
  -> verified DTB identity resolution/self-healing on native checkout documents

frontend/src/auth/useAuth.js
  -> cookie confirmation, cross-tab auth synchronization, handoff readiness capture

frontend/src/context/CartContext.jsx
  -> authoritative Store API cart/nonce reconciliation after auth transitions

frontend/src/pages/Login.jsx
  -> checkout-aware full-document return after login

frontend/src/pages/WooNativeCheckout.jsx
frontend/src/utils/checkoutUrl.js
  -> compatibility handoff and canonical native checkout URL construction
```

## Security invariants

- Never expose JWT, WordPress auth-cookie values, Woo session-cookie values, Stripe secrets or payment client secrets to browser JavaScript.
- Never trust caller-supplied customer IDs for checkout ownership.
- Never carry authenticated customer session/cart data across a conflicting identity boundary.
- Never manually copy arbitrary Woo session rows or make browser storage a second cart authority.
- Do not manually invoke `wp_login` as a substitute for WooCommerce session initialization.
- Do not mint privileged WordPress sessions through storefront customer auth.
- Keep checkout and auth responses private/no-store and vary cache behavior on Cookie/Authorization/Origin as applicable.
- Root cookie scope (`/`) is a deployment invariant for the current `/wp` core + root storefront topology.

## Verification

Before release validate at minimum:

1. Guest cart -> login -> authenticated cart preserves expected items through Woo's native migration.
2. Existing authenticated customer can open `/checkout/` without a blank document or cart/session loss.
3. Checkout `Log in` -> storefront login -> successful auth returns by full-document navigation to native checkout.
4. Existing DTB-only customer session is repaired through `/auth/validate` and then opens native checkout correctly.
5. Direct `/checkout/` with a valid DTB-only customer cookie self-heals native auth without a second login.
6. Deliberate customer A/native-cookie + customer B/DTB-cookie conflict discards the conflicting Woo browser session rather than transferring cart/customer data.
7. Cross-origin preview auth does not mint a native WordPress cookie.
8. Privileged admin/operator storefront auth does not mint a native WordPress auth session.
9. Logout preserves only the intended guest cart payload while removing former-customer contact/address/payment/session state.
10. Login/logout refreshes the Store API cart and Nonce before subsequent mutations.
11. Woo cart contents, selected customer, shipping/tax totals and order ownership remain correct across the handoff.
12. PHP logs contain only redacted event/status diagnostics and no auth/session token values.
