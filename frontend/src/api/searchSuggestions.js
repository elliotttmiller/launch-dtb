import { apiClient } from './client.js';

const FACETS_ENDPOINT = '/wp-json/dtb/v1/catalog/facets';
const CACHE_MS = 5 * 60 * 1000;
let cache = null;
let cacheAt = 0;
let inflight = null;

function normalize(value = '') {
  return String(value || '').trim().toLowerCase();
}

function editDistance(a, b) {
  const left = normalize(a);
  const right = normalize(b);
  if (!left) return right.length;
  if (!right) return left.length;

  const prev = Array.from({ length: right.length + 1 }, (_, index) => index);
  const curr = new Array(right.length + 1);

  for (let i = 1; i <= left.length; i += 1) {
    curr[0] = i;
    for (let j = 1; j <= right.length; j += 1) {
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        curr[j - 1] + 1,
        prev[j] + 1,
        prev[j - 1] + cost,
      );
    }
    for (let j = 0; j <= right.length; j += 1) prev[j] = curr[j];
  }

  return prev[right.length];
}

function termTokens(value = '') {
  return normalize(value).split(/[^a-z0-9]+/).filter((token) => token.length >= 3);
}

function closestDistance(query, label) {
  const normalizedQuery = normalize(query);
  const candidates = [normalize(label), ...termTokens(label)];
  return candidates.reduce((best, candidate) => Math.min(best, editDistance(normalizedQuery, candidate)), Number.POSITIVE_INFINITY);
}

function pushLabel(target, seen, value, type) {
  const label = String(value || '').trim();
  const key = normalize(label);
  if (!key || seen.has(key)) return;
  seen.add(key);
  target.push({ id: `${type}:${key}`, type, label, value: label });
}

function collectFacetTerms(facets) {
  const terms = [];
  const seen = new Set();

  (Array.isArray(facets?.brands) ? facets.brands : []).forEach((brand) => {
    pushLabel(terms, seen, brand?.label || brand?.name || brand?.key || brand, 'brand');
  });

  (Array.isArray(facets?.categories) ? facets.categories : []).forEach((category) => {
    pushLabel(terms, seen, category?.label || category?.name || category?.key || category, 'category');
  });

  Object.values(facets?.displayCategoriesByBrand || {}).forEach((categories) => {
    (Array.isArray(categories) ? categories : []).forEach((category) => {
      pushLabel(terms, seen, category?.label || category?.name || category?.key || category, 'category');
    });
  });

  return terms;
}

async function loadFacetTerms() {
  if (cache && Date.now() - cacheAt < CACHE_MS) return cache;
  if (inflight) return inflight;

  inflight = apiClient(FACETS_ENDPOINT)
    .then((facets) => {
      cache = collectFacetTerms(facets);
      cacheAt = Date.now();
      return cache;
    })
    .catch(() => [])
    .finally(() => {
      inflight = null;
    });

  return inflight;
}

export async function getCatalogSearchSuggestions(query, { limit = 8 } = {}) {
  const normalizedQuery = normalize(query);
  if (normalizedQuery.length < 2) return [];

  const terms = await loadFacetTerms();
  return terms
    .map((term) => {
      const normalizedLabel = normalize(term.label);
      const tokens = termTokens(term.label);
      const starts = normalizedLabel.startsWith(normalizedQuery)
        || normalizedQuery.startsWith(normalizedLabel)
        || tokens.some((token) => token.startsWith(normalizedQuery) || normalizedQuery.startsWith(token));
      const contains = normalizedLabel.includes(normalizedQuery)
        || tokens.some((token) => token.includes(normalizedQuery));
      const distance = normalizedQuery.length >= 4 ? closestDistance(normalizedQuery, normalizedLabel) : Number.POSITIVE_INFINITY;
      const maxDistance = normalizedQuery.length >= 8 ? 2 : 1;

      let score = 0;
      if (normalizedLabel === normalizedQuery || tokens.includes(normalizedQuery)) score = 100;
      else if (starts) score = 80;
      else if (contains) score = 70;
      else if (distance <= maxDistance) score = 60 - distance;

      return { ...term, score, distance };
    })
    .filter((term) => term.score > 0)
    .sort((a, b) => b.score - a.score || a.distance - b.distance || a.label.localeCompare(b.label))
    .slice(0, Math.max(1, Math.min(12, Number(limit) || 8)))
    .map(({ score, distance, ...term }) => term);
}

export async function inferCatalogCorrection(query) {
  const normalizedQuery = normalize(query);
  if (normalizedQuery.length < 4) return '';

  const suggestions = await getCatalogSearchSuggestions(query, { limit: 4 });
  const fuzzy = suggestions.find((item) => {
    const normalizedLabel = normalize(item.label);
    return normalizedLabel !== normalizedQuery
      && closestDistance(normalizedQuery, normalizedLabel) <= (normalizedQuery.length >= 8 ? 2 : 1);
  });

  if (!fuzzy) return '';

  const bestToken = termTokens(fuzzy.label)
    .map((token) => ({ token, distance: editDistance(normalizedQuery, token) }))
    .sort((a, b) => a.distance - b.distance)[0];

  if (bestToken && bestToken.distance <= (normalizedQuery.length >= 8 ? 2 : 1)) {
    const labelToken = String(fuzzy.label).split(/[^A-Za-z0-9]+/).find((token) => normalize(token) === bestToken.token);
    return labelToken || bestToken.token;
  }

  return fuzzy.value || '';
}
