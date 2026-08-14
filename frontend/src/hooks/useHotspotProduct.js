/**
 * frontend/src/hooks/useHotspotProduct.js
 *
 * Live per-SKU WooCommerce lookup for a schematic hotspot part, ported from
 * the legacy `Schematics.jsx` hotspot-product effect
 * (docs/_working/frontend-legacy/frontend/src/pages/Schematics.jsx ~L3154-3203).
 *
 * The static schematic REST payload (`GET /wp-json/dtb/v1/schematics/{id}`)
 * only carries reference data (part_ref, title, brand, mpn, sku,
 * resolution_method, resolution_state, product_url, occurrence_count,
 * available) — it never includes image or price. Legacy resolved those by
 * doing a live `getProductBySku` lookup the moment a hotspot was opened, and
 * this hook reproduces that exact contract: same module-level cache (so
 * re-opening the same hotspot resolves synchronously with no loading
 * flicker), the same 10s timeout guard against a stalled/failing bootstrap,
 * and the same three-state stock resolution.
 *
 * @param {string|undefined|null} sku
 * @returns {{ product: object|null, stockStatus: 'instock'|'outofstock'|'unknown'|null, isLoading: boolean }}
 *   `stockStatus` is `null` only while the live lookup is in flight — every
 *   other terminal state (found, not found, no sku, error, timeout) resolves
 *   to a non-null string so callers never have to special-case a fourth state.
 */
import { useEffect, useState } from 'react';
import { getProductBySku } from '../api/products.js';

// Module-level so the cache survives remounts (e.g. Strict Mode double-invoke,
// or re-opening the same hotspot later in the session) — mirrors the legacy
// `_hotspotSkuCache` module-level Map.
const _hotspotSkuCache = new Map();
const LOOKUP_TIMEOUT_MS = 10000;

function computeInitialState(sku) {
  if (!sku) return { product: null, stockStatus: 'unknown' };
  const cached = _hotspotSkuCache.get(sku);
  return cached || { product: null, stockStatus: null };
}

export function useHotspotProduct(sku) {
  const [state, setState] = useState(() => computeInitialState(sku));

  // Reset synchronously during render when the sku prop changes (e.g. the
  // active hotspot changes to a different part) — mirrors the existing
  // `prevPageId` render-time-reset idiom in DiagramViewer.jsx rather than
  // setting state from inside the effect for a value we can already derive.
  const [prevSku, setPrevSku] = useState(sku);
  if (prevSku !== sku) {
    setPrevSku(sku);
    setState(computeInitialState(sku));
  }

  useEffect(() => {
    // No SKU on this part, or this sku's result is already cached (handled
    // by the render-time reset above) — nothing left for the effect to do.
    if (!sku || _hotspotSkuCache.has(sku)) return undefined;

    let cancelled = false;

    const timeoutId = setTimeout(() => {
      if (cancelled) return;
      const fallback = { product: null, stockStatus: 'unknown' };
      _hotspotSkuCache.set(sku, fallback);
      setState(fallback);
    }, LOOKUP_TIMEOUT_MS);

    getProductBySku(sku)
      .then((wcProduct) => {
        if (cancelled) return;
        clearTimeout(timeoutId);
        const resolved = {
          product: wcProduct || null,
          stockStatus: wcProduct ? (wcProduct.stock_status || 'instock') : 'unknown',
        };
        _hotspotSkuCache.set(sku, resolved);
        setState(resolved);
      })
      .catch(() => {
        if (cancelled) return;
        clearTimeout(timeoutId);
        const fallback = { product: null, stockStatus: 'unknown' };
        _hotspotSkuCache.set(sku, fallback);
        setState(fallback);
      });

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [sku]);

  return {
    product: state.product,
    stockStatus: state.stockStatus,
    isLoading: state.stockStatus === null,
  };
}
