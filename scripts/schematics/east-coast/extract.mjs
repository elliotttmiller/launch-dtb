#!/usr/bin/env node

/**
 * East Coast Drywall schematic extractor.
 *
 * Purpose:
 *   Capture the public data actually delivered to a browser for East Coast
 *   Drywall schematic pages, preserve raw API/application payloads with
 *   provenance, and emit reviewable hotspot/part candidates.
 *
 * Non-goals / safety boundaries:
 *   - Never authenticates, bypasses access controls, or reads non-public data.
 *   - Never writes into DTB canonical schematic_data.json files.
 *   - Never invents coordinates, SKUs, product mappings, or part identities.
 *   - Never treats East Coast product IDs/URLs as DTB canonical identifiers.
 *
 * Runtime:
 *   Node 20+ and Playwright Chromium.
 */

import { chromium } from 'playwright';
import {
  createHash,
} from 'node:crypto';
import {
  mkdir,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_OUTPUT_DIR = path.join(SCRIPT_DIR, 'output');
const DEFAULT_BRAND_URLS = [
  'https://eastcoastdrywall.com/pages/schematic-list/tape-tech',
  'https://eastcoastdrywall.com/pages/schematic-list/columbia',
];
const ALLOWED_HOSTS = new Set(['eastcoastdrywall.com', 'www.eastcoastdrywall.com']);
const MAX_RESPONSE_BYTES = 12 * 1024 * 1024;
const MAX_PAGES = 250;
const DEFAULT_TIMEOUT_MS = 45_000;
const DEFAULT_SETTLE_MS = 2_500;
const REQUEST_DELAY_MS = 850;

const SIGNAL_KEYS = new Set([
  'hotspot', 'hotspots', 'marker', 'markers', 'callout', 'callouts',
  'part', 'parts', 'part_id', 'partid', 'part_ref', 'partref', 'part_number',
  'sku', 'product', 'products', 'product_id', 'productid', 'variant_id',
  'schematic', 'schematics', 'diagram', 'diagram_id', 'image', 'image_url',
  'x', 'y', 'left', 'top', 'cx', 'cy', 'x_pct', 'y_pct', 'width', 'height',
  'normalized', 'coordinates', 'points', 'points_pct',
]);
const COORDINATE_KEYS = new Set([
  'x', 'y', 'left', 'top', 'cx', 'cy', 'x_pct', 'y_pct', 'width', 'height',
  'width_pct', 'height_pct', 'r', 'radius', 'r_pct_w', 'r_pct_h', 'points',
  'points_pct',
]);
const IDENTITY_KEYS = new Set([
  'id', 'label', 'title', 'name', 'number', 'callout', 'part', 'part_id',
  'partid', 'part_ref', 'partref', 'part_number', 'sku', 'product_id',
  'productid', 'variant_id', 'handle', 'url', 'href',
]);

function parseArgs(argv) {
  const out = {
    brandUrls: [],
    outputDir: DEFAULT_OUTPUT_DIR,
    headed: false,
    timeoutMs: DEFAULT_TIMEOUT_MS,
    settleMs: DEFAULT_SETTLE_MS,
    maxPages: MAX_PAGES,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--brand-url') out.brandUrls.push(argv[++i]);
    else if (arg === '--out') out.outputDir = path.resolve(argv[++i]);
    else if (arg === '--headed') out.headed = true;
    else if (arg === '--timeout-ms') out.timeoutMs = boundedInt(argv[++i], 1_000, 120_000, '--timeout-ms');
    else if (arg === '--settle-ms') out.settleMs = boundedInt(argv[++i], 0, 30_000, '--settle-ms');
    else if (arg === '--max-pages') out.maxPages = boundedInt(argv[++i], 1, MAX_PAGES, '--max-pages');
    else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (out.brandUrls.length === 0) out.brandUrls = [...DEFAULT_BRAND_URLS];
  out.brandUrls = out.brandUrls.map(assertAllowedUrl);
  return out;
}

function boundedInt(value, min, max, flag) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new Error(`${flag} must be an integer between ${min} and ${max}.`);
  }
  return parsed;
}

