import { API_BASE_URL } from './client.js';
import { getCatalogSearchSuggestions, inferCatalogCorrection } from './searchSuggestions.js';

const CONFIG_ENDPOINT = `${API_BASE_URL}/wp-json/dtb/v1/catalog/search/nivo-config`;
const CONFIG_MAX_AGE_MS = 5 * 60 * 1000;

let cachedConfig = null;
let cachedConfigAt = 0;
let configPromise = null;

function stripHtml(value = '') {
  const text = String(value || '');
  if (!text) return '';
  if (typeof document === 'undefined') return text.replace(/<[^>]*>/g, '').trim();
  const node = document.createElement('div');
  node.innerHTML = text;
  return (node.textContent || '').trim();
}

function productSlugFromUrl(value = '') {
  try {
    const url = new URL(value, window.location.origin);
    const segments = url.pathname.split('/').filter(Boolean);
    const productIndex = segments.findIndex((segment) => segment === 'product' || segment === 'products');
    if (productIndex >= 0 && segments[productIndex + 1]) return decodeURIComponent(segments[productIndex + 1]);
  } catch {
    // Ignore malformed plugin URLs and fall back to the product ID route.
  }
  return '';
}

function normalizeProduct(product) {
  if (!product?.id) return null;
  const slug = productSlugFromUrl(product.url);
  return {
    id: Number(product.id),
    name: String(product.title || ''),
    title: String(product.title || ''),
    slug,
    sku: String(product.sku || ''),
    image: String(product.image || ''),
    priceText: stripHtml(product.current_price || product.price || ''),
    priceHtml: String(product.current_price || product.price || ''),
    url: String(product.url || ''),
    categories: Array.isArray(product.categories) ? product.categories : [],
    stockStatus: String(product.stock_status || ''),
    inStock: Boolean(product.is_in_stock),
    source: 'nivo',
  };
}

function normalizeSuggestion(item, type) {
  const label = item?.title || item?.name || '';
  if (!label) return null;
  return {
    id: `${type}:${item.id || label}`,
    type,
    label: String(label),
    value: String(label),
    count: Number(item.count || 0),
  };
}

