/**
 * frontend/src/api/designConfig.js
 *
 * Read-only client for the DTB Visual UI Designer's public resolved
 * configuration endpoint plus the token-scoped preview endpoint. Mirrors the
 * other `api/*.js` domain modules (see api/products.js) — thin wrappers over
 * the shared `apiClient`, re-exported through api/index.js.
 */

import { apiClient } from './client.js';

/**
 * Fetch the currently published, resolved design configuration.
 * Public, cacheable, and safe to call from anonymous storefront sessions.
 *
 * @param {'base'|'desktop'|'tablet'|'mobile'} breakpoint
 * @returns {Promise<{schemaVersion:number, revisionId:number|null, config:object}>}
 */
export async function fetchPublishedDesignConfig(breakpoint = 'base') {
  const qs = new URLSearchParams({ breakpoint }).toString();
  return apiClient(`/wp-json/dtb/v1/design/config?${qs}`);
}

/**
 * Fetch the unpublished draft configuration for an active preview session.
 * Requires a valid, short-lived preview token issued by the wp-admin editor
 * (see mu-plugins/dtb-visual-designer/Rest/PreviewController.php) — never
 * cached, never available without one.
 *
 * @param {string} token
 * @param {'base'|'desktop'|'tablet'|'mobile'} breakpoint
 * @returns {Promise<{schemaVersion:number, draftKey:string, revisionSeq:number, config:object}>}
 */
export async function fetchPreviewDesignConfig(token, breakpoint = 'base') {
  const qs = new URLSearchParams({ token, breakpoint }).toString();
  return apiClient(`/wp-json/dtb/v1/design/preview/config?${qs}`);
}
