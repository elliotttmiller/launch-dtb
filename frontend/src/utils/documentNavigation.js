const DOCUMENT_FADE_MS = 180;

let navigationPending = false;

function prefersReducedMotion() {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

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
 * Navigates outside the React router.
 *
 * Checkout transfers deliberately do not fade or hide the current document. A native
 * WooCommerce checkout request can be delayed by authentication/session convergence;
 * hiding the SPA before the browser commits the destination produces a misleading
 * blank screen while the address bar still shows the cart route. Keep the current
 * document visible and let the browser replace it only after the checkout response is
 * ready to commit.
 */
export function navigateDocument(url, { replace = false, transition = 'fade' } = {}) {
  if (typeof window === 'undefined' || navigationPending) return;

  navigationPending = true;

  const commitNavigation = () => {
    if (replace) {
      window.location.replace(url);
    } else {
      window.location.assign(url);
    }
  };

  if (transition === 'checkout' || prefersReducedMotion()) {
    commitNavigation();
    return;
  }

  document.documentElement.classList.add('dtb-document-transition-active');
  window.setTimeout(commitNavigation, DOCUMENT_FADE_MS);
}
