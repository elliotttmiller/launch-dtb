# Checkout Session and Identity Contract

Last verified against source: 2026-07-26.

## Production contract

Drywall Toolbox uses one WooCommerce cart/session across the React storefront and native WooCommerce checkout:

```text
React Store API cart
  -> same-origin Woo cookie-backed session
  -> shared React checkout-handoff boundary
  -> full-document https://elliottm4.sg-host.com/checkout/
  -> WordPress resolves the same authenticated customer
  -> WooCommerce loads the same session/cart
  -> Checkout Block
  -> official WooCommerce Stripe Payment Gateway
```

`/staging/{id}/` is only a React storefront build location. It is not a separate checkout authority. Staging and production storefront builds both hand off to the canonical root `/checkout/` on the backend/public origin.

## React checkout-handoff boundary

`frontend/src/utils/checkoutHandoff.js` is the single orchestration boundary used by the full cart and cart drawer before native checkout owns the document.

It must:

1. contain duplicate concurrent taps with one in-flight promise;
2. wait a bounded amount of time for pending Store API cart mutations;
3. converge authenticated DTB identity to native WordPress/Woo identity;
4. re-read and validate the authoritative WooCommerce Store API cart;
5. navigate the full document to the canonical URL from `getWooCheckoutUrl()`;
6. surface a retryable customer error without discarding the cart when preparation fails.

It must not:

- prefetch or probe the private `/checkout/` HTML document;
- follow a checkout redirect in the background;
- use `/wp/index.php?pagename=checkout` to conceal a broken canonical route;
- persist or synthesize a second cart authority;
- create orders or payment objects;
- issue duplicate identity, cart, or navigation operations after repeated taps.

The cart drawer may still render a staging-shaped or legacy checkout `href` for progressive enhancement. Its click boundary must recognize that target and normalize the actual navigation through the shared canonical handoff.

## Storefront return context

Canonical checkout and post-checkout presentation have different routing responsibilities:

```text
production storefront -> /checkout/ -> /order-tracking/{orderId}
staging storefront    -> /checkout/ -> /staging/{id}/order-tracking/{orderId}
```

The React checkout URL helper may append only the validated public routing hint `dtb_storefront_base_path=/staging/{id}`. `DTB_StorefrontReturnContext` captures that value into the existing Woo session, persists it as `_dtb_storefront_base_path` on the Woo order, and filters WooCommerce's successful gateway return URL to the matching React order-tracking route. Store API order processing also recovers the validated hint from the checkout request referrer and preserves an already-persisted order value, so a blank API request context cannot downgrade a staging order to the production storefront.

The return context is not an authority input. It must never affect customer identity, cart contents, totals, order creation, Stripe state, payment verification, fulfillment, or accounting. Accepted values are production root (`''`) or `/staging/{id}` matching the strict staging-path allowlist; all other values collapse to production root.

The successful tracking URL retains the Woo order key and `checkout_complete=1` signal so guest tracking authorization and the existing post-checkout cart cleanup contract remain intact.

Guest confirmation emails also include customer-safe tracking and order-detail URLs. Both URLs carry the WooCommerce `order_key` capability, and the corresponding single-order REST projections validate that key with a timing-safe comparison. Account order lists remain authentication-only.

## Authenticated customer identity convergence

The React storefront issues the signed HttpOnly `dtb_auth` JWT after DTB login. Store API REST requests already resolve that verified JWT to the matching WordPress customer before WooCommerce initializes customer/session state.

Native checkout is a normal WordPress document request rather than a REST request. `dtb-platform/Auth/NativeCheckoutIdentityBridge.php` therefore resolves the same signed `dtb_auth` identity during `determine_current_user` for native checkout/payment document requests only.

Required invariant:

```text
DTB authenticated customer ID
  == WordPress current user ID during native checkout
  == WooCommerce registered-customer session owner
```

Native WordPress cookie authentication always wins when present. The bridge does not mint WordPress admin/auth cookies, grant capabilities, accept caller-supplied customer IDs, decode unsigned tokens, query `woocommerce_sessions`, copy session rows, or inject arbitrary Woo sessions.

## Guest contract

