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
 *
 * When a `schematic` param is present, the caller (useSchematicRouteState
 * consumer) is expected to fetch the detail record and derive brand/category
 * FROM THAT RESPONSE — this hook only exposes the raw param, it does not
 * require or consult a local mapping table.
 */

import { useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export function useSchematicRouteState() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const brandId = searchParams.get('brand') || null;
  const categoryId = searchParams.get('category') || null;
  const schematicId = searchParams.get('schematic') || null;
  const pageParam = searchParams.get('page');
  const page = pageParam ? Number(pageParam) : null;

  const view = schematicId ? 'viewer' : 'catalog';

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
    goToCatalogRoot,
    goToBrand,
    goToCategory,
    goToSchematic,
    setPage,
    backFromViewer,
    navigate,
  }), [view, brandId, categoryId, schematicId, page, goToCatalogRoot, goToBrand, goToCategory, goToSchematic, setPage, backFromViewer, navigate]);
}
