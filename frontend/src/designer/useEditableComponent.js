import { useEffect, useRef, useMemo } from 'react';
import { useComponentConfig, useDesignConfig } from '../context/DesignConfigContext.jsx';
import { registerComponentNode, initPreviewBridge, isPreviewFrame } from './PreviewBridge.js';

/**
 * Register a React component as an editable DTB Visual Designer surface
 * component. This is the ONLY mechanism that makes a component selectable/
 * configurable — there is no DOM discovery or CSS-selector inference on
 * either side (see mu-plugins/dtb-visual-designer/Domain/SurfaceRegistry.php
 * for the matching PHP-side registration that this id pair must correspond
 * to).
 *
 * Usage:
 *   const { rootProps, getValue, hidden } = useEditableComponent('global-header', 'header-root');
 *   return <header {...rootProps} style={{ display: hidden ? 'none' : undefined }}>...
 *
 * Selection overlays and postMessage wiring only activate when this
 * storefront is actually running inside the editor's preview iframe
 * (see PreviewBridge.isPreviewFrame) — normal customer sessions never render
 * editor DOM attributes, overlays, or draft metadata.
 *
 * @param {string} surfaceId
 * @param {string} componentId
 */
export function useEditableComponent(surfaceId, componentId) {
  const ref = useRef(null);
  const resolved = useComponentConfig(surfaceId, componentId);
  const { config } = useDesignConfig();
  const preview = isPreviewFrame();

  useEffect(() => {
    if (!preview) return undefined;
    initPreviewBridge();
    registerComponentNode(surfaceId, componentId, ref.current);
    return () => registerComponentNode(surfaceId, componentId, null);
  }, [preview, surfaceId, componentId]);

  const rootProps = useMemo(() => {
    if (!preview) return { ref };
    return { ref, 'data-dtb-surface': surfaceId, 'data-dtb-component': componentId };
  }, [preview, surfaceId, componentId]);

  const getValue = (propertyId, fallback) => {
    const prop = resolved.properties?.[propertyId];
    return prop && prop.value != null ? prop.value : fallback;
  };

  // Resolves a `color_ref` property (which stores a registered *token id*,
  // never a raw color) to a `var(--css-custom-property)` reference using the
  // token metadata already present in the resolved config, falling back to
  // the component's own repository-default color when no override applies.
  const getColorVar = (propertyId, fallbackColor) => {
    const tokenId = getValue(propertyId, null);
    const token = tokenId && config.tokens ? config.tokens[tokenId] : null;
    return token && token.cssVar ? `var(${token.cssVar})` : fallbackColor;
  };

  return {
    rootProps,
    hidden: !!resolved.hidden,
    order: resolved.order,
    getValue,
    getColorVar,
    isPreview: preview,
  };
}
