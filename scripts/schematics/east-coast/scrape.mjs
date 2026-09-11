#!/usr/bin/env node

/**
 * Unified East Coast Drywall schematic scraper.
 *
 * One deterministic read-only workflow:
 *   discover -> load schematic -> extract diagram/overlays -> resolve products
 *   -> join -> validate -> persist provenance + normalized source data.
 *
 * This tool never writes DTB canonical catalog/schematic data and never treats
 * East Coast/Shopify IDs as DTB business identifiers.
 */

import { chromium } from 'playwright';
import { createHash } from 'node:crypto';
import { mkdir, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_OUTPUT_DIR = path.join(SCRIPT_DIR, 'output');
const DEFAULT_SEEDS = [
  'https://eastcoastdrywall.com/pages/schematic-list/tape-tech',
  'https://eastcoastdrywall.com/pages/schematic-list/columbia',
];
const ALLOWED_HOSTS = new Set(['eastcoastdrywall.com', 'www.eastcoastdrywall.com']);
const MAX_PAGES = 250;
const DEFAULT_TIMEOUT_MS = 45_000;
const DEFAULT_SETTLE_MS = 1_500;
const REQUEST_DELAY_MS = 650;
const PRODUCT_CONCURRENCY = 6;
const MAX_RESPONSE_BYTES = 12 * 1024 * 1024;

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function nowIso() {
  return new Date().toISOString();
}

function boundedInt(value, min, max, flag) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new Error(`${flag} must be an integer between ${min} and ${max}.`);
  }
  return parsed;
}

function assertAllowedUrl(input) {
  const url = new URL(input);
  if (url.protocol !== 'https:' || !ALLOWED_HOSTS.has(url.hostname)) {
    throw new Error(`Refusing non-public/non-East-Coast URL: ${input}`);
  }
  url.hash = '';
  return url;
}

function cleanText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function safeFilename(value) {
  return String(value)
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 180) || 'page';
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

