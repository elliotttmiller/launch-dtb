import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchToolsetProducts } from '../../api/toolsetBuilderApi.js';

const DEFAULT_PAGE_SIZE = 48;

function normalizeItems(payload) {
  return Array.isArray(payload?.items) ? payload.items : [];
}

function normalizePagination(payload, fallbackPage = 1) {
  const source = payload?.pagination || {};
  return {
    page: Math.max(1, Number(source.page || fallbackPage || 1)),
    perPage: Math.max(1, Number(source.perPage || source.per_page || DEFAULT_PAGE_SIZE)),
    total: Math.max(0, Number(source.total || 0)),
    totalPages: Math.max(1, Number(source.totalPages || source.total_pages || 1)),
  };
}

export default function useToolsetBuilderCatalog({
  toolFamily,
  displayCategory = [],
  brand = '',
  search = '',
  page = 1,
  enabled = true,
} = {}) {
  const [state, setState] = useState(() => ({
    items: [],
    pagination: normalizePagination(null, page),
    loading: Boolean(enabled && toolFamily),
    error: null,
  }));
  const requestIdRef = useRef(0);

  const requestKey = useMemo(
    () => JSON.stringify({ toolFamily, displayCategory, brand, search, page }),
    [brand, displayCategory, page, search, toolFamily],
  );

  const load = useCallback(async () => {
    if (!enabled || !toolFamily) {
      setState({
        items: [],
        pagination: normalizePagination(null, page),
        loading: false,
        error: null,
      });
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setState((current) => ({ ...current, loading: true, error: null }));

    try {
      const payload = await fetchToolsetProducts({
        toolFamily,
        displayCategory,
        brand,
        search,
        page,
        perPage: DEFAULT_PAGE_SIZE,
      });

      if (requestId !== requestIdRef.current) return;

      setState({
        items: normalizeItems(payload),
        pagination: normalizePagination(payload, page),
        loading: false,
        error: null,
      });
    } catch (error) {
      if (requestId !== requestIdRef.current) return;

      setState((current) => ({
        ...current,
        loading: false,
        error: {
          code: error?.code || 'toolset_catalog_error',
          status: Number(error?.status || 0),
          message: error?.message || 'Could not load products for this tool category.',
        },
      }));
    }
  }, [brand, displayCategory, enabled, page, search, toolFamily]);

  useEffect(() => {
    void requestKey;
    load();
    return () => {
      requestIdRef.current += 1;
    };
  }, [load, requestKey]);

  return {
    ...state,
    retry: load,
  };
}