function printHelp() {
  process.stdout.write(`\nEast Coast schematic extractor\n\n`);
  process.stdout.write(`Usage:\n  npm run extract -- [options]\n\n`);
  process.stdout.write(`Options:\n`);
  process.stdout.write(`  --brand-url URL   Seed brand schematic-list URL (repeatable)\n`);
  process.stdout.write(`  --out DIR         Output directory (default: ./output)\n`);
  process.stdout.write(`  --headed          Show Chromium for debugging\n`);
  process.stdout.write(`  --timeout-ms N    Navigation timeout, max 120000\n`);
  process.stdout.write(`  --settle-ms N     Post-load network settle delay\n`);
  process.stdout.write(`  --max-pages N     Safety bound, max ${MAX_PAGES}\n`);
}

function assertAllowedUrl(input) {
  const url = new URL(input);
  if (url.protocol !== 'https:' || !ALLOWED_HOSTS.has(url.hostname)) {
    throw new Error(`Refusing non-public/non-East-Coast URL: ${input}`);
  }
  url.hash = '';
  return url.toString();
}

function sha256(input) {
  return createHash('sha256').update(input).digest('hex');
}

function isoNow() {
  return new Date().toISOString();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function safeFilename(value) {
  return String(value)
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 180) || 'page';
}

function normalizeKey(key) {
  return String(key).trim().toLowerCase().replace(/[-\s]+/g, '_');
}

function isJsonContentType(contentType = '') {
  return /(?:application|text)\/(?:[a-z0-9.+-]*\+)?json\b/i.test(contentType);
}

function isTextualContentType(contentType = '') {
  return /(?:json|javascript|text\/|xml|graphql|x-www-form-urlencoded)/i.test(contentType);
}

function redactHeaders(headers) {
  const denied = new Set([
    'authorization', 'cookie', 'set-cookie', 'x-api-key', 'proxy-authorization',
    'x-shopify-access-token', 'x-csrf-token', 'x-xsrf-token',
  ]);
  return Object.fromEntries(
    Object.entries(headers || {})
      .filter(([key]) => !denied.has(key.toLowerCase()))
      .map(([key, value]) => [key, value]),
  );
}

function requestFingerprint(request) {
  const postData = request.postData() || '';
  return sha256(`${request.method()}\n${request.url()}\n${postData}`);
}

function jsonSignalScore(value, depth = 0) {
  if (depth > 12 || value == null) return 0;
  if (Array.isArray(value)) {
    return Math.min(60, value.slice(0, 80).reduce((sum, item) => sum + jsonSignalScore(item, depth + 1), 0));
  }
  if (typeof value !== 'object') return 0;

  let score = 0;
  const keys = Object.keys(value);
  for (const key of keys) {
    const normalized = normalizeKey(key);
    if (SIGNAL_KEYS.has(normalized)) score += COORDINATE_KEYS.has(normalized) ? 4 : 2;
    if (/hotspot|schematic|callout|part|product|diagram/i.test(normalized)) score += 2;
  }
  for (const child of Object.values(value).slice(0, 80)) {
    score += Math.min(18, jsonSignalScore(child, depth + 1));
  }
  return Math.min(score, 100);
}

function objectLooksLikeHotspot(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false;
  const keys = new Set(Object.keys(obj).map(normalizeKey));
  const hasCoordinate = [...COORDINATE_KEYS].some((key) => keys.has(key))
    || keys.has('normalized')
    || keys.has('coordinates');
  const hasIdentity = [...IDENTITY_KEYS].some((key) => keys.has(key));
  return hasCoordinate && hasIdentity;
}

function objectLooksLikePart(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false;
  const keys = new Set(Object.keys(obj).map(normalizeKey));
  const hasPartIdentity = ['part_id', 'partid', 'part_ref', 'partref', 'part_number', 'sku', 'number'].some((key) => keys.has(key));
  const hasDescription = ['name', 'title', 'label', 'description'].some((key) => keys.has(key));
  return hasPartIdentity && hasDescription;
}