function productHandleFromHref(href) {
  if (!href) return null;
  try {
    const url = assertAllowedUrl(href);
    const match = url.pathname.match(/^\/products\/([^/?#]+)/i);
    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

function parseArgs(argv) {
  const options = {
    seeds: [],
    directUrls: [],
    outputDir: DEFAULT_OUTPUT_DIR,
    headed: false,
    timeoutMs: DEFAULT_TIMEOUT_MS,
    settleMs: DEFAULT_SETTLE_MS,
    maxPages: MAX_PAGES,
    failOnIncomplete: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--brand-url') options.seeds.push(assertAllowedUrl(argv[++i]).toString());
    else if (arg === '--url') options.directUrls.push(assertAllowedUrl(argv[++i]).toString());
    else if (arg === '--out') options.outputDir = path.resolve(argv[++i]);
    else if (arg === '--headed') options.headed = true;
    else if (arg === '--timeout-ms') options.timeoutMs = boundedInt(argv[++i], 1_000, 120_000, arg);
    else if (arg === '--settle-ms') options.settleMs = boundedInt(argv[++i], 0, 30_000, arg);
    else if (arg === '--max-pages') options.maxPages = boundedInt(argv[++i], 1, MAX_PAGES, arg);
    else if (arg === '--fail-on-incomplete') options.failOnIncomplete = true;
    else if (arg === '--help' || arg === '-h') {
      process.stdout.write(`\nUnified East Coast schematic scraper\n\n`);
      process.stdout.write(`Usage: npm run scrape -- [options]\n\n`);
      process.stdout.write(`  --brand-url URL       Seed schematic-list URL; repeatable\n`);
      process.stdout.write(`  --url URL             Direct /pages/schematic/* URL; repeatable\n`);
      process.stdout.write(`  --out DIR             Output root (default ./output)\n`);
      process.stdout.write(`  --headed              Show Chromium\n`);
      process.stdout.write(`  --timeout-ms N        Navigation timeout\n`);
      process.stdout.write(`  --settle-ms N         Post-load settle delay\n`);
      process.stdout.write(`  --max-pages N         Crawl bound, max ${MAX_PAGES}\n`);
      process.stdout.write(`  --fail-on-incomplete  Exit non-zero on FAIL validation\n`);
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!options.seeds.length && !options.directUrls.length) options.seeds = [...DEFAULT_SEEDS];
  return options;
}

async function atomicWriteJson(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
  const temp = `${filePath}.tmp-${process.pid}`;
  await writeFile(temp, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  await rename(temp, filePath);
}

async function persistRaw(runDir, relativePath, body) {
  const absolute = path.join(runDir, relativePath);
  await mkdir(path.dirname(absolute), { recursive: true });
  await writeFile(absolute, body, 'utf8');
  return { path: relativePath.replaceAll('\\', '/'), sha256: sha256(body), bytes: Buffer.byteLength(body) };
}

function sanitizeSnapshot(value, depth = 0) {
  if (depth > 20 || value == null) return value;
  if (Array.isArray(value)) return value.map((item) => sanitizeSnapshot(item, depth + 1));
  if (typeof value !== 'object') return value;

  const denied = /(token|secret|password|authorization|cookie|api[_-]?key|access[_-]?token)/i;
  return Object.fromEntries(Object.entries(value).map(([key, child]) => [
    key,
    denied.test(key) ? '[REDACTED]' : sanitizeSnapshot(child, depth + 1),
  ]));
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
    function handleFromHref(href) {
      const match = String(href || '').match(/\/products\/([^/?#]+)/i);
      return match ? decodeURIComponent(match[1]) : null;
    }

    const root = document.querySelector('[data-schematic-canvas]');
    const isSchematic = !!root;
    const links = [...document.querySelectorAll('a[href]')].map((a) => ({ href: a.href, text: (a.textContent || '').trim() }));
    if (!isSchematic) {
      return { isSchematic: false, url: location.href, title: document.title, links };
    }

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

    const occurrences = [];
    for (const [index, node] of [...root.querySelectorAll('.interactable-schematic-overlay > a[href*="/products/"], .interactable-schematic-overlay .schematic-link a[href*="/products/"], .interactable-schematic-overlay .schematic-overlay-text')].entries()) {
      const pageNode = node.closest('[data-canvas-page]');
      const overlay = node.closest('.interactable-schematic-overlay');
      const pageIndex = pageNode ? pageNodes.indexOf(pageNode) : -1;
      const href = node.tagName === 'A' ? node.href : '';
      const handle = node.getAttribute('data-product-handle') || handleFromHref(href);
      occurrences.push({
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
      });
    }

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

function normalizeOccurrence(raw) {
  const style = parseStyleDeclaration(raw.attrs?.style || '');
  const leftPct = parsePercent(style.left);
  const topPct = parsePercent(style.top);
  const widthPct = parsePercent(style.width);
  const heightPct = parsePercent(style.height);
  const geometryComplete = [leftPct, topPct, widthPct, heightPct].every(Number.isFinite);

  return {
    ...raw,
    sourcePartNumber: raw.callout || null,
    sourceGeometry: {
      coordinateSystem: geometryComplete ? 'css_percent_top_left_rect' : 'source_native_unknown',
      leftPct,
      topPct,
      widthPct,
      heightPct,
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

function normalizeProduct(raw, handle, productUrl) {
  const product = raw?.product && typeof raw.product === 'object' ? raw.product : raw;
  if (!product || typeof product !== 'object') return null;

  const variants = Array.isArray(product.variants) ? product.variants.map((variant) => ({
    id: variant?.id ?? null,
    title: cleanText(variant?.title),
    sku: cleanText(variant?.sku),
    barcode: cleanText(variant?.barcode),
    price: variant?.price ?? null,
    compareAtPrice: variant?.compare_at_price ?? null,
    available: variant?.available ?? null,
    option1: variant?.option1 ?? null,
    option2: variant?.option2 ?? null,
    option3: variant?.option3 ?? null,
  })) : [];

  const images = Array.isArray(product.images)
    ? product.images.map((image) => (typeof image === 'string' ? image : image?.src || image?.url || '')).filter(Boolean)
    : [];

  return {
    source: 'east_coast_drywall_shopify_product_json',
    handle,
    productUrl,
    id: product.id ?? null,
    title: cleanText(product.title),
    vendor: cleanText(product.vendor),
    productType: cleanText(product.type || product.product_type),
    available: product.available ?? null,
    descriptionHtml: String(product.description || product.body_html || product.body || '').trim(),
    featuredImage: typeof product.featured_image === 'string'
      ? product.featured_image
      : product.featured_image?.src || product.featured_image?.url || null,
    images,
    options: Array.isArray(product.options) ? product.options : [],
    variants,
  };
}

async function fetchProducts(page, handles, runDir, productMap) {
  const pending = handles.filter((handle) => handle && !productMap.has(handle));
  if (!pending.length) return;

  const results = await page.evaluate(async ({ handles, concurrency, maxBytes }) => {
    const out = new Array(handles.length);
    let cursor = 0;
    async function worker() {
      while (cursor < handles.length) {
        const index = cursor++;
        const handle = handles[index];
        const relative = `/products/${encodeURIComponent(handle)}.js`;
        try {
          const response = await fetch(relative, { headers: { Accept: 'application/json' }, credentials: 'omit' });
          const text = await response.text();
          if (text.length > maxBytes) {
            out[index] = { handle, url: new URL(relative, location.origin).toString(), status: response.status, ok: false, error: 'response_too_large', text: '' };
            continue;
          }
          out[index] = { handle, url: new URL(relative, location.origin).toString(), status: response.status, ok: response.ok, error: null, text };
        } catch (error) {
          out[index] = { handle, url: new URL(relative, location.origin).toString(), status: null, ok: false, error: String(error?.message || error), text: '' };
        }
      }
    }
    await Promise.all(Array.from({ length: Math.min(concurrency, handles.length) }, () => worker()));
    return out;
  }, { handles: pending, concurrency: PRODUCT_CONCURRENCY, maxBytes: MAX_RESPONSE_BYTES });

  for (const result of results) {
    let json = null;
    if (result.text) {
      try { json = JSON.parse(result.text); } catch {}
    }
    const raw = result.text
      ? await persistRaw(runDir, path.join('raw', 'products', `${safeFilename(result.handle)}-${sha256(result.text).slice(0, 12)}.json`), result.text)
      : null;
    productMap.set(result.handle, {
      handle: result.handle,
      productUrl: result.url,
      httpStatus: result.status,
      ok: result.ok === true && !!json,
      error: result.error || (json ? null : 'non_json_response'),
      raw,
      product: json ? normalizeProduct(json, result.handle, result.url) : null,
    });
  }
}

function joinOccurrences(occurrences, productMap) {
  return occurrences.map((occurrence) => {
    const sourceProduct = occurrence.productHandle ? productMap.get(occurrence.productHandle) || null : null;
    const variants = sourceProduct?.product?.variants || [];
    const exactSkuMatches = occurrence.sourcePartNumber
      ? variants.filter((variant) => cleanText(variant.sku).toLowerCase() === cleanText(occurrence.sourcePartNumber).toLowerCase())
      : [];
    return {
      ...occurrence,
      productResolution: occurrence.productHandle ? {
        status: sourceProduct?.ok ? 'source_product_resolved' : 'source_product_unresolved',
        productHandle: occurrence.productHandle,
        sourceProductId: sourceProduct?.product?.id ?? null,
        sourceProductTitle: sourceProduct?.product?.title || null,
        exactVariantSkuMatches: exactSkuMatches.map((variant) => ({ id: variant.id, sku: variant.sku, title: variant.title })),
      } : {
        status: 'no_online_product_link',
        productHandle: null,
        sourceProductId: null,
        sourceProductTitle: null,
        exactVariantSkuMatches: [],
      },
    };
  });
}

function validateSchematic(record) {
  const errors = [];
  const warnings = [];
  if (!record.pages.length) errors.push('schematic_has_no_pages');
  if (!record.occurrences.length) errors.push('schematic_has_no_occurrences');
  if (record.declaredPageCount != null && record.declaredPageCount !== record.pages.length) {
    errors.push(`page_count_mismatch:${record.declaredPageCount}:${record.pages.length}`);
  }

  for (const occurrence of record.occurrences) {
    const g = occurrence.normalizedGeometry;
    if (!occurrence.callout) warnings.push(`missing_callout:${occurrence.occurrenceIndex}`);
    if (!g) {
      errors.push(`missing_geometry:${occurrence.occurrenceIndex}`);
      continue;
    }
    for (const [key, value] of Object.entries({ xPct: g.xPct, yPct: g.yPct, widthPct: g.widthPct, heightPct: g.heightPct })) {
      if (!Number.isFinite(value) || value < 0 || value > 100) errors.push(`invalid_geometry:${occurrence.occurrenceIndex}:${key}:${value}`);
    }
    if (occurrence.productHandle && occurrence.productResolution.status !== 'source_product_resolved') {
      warnings.push(`product_unresolved:${occurrence.productHandle}`);
    }
    if (occurrence.productResolution.status === 'source_product_resolved'
      && occurrence.productResolution.exactVariantSkuMatches.length === 0) {
      warnings.push(`no_exact_variant_sku_match:${occurrence.callout}:${occurrence.productHandle}`);
    }
  }

  return {
    status: errors.length ? 'FAIL' : warnings.length ? 'PASS_WITH_WARNINGS' : 'PASS',
    errors: [...new Set(errors)],
    warnings: [...new Set(warnings)],
    counts: {
      pages: record.pages.length,
      occurrences: record.occurrences.length,
      uniqueParts: new Set(record.occurrences.map((item) => item.sourcePartNumber).filter(Boolean)).size,
      linkedProducts: record.occurrences.filter((item) => item.productResolution.status === 'source_product_resolved').length,
      unavailableOrUnresolved: record.occurrences.filter((item) => item.productResolution.status !== 'source_product_resolved').length,
    },
  };
}

function isSchematicListUrl(url) {
  return /^\/pages\/schematic-list(?:\/|$)/i.test(new URL(url).pathname);
}

function isDirectSchematicUrl(url) {
  return /^\/pages\/schematic\//i.test(new URL(url).pathname);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  await mkdir(options.outputDir, { recursive: true });
  const runId = `${nowIso().replace(/[:.]/g, '-')}-${process.pid}`;
  const runDir = path.join(options.outputDir, runId);
  await mkdir(runDir, { recursive: true });

  const browser = await chromium.launch({ headless: !options.headed });
  const context = await browser.newContext({ locale: 'en-US', viewport: { width: 1440, height: 1200 }, serviceWorkers: 'block' });
  const page = await context.newPage();
  page.setDefaultNavigationTimeout(options.timeoutMs);
  page.setDefaultTimeout(options.timeoutMs);

  const queue = [...options.directUrls, ...options.seeds];
  const seen = new Set();
  const schematicUrls = new Set(options.directUrls.filter(isDirectSchematicUrl));
  const schematics = [];
  const productMap = new Map();
  const failures = [];
  const diagnostics = [];

  try {
    while (queue.length && seen.size < options.maxPages) {
      const current = assertAllowedUrl(queue.shift()).toString();
      if (seen.has(current)) continue;
      seen.add(current);
      if (seen.size > 1) await page.waitForTimeout(REQUEST_DELAY_MS);
      process.stdout.write(`[${seen.size}/${options.maxPages}] ${current}\n`);

      let response = null;
      try {
        response = await page.goto(current, { waitUntil: 'domcontentloaded' });
        await page.waitForLoadState('networkidle', { timeout: Math.min(options.timeoutMs, 15_000) }).catch(() => {});
        if (options.settleMs) await page.waitForTimeout(options.settleMs);
      } catch (error) {
        failures.push({ url: current, stage: 'navigation', error: error.message });
        continue;
      }

      if (!response || response.status() >= 400) {
        failures.push({ url: current, stage: 'navigation_status', status: response?.status() ?? null });
        continue;
      }

      const snapshot = await inspectPage(page);
      const rawPage = await persistRaw(
        runDir,
        path.join('raw', 'pages', `${safeFilename(current)}.json`),
        `${JSON.stringify(sanitizeSnapshot(snapshot), null, 2)}\n`,
      );

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
      const occurrences = snapshot.occurrences.map(normalizeOccurrence);
      const handles = [...new Set(occurrences.map((item) => item.productHandle).filter(Boolean))];
      await fetchProducts(page, handles, runDir, productMap);
      const joined = joinOccurrences(occurrences, productMap);

      const record = {
        source: 'east_coast_drywall',
        sourceUrl: snapshot.url,
        title: snapshot.schematicTitle || snapshot.title,
        pageTitle: snapshot.title,
        declaredPageCount: snapshot.declaredPageCount,
        pages: snapshot.pages,
        occurrences: joined,
        rawPage,
      };
      record.validation = validateSchematic(record);
      schematics.push(record);
    }
  } finally {
    await context.close();
    await browser.close();
  }

  const products = [...productMap.values()].sort((a, b) => a.handle.localeCompare(b.handle));
  const validation = schematics.map((record) => ({ sourceUrl: record.sourceUrl, title: record.title, ...record.validation }));
  const failed = validation.filter((item) => item.status === 'FAIL');
  const warned = validation.filter((item) => item.status === 'PASS_WITH_WARNINGS');
  const undiscovered = [...schematicUrls].filter((url) => !schematics.some((record) => record.sourceUrl === url));
  for (const url of undiscovered) failures.push({ url, stage: 'coverage', error: 'discovered_schematic_not_extracted' });

  const manifest = {
    schemaVersion: '2.0',
    runId,
    generatedAt: nowIso(),
    source: 'https://eastcoastdrywall.com',
    seeds: options.seeds,
    directUrls: options.directUrls,
    safety: {
      allowedHosts: [...ALLOWED_HOSTS],
      maxPages: options.maxPages,
      canonicalWrites: false,
      authenticationUsed: false,
      outputIgnoredByGit: true,
    },
    counts: {
      pagesVisited: seen.size,
      schematicsDiscovered: schematicUrls.size,
      schematicsExtracted: schematics.length,
      productsResolved: products.filter((item) => item.ok).length,
      productsUnresolved: products.filter((item) => !item.ok).length,
      failures: failures.length,
      validationFailures: failed.length,
      validationWarnings: warned.length,
    },
    overallStatus: failed.length || failures.some((item) => item.stage === 'coverage') ? 'FAIL' : warned.length ? 'PASS_WITH_WARNINGS' : 'PASS',
  };

  await atomicWriteJson(path.join(runDir, 'manifest.json'), manifest);
  await atomicWriteJson(path.join(runDir, 'schematics.json'), schematics);
  await atomicWriteJson(path.join(runDir, 'products.json'), products);
  await atomicWriteJson(path.join(runDir, 'validation.json'), validation);
  await atomicWriteJson(path.join(runDir, 'failures.json'), failures);
  await atomicWriteJson(path.join(runDir, 'diagnostics.json'), diagnostics);

  process.stdout.write(`\nRun complete: ${runDir}\n`);
  process.stdout.write(`Schematics: ${schematics.length}/${schematicUrls.size}\n`);
  process.stdout.write(`Products: ${products.filter((item) => item.ok).length}/${products.length} resolved\n`);
  process.stdout.write(`Status: ${manifest.overallStatus}\n`);

  if (options.failOnIncomplete && manifest.overallStatus === 'FAIL') process.exitCode = 2;
}

main().catch((error) => {
  process.stderr.write(`ERROR: ${error.stack || error.message}\n`);
  process.exitCode = 1;
});
