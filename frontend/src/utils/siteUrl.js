// Current public authority. Launch cutover changes REACT_APP_SITE_URL (and the
// server-owned WordPress/Apache settings) without changing route consumers.
export const DEFAULT_PUBLIC_SITE_URL = 'https://elliottm4.sg-host.com';

function normalizeConfiguredSiteUrl(value) {
  try {
    const parsed = new URL(String(value || '').trim());
    if (!['http:', 'https:'].includes(parsed.protocol)) return '';
    return parsed.origin;
  } catch {
    return '';
  }
}

export const PUBLIC_SITE_URL =
  normalizeConfiguredSiteUrl(process.env.REACT_APP_SITE_URL) || DEFAULT_PUBLIC_SITE_URL;

/**
 * Build a public URL while keeping the configured production origin authoritative.
 * Even an absolute legacy URL contributes only its path, query, and fragment.
 */
export function absoluteSiteUrl(value = '/') {
  const parsed = new URL(String(value || '/'), `${PUBLIC_SITE_URL}/`);
  return new URL(`${parsed.pathname}${parsed.search}${parsed.hash}`, `${PUBLIC_SITE_URL}/`).toString();
}

/** Canonical URLs never include a fragment. */
export function canonicalSiteUrl(value = '/') {
  const url = new URL(absoluteSiteUrl(value));
  url.hash = '';
  return url.toString();
}
