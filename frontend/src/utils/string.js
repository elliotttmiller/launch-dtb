/**
 * frontend/src/utils/string.js
 *
 * Shared string utilities.
 */

/**
 * Decode common HTML entities that WooCommerce and WordPress embed in API
 * responses (product names, category names, etc.).
 *
 * @param {string} str
 * @returns {string}
 */
export function decodeHtmlEntities(str) {
  return (str || '')
    .replace(/&amp;/g,  '&')
    .replace(/&lt;/g,   '<')
    .replace(/&gt;/g,   '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
    // Numeric decimal entities: &#8243; → ″
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    // Numeric hex entities: &#x2033; → ″
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

// Small words that stay lowercase in title-cased labels unless they're the
// first word (matches common title-case convention).
const TITLE_CASE_MINOR_WORDS = new Set([
  'a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'in', 'nor', 'of', 'on', 'or', 'the', 'to', 'with',
]);

/**
 * Title-case a raw kebab/snake-case slug/id into a human-readable label,
 * e.g. "semi-automatic-tapers" -> "Semi-Automatic Tapers".
 *
 * @param {string} slug
 * @returns {string}
 */
export function humanizeSlug(slug) {
  const words = (slug || '')
    .replace(/[-_]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return words
    .map((word, index) => {
      const lower = word.toLowerCase();
      if (index > 0 && TITLE_CASE_MINOR_WORDS.has(lower)) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ');
}

/**
 * Resolve a display label for an API entity that may only provide a raw
 * id/slug (e.g. WooCommerce term slugs surfaced as `category.id`). Prefers
 * an already human-readable `name` from the API; otherwise falls back to a
 * humanized version of the id. Also catches the case where the API "name"
 * field is itself just the raw slug (no spaces, contains a hyphen) by
 * humanizing that too, so a slug-shaped `name` never renders verbatim.
 *
 * @param {string} [name] - API-provided display name, if any.
 * @param {string} [id] - Fallback raw id/slug.
 * @returns {string}
 */
export function humanizeLabel(name, id) {
  const trimmedName = (name || '').trim();
  const looksLikeRawSlug = trimmedName && !/\s/.test(trimmedName) && /[-_]/.test(trimmedName);
  if (trimmedName && !looksLikeRawSlug) return trimmedName;
  return humanizeSlug(trimmedName || id || '');
}

/**
 * Normalize a schematic "part_ref" for cross-referencing between the
 * resolved `parts[]` array (already normalized, e.g. "ah7-25") and the raw
 * hotspot `occurrences[].part_ref` values sourced from legacy labels (e.g.
 * `AH 7-2.5"`). Without this, a straight `===` comparison silently fails —
 * every occurrence's `part_ref` looks like a raw label (whitespace,
 * quote/inch marks, periods, mixed case) while the resolved part's
 * `part_ref` has already been slugged by the backend. Lowercases and strips
 * whitespace, double/single quote or inch/foot marks, and periods so both
 * shapes collapse to the same key.
 *
 * @param {string} value
 * @returns {string}
 */
export function normalizePartRef(value) {
  return (value || '')
    .toString()
    .toLowerCase()
    .replace(/[\s"'′″.]+/g, '');
}
