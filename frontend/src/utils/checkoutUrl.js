import { API_BASE_URL } from '../api/client.js';

const EXPRESS_HANDOFF_KEY = 'dtb:checkout-express-entry:v1';
const EXPRESS_HANDOFF_TTL_MS = 2 * 60 * 1000;
let expressHandoffRequestedAt = 0;

function backendOrigin() {
  if (typeof window === 'undefined') return API_BASE_URL || '';
  try {
    return new URL(API_BASE_URL || window.location.origin, window.location.origin).origin;
  } catch {
    return window.location.origin;
  }
}

function storefrontBasePath() {
  const configured = String(process.env.PUBLIC_URL || '').trim().replace(/\/+$/, '');
  if (!configured || configured === '/') return '';

  try {
    const pathname = new URL(configured, typeof window !== 'undefined' ? window.location.origin : 'https://elliottm4.sg-host.com').pathname.replace(/\/+$/, '');
    return /^\/staging\/[A-Za-z0-9_-]+$/.test(pathname) ? pathname : '';
  } catch {
    return /^\/staging\/[A-Za-z0-9_-]+$/.test(configured) ? configured : '';
  }
}

function storedExpressHandoffTimestamp() {
  if (typeof window === 'undefined') return 0;
  try {
    return Number(window.sessionStorage.getItem(EXPRESS_HANDOFF_KEY) || 0);
  } catch {
    return 0;
  }
}

function hasActiveExpressHandoff() {
  const requestedAt = Math.max(expressHandoffRequestedAt, storedExpressHandoffTimestamp());
  return requestedAt > 0 && (Date.now() - requestedAt) <= EXPRESS_HANDOFF_TTL_MS;
}

export function requestExpressCheckoutHandoff() {
  expressHandoffRequestedAt = Date.now();
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(EXPRESS_HANDOFF_KEY, String(expressHandoffRequestedAt));
  } catch {
    // Session storage is optional. The in-memory marker still covers this document.
  }
}

export function clearExpressCheckoutHandoff() {
  expressHandoffRequestedAt = 0;
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(EXPRESS_HANDOFF_KEY);
  } catch {
    // Nothing else is required when storage is unavailable.
  }
}

function buildCheckoutUrl(path, { express = false } = {}) {
  const origin = backendOrigin();
  const base = origin ? new URL(path, origin) : new URL(path, 'https://elliottm4.sg-host.com');
  const storefrontPath = storefrontBasePath();

  if (storefrontPath) {
    base.searchParams.set('dtb_storefront_base_path', storefrontPath);
  }
  if (express) {
    base.searchParams.set('dtb_express', '1');
  }

  return origin ? base.toString() : `${base.pathname}${base.search}`;
}

/**
 * Canonical full-document WooCommerce checkout URL.
 *
 * React staging builds may live below /staging/{id}, but checkout is not a
 * parallel SPA route. Production and same-origin staging both hand off directly
 * to root WordPress/WooCommerce checkout. The optional, validated storefront
 * base-path query value is routing metadata only; WooCommerce persists it so a
 * successful order returns to the same React storefront environment.
 *
 * A short-lived express marker is presentation metadata only. It tells the
 * native checkout document to bring the official WooCommerce Stripe Express
 * Checkout surface into view; it never creates or confirms a payment object.
 */
export function getWooCheckoutUrl() {
  return buildCheckoutUrl('/checkout/', { express: hasActiveExpressHandoff() });
}

/**
 * Direct WordPress fallback used only when the canonical root checkout route is
 * incorrectly served by the React SPA. This bypasses the SPA catch-all without
 * introducing a second checkout implementation and preserves storefront return
 * context exactly like the canonical handoff.
 */
export function getWooCheckoutFallbackUrl() {
  return buildCheckoutUrl('/wp/index.php?pagename=checkout', { express: hasActiveExpressHandoff() });
}
