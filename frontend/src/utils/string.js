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

// Known schematic/catalog noun suffixes that can arrive collapsed into a
// single API display token (for example "Angleheads" or "Nailspotters").
// These are presentation-only word boundaries; canonical ids remain unchanged.
const COMPACT_LABEL_SUFFIXES = [
  'applicators',
  'finishers',
  'flushers',
  'spotters',
  'tapers',
  'rollers',
  'handles',
  'heads',
  'boxes',
  'tubes',
  'pumps',
];

/**
 * Split compact identifier-like text into display words without mutating the
 * underlying identity. Handles kebab/snake case, camel/Pascal case, and the
 * collapsed noun forms used by schematic category metadata.
 *
 * @param {string} value
 * @returns {string}
 */
function splitCompactLabel(value) {
  let normalized = (value || '')
    .replace(/[-_]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .trim();

  const words = normalized.split(/\s+/).filter(Boolean);
  normalized = words
    .flatMap((word) => {
      const lower = word.toLowerCase();
      const suffix = COMPACT_LABEL_SUFFIXES.find(
        (candidate) => lower.endsWith(candidate) && lower.length > candidate.length
      );

      if (!suffix) return [word];

      const prefixLength = word.length - suffix.length;
      return [word.slice(0, prefixLength), word.slice(prefixLength)].filter(Boolean);
    })
    .join(' ');

  return normalized;
}

/**
 * Title-case a raw compact slug/id into a human-readable label,
 * e.g. "semi-automatic-tapers" -> "Semi Automatic Tapers",
 * "AutomaticTapers" -> "Automatic Tapers", and
 * "Angleheads" -> "Angle Heads".
 *
 * @param {string} slug
 * @returns {string}
 */
export function humanizeSlug(slug) {
  const words = splitCompactLabel(slug)
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
 * humanized version of the id. Identifier-shaped names are normalized before
 * rendering so compact values such as `AutomaticTapers` and `Angleheads` do
 * not leak into customer-facing UI.
 *
 * @param {string} [name] - API-provided display name, if any.
 * @param {string} [id] - Fallback raw id/slug.
 * @returns {string}
 */
export function humanizeLabel(name, id) {
  const trimmedName = (name || '').trim();
  if (!trimmedName) return humanizeSlug(id || '');

  if (/\s/.test(trimmedName)) return trimmedName;

  const normalizedName = humanizeSlug(trimmedName);
  const compactChanged = normalizedName.toLowerCase() !== trimmedName.toLowerCase();
  const looksLikeRawIdentifier = /[-_]/.test(trimmedName) || /[a-z0-9][A-Z]/.test(trimmedName) || compactChanged;

  return looksLikeRawIdentifier ? normalizedName : trimmedName;
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
