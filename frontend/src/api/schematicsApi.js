/**
 * frontend/src/api/schematicsApi.js
 *
 * Client for the Phase 4 authoritative public schematics API
 * (`dtb-schematics` mu-plugin):
 *
 *   GET /wp-json/dtb/v1/schematics             -> collection
 *   GET /wp-json/dtb/v1/schematics/{id}         -> detail
 *
 * This is the ONLY frontend module that should talk to these endpoints.
 * Hooks (useSchematicCatalog, useSchematicRouteState) call into this module;
 * components must never call fetch()/axios directly.
 *
 * Behavior:
 * - Sends `If-None-Match` using the last-seen ETag per URL and treats a 304
 *   response as "unchanged" (resolves with the previously cached body).
 * - Forces HTTP revalidation instead of accepting a still-fresh browser
 *   max-age entry. This preserves cheap ETag/304 responses while ensuring a
 *   just-synchronized schematic projection can become visible immediately.
 * - Throws a `SchematicApiError` with an explicit `kind` for every failure
 *   mode so callers can render honest error/empty states instead of a
 *   silent placeholder.
 */

import { PUBLIC_SITE_URL } from '../utils/siteUrl.js';

const _apiBase = (process.env.REACT_APP_API_BASE_URL || '').trim().replace(/\/+$/, '');
const WP_API_BASE = _apiBase ? `${_apiBase}/wp-json` : `${PUBLIC_SITE_URL}/wp-json`;

export const SCHEMATICS_COLLECTION_URL = `${WP_API_BASE}/dtb/v1/schematics`;

export function schematicDetailUrl(schematicId) {
  return `${WP_API_BASE}/dtb/v1/schematics/${encodeURIComponent(schematicId)}`;
}

/**
 * @typedef {'network'|'http'|'not_found'|'invalid_response'} SchematicApiErrorKind
 */
export class SchematicApiError extends Error {
  /**
   * @param {string} message
   * @param {SchematicApiErrorKind} kind
   * @param {number|null} status
   */
  constructor(message, kind, status = null) {
    super(message);
    this.name = 'SchematicApiError';
    this.kind = kind;
    this.status = status;
  }
}

// url -> { etag, body }
const _etagCache = new Map();

async function requestJson(url, { signal } = {}) {
  const cached = _etagCache.get(url);
  const headers = { Accept: 'application/json' };
  if (cached?.etag) headers['If-None-Match'] = cached.etag;

  let response;
  try {
    response = await fetch(url, {
      method: 'GET',
      headers,
      signal,
      // The API intentionally advertises public max-age caching. For the
      // interactive storefront client, however, use that response only after
      // HTTP revalidation so a synchronization/publication-version change is
      // never hidden behind a still-fresh browser cache entry. ETag handling
      // above keeps the unchanged path bandwidth-efficient via 304.
      cache: 'no-cache',
    });
  } catch (err) {
    if (err?.name === 'AbortError') throw err;
    throw new SchematicApiError(
      `Network error while contacting the schematics API: ${err?.message || err}`,
      'network',
    );
  }

  if (response.status === 304 && cached) {
    return cached.body;
  }

  if (response.status === 404) {
    throw new SchematicApiError('Schematic not found', 'not_found', 404);
  }

  if (!response.ok) {
    throw new SchematicApiError(
      `Schematics API request failed: ${response.status} ${response.statusText}`,
      'http',
      response.status,
    );
  }

  let body;
  try {
    body = await response.json();
  } catch {
    throw new SchematicApiError('Schematics API returned an invalid response', 'invalid_response');
  }

  if (!body || typeof body !== 'object') {
    throw new SchematicApiError('Schematics API returned an invalid response', 'invalid_response');
  }

  const etag = response.headers.get('ETag');
  if (etag) {
    _etagCache.set(url, { etag, body });
  }

  return body;
}

/**
 * Fetch the schematics collection (catalog/navigation data).
 *
 * @returns {Promise<{schema_version:number, catalog_version:string, count:number, items:Array}>}
 */
export async function fetchSchematicsCollection({ signal } = {}) {
  const body = await requestJson(SCHEMATICS_COLLECTION_URL, { signal });
  if (!Array.isArray(body.items)) {
    throw new SchematicApiError('Schematics collection response missing "items"', 'invalid_response');
  }
  return body;
}

/**
 * Fetch the full detail record (pages, hotspots, resolved parts) for one schematic.
 *
 * @param {string} schematicId
 * @returns {Promise<object>}
 */
export async function fetchSchematicDetail(schematicId, { signal } = {}) {
  if (!schematicId) {
    throw new SchematicApiError('A schematic ID is required', 'invalid_response');
  }
  const body = await requestJson(schematicDetailUrl(schematicId), { signal });
  if (!Array.isArray(body.pages)) {
    throw new SchematicApiError('Schematic detail response missing "pages"', 'invalid_response');
  }
  return body;
}
