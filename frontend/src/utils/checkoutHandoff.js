import { getWooCheckoutFallbackUrl, getWooCheckoutUrl } from './checkoutUrl.js';

const CART_PATH_PATTERN = /\/cart\/?$/i;
const CHECKOUT_PATH_PATTERN = /\/checkout(?:\/|$)/i;

function parseUrl(value) {
  try {
    return new URL(value, typeof window !== 'undefined' ? window.location.origin : 'https://elliottm4.sg-host.com');
  } catch {
    return null;
  }
}

function isCartDestination(value) {
  const url = parseUrl(value);
  return Boolean(url && CART_PATH_PATTERN.test(url.pathname));
}

function isCheckoutDestination(value) {
  const url = parseUrl(value);
  return Boolean(url && CHECKOUT_PATH_PATTERN.test(url.pathname));
}

async function probeCheckout(url) {
  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
    redirect: 'follow',
    headers: {
      Accept: 'text/html,application/xhtml+xml',
    },
  });

  return {
    ok: response.ok,
    status: response.status,
    finalUrl: response.url || url,
  };
}

/**
 * Resolve the safest native WooCommerce checkout destination before replacing
 * the React document.
 *
 * The canonical public /checkout/ route remains preferred. When the hosting
 * rewrite layer incorrectly redirects it to the React /cart/ route, the
 * supported WordPress front-controller URL is probed once as a deterministic
 * fallback. A confirmed cart redirect is surfaced as an error instead of
 * creating a visible cart-refresh loop.
 */
export async function resolveWooCheckoutHandoffUrl() {
  const canonicalUrl = getWooCheckoutUrl();
  const canonical = await probeCheckout(canonicalUrl);

  if (canonical.ok && !isCartDestination(canonical.finalUrl)) {
    return isCheckoutDestination(canonical.finalUrl) ? canonical.finalUrl : canonicalUrl;
  }

  const fallbackUrl = getWooCheckoutFallbackUrl();
  const fallback = await probeCheckout(fallbackUrl);

  if (fallback.ok && !isCartDestination(fallback.finalUrl)) {
    return fallback.finalUrl || fallbackUrl;
  }

  const error = new Error(
    'WooCommerce could not open checkout for the current cart. Your cart is still saved. Refresh the page and try again.'
  );
  error.code = 'DTB_CHECKOUT_HANDOFF_REJECTED';
  error.details = {
    canonicalStatus: canonical.status,
    canonicalFinalUrl: canonical.finalUrl,
    fallbackStatus: fallback.status,
    fallbackFinalUrl: fallback.finalUrl,
  };
  throw error;
}
