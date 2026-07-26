# Checkout Handoff Recovery

Last updated: 2026-07-26.

## Problem

The React cart can contain valid WooCommerce Store API items while a full-document request to the public `/checkout/` route is redirected back to `/cart/`. To the shopper this appears as either:

- Checkout from the cart drawer opening the full cart page; or
- Continue to secure checkout refreshing the cart page.

The React cart remains a visual projection. WooCommerce's cookie-backed Store API session is the cart authority and native WooCommerce Checkout Block remains the only checkout/order authority.

## Production behavior

Both cart entry points now use the same handoff sequence:

```text
cart mutation drain
  -> authenticated identity convergence when required
  -> authoritative Store API cart read
  -> no-store credentialed probe of canonical /checkout/
  -> full-document navigation when checkout is reachable
  -> one supported /wp/index.php?pagename=checkout fallback probe when the host redirects canonical checkout to /cart/
  -> explicit retryable error when both routes resolve back to cart
```

The probe sends normal browser cookies using `credentials: include`. It does not send or persist a Cart-Token, copy WooCommerce session rows, derive a customer/session identifier, create an order, submit checkout, or initialize Stripe.

## Ownership

- `frontend/src/utils/checkoutUrl.js` owns canonical and fallback URL construction.
- `frontend/src/utils/checkoutHandoff.js` owns pre-navigation route verification and loop rejection.
- `frontend/src/pages/Cart.jsx` owns full-cart pending/error presentation.
- `frontend/src/components/shell/CartSidebar.jsx` owns cart-drawer mutation draining, cart verification, and handoff invocation.
- WordPress/WooCommerce owns native checkout, cart/session interpretation, order creation, and redirects.
- Root `.htaccess` owns public `/checkout/` routing into WordPress.

## Failure behavior

When both canonical and fallback native checkout probes resolve to `/cart/`, the storefront must:

1. remain on the cart page;
2. preserve the shopper's visible cart;
3. stop the pending state;
4. present an explicit retryable error; and
5. avoid another automatic navigation attempt.

This prevents a misleading page-refresh loop but does not conceal a server-side session or page-assignment defect.

## Required production verification

1. Guest cart drawer checkout opens native `/checkout/` with the same SKU and quantity.
2. Guest full-cart checkout opens native `/checkout/` with the same SKU and quantity.
3. Authenticated checkout preserves the same customer and WooCommerce session owner.
4. Browser requests include `wp_woocommerce_session_*`, `woocommerce_items_in_cart`, and `woocommerce_cart_hash` where WooCommerce emits them.
5. `/checkout/` does not redirect to `/cart/` for a non-empty authoritative Store API cart.
6. If the canonical host route is intentionally broken in a controlled test, the front-controller fallback opens native checkout.
7. If both routes redirect to cart, the React page displays an error instead of refreshing.
8. Quantity mutations finish before checkout probing begins.
9. Duplicate taps create only one handoff attempt.
10. Successful checkout continues through the official WooCommerce Stripe gateway and existing order pipeline.

## Static validation

```powershell
.\scripts\smoke-dtb-checkout-handoff.ps1
```

This static check does not prove live WooCommerce session continuity, SiteGround rewrite behavior, browser cookies, or Stripe operation.
