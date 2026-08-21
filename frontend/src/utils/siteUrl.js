// Current public authority. Launch cutover changes REACT_APP_SITE_URL without
// changing route consumers; this may include a hosted subdirectory.
export const DEFAULT_PUBLIC_SITE_URL = 'https://drywalltoolbox.com/staging/2972';

function normalizeConfiguredSiteUrl(value) {
  try {
    const parsed = new URL(String(value || '').trim());
    if (!['http:', 'https:'].includes(parsed.protocol)) return '';
    return `${parsed.origin}${parsed.pathname.replace(/\/+$/, '')}`;
  } catch {
    return '';
  }
}

export const PUBLIC_SITE_URL =
  normalizeConfiguredSiteUrl(process.env.REACT_APP_SITE_URL) || DEFAULT_PUBLIC_SITE_URL;

/**
 * Build a public URL while keeping the configured public base authoritative.
 * Even an absolute legacy URL contributes only its path, query, and fragment.
 */
export function absoluteSiteUrl(value = '/') {
  const base = `${PUBLIC_SITE_URL.replace(/\/+$/, '')}/`;
  const parsed = new URL(String(value || '/'), base);
  // Route consumers historically pass root-relative paths. In a subdirectory
  // deployment those are app-relative, not domain-root-relative.
  const appRelativePath = parsed.pathname.replace(/^\/+/, '');
  return new URL(`${appRelativePath}${parsed.search}${parsed.hash}`, base).toString();
}

/** Canonical URLs never include a fragment. */
export function canonicalSiteUrl(value = '/') {
  const url = new URL(absoluteSiteUrl(value));
  url.hash = '';
  return url.toString();
}