Guests remain WordPress user `0` with WooCommerce's normal guest session identity. The native checkout bridge does nothing when `dtb_auth` is absent or invalid.

## Logout transition

`DELETE /dtb/v1/auth/logout` is the single storefront logout boundary. A successful response means both identity layers have transitioned:

1. the customer-owned WooCommerce session is destroyed;
2. only its cart payload is copied into a newly generated guest session;
3. customer, contact, address, coupon, shipping, payment, and pending-checkout state are not copied;
4. the `dtb_auth` cookie is expired; and
5. the response is private and non-cacheable.

The React auth provider must not publish logged-out state, close the account surface, or redirect until the server confirms success. Logout failures remain visible and retryable. Cross-tab logout propagation updates browser state without issuing duplicate logout requests.

Browser-managed address autofill is independent of DTB and Woo session state. Standard checkout `autocomplete` metadata remains enabled for usability; server-rendered guest values must nevertheless be empty after the logout transition.

## Cart-Token policy

Same-origin production/staging React uses WooCommerce's cookie-backed session plus Store API Nonce semantics. `Cart-Token` remains compatibility-only for genuinely cross-origin clients.

Do not use a browser-persisted Cart-Token to repair native checkout continuity: a full-document checkout navigation cannot attach a custom `Cart-Token` request header, which would recreate two cart authorities.

## Failure behavior

If a signed DTB identity cannot be verified, the bridge fails closed and leaves WordPress authentication unchanged.

If the shared handoff cannot confirm the authoritative cart, complete authenticated identity convergence, or drain pending cart mutations within its bound, it remains on the current React cart surface and shows a retryable message. It does not navigate to an alternate checkout URL or silently refresh the cart route.

The checkout flow must never repair identity/session mismatch by:

- decoding an unsigned JWT payload;
- deriving a Woo session key from caller-controlled data;
- reading another customer's `woocommerce_sessions` row;
- manually injecting a Woo session;
- trusting a caller-supplied customer ID;
- prefetching checkout HTML to infer route health.

## Mechanical verification

For an authenticated staging customer:

1. Add a product through the Store API and verify the server cart contains it.
2. Verify the browser has `wp_woocommerce_session_*` and `woocommerce_items_in_cart` cookies.
3. Click Checkout from `/staging/2972/` and verify repeated rapid taps produce one Store API cart proof and one document navigation.
4. The first checkout document navigation must target `/checkout/?dtb_storefront_base_path=%2Fstaging%2F2972` (encoding may vary), not `/staging/2972/checkout/`.
5. Verify no background `GET /checkout/` request occurs before the actual document navigation.
6. The `/checkout/` response must not expire `wp_woocommerce_session_*`, `woocommerce_items_in_cart`, or `woocommerce_cart_hash`.
7. Native checkout must render the same SKU/variation/quantity seen by the React cart.
8. For an authenticated customer, server-side `get_current_user_id()` must equal the Woo session customer ID.
9. Place a successful test order and verify the customer return URL is `/staging/2972/order-tracking/{orderId}?order_key=...&checkout_complete=1`.
10. Repeat from production root and verify the return URL is `/order-tracking/{orderId}?order_key=...&checkout_complete=1` with no staging prefix.
11. Guest checkout must continue to work without a DTB auth cookie.
12. Invalid/expired/tampered `dtb_auth` must not authenticate the request or expose another customer's cart.
13. Sign out with a populated account cart, then open checkout as a guest in the same browser. The cart must remain, while server-rendered email, phone, name, address, coupons, chosen shipping, payment, and pending-order state from the account must not remain.
14. Force the logout endpoint to fail. The storefront must retain authenticated UI state, keep the account surface open, and present a retryable error instead of claiming logout succeeded.
15. Complete logout in one tab. Other tabs must clear their local authenticated state without generating a logout-request loop.
16. Hold a cart quantity mutation open beyond the configured handoff bound and verify checkout remains on the cart with a retryable message.

Only after this identity/session/return-context contract passes should Stripe card, 3DS/SCA, Link, wallet, webhook, order-pay, refund, Veeqo, and QuickBooks acceptance tests be considered meaningful.