function dedupeSuggestions(items) {
  const seen = new Set();
  return items.filter((item) => {
    if (!item?.label) return false;
    const key = item.label.trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalizeResponse(query, payload) {
  const data = payload?.data && typeof payload.data === 'object' ? payload.data : {};
  const didYouMean = typeof data.did_you_mean === 'string' ? data.did_you_mean.trim() : '';
  const products = Array.isArray(data.products) ? data.products.map(normalizeProduct).filter(Boolean) : [];
  const categories = Array.isArray(data.categories)
    ? data.categories.map((item) => normalizeSuggestion(item, 'category')).filter(Boolean)
    : [];
  const tags = Array.isArray(data.tags)
    ? data.tags.map((item) => normalizeSuggestion(item, 'tag')).filter(Boolean)
    : [];
  const productCategories = products.flatMap((product) => (
    Array.isArray(product.categories)
      ? product.categories.map((item) => normalizeSuggestion(item, 'category')).filter(Boolean)
      : []
  ));
  const suggestions = dedupeSuggestions([
    ...(didYouMean ? [{ id: `correction:${didYouMean}`, type: 'correction', label: didYouMean, value: didYouMean }] : []),
    ...categories,
    ...tags,
    ...productCategories,
  ]).slice(0, 8);

  return {
    query,
    source: 'nivo',
    didYouMean,
    products,
    suggestions,
    settings: data.settings && typeof data.settings === 'object' ? data.settings : {},
  };
}

async function fetchConfig() {
  const response = await fetch(CONFIG_ENDPOINT, {
    method: 'GET',
    credentials: 'include',
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });
  if (!response.ok) {
    const error = new Error(`NivoSearch config request failed with status ${response.status}.`);
    error.status = response.status;
    throw error;
  }
  return response.json();
}

async function loadConfig({ force = false } = {}) {
  const fresh = cachedConfig && Date.now() - cachedConfigAt < CONFIG_MAX_AGE_MS;
  if (!force && fresh) return cachedConfig;
  if (!force && configPromise) return configPromise;

  configPromise = fetchConfig().then((config) => {
    cachedConfig = config;
    cachedConfigAt = Date.now();
    return config;
  }).finally(() => {
    configPromise = null;
  });

  return configPromise;
}

async function executeNivoSearch(query, config, signal) {
  const body = new URLSearchParams();
  body.set('action', 'nivo_search');
  body.set('s', query);
  body.set('query', query);
  body.set('preset_id', String(config.presetId));
  body.set('nonce', String(config.nonce));

  const response = await fetch(config.endpoint, {
    method: 'POST',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    },
    body: body.toString(),
    signal,
  });

  if (!response.ok) {
    const error = new Error(`NivoSearch request failed with status ${response.status}.`);
    error.status = response.status;
    throw error;
  }

  const text = await response.text();
  let payload;
  try {
    payload = JSON.parse(text);
  } catch {
    const error = new Error('NivoSearch returned a non-JSON response.');
    error.code = 'invalid_nivo_response';
    throw error;
  }

  if (!payload?.success) {
    const error = new Error(payload?.data?.message || 'NivoSearch request was rejected.');
    error.code = 'nivo_search_rejected';
    error.payload = payload?.data || null;
    throw error;
  }

  return normalizeResponse(query, payload);
}

function correctedResult(originalQuery, firstResult, corrected, correctionSource = 'nivo') {
  const correction = firstResult.didYouMean || corrected.query;
  const suggestions = dedupeSuggestions([
    ...(correction ? [{ id: `correction:${correction}`, type: 'correction', label: correction, value: correction }] : []),
    ...(Array.isArray(corrected.suggestions) ? corrected.suggestions : []),
    ...(Array.isArray(firstResult.suggestions) ? firstResult.suggestions : []),
  ]).slice(0, 8);

  return {
    ...corrected,
    query: originalQuery,
    didYouMean: correction,
    suggestions,
    source: correctionSource === 'nivo' ? 'nivo-corrected' : 'nivo-catalog-corrected',
  };
}

async function executeWithCorrection(query, config, signal) {
  const firstResult = await executeNivoSearch(query, config, signal);
  let correction = String(firstResult.didYouMean || '').trim();
  let correctionSource = 'nivo';

  // Nivo 2.0.2 can return a correction separately from its first product set.
  // Follow that correction exactly once. If the installed Nivo index does not
  // emit a correction, use a bounded catalog-facet spelling candidate only as a
  // fallback, then execute the corrected term through Nivo again.
  if (firstResult.products.length === 0 && !correction && !signal?.aborted) {
    correction = String(await inferCatalogCorrection(query) || '').trim();
    correctionSource = 'catalog';
  }

  if (
    firstResult.products.length === 0
    && correction
    && correction.localeCompare(query, undefined, { sensitivity: 'accent' }) !== 0
    && !signal?.aborted
  ) {
    const corrected = await executeNivoSearch(correction, config, signal);
    return correctedResult(query, { ...firstResult, didYouMean: correction }, corrected, correctionSource);
  }

  return firstResult;
}

async function enrichSuggestions(query, result) {
  const supplemental = await getCatalogSearchSuggestions(query, { limit: 8 });
  return {
    ...result,
    suggestions: dedupeSuggestions([
      ...(Array.isArray(result.suggestions) ? result.suggestions : []),
      ...supplemental,
    ]).slice(0, 8),
  };
}

/**
 * Execute the installed NivoSearch preset through its public WooCommerce AJAX
 * action while preserving DTB ownership of the React presentation layer.
 */
export async function searchWithNivo(query, { signal } = {}) {
  const normalizedQuery = String(query || '').trim();
  if (!normalizedQuery) {
    return { query: '', source: 'nivo', didYouMean: '', products: [], suggestions: [], settings: {} };
  }

  let config = await loadConfig();
  if (!config?.enabled || !config?.endpoint || !config?.nonce || !config?.presetId) {
    const error = new Error('NivoSearch storefront integration is unavailable.');
    error.code = config?.reason || 'nivo_unavailable';
    throw error;
  }

  if (normalizedQuery.length < Number(config.minChars || 2)) {
    return { query: normalizedQuery, source: 'nivo', didYouMean: '', products: [], suggestions: [], settings: {} };
  }

  try {
    const result = await executeWithCorrection(normalizedQuery, config, signal);
    return signal?.aborted ? result : enrichSuggestions(normalizedQuery, result);
  } catch (error) {
    if (signal?.aborted) throw error;
    if (error?.status !== 403 && error?.code !== 'invalid_nivo_response') throw error;

    // A stale WordPress nonce is recoverable. Refresh the non-cacheable config
    // once, then retry the same idempotent search request.
    config = await loadConfig({ force: true });
    if (!config?.enabled || !config?.nonce) throw error;
    const result = await executeWithCorrection(normalizedQuery, config, signal);
    return signal?.aborted ? result : enrichSuggestions(normalizedQuery, result);
  }
}

export async function getNivoSearchConfig() {
  return loadConfig();
}
