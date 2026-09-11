import { mkdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { closeBrowserlessSession, openBrowserlessSession } from './browserless.mjs';
import { atomicWriteJson, cleanText, nowIso, persistRaw, safeFilename, sha256 } from './io.mjs';
import { derivePartNumberFromHandle, normalizeSourceIdentifier } from './source.mjs';

const MAX_RESPONSE_BYTES = 12 * 1024 * 1024;
const NOT_FOUND_CACHE_TTL_MS = 24 * 60 * 60 * 1_000;
const SUCCESS_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1_000;

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

function cachePath(cacheDir, handle) {
  return path.join(cacheDir, `${safeFilename(handle)}.json`);
}

async function loadCache(options, handle) {
  if (options.refreshProducts) return null;
  const file = cachePath(options.cacheDir, handle);
  try {
    const [body, info] = await Promise.all([readFile(file, 'utf8'), stat(file)]);
    const cached = JSON.parse(body);
    const ttl = cached.classification === 'not_published' ? NOT_FOUND_CACHE_TTL_MS : SUCCESS_CACHE_TTL_MS;
    if ((Date.now() - info.mtimeMs) > ttl) return null;
    if (!['resolved', 'not_published'].includes(cached.classification)) return null;
    return { ...cached, cache: { hit: true } };
  } catch {
    return null;
  }
}

async function saveCache(options, record) {
  if (!['resolved', 'not_published'].includes(record.classification)) return;
  await mkdir(options.cacheDir, { recursive: true });
  await atomicWriteJson(cachePath(options.cacheDir, record.handle), {
    cacheVersion: 1,
    cachedAt: nowIso(),
    handle: record.handle,
    productUrl: record.productUrl,
    httpStatus: record.httpStatus,
    ok: record.ok,
    classification: record.classification,
    error: record.error,
    product: record.product,
  });
}

function retryDelayMs(attempt, baseDelayMs, retryAfterHeader) {
  const seconds = Number.parseFloat(retryAfterHeader || '');
  if (Number.isFinite(seconds) && seconds >= 0) return Math.min(60_000, Math.max(baseDelayMs, seconds * 1_000));
  const exponential = baseDelayMs * (2 ** Math.max(0, attempt - 1));
  const jitter = Math.floor(Math.random() * Math.max(150, baseDelayMs * 0.35));
  return Math.min(30_000, exponential + jitter);
}

async function fetchOnce(page, handle) {
  return page.evaluate(async ({ handle, maxBytes }) => {
    const relative = `/products/${encodeURIComponent(handle)}.js`;
    try {
      const response = await fetch(relative, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        credentials: 'omit',
      });
      const text = await response.text();
      return {
        handle,
        url: new URL(relative, location.origin).toString(),
        status: response.status,
        ok: response.ok,
        retryAfter: response.headers.get('retry-after'),
        contentType: response.headers.get('content-type') || '',
        text: text.length > maxBytes ? '' : text,
        error: text.length > maxBytes ? 'response_too_large' : null,
      };
    } catch (error) {
      return { handle, url: new URL(relative, location.origin).toString(), status: null, ok: false, retryAfter: null, contentType: '', text: '', error: String(error?.message || error) };
    }
  }, { handle, maxBytes: MAX_RESPONSE_BYTES });
}

async function resolveOne(page, handle, options, runDir) {
  let last = null;
  const retryTrace = [];
  for (let attempt = 0; attempt <= options.productRetries; attempt += 1) {
    if (attempt > 0) {
      const delay = retryDelayMs(attempt, Math.max(1_000, options.productDelayMs * 2), last?.retryAfter);
      retryTrace.push({ attempt: attempt + 1, delayMs: delay, reason: `retry_after_${last?.status ?? 'network'}` });
      await page.waitForTimeout(delay);
    }
    last = await fetchOnce(page, handle);
    if (last.status === 429 || last.status == null || (last.status >= 500 && last.status <= 599)) continue;
    break;
  }

  let json = null;
  if (last?.text) {
    try { json = JSON.parse(last.text); } catch {}
  }
  const raw = last?.text
    ? await persistRaw(runDir, path.join('raw', 'products', `${safeFilename(handle)}-${sha256(last.text).slice(0, 12)}.json`), last.text)
    : null;

  let classification = 'retry_exhausted';
  if (last?.status === 404) classification = 'not_published';
  else if (last?.ok && json) classification = 'resolved';
  else if (last?.status === 429) classification = 'rate_limited_retry_exhausted';
  else if (last?.status && last.status >= 500) classification = 'upstream_retry_exhausted';
  else if (last?.error === 'response_too_large') classification = 'response_too_large';
  else if (last?.status && last.status >= 400) classification = 'http_error';
  else if (last?.status && !json) classification = 'non_json_response';

  return {
    handle,
    productUrl: last?.url || `https://eastcoastdrywall.com/products/${encodeURIComponent(handle)}.js`,
    httpStatus: last?.status ?? null,
    ok: classification === 'resolved',
    classification,
    error: last?.error || (classification === 'non_json_response' ? 'non_json_response' : null),
    attempts: retryTrace.length + 1,
    retryTrace,
    raw,
    product: json ? normalizeProduct(json, handle, last.url) : null,
    cache: { hit: false },
  };
}

