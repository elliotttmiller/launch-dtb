import path from 'node:path';
import { cleanText, persistRaw, safeFilename, sanitizeSnapshot } from './io.mjs';
import { closeBrowserlessSession, openBrowserlessSession } from './browserless.mjs';

export const ALLOWED_HOSTS = new Set(['eastcoastdrywall.com', 'www.eastcoastdrywall.com']);
const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'by', 'for', 'from', 'in', 'included',
  'kit', 'of', 'on', 'or', 'page', 'parts', 'red', 'the', 'to', 'updated', 'with',
]);
const PROVIDER_PREFIXES = ['TT-', 'COL-', 'DM-'];

export function assertAllowedUrl(input) {
  const url = new URL(input);
  if (url.protocol !== 'https:' || !ALLOWED_HOSTS.has(url.hostname)) {
    throw new Error(`Refusing non-public/non-East-Coast URL: ${input}`);
  }
  url.hash = '';
  return url;
}

function parsePercent(value) {
  const match = String(value ?? '').trim().match(/^(-?\d+(?:\.\d+)?)%$/);
  return match ? Number(match[1]) : null;
}

function parseStyleDeclaration(styleText = '') {
  const out = {};
  for (const segment of String(styleText).split(';')) {
    const colon = segment.indexOf(':');
    if (colon <= 0) continue;
    const key = segment.slice(0, colon).trim().toLowerCase();
    const value = segment.slice(colon + 1).trim();
    if (key && value) out[key] = value;
  }
  return out;
}

export function derivePartNumberFromHandle(handle) {
  if (!handle) return null;
  let value = cleanText(handle);
  for (const prefix of PROVIDER_PREFIXES) {
    if (value.toUpperCase().startsWith(prefix)) {
      value = value.slice(prefix.length);
      break;
    }
  }
  return value || null;
}

