#!/usr/bin/env node

/**
 * East Coast Drywall schematic part/product enrichment.
 *
 * Reads a prior extractor run's raw/page snapshots, revisits only the public
 * schematic pages captured in that run, extracts the actual schematic overlay
 * occurrences, and deterministically resolves linked Shopify product JSON via
 * /products/<handle>.js.
 *
 * This script is read-only against East Coast and never writes DTB canonical
 * catalog or schematic data. Source coordinates/styles remain source-native.
 */

import { chromium } from 'playwright';
import { createHash } from 'node:crypto';
import {
  mkdir,
  readFile,
  readdir,
  rename,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const ALLOWED_HOSTS = new Set(['eastcoastdrywall.com', 'www.eastcoastdrywall.com']);
const DEFAULT_TIMEOUT_MS = 45_000;
const REQUEST_DELAY_MS = 600;
const PRODUCT_CONCURRENCY = 6;
const MAX_PRODUCT_BODY_BYTES = 8 * 1024 * 1024;

function parseArgs(argv) {
  const args = {
    runDir: '',
    headed: false,
    timeoutMs: DEFAULT_TIMEOUT_MS,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--run') args.runDir = path.resolve(argv[++i] || '');
    else if (arg === '--headed') args.headed = true;
    else if (arg === '--timeout-ms') {
      const value = Number.parseInt(argv[++i], 10);
      if (!Number.isInteger(value) || value < 1_000 || value > 120_000) {
        throw new Error('--timeout-ms must be between 1000 and 120000.');
      }
      args.timeoutMs = value;
    } else if (arg === '--help' || arg === '-h') {
      process.stdout.write(
        'Usage: node enrich-products.mjs --run <extractor-run-directory> [--headed] [--timeout-ms N]\n',
      );
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!args.runDir) throw new Error('--run is required.');
  return args;
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function assertAllowedUrl(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || !ALLOWED_HOSTS.has(url.hostname)) {
    throw new Error(`Refusing non-East-Coast URL: ${value}`);
  }
  url.hash = '';
  return url;
}

function productHandleFromHref(href) {
  try {
    const url = assertAllowedUrl(href);
    const match = url.pathname.match(/^\/products\/([^/?#]+)/i);
    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

function cleanText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function datasetObject(element) {
  return Object.fromEntries(Object.entries(element?.dataset || {}));
}

function parseStyleDeclaration(styleText = '') {
  const result = {};
  for (const segment of String(styleText).split(';')) {
    const colon = segment.indexOf(':');
    if (colon <= 0) continue;
    const key = segment.slice(0, colon).trim().toLowerCase();
    const value = segment.slice(colon + 1).trim();
    if (key && value) result[key] = value;
  }
  return result;
}

function parsePercent(value) {
  const match = String(value ?? '').trim().match(/^(-?\d+(?:\.\d+)?)%$/);
  return match ? Number(match[1]) : null;
}

function normalizeProduct(raw, handle, productUrl) {
  const product = raw?.product && typeof raw.product === 'object' ? raw.product : raw;
  if (!product || typeof product !== 'object') return null;

  const variants = Array.isArray(product.variants)
    ? product.variants.map((variant) => ({
        id: variant?.id ?? null,
        title: cleanText(variant?.title),
        sku: cleanText(variant?.sku),
        price: variant?.price ?? null,
        compareAtPrice: variant?.compare_at_price ?? null,
        available: variant?.available ?? null,
        barcode: cleanText(variant?.barcode),
        option1: variant?.option1 ?? null,
        option2: variant?.option2 ?? null,
        option3: variant?.option3 ?? null,
        featuredImage: variant?.featured_image ?? null,
      }))
    : [];

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
    publishedAt: product.published_at ?? null,
    createdAt: product.created_at ?? null,
    updatedAt: product.updated_at ?? null,
    tags: Array.isArray(product.tags) ? product.tags : product.tags ?? null,
    options: Array.isArray(product.options) ? product.options : [],
    featuredImage: typeof product.featured_image === 'string'
      ? product.featured_image
      : product.featured_image?.src || product.featured_image?.url || null,
    images,
    variants,
  };
}

async function atomicWriteJson(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
  const temp = `${filePath}.tmp-${process.pid}`;
  await writeFile(temp, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  await rename(temp, filePath);
}

async function loadCapturedSchematicPages(runDir) {
  const pagesDir = path.join(runDir, 'raw', 'pages');
  const names = (await readdir(pagesDir)).filter((name) => name.endsWith('.json')).sort();
  const pages = [];

  for (const name of names) {
    const absolute = path.join(pagesDir, name);
    let parsed;
    try {
      parsed = JSON.parse(await readFile(absolute, 'utf8'));
    } catch (error) {
      process.stderr.write(`[skip malformed page snapshot] ${name}: ${error.message}\n`);
      continue;
    }

    const rawUrl = parsed?.url;
    if (!rawUrl) continue;
    let url;
    try { url = assertAllowedUrl(rawUrl); } catch { continue; }
    if (!/^\/pages\/schematic\//i.test(url.pathname)) continue;

    pages.push({
      snapshotFile: name,
      sourceUrl: url.toString(),
      sourceTitle: cleanText(parsed?.title),
    });
  }

  return pages;
}

async function extractOverlayOccurrences(page) {
  return page.evaluate(() => {
    function attrsOf(element) {
      const attrs = {};
      for (const attr of element?.attributes || []) attrs[attr.name] = attr.value;
      return attrs;
    }

    function datasetOf(element) {
      return Object.fromEntries(Object.entries(element?.dataset || {}));
    }

    function rectOf(element) {
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
      };
    }

    function handleFromHref(href) {
      const match = String(href || '').match(/\/products\/([^/?#]+)/i);
      return match ? decodeURIComponent(match[1]) : null;
    }

    const root = document.querySelector('[data-schematic-canvas]') || document;
    const pageNodes = [...root.querySelectorAll('[data-canvas-page]')];
    const occurrences = [];

    const nodes = [
      ...root.querySelectorAll('.interactable-schematic-overlay a[href*="/products/"], .interactable-schematic-overlay .schematic-overlay-text'),
    ];

    for (const [index, node] of nodes.entries()) {
      const overlay = node.closest('.interactable-schematic-overlay');
      const pageNode = node.closest('[data-canvas-page]');
      const pageIndex = pageNode ? pageNodes.indexOf(pageNode) + 1 : null;
      const href = node.tagName === 'A' ? node.href : '';
      const handle = node.getAttribute('data-product-handle') || handleFromHref(href);
      const callout = (node.textContent || node.getAttribute('title') || '').replace(/\s+/g, ' ').trim();

      occurrences.push({
        occurrenceIndex: index,
        page: pageIndex,
        callout,
        href: href || null,
        productHandle: handle || null,
        tag: node.tagName,
        attrs: attrsOf(node),
        dataset: datasetOf(node),
        inlineStyle: node.getAttribute('style') || '',
        overlayAttrs: attrsOf(overlay),
        overlayDataset: datasetOf(overlay),
        overlayInlineStyle: overlay?.getAttribute('style') || '',
        pageAttrs: attrsOf(pageNode),
        nodeRect: rectOf(node),
        overlayRect: rectOf(overlay),
      });
    }

    return occurrences;
  });
}

function enrichOccurrenceGeometry(occurrence) {
  const sourceStyle = parseStyleDeclaration(occurrence.inlineStyle);
  const overlayStyle = parseStyleDeclaration(occurrence.overlayInlineStyle);
  const style = { ...overlayStyle, ...sourceStyle };

  const leftPct = parsePercent(style.left);
  const topPct = parsePercent(style.top);
  const widthPct = parsePercent(style.width);
  const heightPct = parsePercent(style.height);

  return {
    ...occurrence,
    sourceGeometry: {
      coordinateSystem: leftPct !== null || topPct !== null ? 'css_percent' : 'source_native_unknown',
      anchorSemantics: 'unverified',
      leftPct,
      topPct,
      widthPct,
      heightPct,
      inlineStyle: occurrence.inlineStyle,
      overlayInlineStyle: occurrence.overlayInlineStyle,
      nodeRect: occurrence.nodeRect,
      overlayRect: occurrence.overlayRect,
    },
  };
}

async function fetchProductsInPage(page, handles) {
  if (handles.length === 0) return [];

  return page.evaluate(async ({ handles, concurrency, maxBytes }) => {
    const results = new Array(handles.length);
    let cursor = 0;

    async function worker() {
      while (true) {
        const index = cursor;
        cursor += 1;
        if (index >= handles.length) return;
        const handle = handles[index];
        const productUrl = `/products/${encodeURIComponent(handle)}.js`;
        try {
          const response = await fetch(productUrl, {
            method: 'GET',
            credentials: 'omit',
            headers: { Accept: 'application/json' },
          });
          const text = await response.text();
          if (text.length > maxBytes) {
            results[index] = { handle, productUrl, status: response.status, error: 'response_too_large' };
            continue;
          }
          let json = null;
          try { json = JSON.parse(text); } catch {}
          results[index] = {
            handle,
            productUrl: new URL(productUrl, location.origin).toString(),
            status: response.status,
            ok: response.ok,
            contentType: response.headers.get('content-type') || '',
            bodySha256Input: text,
            json,
            error: json ? null : 'non_json_response',
          };
        } catch (error) {
          results[index] = { handle, productUrl, status: null, ok: false, error: String(error?.message || error) };
        }
      }
    }

    await Promise.all(Array.from({ length: Math.min(concurrency, handles.length) }, () => worker()));
    return results;
  }, { handles, concurrency: PRODUCT_CONCURRENCY, maxBytes: MAX_PRODUCT_BODY_BYTES });
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const capturedPages = await loadCapturedSchematicPages(options.runDir);
  if (capturedPages.length === 0) throw new Error('No captured /pages/schematic/* snapshots found in the run.');

  const browser = await chromium.launch({ headless: !options.headed });
  const context = await browser.newContext({
    locale: 'en-US',
    viewport: { width: 1440, height: 1200 },
    serviceWorkers: 'block',
  });
  const page = await context.newPage();
  page.setDefaultNavigationTimeout(options.timeoutMs);
  page.setDefaultTimeout(options.timeoutMs);

  const schematicRecords = [];
  const productByHandle = new Map();
  const failures = [];

  try {
    for (const [pageIndex, source] of capturedPages.entries()) {
      process.stdout.write(`[${pageIndex + 1}/${capturedPages.length}] ${source.sourceUrl}\n`);
      if (pageIndex > 0) await page.waitForTimeout(REQUEST_DELAY_MS);

      let response;
      try {
        response = await page.goto(source.sourceUrl, { waitUntil: 'domcontentloaded' });
        await page.waitForLoadState('networkidle', { timeout: Math.min(options.timeoutMs, 15_000) }).catch(() => {});
      } catch (error) {
        failures.push({ sourceUrl: source.sourceUrl, stage: 'navigation', error: error.message });
        continue;
      }

      if (!response || response.status() >= 400) {
        failures.push({ sourceUrl: source.sourceUrl, stage: 'navigation_status', status: response?.status() ?? null });
        continue;
      }

      const occurrences = (await extractOverlayOccurrences(page)).map(enrichOccurrenceGeometry);
      const handles = [...new Set(occurrences.map((entry) => entry.productHandle).filter(Boolean))];
      const fetchedProducts = await fetchProductsInPage(page, handles);

      for (const fetched of fetchedProducts) {
        const bodyText = typeof fetched.bodySha256Input === 'string' ? fetched.bodySha256Input : '';
        const rawSha256 = bodyText ? sha256(bodyText) : null;
        const normalized = fetched.json ? normalizeProduct(fetched.json, fetched.handle, fetched.productUrl) : null;
        productByHandle.set(fetched.handle, {
          handle: fetched.handle,
          productUrl: fetched.productUrl,
          httpStatus: fetched.status,
          ok: fetched.ok === true,
          contentType: fetched.contentType || '',
          sourceSha256: rawSha256,
          error: fetched.error || null,
          product: normalized,
        });
      }

      const joinedOccurrences = occurrences.map((occurrence) => {
        const sourceProduct = occurrence.productHandle ? productByHandle.get(occurrence.productHandle) || null : null;
        const variants = sourceProduct?.product?.variants || [];
        const exactSkuMatches = occurrence.callout
          ? variants.filter((variant) => cleanText(variant.sku).toLowerCase() === cleanText(occurrence.callout).toLowerCase())
          : [];

        return {
          ...occurrence,
          sourcePartNumber: occurrence.callout || null,
          productResolution: occurrence.productHandle
            ? {
                status: sourceProduct?.ok ? 'source_product_resolved' : 'source_product_unresolved',
                productHandle: occurrence.productHandle,
                productUrl: occurrence.href || sourceProduct?.productUrl || null,
                sourceProductId: sourceProduct?.product?.id ?? null,
                sourceProductTitle: sourceProduct?.product?.title || null,
                exactVariantSkuMatches: exactSkuMatches.map((variant) => ({
                  id: variant.id,
                  sku: variant.sku,
                  title: variant.title,
                })),
              }
            : {
                status: 'no_online_product_link',
                productHandle: null,
                productUrl: null,
                sourceProductId: null,
                sourceProductTitle: null,
                exactVariantSkuMatches: [],
              },
        };
      });

      schematicRecords.push({
        sourceUrl: source.sourceUrl,
        sourceTitle: cleanText(await page.title()) || source.sourceTitle,
        snapshotFile: source.snapshotFile,
        occurrenceCount: joinedOccurrences.length,
        linkedProductCount: handles.length,
        occurrences: joinedOccurrences,
      });
    }
  } finally {
    await context.close();
    await browser.close();
  }

  const products = [...productByHandle.values()].sort((a, b) => a.handle.localeCompare(b.handle));
  const summary = {
    schemaVersion: '1.0',
    generatedAt: new Date().toISOString(),
    runDir: options.runDir,
    counts: {
      schematicPages: schematicRecords.length,
      occurrences: schematicRecords.reduce((sum, item) => sum + item.occurrenceCount, 0),
      uniqueLinkedProducts: products.length,
      resolvedProducts: products.filter((item) => item.ok && item.product).length,
      unresolvedProducts: products.filter((item) => !item.ok || !item.product).length,
      failures: failures.length,
    },
    safety: {
      canonicalWrites: false,
      sourceOnly: true,
      authenticatedRequests: false,
      coordinateAnchorSemanticsVerified: false,
    },
  };

  await atomicWriteJson(path.join(options.runDir, 'schematic-parts-products.json'), schematicRecords);
  await atomicWriteJson(path.join(options.runDir, 'source-products.json'), products);
  await atomicWriteJson(path.join(options.runDir, 'enrichment-summary.json'), summary);
  await atomicWriteJson(path.join(options.runDir, 'enrichment-failures.json'), failures);

  process.stdout.write(`\nEnrichment complete\n`);
  process.stdout.write(`Schematic pages: ${summary.counts.schematicPages}\n`);
  process.stdout.write(`Part/hotspot occurrences: ${summary.counts.occurrences}\n`);
  process.stdout.write(`Unique linked products: ${summary.counts.uniqueLinkedProducts}\n`);
  process.stdout.write(`Resolved products: ${summary.counts.resolvedProducts}\n`);
  process.stdout.write(`Unresolved products: ${summary.counts.unresolvedProducts}\n`);
  process.stdout.write(`Failures: ${summary.counts.failures}\n`);
}

main().catch((error) => {
  process.stderr.write(`ERROR: ${error.stack || error.message}\n`);
  process.exitCode = 1;
});
