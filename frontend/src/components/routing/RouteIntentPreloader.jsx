import { useEffect } from 'react';
import { preloadRoute } from '../../routing/routeModules.js';

function getInternalHref(target) {
  if (!(target instanceof Element)) return null;
  const anchor = target.closest('a[href]');
  if (!anchor || anchor.hasAttribute('download')) return null;
  if (anchor.getAttribute('target') && anchor.getAttribute('target') !== '_self') return null;

  try {
    const url = new URL(anchor.href, window.location.href);
    if (url.origin !== window.location.origin) return null;
    return url.pathname;
  } catch {
    return null;
  }
}

export default function RouteIntentPreloader() {
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;

    const warmFromEvent = (event) => {
      const pathname = getInternalHref(event.target);
      if (pathname) preloadRoute(pathname);
    };

    document.addEventListener('pointerover', warmFromEvent, { passive: true });
    document.addEventListener('focusin', warmFromEvent);
    document.addEventListener('touchstart', warmFromEvent, { passive: true });

    return () => {
      document.removeEventListener('pointerover', warmFromEvent);
      document.removeEventListener('focusin', warmFromEvent);
      document.removeEventListener('touchstart', warmFromEvent);
    };
  }, []);

  return null;
}