export function normalizeSourceIdentifier(value) {
  return cleanText(derivePartNumberFromHandle(value) || value).toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function validateProductHandle(handle) {
  const value = cleanText(handle);
  if (!value) return { valid: false, reason: 'missing_handle' };
  if (value.length > 120) return { valid: false, reason: 'handle_too_long' };
  if (/%[0-9A-F]{2}/i.test(value)) return { valid: false, reason: 'encoded_punctuation_or_text' };
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(value)) return { valid: false, reason: 'invalid_handle_characters' };
  const part = derivePartNumberFromHandle(value);
  const lower = cleanText(part).toLowerCase().replace(/[.]+$/g, '');
  if (!part || STOP_WORDS.has(lower)) return { valid: false, reason: 'annotation_not_part' };
  if (/^(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[-_]?\d{2,4}$/i.test(part)) {
    return { valid: false, reason: 'date_annotation' };
  }
  return { valid: true, reason: null, sourcePartNumber: part };
}

export function isSchematicListUrl(url) {
  return /^\/pages\/schematic-list(?:\/|$)/i.test(new URL(url).pathname);
}

export function isDirectSchematicUrl(url) {
  return /^\/pages\/schematic\//i.test(new URL(url).pathname);
}

async function inspectPage(page) {
  return page.evaluate(() => {
    function attrs(element) {
      const out = {};
      for (const attr of element?.attributes || []) out[attr.name] = attr.value;
      return out;
    }
    function rect(element) {
      if (!element) return null;
      const r = element.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height };
    }
    const root = document.querySelector('[data-schematic-canvas]');
    const links = [...document.querySelectorAll('a[href]')].map((a) => ({ href: a.href, text: (a.textContent || '').trim() }));
    if (!root) return { isSchematic: false, url: location.href, title: document.title, links };
    const pageNodes = [...root.querySelectorAll('[data-canvas-page]')];
    const pages = pageNodes.map((pageNode, index) => {
      const image = pageNode.querySelector('.interactable-schematic-image');
      return {
        page: index + 1,
        pageIndex: Number(pageNode.getAttribute('data-page-index')) || index,
        image: image ? {
          alt: image.getAttribute('alt') || '',
          src: image.currentSrc || image.src || '',
          srcSmall: image.getAttribute('data-src-sm') || '',
          srcLarge: image.getAttribute('data-src-lg') || '',
          layoutWidth: Number(image.getAttribute('data-layout-w')) || Number(image.getAttribute('width')) || null,
          layoutHeight: Number(image.getAttribute('data-layout-h')) || Number(image.getAttribute('height')) || null,
          naturalWidth: image.naturalWidth || null,
          naturalHeight: image.naturalHeight || null,
        } : null,
      };
    });
    const selector = [
      '.interactable-schematic-overlay > a[href*="/products/"]',
      '.interactable-schematic-overlay .schematic-link a[href*="/products/"]',
      '.interactable-schematic-overlay .schematic-overlay-text[data-product-handle]',
    ].join(',');
    const occurrences = [...root.querySelectorAll(selector)].map((node, index) => {
      const pageNode = node.closest('[data-canvas-page]');
      const overlay = node.closest('.interactable-schematic-overlay');
      const pageIndex = pageNode ? pageNodes.indexOf(pageNode) : -1;
      const href = node.tagName === 'A' ? node.href : '';
      const match = String(href || '').match(/\/products\/([^/?#]+)/i);
      const handle = node.getAttribute('data-product-handle') || (match ? decodeURIComponent(match[1]) : null);
      return {
        occurrenceIndex: index,
        page: pageIndex >= 0 ? pageIndex + 1 : null,
        callout: (node.textContent || node.getAttribute('title') || '').replace(/\s+/g, ' ').trim(),
        productHandle: handle || null,
        href: href || null,
        tag: node.tagName,
        attrs: attrs(node),
        overlayAttrs: attrs(overlay),
        nodeRect: rect(node),
        overlayRect: rect(overlay),
      };
    });
    return {
      isSchematic: true,
      url: location.href,
      title: document.title,
      schematicTitle: (root.querySelector('.interactable-schematic-title')?.textContent || '').trim(),
      declaredPageCount: Number(root.getAttribute('data-page-count')) || null,
      pages,
      occurrences,
      links,
    };
  });
}

export function normalizeOccurrence(raw) {
  const style = parseStyleDeclaration(raw.attrs?.style || '');
  const leftPct = parsePercent(style.left);
  const topPct = parsePercent(style.top);
  const widthPct = parsePercent(style.width);
  const heightPct = parsePercent(style.height);
  const geometryComplete = [leftPct, topPct, widthPct, heightPct].every(Number.isFinite);
  const handleValidation = validateProductHandle(raw.productHandle);
  return {
    ...raw,
    sourcePartNumber: handleValidation.valid ? handleValidation.sourcePartNumber : cleanText(raw.callout) || null,
    sourceIdentity: {
      callout: cleanText(raw.callout) || null,
      productHandle: raw.productHandle || null,
      handleValid: handleValidation.valid,
      handleRejectReason: handleValidation.reason,
      identityStatus: handleValidation.valid ? 'source_handle_confirmed' : 'annotation_or_invalid_handle',
    },
    sourceGeometry: {
      coordinateSystem: geometryComplete ? 'css_percent_top_left_rect' : 'source_native_unknown',
      leftPct, topPct, widthPct, heightPct,
      anchorSemantics: geometryComplete ? 'top_left_rectangle' : 'unverified',
    },
    normalizedGeometry: geometryComplete ? {
      coordinateSystem: 'normalized_percent_center_rect',
      xPct: leftPct + (widthPct / 2),
      yPct: topPct + (heightPct / 2),
      widthPct,
      heightPct,
      derivedFrom: 'source_css_percent_top_left_rect',
    } : null,
  };
}

export async function discoverAndExtract(options, runDir) {
  const session = await openBrowserlessSession(options.browserless, options.timeoutMs);
  const queue = [...options.directUrls, ...options.seeds];
  const seen = new Set();
  const schematicUrls = new Set(options.directUrls.filter(isDirectSchematicUrl));
  const rawSchematics = [];
  const failures = [];
  const diagnostics = [];
  try {
    while (queue.length && seen.size < options.maxPages) {
      const current = assertAllowedUrl(queue.shift()).toString();
      if (seen.has(current)) continue;
      seen.add(current);
      if (seen.size > 1 && options.navDelayMs) await session.page.waitForTimeout(options.navDelayMs);
      process.stdout.write(`[pages ${seen.size}/${options.maxPages}] ${current}\n`);
      let response;
      try {
        response = await session.page.goto(current, { waitUntil: 'domcontentloaded' });
        await session.page.waitForLoadState('networkidle', { timeout: Math.min(options.timeoutMs, 12_000) }).catch(() => {});
        if (options.settleMs) await session.page.waitForTimeout(options.settleMs);
      } catch (error) {
        failures.push({ url: current, stage: 'navigation', error: error.message });
        continue;
      }
      if (!response || response.status() >= 400) {
        failures.push({ url: current, stage: 'navigation_status', status: response?.status() ?? null });
        continue;
      }
      const snapshot = await inspectPage(session.page);
      const rawPage = await persistRaw(runDir, path.join('raw', 'pages', `${safeFilename(current)}.json`), `${JSON.stringify(sanitizeSnapshot(snapshot), null, 2)}\n`);
      if (!snapshot.isSchematic) {
        if (isSchematicListUrl(current)) {
          for (const link of snapshot.links) {
            let target;
            try { target = assertAllowedUrl(link.href).toString(); } catch { continue; }
            if (isDirectSchematicUrl(target)) schematicUrls.add(target);
            if ((isDirectSchematicUrl(target) || isSchematicListUrl(target)) && !seen.has(target) && !queue.includes(target)) queue.push(target);
          }
        }
        diagnostics.push({ url: current, contract: 'non_schematic_page', rawPage });
        continue;
      }
      schematicUrls.add(snapshot.url);
      rawSchematics.push({
        source: 'east_coast_drywall',
        sourceUrl: snapshot.url,
        title: snapshot.schematicTitle || snapshot.title,
        pageTitle: snapshot.title,
        declaredPageCount: snapshot.declaredPageCount,
        pages: snapshot.pages,
        occurrences: snapshot.occurrences.map(normalizeOccurrence),
        rawPage,
      });
    }
  } finally {
    await closeBrowserlessSession(session);
  }
  for (const url of [...schematicUrls].filter((item) => !rawSchematics.some((record) => record.sourceUrl === item))) {
    failures.push({ url, stage: 'coverage', error: 'discovered_schematic_not_extracted' });
  }
  return { seen, schematicUrls, rawSchematics, failures, diagnostics };
}