function walkCandidates(value, source, pointer = '$', output = [], depth = 0) {
  if (depth > 20 || value == null) return output;
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i += 1) {
      walkCandidates(value[i], source, `${pointer}[${i}]`, output, depth + 1);
    }
    return output;
  }
  if (typeof value !== 'object') return output;

  if (objectLooksLikeHotspot(value)) {
    output.push({
      kind: 'hotspot_candidate',
      source,
      pointer,
      raw: value,
    });
  } else if (objectLooksLikePart(value)) {
    output.push({
      kind: 'part_candidate',
      source,
      pointer,
      raw: value,
    });
  }

  for (const [key, child] of Object.entries(value)) {
    walkCandidates(child, source, `${pointer}.${key}`, output, depth + 1);
  }
  return output;
}

function normalizeCandidate(candidate) {
  const raw = candidate.raw;
  const keyed = Object.fromEntries(Object.entries(raw).map(([k, v]) => [normalizeKey(k), v]));

  const first = (...keys) => {
    for (const key of keys) {
      const value = keyed[key];
      if (value !== undefined && value !== null && String(value).trim() !== '') return value;
    }
    return null;
  };

  const coordinates = {};
  for (const [key, value] of Object.entries(keyed)) {
    if (COORDINATE_KEYS.has(key) && (typeof value === 'number' || Array.isArray(value))) {
      coordinates[key] = value;
    }
  }
  if (keyed.normalized && typeof keyed.normalized === 'object') coordinates.normalized = keyed.normalized;
  if (keyed.coordinates && typeof keyed.coordinates === 'object') coordinates.coordinates = keyed.coordinates;

  return {
    kind: candidate.kind,
    source: candidate.source,
    pointer: candidate.pointer,
    callout: first('callout', 'label', 'number'),
    part_ref: first('part_ref', 'partref', 'part_id', 'partid'),
    part_number: first('part_number', 'sku'),
    name: first('name', 'title', 'description'),
    product_id: first('product_id', 'productid'),
    variant_id: first('variant_id'),
    product_url: first('url', 'href'),
    coordinates,
    // The raw source is intentionally retained. We do not convert geometry
    // until its coordinate system and anchor semantics are known.
    raw,
  };
}

