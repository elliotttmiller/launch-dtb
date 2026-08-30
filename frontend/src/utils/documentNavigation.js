let navigationPending = false;

function resetDocumentTransition() {
  navigationPending = false;
  if (typeof document !== 'undefined') {
    document.documentElement.classList.remove('dtb-document-transition-active');
    document.documentElement.classList.remove('dtb-checkout-handoff-active');
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('pageshow', resetDocumentTransition);
}

/**
 * Rebase an internal Drywall Toolbox URL onto the active storefront mount.
 *
 * WordPress/WooCommerce may return canonical production URLs such as
 * `https://drywalltoolbox.com/?product=example`. The React storefront is
 * root-mounted in production but `/staging/`-mounted for staging. Internal
 * product links therefore need their pathname/query/hash preserved while the
 * frontend mount is applied. External URLs are returned unchanged.
 */
export function resolveStorefrontUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';

  const publicUrl = String(process.env.PUBLIC_URL || '/')
    .replace(/\/+$/, '') || '';

  try {
    const baseOrigin = typeof window !== 'undefined'
      ? window.location.origin
      : 'https://drywalltoolbox.com';
    const parsed = new URL(raw, baseOrigin);
    const allowedHosts = new Set(['drywalltoolbox.com', 'www.drywalltoolbox.com']);

    if (!allowedHosts.has(parsed.hostname.toLowerCase())) {
      return raw;
    }

    const pathname = parsed.pathname.startsWith('/') ? parsed.pathname : `/${parsed.pathname}`;
    const alreadyMounted = publicUrl && (pathname === publicUrl || pathname.startsWith(`${publicUrl}/`));
    const mountedPath = alreadyMounted
      ? pathname
      : `${publicUrl}${pathname}` || '/';

    return `${mountedPath}${parsed.search}${parsed.hash}`;
  } catch {
    return raw;
  }
}

/**
 * Navigates outside the React router.
 *
 * Checkout transfers deliberately do not fade or hide the current document. A native
 * WooCommerce checkout request can be delayed by authentication/session convergence;
 * hiding the SPA before the browser commits the destination produces a misleading
 * blank screen while the address bar still shows the cart route. Keep the current
 * document visible and let the browser replace it only after the checkout response is
 * ready to commit.
 */
export function navigateDocument(url, { replace = false } = {}) {
  if (typeof window === 'undefined' || navigationPending) return;

  navigationPending = true;

  const commitNavigation = () => {
    if (replace) {
      window.location.replace(url);
    } else {
      window.location.assign(url);
    }
  };

  commitNavigation();
}
