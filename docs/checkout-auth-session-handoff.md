# Checkout Authentication and Native Session Handoff

Last verified against active source: 2026-07-24.

## Authority

Drywall Toolbox storefront authentication uses the server-issued HttpOnly `dtb_auth` JWT cookie. The browser never receives or persists raw auth tokens in application storage.

Native WooCommerce checkout is a full-document WordPress/WooCommerce surface. For same-origin customer sessions, storefront authentication must therefore also be recognizable by WordPress's native HttpOnly authentication/session stack before WooCommerce initializes checkout customer/session state.

This compatibility boundary does not change commerce authority:

```text
React storefront auth
  -> POST /wp-json/dtb/v1/auth/login or /register
  -> HttpOnly dtb_auth JWT remains storefront auth authority
  -> same-origin non-privileged customer also receives native WordPress auth cookie
  -> standard wp_login lifecycle reconciles WooCommerce customer/session state
  -> full-document /checkout/
  -> WooCommerce Checkout Block
  -> official WooCommerce Stripe Payment Gateway
```

WooCommerce remains authoritative for cart/session, customer/address state, validation, shipping, tax, totals, order creation and order/payment status. The official Stripe gateway remains authoritative for payment rendering, wallets, tokenization, SCA and payment execution.

## Login and registration return contract

`/checkout/` is not a React checkout runtime. When login or registration was initiated from checkout, successful authentication must return with full-document navigation to the canonical WooCommerce checkout URL. React Router must not render `/checkout` as an intermediate post-auth destination.

This avoids racing newly issued HttpOnly cookies against a client-side route transition and prevents a blank SPA handoff document.

## Existing authenticated sessions

`POST /wp-json/dtb/v1/auth/validate` is part of normal storefront auth bootstrap. For a valid same-origin DTB customer session that predates the native-cookie compatibility boundary, the auth hardening layer may establish the missing native WordPress customer cookie once. Existing native WordPress auth wins and is not repeatedly regenerated.

Cross-origin preview/development sessions do not receive a native WordPress auth cookie through this bridge.

## Privilege boundary

Storefront auth must never silently create a native administrator/operator WordPress browser session. Users with privileged administration capabilities such as `manage_options` or `edit_users` are excluded from native-cookie minting through the storefront bridge and continue to use the normal WordPress administrative authentication flow.

Logout clears the storefront DTB auth cookie and the same-origin native customer cookie established by this compatibility path. Privileged native admin/operator sessions are not cleared by the storefront customer-cookie cleanup helper.

## Source ownership

```text
drywalltoolbox/wp/wp-content/mu-plugins/dtb-platform/Auth/AuthRoutes.php
  -> credentials, JWT issuance/validation, auth REST contract

drywalltoolbox/wp/wp-content/mu-plugins/dtb-platform/Auth/AuthCookieRuntimeHardening.php
  -> cookie/cache normalization and same-origin native customer-cookie compatibility

drywalltoolbox/wp/wp-content/mu-plugins/dtb-platform/Auth/NativeCheckoutIdentityBridge.php
  -> narrow verified DTB identity fallback for native checkout document requests

frontend/src/pages/Login.jsx
  -> checkout-aware full-document return after login

frontend/src/pages/WooNativeCheckout.jsx
frontend/src/utils/checkoutUrl.js
  -> compatibility handoff and canonical native checkout URL construction
```

## Security invariants

- Never expose JWT, WordPress auth-cookie values, Stripe secrets or payment client secrets to browser JavaScript.
- Never trust caller-supplied customer IDs for checkout ownership.
- Native WordPress cookie auth wins over the DTB checkout identity fallback.
- Do not mint privileged WordPress sessions through storefront customer auth.
- Keep checkout and auth responses private/no-store and vary cache behavior on Cookie/Authorization/Origin as applicable.
- Do not create a second cart/session authority or query WooCommerce session rows directly to reconstruct arbitrary browser sessions.

## Verification

Before release validate at minimum:

1. Guest checkout loads and Contact -> Shipping -> Payment navigation works.
2. Existing authenticated customer can open `/checkout/` without a blank document or cart/session loss.
3. Checkout `Log in` -> storefront login -> successful auth returns by full-document navigation to native checkout.
4. Existing DTB-only customer session is repaired through `/auth/validate` and then opens native checkout correctly.
5. Cross-origin preview auth does not mint a native WordPress cookie.
6. Privileged admin/operator storefront auth does not mint a native WordPress auth session.
7. Logout removes customer storefront/native session access without clearing a privileged admin session.
8. Woo cart contents, selected customer, shipping/tax totals and order ownership remain correct across the handoff.
