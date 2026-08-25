/**
 * frontend/src/hooks/useSchematicRouteState.js
 *
 * Owns URL state for the /schematics route using React Router — brand,
 * category, schematic ID, and page number. No global history patching,
 * no MutationObserver, no DOM label scraping.
 *
 * URL shape:
 *   /schematics                                        catalog root
 *   /schematics?brand=<brandId>                         brand selected
 *   /schematics?brand=<brandId>&category=<categoryId>   category selected
 *   /schematics?schematic=<schematicId>                 viewer (any page 1)
 *   /schematics?schematic=<schematicId>&page=<n>         viewer at page n
 *   /schematics?schematic=<schematicId>&variant=<key>    shared-diagram variant
 *
 * When a `schematic` param is present, the caller (useSchematicRouteState
 * consumer) is expected to fetch the detail record and derive brand/category
 * FROM THAT RESPONSE — this hook only exposes the raw param, it does not
 * require or consult a local mapping table.
 */

import { useCallback, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { canonicalizeSchematicBrandId } from '../data/schematicBrands.js';

export function useSchematicRouteState() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const routeBrandId = searchParams.get('brand') || null;
  const brandId = routeBrandId ? canonicalizeSchematicBrandId(routeBrandId) : null;
  const categoryId = searchParams.get('category') || null;
  const schematicId = searchParams.get('schematic') || null;
  const pageParam = searchParams.get('page');
  const page = pageParam ? Number(pageParam) : null;
  const variant = searchParams.get('variant') || null;

  const view = schematicId ? 'viewer' : 'catalog';

  // Keep legacy shared/bookmarked links working while replacing their URL
  // with the canonical API identity. Consumers receive the canonical value
  // immediately, before the replace-navigation effect completes.
  useEffect(() => {
    if (!routeBrandId || !brandId || routeBrandId === brandId) return;
    const params = new URLSearchParams(searchParams);
    params.set('brand', brandId);
    setSearchParams(params, { replace: true });
  }, [brandId, routeBrandId, searchParams, setSearchParams]);

  const goToCatalogRoot = useCallback(() => {
    setSearchParams({}, { replace: false });
  }, [setSearchParams]);

  const goToBrand = useCallback((nextBrandId) => {
    setSearchParams(nextBrandId ? { brand: nextBrandId } : {}, { replace: false });
  }, [setSearchParams]);

  const goToCategory = useCallback((nextBrandId, nextCategoryId) => {
    if (!nextCategoryId) {
      setSearchParams(nextBrandId ? { brand: nextBrandId } : {}, { replace: false });
      return;
    }
    setSearchParams({ brand: nextBrandId, category: nextCategoryId }, { replace: false });
  }, [setSearchParams]);

  const goToSchematic = useCallback((nextSchematicId, nextPage) => {
    const params = { schematic: nextSchematicId };
    if (nextPage) params.page = String(nextPage);
    setSearchParams(params, { replace: false });
  }, [setSearchParams]);

  const setPage = useCallback((nextPage) => {
    const params = Object.fromEntries(searchParams);
    if (nextPage) {
      params.page = String(nextPage);
    } else {
      delete params.page;
    }
    setSearchParams(params, { replace: true });
  }, [searchParams, setSearchParams]);

  const setVariant = useCallback((nextVariant) => {
    const params = Object.fromEntries(searchParams);
    if (nextVariant) {
      params.variant = String(nextVariant);
    } else {
      delete params.variant;
    }
    setSearchParams(params, { replace: true });
  }, [searchParams, setSearchParams]);

  /**
   * Return to the catalog, preserving brand/category context derived from
   * the currently-open schematic (schematic -> category -> brand -> catalog).
   */
  const backFromViewer = useCallback((derivedBrandId, derivedCategoryId) => {
    if (derivedBrandId && derivedCategoryId) {
      setSearchParams({ brand: derivedBrandId, category: derivedCategoryId }, { replace: false });
    } else if (derivedBrandId) {
      setSearchParams({ brand: derivedBrandId }, { replace: false });
    } else {
      setSearchParams({}, { replace: false });
    }
  }, [setSearchParams]);

  return useMemo(() => ({
    view,
    brandId,
    categoryId,
    schematicId,
    page,
    variant,
    goToCatalogRoot,
    goToBrand,
    goToCategory,
    goToSchematic,
    setPage,
    setVariant,
    backFromViewer,
    navigate,
  }), [view, brandId, categoryId, schematicId, page, variant, goToCatalogRoot, goToBrand, goToCategory, goToSchematic, setPage, setVariant, backFromViewer, navigate]);
}
