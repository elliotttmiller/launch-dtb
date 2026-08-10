/**
 * frontend/src/hooks/useCatalogCategory.js
 *
 * Fetches term-level metadata (label, description, image, parent, children)
 * for a single product_cat slug from GET /wp-json/dtb/v1/catalog/category.
 * Mirrors the loading/error/cache conventions of useCatalogFacets.
 */

import { useEffect, useState } from 'react';
import { fetchCatalogCategory } from '../services/catalogPlatformCache.js';

export function useCatalogCategory(slug) {
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(Boolean(slug));
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    if (!slug) {
      Promise.resolve().then(() => {
        if (!mounted) return;
        setCategory(null);
        setLoading(false);
        setError(null);
      });
      return () => { mounted = false; };
    }

    Promise.resolve().then(() => {
      if (!mounted) return;
      setLoading(true);
      setError(null);
    });

    fetchCatalogCategory(slug)
      .then((data) => {
        if (!mounted) return;
        setCategory(data || null);
        setLoading(false);
      })
      .catch((err) => {
        if (!mounted) return;
        setCategory(null);
        setError(err);
        setLoading(false);
      });

    return () => { mounted = false; };
  }, [slug]);

  return { category, loading, error };
}

export default useCatalogCategory;
