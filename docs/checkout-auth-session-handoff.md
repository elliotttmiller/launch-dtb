# Checkout Authentication and Native Session Handoff

Last verified against active source: 2026-07-24.

## Authority

Drywall Toolbox storefront authentication uses the server-issued HttpOnly `dtb_auth` JWT cookie. The browser never receives or persists raw auth tokens in application storage.

Native WooCommerce checkout is a full-document WordPress/WooCommerce surface. For same-origin customer sessions, storefront authentication must therefore also converge on WordPress's native HttpOnly authentication/session stack before or during native checkout initialization.

This compatibility boundary does not change commerce authority:

```text
React storefront auth
  -> POST /wp-json/dtb/v1/auth/login or /register
  -> AuthRoutes issues the persistent HttpOnly dtb_auth JWT (single owner)
  -> POST /wp-json/dtb/v1/auth/validate confirms the storefront session
  -> same-origin non-privileged customer converges to session-scoped native WordPress auth
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

The frontend login/registration flow waits for `/auth/validate` before returning. Same-origin checkout navigation is allowed only when the server reports `session.native_checkout.ready=true`; blocked privileged conflicts or cookie-emission failures remain on the auth screen instead of navigating into an ambiguous checkout state.

Cross-origin preview builds cannot pre-mint a first-party native WordPress cookie through their API request. They may still perform the full-document handoff to the backend checkout origin after DTB JWT validation; `NativeCheckoutIdentityBridge.php` verifies the backend-origin `dtb_auth` cookie and establishes session-scoped native compatibility there.

## Native customer-session convergence

`AuthCookieRuntimeHardening.php` does not regenerate or overwrite `dtb_auth`. `AuthRoutes.php` is the single JWT-cookie owner.

For same-origin non-privileged customers, auth login/register/validate responses reconcile native WordPress auth as follows:

1. Validate any existing `wordpress_logged_in_*` cookie cryptographically; cookie presence alone is not trusted.
2. If the valid native cookie already belongs to the verified DTB customer, the session is `aligned` and no cookie is regenerated.
3. If no valid native cookie exists, queue WordPress's supported native HttpOnly auth cookie for the verified customer.
4. The native compatibility cookie is session-scoped. Persistent storefront authentication remains exclusively owned by the 7-day `dtb_auth` cookie.
5. Do not manually replay the `wp_login` action. WooCommerce owns guest-session-to-user-session migration during its native session initialization lifecycle.
6. Attach only redacted handoff diagnostics to the auth response (`status`, readiness booleans, and conflict-containment state). No cookie/token values are exposed.

If `/auth/validate` reports the DTB session unauthenticated/expired, any non-privileged native customer compatibility cookie is cleared so it cannot become a longer-lived second storefront authentication authority.

A DTB-only customer who reaches `/checkout/` directly before `/auth/validate` has converged the native cookie is self-healed by `NativeCheckoutIdentityBridge.php` after the HttpOnly DTB JWT is verified. The bridge issues only a session-scoped compatibility cookie and WooCommerce still owns session migration.

## Privileged native identity isolation

A native WordPress administrator/operator cookie must never become the shopper identity for public WooCommerce Store API or checkout requests. Otherwise Woo can issue a customer-bound `wp_woocommerce_session_*` cookie for the privileged WordPress user; if that native auth later disappears, the browser presents a customer-bound Woo session while Woo resolves the request as guest, causing Woo to invalidate the session and empty the cart.

`StorefrontCommerceIdentityIsolation.php` therefore applies only to public `/checkout/` and `/wp-json/wc/store/*` surfaces:

```text
privileged native WP identity + valid DTB customer
  -> DTB customer is the shopper identity for this commerce request

privileged native WP identity + no valid DTB customer
  -> treat the public commerce request as guest
  -> keep the administrator auth cookie intact for wp-admin
```

This boundary does not alter wp-admin, Woo Admin REST, or native administrator capabilities. It only prevents privileged native identity from owning the public shopper cart/session lifecycle.

## Identity-conflict containment

A browser can theoretically present two valid but different non-privileged customer identities, for example:

```text
dtb_auth -> customer B
wordpress_logged_in_* -> customer A
```

That state must never transfer customer A's cart/session/customer data into customer B. Privacy/data isolation outranks cart preservation for a true cross-customer conflict.

Normal guest-to-customer login is not an identity conflict. WooCommerce's native session handler is allowed to perform its supported guest-session-to-user-session migration when the verified current WordPress user is known before session initialization. DTB does not query arbitrary Woo session rows, copy serialized sessions, fabricate customer IDs, or manually transplant cart data.

## Logout contract

`AuthRoutes.php` clears `dtb_auth` and asks `DTB_SessionService` to rotate the current Woo shopper session to an anonymous cart-only session.

The rotation preserves only the cart payload needed for guest cart continuity. Former-customer contact, address, shipping, coupon, payment and checkout state is not copied into the anonymous replacement session.

The explicit DTB storefront logout route must rotate the Woo shopper session even when a native administrator cookie also exists in the same browser. This does not clear or demote the administrator's native WordPress auth cookie; it only prevents a customer-bound Woo shopper session from being stranded after storefront logout.

## Source ownership

```text
drywalltoolbox/wp/wp-content/mu-plugins/dtb-platform/Auth/AuthRoutes.php
  -> credentials, JWT issuance/validation, dtb_auth cookie ownership

drywalltoolbox/wp/wp-content/mu-plugins/dtb-platform/Auth/AuthCookieRuntimeHardening.php
  -> auth preflight conflict blocking, no-store response hardening,
     native-cookie convergence, fail-closed split-identity containment

drywalltoolbox/wp/wp-content/mu-plugins/dtb-platform/Auth/StorefrontCommerceIdentityIsolation.php
  -> prevents privileged native WP identity from owning public shopper commerce state

drywalltoolbox/wp/wp-content/mu-plugins/dtb-platform/Auth/SessionService.php
  -> explicit storefront logout cart-preserving guest rotation

drywalltoolbox/wp/wp-content/mu-plugins/dtb-platform/Auth/NativeCheckoutIdentityBridge.php
  -> verified DTB identity resolution/self-healing on native checkout documents

frontend/src/auth/useAuth.js
  -> cookie confirmation, cross-tab auth synchronization, handoff readiness capture

frontend/src/context/CartContext.jsx
  -> authoritative Store API cart/nonce reconciliation after auth transitions

frontend/src/pages/Login.jsx
frontend/src/pages/Register.jsx
  -> checkout-aware full-document return; same-origin handoff is readiness-gated

frontend/src/pages/WooNativeCheckout.jsx
frontend/src/utils/checkoutUrl.js
  -> compatibility handoff and canonical native checkout URL construction
```

## Security invariants

- Never expose JWT, WordPress auth-cookie values, Woo session-cookie values, Stripe secrets or payment client secrets to browser JavaScript.
- Never trust caller-supplied customer IDs for checkout ownership.
- Never carry authenticated customer session/cart data across a true conflicting customer identity boundary.
- Never clear/replace a valid privileged native WordPress session from storefront customer auth.
- Never let a privileged native WordPress identity own the public shopper cart/session lifecycle.
- Never manually copy arbitrary Woo session rows or make browser storage a second cart authority.
- Do not manually invoke `wp_login` as a substitute for WooCommerce session initialization.
- Keep native customer compatibility auth session-scoped; `dtb_auth` remains the persistent storefront authority.
- Keep checkout and auth responses private/no-store and vary cache behavior on Cookie/Authorization/Origin as applicable.
- Root cookie scope (`/`) is a deployment invariant for the current `/wp` core + root storefront topology.
- Code running inside `determine_current_user` must not initialize/destroy Woo sessions or recursively resolve current-user state.

## Verification

Before release validate at minimum:

1. Guest cart -> checkout preserves the same Woo session and items.
2. Guest cart -> login -> authenticated cart preserves expected items through Woo's native migration.
3. Existing authenticated customer can open `/checkout/` without a blank document or cart/session loss.
4. Checkout `Log in` -> storefront login -> successful auth returns by same-origin readiness-gated full-document navigation to native checkout.
5. Explicit storefront logout preserves cart contents as an anonymous cart-only session.
6. A browser with a native administrator cookie but no DTB customer uses guest shopper identity on public Store API/checkout requests.
7. A browser with a native administrator cookie plus valid DTB customer uses the DTB customer as shopper identity without mutating the administrator cookie.
8. Deliberate customer A/native-cookie + customer B/DTB-cookie conflict never transfers A's private customer/session state to B.
9. Login/logout refreshes the Store API cart and Nonce before subsequent mutations.
10. Woo cart contents, selected customer, shipping/tax totals and order ownership remain correct across the handoff.
11. PHP logs contain only redacted event/status diagnostics and no auth/session token values.
