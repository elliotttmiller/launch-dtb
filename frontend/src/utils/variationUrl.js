/**
 * frontend/src/utils/variationUrl.js
 *
 * URL helpers for the ?variant=<variation_id> query-string contract.
 *
 * Contract:
 *   /products/:slug                  — no variation selected
 *   /products/:slug?variant=12345    — pre-select variation 12345
 *
 * These helpers are pure functions with no React import so they can be used
 * in hooks, pages, and tests without any React context.
 */

/**
 * Read the current ?variant= value from a URLSearchParams or URL string.
 *
 * @param {URLSearchParams|string|null} search  URLSearchParams instance, a
 *   raw query string such as "?variant=123", or null.
 * @returns {number|null}  Parsed variation ID, or null when absent/invalid.
 */
export function getVariantParam(search) {
  let params;
  if (!search) return null;
  if (typeof search === 'string') {
    params = new URLSearchParams(search);
  } else {
    params = search;
  }
  const raw = params.get('variant');
  if (!raw) return null;
  const id = parseInt(raw, 10);
  return Number.isFinite(id) && id > 0 ? id : null;
}

/**
 * Build a URLSearchParams with ?variant=<id> set (or removed when id is null).
 *
 * Preserves all existing query params except 'variant'.
 *
 * @param {URLSearchParams|string|null} currentSearch  Existing query string.
 * @param {number|null} variationId  New variation ID, or null to clear.
 * @returns {string}  New query string (e.g. "?variant=12345") — empty string
 *   when all params were cleared.
 */
export function buildVariantSearch(currentSearch, variationId) {
  const params = new URLSearchParams(
    typeof currentSearch === 'string' ? currentSearch : (currentSearch?.toString() ?? '')
  );

  if (variationId != null && Number.isFinite(variationId) && variationId > 0) {
    params.set('variant', String(variationId));
  } else {
    params.delete('variant');
  }

  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

/**
 * Resolve an explicitly requested variation on initial load.
 *
 * Resolution order (matches the system contract):
 *   1. ?variant=<id> query param — if it belongs to this parent
 *   2. null — parent context remains active until the shopper chooses
 *
 * @param {number|null}  variantParam   Parsed ?variant= value.
 * @param {Array}        variations     All child variations.
 * @param {Object|null}  computed       Computed state from the detail endpoint.
 * @returns {Object|null}              The resolved variation object, or null.
 */
export function resolveInitialVariation(variantParam, variations) {
  if (!Array.isArray(variations) || variations.length === 0) return null;

  if (variantParam != null) {
    const matched = variations.find((v) => v.id === variantParam);
    if (matched) return matched;
  }

  return null;
}