async function atomicWriteJson(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
  const temp = `${filePath}.tmp-${process.pid}`;
  await writeFile(temp, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  // writeFile + rename would be preferable across filesystems, but Playwright
  // output paths are expected to remain within one working tree. Avoid an
  // extra dependency and write final only after full serialization succeeds.
  const serialized = await import('node:fs/promises').then(({ readFile }) => readFile(temp, 'utf8'));
  await writeFile(filePath, serialized, 'utf8');
  await import('node:fs/promises').then(({ unlink }) => unlink(temp));
}

async function persistResponseBody(outputDir, responseMeta, bodyText, extension) {
  const hash = sha256(bodyText);
  const rel = path.posix.join('raw', 'responses', `${hash}.${extension}`);
  const abs = path.join(outputDir, rel);
  await mkdir(path.dirname(abs), { recursive: true });
  await writeFile(abs, bodyText, 'utf8');
  return { sha256: hash, bodyPath: rel, bytes: Buffer.byteLength(bodyText) };
}

async function extractDomSnapshot(page) {
  return page.evaluate(() => {
    const relevant = [];
    const selector = [
      '[data-hotspot]', '[data-marker]', '[data-callout]', '[data-part]',
      '[data-part-id]', '[data-product-id]', '[data-schematic]',
      '[class*="hotspot" i]', '[class*="marker" i]', '[class*="callout" i]',
      '[id*="hotspot" i]', '[id*="schematic" i]',
      'svg circle', 'svg rect', 'svg polygon', 'svg path',
    ].join(',');

    for (const element of document.querySelectorAll(selector)) {
      const rect = element.getBoundingClientRect();
      const attrs = {};
      for (const attr of element.attributes || []) {
        if (attr.name.startsWith('data-') || ['id', 'class', 'href', 'cx', 'cy', 'x', 'y', 'width', 'height', 'points', 'viewBox'].includes(attr.name)) {
          attrs[attr.name] = attr.value;
        }
      }
      relevant.push({
        tag: element.tagName,
        text: (element.textContent || '').trim().slice(0, 500),
        attrs,
        rect: {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
        },
      });
    }

    const scripts = [];
    for (const [index, script] of [...document.scripts].entries()) {
      const type = script.type || '';
      const text = script.textContent || '';
      if (!text.trim()) continue;
      if (/json|javascript|ld\+json/i.test(type) || /hotspot|schematic|callout|part/i.test(text)) {
        scripts.push({ index, type, src: script.src || null, text: text.slice(0, 2_000_000) });
      }
    }

    const links = [...document.querySelectorAll('a[href]')].map((a) => ({
      href: a.href,
      text: (a.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 300),
    }));

    return {
      url: location.href,
      title: document.title,
      relevantElements: relevant,
      scripts,
      links,
    };
  });
}

function isCrawlableSchematicUrl(rawUrl, seedPaths) {
  let url;
  try { url = new URL(rawUrl); } catch { return false; }
  if (!ALLOWED_HOSTS.has(url.hostname) || url.protocol !== 'https:') return false;
  url.hash = '';
  const pathname = url.pathname.toLowerCase();
  if (pathname.startsWith('/pages/schematic-list/')) return true;
  if (/schematic/.test(pathname) && !/\.(pdf|jpg|jpeg|png|webp|svg)$/i.test(pathname)) return true;
  return seedPaths.some((prefix) => pathname.startsWith(prefix));
}

function endpointKey(meta) {
  const url = new URL(meta.url);
  return `${meta.method} ${url.origin}${url.pathname}`;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  await mkdir(options.outputDir, { recursive: true });

  const runId = `${new Date().toISOString().replace(/[:.]/g, '-')}-${process.pid}`;
  const runDir = path.join(options.outputDir, runId);
  await mkdir(runDir, { recursive: true });

  const browser = await chromium.launch({ headless: !options.headed });
  const context = await browser.newContext({
    userAgent: 'DrywallToolbox-SchematicResearch/1.0 (+public-data-audit)',
    locale: 'en-US',
    viewport: { width: 1440, height: 1200 },
    serviceWorkers: 'block',
  });

  const page = await context.newPage();
  page.setDefaultNavigationTimeout(options.timeoutMs);
  page.setDefaultTimeout(options.timeoutMs);

  const responseRecords = [];
  const candidateRecords = [];
  const endpointStats = new Map();
  const pendingResponses = new Set();
  let activePageUrl = null;

  page.on('response', (response) => {
    const task = (async () => {
      const request = response.request();
      const url = response.url();
      let parsed;
      try { parsed = new URL(url); } catch { return; }
      const contentType = response.headers()['content-type'] || '';
      if (!isTextualContentType(contentType)) return;

      let bodyBuffer;
      try { bodyBuffer = await response.body(); } catch { return; }
      if (!bodyBuffer || bodyBuffer.byteLength === 0 || bodyBuffer.byteLength > MAX_RESPONSE_BYTES) return;

      const bodyText = bodyBuffer.toString('utf8');
      const isJson = isJsonContentType(contentType) || /^[\s\uFEFF]*[\[{]/.test(bodyText);
      let parsedBody = null;
      let signalScore = 0;
      if (isJson) {
        try {
          parsedBody = JSON.parse(bodyText.replace(/^\uFEFF/, ''));
          signalScore = jsonSignalScore(parsedBody);
        } catch {
          parsedBody = null;
        }
      } else if (/hotspot|schematic|callout|part[_ -]?(?:id|number)|product[_ -]?id/i.test(bodyText)) {
        signalScore = 5;
      }

      // Keep all same-site JSON plus any cross-origin payload with schematic
      // signals. This captures Shopify/app-proxy/public app backends without
      // assuming a vendor-specific endpoint name.
      const sameSite = ALLOWED_HOSTS.has(parsed.hostname);
      if (!(sameSite && isJson) && signalScore < 4) return;

      const persisted = await persistResponseBody(
        runDir,
        { url },
        bodyText,
        parsedBody ? 'json' : 'txt',
      );
      const record = {
        capturedAt: isoNow(),
        pageUrl: activePageUrl,
        url,
        host: parsed.hostname,
        method: request.method(),
        resourceType: request.resourceType(),
        status: response.status(),
        contentType,
        requestFingerprint: requestFingerprint(request),
        requestHeaders: redactHeaders(request.headers()),
        postDataSha256: request.postData() ? sha256(request.postData()) : null,
        signalScore,
        ...persisted,
      };
      responseRecords.push(record);

      const key = endpointKey(record);
      const stat = endpointStats.get(key) || {
        endpoint: key,
        hosts: new Set(),
        urls: new Set(),
        methods: new Set(),
        captures: 0,
        maxSignalScore: 0,
        contentTypes: new Set(),
      };
      stat.hosts.add(record.host);
      stat.urls.add(record.url);
      stat.methods.add(record.method);
      stat.contentTypes.add(record.contentType);
      stat.captures += 1;
      stat.maxSignalScore = Math.max(stat.maxSignalScore, signalScore);
      endpointStats.set(key, stat);

      if (parsedBody && signalScore >= 4) {
        const source = {
          type: 'network_json',
          pageUrl: activePageUrl,
          responseUrl: url,
          responseSha256: persisted.sha256,
        };
        for (const candidate of walkCandidates(parsedBody, source)) {
          candidateRecords.push(normalizeCandidate(candidate));
        }
      }
    })().catch((error) => {
      process.stderr.write(`[response-capture] ${error.message}\n`);
    });

    pendingResponses.add(task);
    task.finally(() => pendingResponses.delete(task));
  });

  const seeds = options.brandUrls.map((value) => new URL(value));
  const seedPaths = seeds.map((url) => `${url.pathname.replace(/\/$/, '')}/`);
  const queue = [...options.brandUrls];
  const seen = new Set();
  const pages = [];

  try {
    while (queue.length > 0 && seen.size < options.maxPages) {
      const next = queue.shift();
      const current = assertAllowedUrl(next);
      if (seen.has(current)) continue;
      seen.add(current);
      activePageUrl = current;

      process.stdout.write(`[${seen.size}/${options.maxPages}] ${current}\n`);
      await sleep(REQUEST_DELAY_MS);

      let navStatus = null;
      let navError = null;
      try {
        const nav = await page.goto(current, { waitUntil: 'domcontentloaded' });
        navStatus = nav?.status() ?? null;
        await page.waitForLoadState('networkidle', { timeout: Math.min(options.timeoutMs, 15_000) }).catch(() => {});
        if (options.settleMs > 0) await page.waitForTimeout(options.settleMs);
      } catch (error) {
        navError = error.message;
      }

      const snapshot = await extractDomSnapshot(page).catch((error) => ({
        url: current,
        title: null,
        relevantElements: [],
        scripts: [],
        links: [],
        error: error.message,
      }));

      const pageRecord = {
        requestedUrl: current,
        finalUrl: snapshot.url || page.url(),
        title: snapshot.title,
        status: navStatus,
        error: navError,
        capturedAt: isoNow(),
        relevantElementCount: snapshot.relevantElements.length,
        linkCount: snapshot.links.length,
      };
      pages.push(pageRecord);

      const pageSlug = safeFilename(current);
      await atomicWriteJson(path.join(runDir, 'raw', 'pages', `${pageSlug}.json`), snapshot);

      // Embedded application/json payloads are often used by Shopify themes
      // and app blocks. Parse them independently of network interception.
      for (const script of snapshot.scripts) {
        const text = script.text?.trim();
        if (!text || !/^[\[{]/.test(text)) continue;
        try {
          const parsed = JSON.parse(text);
          const score = jsonSignalScore(parsed);
          if (score < 4) continue;
          const rawHash = sha256(text);
          for (const candidate of walkCandidates(parsed, {
            type: 'embedded_json',
            pageUrl: snapshot.url,
            scriptIndex: script.index,
            sourceSha256: rawHash,
          })) {
            candidateRecords.push(normalizeCandidate(candidate));
          }
        } catch {
          // Script text may be JavaScript rather than strict JSON; the DOM
          // snapshot remains available for manual/research inspection.
        }
      }

      // DOM candidates are evidence only. Bounding boxes use rendered viewport
      // coordinates and MUST NOT be promoted as diagram coordinates directly.
      for (const [index, element] of snapshot.relevantElements.entries()) {
        candidateRecords.push({
          kind: 'dom_candidate',
          source: { type: 'dom', pageUrl: snapshot.url, index },
          pointer: `$.relevantElements[${index}]`,
          raw: element,
        });
      }

      for (const link of snapshot.links) {
        if (!isCrawlableSchematicUrl(link.href, seedPaths)) continue;
        let normalized;
        try { normalized = assertAllowedUrl(link.href); } catch { continue; }
        if (!seen.has(normalized) && !queue.includes(normalized)) queue.push(normalized);
      }
    }

    await Promise.allSettled([...pendingResponses]);
  } finally {
    await context.close();
    await browser.close();
  }

  const endpoints = [...endpointStats.values()]
    .map((stat) => ({
      endpoint: stat.endpoint,
      hosts: [...stat.hosts].sort(),
      methods: [...stat.methods].sort(),
      captures: stat.captures,
      maxSignalScore: stat.maxSignalScore,
      contentTypes: [...stat.contentTypes].sort(),
      exampleUrls: [...stat.urls].slice(0, 10),
    }))
    .sort((a, b) => b.maxSignalScore - a.maxSignalScore || b.captures - a.captures || a.endpoint.localeCompare(b.endpoint));

  const uniqueCandidates = [];
  const candidateKeys = new Set();
  for (const candidate of candidateRecords) {
    const key = sha256(JSON.stringify({
      kind: candidate.kind,
      source: candidate.source,
      pointer: candidate.pointer,
      raw: candidate.raw,
    }));
    if (candidateKeys.has(key)) continue;
    candidateKeys.add(key);
    uniqueCandidates.push({ ...candidate, candidateSha256: key });
  }

  const manifest = {
    schemaVersion: '1.0',
    runId,
    generatedAt: isoNow(),
    source: 'https://eastcoastdrywall.com',
    seeds: options.brandUrls,
    safety: {
      allowedHosts: [...ALLOWED_HOSTS],
      maxPages: options.maxPages,
      maxResponseBytes: MAX_RESPONSE_BYTES,
      canonicalWrites: false,
      authenticationUsed: false,
    },
    counts: {
      pagesVisited: pages.length,
      responsesPersisted: responseRecords.length,
      endpointsObserved: endpoints.length,
      candidates: uniqueCandidates.length,
    },
    pages,
  };

  await atomicWriteJson(path.join(runDir, 'manifest.json'), manifest);
  await atomicWriteJson(path.join(runDir, 'endpoints.json'), endpoints);
  await atomicWriteJson(path.join(runDir, 'responses.json'), responseRecords);
  await atomicWriteJson(path.join(runDir, 'candidates.json'), uniqueCandidates);

  const highSignalEndpoints = endpoints.filter((endpoint) => endpoint.maxSignalScore >= 8);
  process.stdout.write(`\nRun complete: ${runDir}\n`);
  process.stdout.write(`Pages: ${pages.length}\n`);
  process.stdout.write(`Captured responses: ${responseRecords.length}\n`);
  process.stdout.write(`Candidate records: ${uniqueCandidates.length}\n`);
  process.stdout.write(`High-signal endpoints: ${highSignalEndpoints.length}\n`);
  for (const endpoint of highSignalEndpoints.slice(0, 20)) {
    process.stdout.write(`  score=${endpoint.maxSignalScore} captures=${endpoint.captures} ${endpoint.endpoint}\n`);
  }

  if (pages.length === 0) process.exitCode = 2;
}

main().catch((error) => {
  process.stderr.write(`ERROR: ${error.stack || error.message}\n`);
  process.exitCode = 1;
});
