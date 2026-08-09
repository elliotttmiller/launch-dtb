import { apiClient } from '../api/client.js';
import { brandToSlug, isAllProductsCategorySlug, parseCatalogQuery } from '../utils/catalogUrlState.js';

const FRESH_CACHE_TTL = 5 * 60 * 1000;
const STALE_CACHE_TTL = 24 * 60 * 60 * 1000;
const CACHE_VERSION = 'v11';
const PRODUCT_STORAGE_PREFIX = `dtb:catalog-products:${CACHE_VERSION}:`;
const FACETS_STORAGE_PREFIX = `dtb:catalog-facets:${CACHE_VERSION}:`;
const CATALOG_SNAPSHOTS_ENABLED = /^(1|true|yes|on)$/i.test(
  String(process.env.REACT_APP_CATALOG_SNAPSHOTS_ENABLED || '').trim(),
);
const PUBLIC_ASSET_BASE = String(process.env.PUBLIC_URL || '').replace(/\/+$/, '');

const productCache = new Map();
const productInflight = new Map();
const facetsCache = new Map();
const facetsInflight = new Map();
const snapshotInflight = new Map();

function canUseStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage);
}

function readPersistent(prefix, key) {
  if (!canUseStorage()) return null;

  try {
    const raw = window.localStorage.getItem(`${prefix}${key}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !parsed.cachedAt || !parsed.data) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writePersistent(prefix, key, data) {
  if (!canUseStorage() || !data) return;

  try {
    window.localStorage.setItem(`${prefix}${key}`, JSON.stringify({ data, cachedAt: Date.now() }));
  } catch {
    // Persistent cache is opportunistic. Storage quota/private mode failures are non-fatal.
  }
}

function removePersistent(prefix, key) {
  if (!canUseStorage()) return;

  try {
    window.localStorage.removeItem(`${prefix}${key}`);
  } catch {
    // Non-critical cleanup.
  }
}

function getCacheEntry(cache, key, prefix, { allowStale = false } = {}) {
  const now = Date.now();
  const memoryEntry = cache.get(key);

  if (memoryEntry?.data) {
    const age = now - memoryEntry.cachedAt;
    if (age < FRESH_CACHE_TTL) {
      return { data: memoryEntry.data, isStale: false, source: 'memory' };
    }
    if (allowStale && age < STALE_CACHE_TTL) {
      return { data: memoryEntry.data, isStale: true, source: 'memory' };
    }
  }

  const persistentEntry = readPersistent(prefix, key);
  if (!persistentEntry?.data) return null;

  const persistentAge = now - persistentEntry.cachedAt;
  if (persistentAge >= STALE_CACHE_TTL) {
    removePersistent(prefix, key);
    return null;
  }

  cache.set(key, persistentEntry);
  if (persistentAge < FRESH_CACHE_TTL) {
    return { data: persistentEntry.data, isStale: false, source: 'storage' };
  }
  if (allowStale) {
    return { data: persistentEntry.data, isStale: true, source: 'storage' };
  }
  return null;
}

function setCacheEntry(cache, key, prefix, data) {
  const entry = { data, cachedAt: Date.now() };
  cache.set(key, entry);
  writePersistent(prefix, key, data);
  return data;
}

function keyFromParams(params = {}) {
  return JSON.stringify(Object.keys(params).sort().reduce((acc, key) => {
    const value = params[key];
    if (value !== undefined && value !== null && value !== '') acc[key] = value;
    return acc;
  }, {}));
}

function buildSnapshotUrl(type, params = {}) {
  if (!CATALOG_SNAPSHOTS_ENABLED) return '';
  const suffix = type === 'facets' ? 'facets' : 'products';
  const normalized = parseCatalogQuery(params);
  const brand = brandToSlug(normalized.brand || '');
  const category = normalized.displayCategory || normalized.category || '';
  const file = [suffix, brand || 'all', category || 'all'].join('--');
  return `${PUBLIC_ASSET_BASE}/catalog-snapshots/${file}.json`;
}

async function readSnapshot(type, params = {}) {
  const url = buildSnapshotUrl(type, params);
  if (!url || typeof fetch !== 'function') return null;
  if (snapshotInflight.has(url)) return snapshotInflight.get(url);

  const request = fetch(url, { credentials: 'same-origin' })
    .then((response) => (response.ok ? response.json() : null))
    .catch(() => null)
    .finally(() => snapshotInflight.delete(url));

  snapshotInflight.set(url, request);
  return request;
}

async function fetchCatalogResource({
  cache,
  inflight,
  prefix,
  params,
  request,
  snapshotType,
  allowStale = true,
}) {
  const key = keyFromParams(params);
  const cached = getCacheEntry(cache, key, prefix, { allowStale });
  if (cached && !cached.isStale) return cached.data;
  if (inflight.has(key)) return inflight.get(key);

  const operation = (async () => {
    try {
      const data = await request();
      if (data) return setCacheEntry(cache, key, prefix, data);
      throw new Error('Catalog response was empty.');
    } catch (error) {
      const snapshot = await readSnapshot(snapshotType, params);
      if (snapshot) return setCacheEntry(cache, key, prefix, snapshot);
      if (cached?.data) return cached.data;
      throw error;
    }
  })().finally(() => inflight.delete(key));

  inflight.set(key, operation);
  return operation;
}

export async function getCatalogProducts(params = {}, options = {}) {
  return fetchCatalogResource({
    cache: productCache,
    inflight: productInflight,
    prefix: PRODUCT_STORAGE_PREFIX,
    params,
    request: () => apiClient.get('/dtb/v1/catalog/products', { params }),
    snapshotType: 'products',
    allowStale: options.allowStale !== false,
  });
}

export async function getCatalogFacets(params = {}, options = {}) {
  return fetchCatalogResource({
    cache: facetsCache,
    inflight: facetsInflight,
    prefix: FACETS_STORAGE_PREFIX,
    params,
    request: () => apiClient.get('/dtb/v1/catalog/facets', { params }),
    snapshotType: 'facets',
    allowStale: options.allowStale !== false,
  });
}

export function clearCatalogPlatformCache() {
  productCache.clear();
  facetsCache.clear();
}
