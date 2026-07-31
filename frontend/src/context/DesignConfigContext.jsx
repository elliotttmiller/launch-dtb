import { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { fetchPublishedDesignConfig, fetchPreviewDesignConfig } from '../api/designConfig.js';

// Mirrors Tailwind's default `md`/`lg` breakpoints already used throughout the
// storefront (see frontend/tailwind.config.js) rather than inventing a second
// breakpoint system for the designer.
const MOBILE_MAX = 767;
const TABLET_MAX = 1023;

function resolveBreakpoint() {
  if (typeof window === 'undefined') return 'base';
  const width = window.innerWidth;
  if (width <= MOBILE_MAX) return 'mobile';
  if (width <= TABLET_MAX) return 'tablet';
  return 'desktop';
}

function readPreviewParams() {
  if (typeof window === 'undefined') return { active: false, token: null, forcedBreakpoint: null };
  const params = new URLSearchParams(window.location.search);
  const token = params.get('dtb_preview_token');
  return {
    active: params.get('dtb_preview') === '1' && !!token,
    token,
    forcedBreakpoint: params.get('dtb_preview_bp'),
  };
}

const EMPTY_CONFIG = { tokens: {}, surfaces: {} };

const DesignConfigContext = createContext(null);

export function useDesignConfig() {
  const context = useContext(DesignConfigContext);
  if (!context) {
    throw new Error('useDesignConfig must be used within a DesignConfigProvider');
  }
  return context;
}

/**
 * Resolve one component's config from the current resolved payload, falling
 * back to an empty (all-default) shape for unregistered surfaces/components
 * so callers never need to null-check.
 */
export function useComponentConfig(surfaceId, componentId) {
  const { config } = useDesignConfig();
  return useMemo(() => {
    const surface = config?.surfaces?.[surfaceId];
    const component = surface?.components?.[componentId];
    return component || { properties: {}, hidden: false, order: null };
  }, [config, surfaceId, componentId]);
}

function applyTokensToDocument(tokens) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  Object.keys(tokens || {}).forEach((tokenId) => {
    const token = tokens[tokenId];
    if (!token || !token.cssVar || token.value == null) return;
    const unit = typeof token.value === 'number' ? 'px' : '';
    root.style.setProperty(token.cssVar, `${token.value}${unit}`);
  });
}

/**
 * Centralized runtime configuration provider for the DTB Visual UI Designer.
 *
 * Resolution order applied server-side (see
 * mu-plugins/dtb-visual-designer/Application/ConfigResolver.php): repository
 * defaults -> published global tokens -> surface/component/responsive
 * overrides -> (preview only) unpublished draft overrides. This provider
 * never re-implements that precedence — it only fetches the one resolved
 * payload for the active mode (published vs. preview) and exposes it.
 *
 * Fails safe: any fetch error or malformed payload falls back to the empty
 * (all-default) shape so the storefront keeps rendering from repository
 * defaults rather than blocking on the design API.
 */
export function DesignConfigProvider({ children }) {
  const previewParams = useMemo(() => readPreviewParams(), []);
  const [breakpoint, setBreakpoint] = useState(previewParams.forcedBreakpoint || resolveBreakpoint());
  const [config, setConfig] = useState(EMPTY_CONFIG);
  const [status, setStatus] = useState('loading'); // 'loading' | 'ready' | 'error'
  const [revisionId, setRevisionId] = useState(null);
  const isPreview = previewParams.active;
  const refreshTokenRef = useRef(0);

  useEffect(() => {
    if (previewParams.forcedBreakpoint) return undefined;
    const onResize = () => setBreakpoint(resolveBreakpoint());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [previewParams.forcedBreakpoint]);

  const load = useCallback(() => {
    const requestId = ++refreshTokenRef.current;
    const request = isPreview
      ? fetchPreviewDesignConfig(previewParams.token, breakpoint)
      : fetchPublishedDesignConfig(breakpoint);

    request
      .then((payload) => {
        if (requestId !== refreshTokenRef.current) return;
        const resolved = payload?.config && typeof payload.config === 'object' ? payload.config : EMPTY_CONFIG;
        setConfig(resolved);
        setRevisionId(payload?.revisionId ?? null);
        applyTokensToDocument(resolved.tokens);
        setStatus('ready');
      })
      .catch(() => {
        if (requestId !== refreshTokenRef.current) return;
        // Repository defaults keep the storefront usable even if the design
        // API is unavailable — never block rendering on this fetch.
        setConfig(EMPTY_CONFIG);
        setStatus('error');
      });
  }, [isPreview, previewParams.token, breakpoint]);

  useEffect(() => {
    load();
  }, [load]);

  // In preview mode, the editor notifies this window via postMessage after
  // every draft mutation so edits appear live without a full page reload.
  useEffect(() => {
    if (!isPreview) return undefined;
    function onMessage(event) {
      if (!event.data || event.data.type !== 'dtb-vd:config-updated') return;
      load();
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [isPreview, load]);

  const value = useMemo(
    () => ({ config, status, isPreview, breakpoint, revisionId, refresh: load }),
    [config, status, isPreview, breakpoint, revisionId, load]
  );

  return <DesignConfigContext.Provider value={value}>{children}</DesignConfigContext.Provider>;
}