async function bootstrap(page, settleMs) {
  const response = await page.goto('https://eastcoastdrywall.com/', { waitUntil: 'domcontentloaded' });
  if (!response || response.status() >= 400) throw new Error(`Unable to bootstrap East Coast product session: HTTP ${response?.status() ?? 'unknown'}`);
  if (settleMs) await page.waitForTimeout(Math.min(settleMs, 2_000));
}

export async function resolveProductsGlobally(handles, options, runDir) {
  const productMap = new Map();
  const pending = [];
  const sessionRetryCounts = new Map();
  for (const handle of handles) {
    const cached = await loadCache(options, handle);
    if (cached) productMap.set(handle, cached);
    else pending.push(handle);
  }

  while (pending.length) {
    const batch = pending.splice(0, options.productBatchSize);
    let session = null;
    try {
      session = await openBrowserlessSession(options.browserless, options.timeoutMs);
      await bootstrap(session.page, options.settleMs);
      process.stdout.write(`[products] Browserless session (${batch.length} handles; ${pending.length} queued)\n`);
      for (let i = 0; i < batch.length; i += 1) {
        if (i > 0) await session.page.waitForTimeout(options.productDelayMs);
        const handle = batch[i];
        const record = await resolveOne(session.page, handle, options, runDir);
        if (record.classification === 'rate_limited_retry_exhausted' && (sessionRetryCounts.get(handle) || 0) < 1) {
          sessionRetryCounts.set(handle, (sessionRetryCounts.get(handle) || 0) + 1);
          pending.unshift(handle, ...batch.slice(i + 1));
          break;
        }
        productMap.set(handle, record);
        await saveCache(options, record);
        if (record.classification === 'rate_limited_retry_exhausted') {
          pending.unshift(...batch.slice(i + 1));
          break;
        }
      }
    } finally {
      await closeBrowserlessSession(session);
    }
  }
  return productMap;
}

export function sourceIdentityEvidence(sourcePartNumber, handle, product) {
  const expected = normalizeSourceIdentifier(sourcePartNumber || derivePartNumberFromHandle(handle));
  const handlePart = normalizeSourceIdentifier(derivePartNumberFromHandle(handle));
  const variantMatches = (product?.variants || []).filter((variant) => expected && normalizeSourceIdentifier(variant.sku) === expected);
  const titleNormalized = normalizeSourceIdentifier(product?.title || '');
  const handleMatch = !!expected && handlePart === expected;
  const titleMatch = !!expected && titleNormalized.includes(expected);
  let status = 'unverified';
  if (variantMatches.length) status = 'variant_confirmed';
  else if (handleMatch && titleMatch) status = 'handle_and_title_confirmed';
  else if (handleMatch) status = 'handle_confirmed';
  else if (titleMatch) status = 'title_confirmed';
  else if (product) status = 'ambiguous';
  return {
    status,
    expectedIdentifier: sourcePartNumber || derivePartNumberFromHandle(handle) || null,
    handleConfirmed: handleMatch,
    titleConfirmed: titleMatch,
    variantSkuMatches: variantMatches.map((variant) => ({ id: variant.id, sku: variant.sku, title: variant.title })),
  };
}

export function joinOccurrences(occurrences, productMap) {
  return occurrences.map((occurrence) => {
    if (!occurrence.sourceIdentity.handleValid) {
      return { ...occurrence, productResolution: { status: 'invalid_or_annotation_handle', productHandle: occurrence.productHandle, sourceProductId: null, sourceProductTitle: null, identityEvidence: null } };
    }
    const sourceProduct = productMap.get(occurrence.productHandle) || null;
    const evidence = sourceIdentityEvidence(occurrence.sourcePartNumber, occurrence.productHandle, sourceProduct?.product || null);
    let status = 'source_product_resolution_incomplete';
    if (sourceProduct?.classification === 'resolved') status = 'source_product_resolved';
    else if (sourceProduct?.classification === 'not_published') status = 'source_part_only';
    return {
      ...occurrence,
      productResolution: {
        status,
        productHandle: occurrence.productHandle,
        classification: sourceProduct?.classification || 'missing_resolution_record',
        httpStatus: sourceProduct?.httpStatus ?? null,
        sourceProductId: sourceProduct?.product?.id ?? null,
        sourceProductTitle: sourceProduct?.product?.title || null,
        identityEvidence: evidence,
      },
    };
  });
}

export function classifyProductCounts(products) {
  const counts = { productsDiscovered: products.length, productsResolved: 0, productsNotPublished: 0, productsRateLimited: 0, productsRetryExhausted: 0, productsHttpError: 0, productsNonJson: 0, productsCacheHits: 0 };
  for (const item of products) {
    if (item.cache?.hit) counts.productsCacheHits += 1;
    if (item.classification === 'resolved') counts.productsResolved += 1;
    else if (item.classification === 'not_published') counts.productsNotPublished += 1;
    else if (item.classification === 'rate_limited_retry_exhausted') counts.productsRateLimited += 1;
    else if (['upstream_retry_exhausted', 'retry_exhausted'].includes(item.classification)) counts.productsRetryExhausted += 1;
    else if (['http_error', 'response_too_large'].includes(item.classification)) counts.productsHttpError += 1;
    else if (item.classification === 'non_json_response') counts.productsNonJson += 1;
  }
  return counts;
}
