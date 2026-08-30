import { DEFAULT_PUBLIC_SITE_URL } from './siteUrl.js';

function buildCheckoutUrl(path) {
  const origin = typeof window !== 'undefined' && window.location?.origin
    ? window.location.origin
    : DEFAULT_PUBLIC_SITE_URL;
  return new URL(path, origin).toString();
}

function getStorefrontMount() {
  return String(process.env.PUBLIC_URL || '')
    .trim()
    .replace(/\/+$/, '');
}

/**
 * Canonical full-document WooCommerce checkout URL for the active storefront.
 *
 * Production is root-mounted and resolves to `/checkout/`. SiteGround staging
 * is mounted at `/staging`, so its checkout entry URL is
 * `/staging/checkout/`. Apache then internally hands that request to the one
 * shared WordPress/WooCommerce checkout runtime; the browser is not redirected
 * into the production storefront. WooCommerce remains the only checkout and
 * payment authority in both environments.
 */
export function getWooCheckoutUrl() {
  const mount = getStorefrontMount();
  const checkoutPath = mount && mount !== '/'
    ? `${mount}/checkout/`
    : '/checkout/';

  return buildCheckoutUrl(checkoutPath);
}

/**
 * Direct shared-WordPress fallback used only when the public checkout rewrite
 * is accidentally unavailable. This bypasses every SPA catch-all without
 * introducing another checkout implementation.
 */
export function getWooCheckoutFallbackUrl() {
  return buildCheckoutUrl('/wp/index.php?pagename=checkout');
}
