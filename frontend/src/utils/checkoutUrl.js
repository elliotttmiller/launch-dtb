import { DEFAULT_PUBLIC_SITE_URL } from './siteUrl.js';

function buildCheckoutUrl(path) {
  const origin = typeof window !== 'undefined' && window.location?.origin
    ? window.location.origin
    : DEFAULT_PUBLIC_SITE_URL;
  return new URL(path, origin).toString();
}

/**
 * Canonical full-document WooCommerce checkout URL.
 *
 * Checkout is root-mounted on the same public origin as the React storefront.
 * No environment path or client-supplied return host is carried into the
 * WooCommerce session or order. Stripe's Universal Payment Method remains the
 * single provider-owned payment surface.
 */
export function getWooCheckoutUrl() {
  return buildCheckoutUrl('/checkout/');
}

/**
 * Direct WordPress fallback used only when the canonical root checkout route is
 * incorrectly served by the React SPA. This bypasses the SPA catch-all without
 * introducing a second checkout implementation.
 */
export function getWooCheckoutFallbackUrl() {
  return buildCheckoutUrl('/wp/index.php?pagename=checkout');
}
