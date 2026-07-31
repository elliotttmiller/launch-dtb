import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { isPreviewFrame } from './PreviewBridge.js';

/**
 * The Visual Designer's preview iframe always loads the storefront's root
 * document (`/`) — client-side routes like `/cart` or `/products` are
 * rendered entirely by the React SPA and have no matching server-side deep
 * link, so pointing the iframe straight at one would 404 or blank-page
 * depending on host rewrite rules. Only WooCommerce-hosted pages (checkout)
 * are real server routes and can be framed directly.
 *
 * Instead, the editor passes the intended surface route via a
 * `dtb_preview_route` query param (see
 * mu-plugins/dtb-visual-designer/Admin/assets/dtb-visual-designer.js), and
 * this hook performs one client-side `navigate()` to it after the SPA has
 * mounted — exactly once per iframe load.
 */
export function usePreviewRouteSync() {
  const navigate = useNavigate();
  const appliedRef = useRef(false);

  useEffect(() => {
    if (appliedRef.current || !isPreviewFrame() || typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    if (params.get('dtb_preview') !== '1') return;

    const targetRoute = params.get('dtb_preview_route');
    if (!targetRoute) return;

    appliedRef.current = true;
    navigate(decodeURIComponent(targetRoute), { replace: true });
  }, [navigate]);
}
