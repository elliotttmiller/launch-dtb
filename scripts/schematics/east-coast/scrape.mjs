#!/usr/bin/env node

/**
 * Browserless-backed East Coast Drywall schematic scraper.
 *
 * One operator command. Internally modular, read-only, deterministic, and
 * fail-closed for incomplete product resolution or structural schematic errors.
 */

import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import {
  browserlessOptionsFromEnv,
  parseBoolean,
  publicBrowserlessManifest,
  validateBrowserlessOptions,
} from './lib/browserless.mjs';
import { atomicWriteJson, cleanText, nowIso } from './lib/io.mjs';
import { classifyProductCounts, joinOccurrences, resolveProductsGlobally } from './lib/products.mjs';
import { ALLOWED_HOSTS, assertAllowedUrl, discoverAndExtract } from './lib/source.mjs';
import { validateSchematic } from './lib/validation.mjs';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_OUTPUT_DIR = path.join(SCRIPT_DIR, 'output');
const DEFAULT_CACHE_DIR = path.join(SCRIPT_DIR, '.cache', 'products');
const DEFAULT_SEEDS = [
  'https://eastcoastdrywall.com/pages/schematic-list/tape-tech',
  'https://eastcoastdrywall.com/pages/schematic-list/columbia',
];
const MAX_PAGES = 250;

function boundedInt(value, min, max, flag) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new Error(`${flag} must be an integer between ${min} and ${max}.`);
  }
  return parsed;
}

function parseArgs(argv) {
  const browserless = browserlessOptionsFromEnv();
  const options = {
    seeds: [],
    directUrls: [],
    outputDir: DEFAULT_OUTPUT_DIR,
    cacheDir: DEFAULT_CACHE_DIR,
    timeoutMs: 45_000,
    settleMs: 1_200,
    navDelayMs: 500,
    productDelayMs: 450,
    productRetries: 4,
    productBatchSize: 75,
    pageBatchSize: 8,
    maxPages: MAX_PAGES,
    failOnIncomplete: false,
    refreshProducts: false,
    browserless,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--brand-url') options.seeds.push(assertAllowedUrl(argv[++i]).toString());
    else if (arg === '--url') options.directUrls.push(assertAllowedUrl(argv[++i]).toString());
    else if (arg === '--out') options.outputDir = path.resolve(argv[++i]);
    else if (arg === '--cache-dir') options.cacheDir = path.resolve(argv[++i]);
    else if (arg === '--timeout-ms') options.timeoutMs = boundedInt(argv[++i], 1_000, 120_000, arg);
    else if (arg === '--session-timeout-ms') options.browserless.sessionTimeoutMs = boundedInt(argv[++i], 60_000, 60 * 60 * 1_000, arg);
    else if (arg === '--settle-ms') options.settleMs = boundedInt(argv[++i], 0, 30_000, arg);
    else if (arg === '--nav-delay-ms') options.navDelayMs = boundedInt(argv[++i], 0, 10_000, arg);
    else if (arg === '--product-delay-ms') options.productDelayMs = boundedInt(argv[++i], 100, 10_000, arg);
    else if (arg === '--product-retries') options.productRetries = boundedInt(argv[++i], 0, 8, arg);
    else if (arg === '--product-batch-size') options.productBatchSize = boundedInt(argv[++i], 10, 250, arg);
    else if (arg === '--page-batch-size') options.pageBatchSize = boundedInt(argv[++i], 1, 50, arg);
    else if (arg === '--max-pages') options.maxPages = boundedInt(argv[++i], 1, MAX_PAGES, arg);
    else if (arg === '--proxy') options.browserless.proxy = cleanText(argv[++i]).toLowerCase();
    else if (arg === '--proxy-country') options.browserless.proxyCountry = cleanText(argv[++i]).toLowerCase();
    else if (arg === '--proxy-sticky') options.browserless.proxySticky = parseBoolean(argv[++i], arg);
    else if (arg === '--stealth') options.browserless.stealth = true;
    else if (arg === '--refresh-products') options.refreshProducts = true;
    else if (arg === '--fail-on-incomplete') options.failOnIncomplete = true;
    else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    } else throw new Error(`Unknown argument: ${arg}`);
  }

  if (!options.seeds.length && !options.directUrls.length) options.seeds = [...DEFAULT_SEEDS];
  validateBrowserlessOptions(options.browserless);
  return options;
}

function printHelp() {
  process.stdout.write(`\nBrowserless East Coast schematic scraper\n\n`);
  process.stdout.write('Required environment:\n  BROWSERLESS_TOKEN                 Browserless API token\n\n');
  process.stdout.write('Optional environment:\n');
  process.stdout.write('  BROWSERLESS_WS_ENDPOINT           Default wss://production-sfo.browserless.io\n');
  process.stdout.write('  BROWSERLESS_PROXY                 none|datacenter|residential\n');
  process.stdout.write('  BROWSERLESS_PROXY_COUNTRY         Default us\n');
  process.stdout.write('  BROWSERLESS_PROXY_STICKY          true|false\n');
  process.stdout.write('  BROWSERLESS_STEALTH               true|false\n');
  process.stdout.write('  BROWSERLESS_SESSION_TIMEOUT_MS     Default 120000\n\n');
  process.stdout.write('Usage: npm run scrape -- [options]\n\n');
  process.stdout.write('  --brand-url URL          Seed schematic-list URL; repeatable\n');
  process.stdout.write('  --url URL                Direct schematic URL; repeatable\n');
  process.stdout.write('  --out DIR                Output root\n');
  process.stdout.write('  --cache-dir DIR          Product cache root\n');
  process.stdout.write('  --timeout-ms N           Page/CDP connection timeout\n');
  process.stdout.write('  --session-timeout-ms N   Browserless session maximum\n');
  process.stdout.write('  --settle-ms N            Post-load settle delay\n');
  process.stdout.write('  --nav-delay-ms N         Delay between schematic navigations\n');
  process.stdout.write('  --product-delay-ms N     Minimum product request spacing\n');
  process.stdout.write('  --product-retries N      Retries for 429/5xx/network errors\n');
  process.stdout.write('  --product-batch-size N   Product handles per Browserless session\n');
  process.stdout.write('  --page-batch-size N      Page navigations per Browserless session\n');
  process.stdout.write('  --proxy TYPE             none|datacenter|residential\n');
  process.stdout.write('  --proxy-country CC       Proxy country\n');
  process.stdout.write('  --proxy-sticky BOOL      Sticky proxy within each session\n');
  process.stdout.write('  --stealth                Browserless stealth endpoint\n');
  process.stdout.write('  --refresh-products       Ignore product cache\n');
  process.stdout.write(`  --max-pages N            Crawl bound, max ${MAX_PAGES}\n`);
  process.stdout.write('  --fail-on-incomplete     Exit non-zero for INCOMPLETE or FAIL\n');
}

function buildInvalidHandles(rawSchematics) {
  return [...new Map(
    rawSchematics
      .flatMap((record) => record.occurrences)
      .filter((occurrence) => occurrence.productHandle && !occurrence.sourceIdentity.handleValid)
      .map((occurrence) => [occurrence.productHandle, {
        handle: occurrence.productHandle,
        callout: occurrence.callout,
        reason: occurrence.sourceIdentity.handleRejectReason,
      }]),
  ).values()].sort((a, b) => a.handle.localeCompare(b.handle));
}

function buildValidHandles(rawSchematics) {
  return [...new Set(
    rawSchematics
      .flatMap((record) => record.occurrences)
      .filter((occurrence) => occurrence.sourceIdentity.handleValid)
      .map((occurrence) => occurrence.productHandle),
  )].sort((a, b) => a.localeCompare(b));
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  await mkdir(options.outputDir, { recursive: true });
  await mkdir(options.cacheDir, { recursive: true });
  const runId = `${nowIso().replace(/[:.]/g, '-')}-${process.pid}`;
  const runDir = path.join(options.outputDir, runId);
  await mkdir(runDir, { recursive: true });

  process.stdout.write('Browserless transport: enabled\n');
  process.stdout.write(`Proxy: ${options.browserless.proxy}${options.browserless.proxy !== 'none' ? ` (${options.browserless.proxyCountry}, sticky=${options.browserless.proxySticky})` : ''}\n`);

  const extraction = await discoverAndExtract(options, runDir);
  const validHandles = buildValidHandles(extraction.rawSchematics);
  const invalidHandles = buildInvalidHandles(extraction.rawSchematics);
  process.stdout.write(`Valid unique product handles: ${validHandles.length}\n`);
  process.stdout.write(`Rejected annotation/malformed handles: ${invalidHandles.length}\n`);

  const productMap = await resolveProductsGlobally(validHandles, options, runDir);
  const schematics = extraction.rawSchematics.map((record) => {
    const joined = { ...record, occurrences: joinOccurrences(record.occurrences, productMap) };
    joined.validation = validateSchematic(joined);
    return joined;
  });
  const products = [...productMap.values()].sort((a, b) => a.handle.localeCompare(b.handle));
  const validation = schematics.map((record) => ({ sourceUrl: record.sourceUrl, title: record.title, ...record.validation }));
  const failed = validation.filter((item) => item.status === 'FAIL');
  const incomplete = validation.filter((item) => item.status === 'INCOMPLETE');
  const warned = validation.filter((item) => item.status === 'PASS_WITH_WARNINGS');
  const productCounts = classifyProductCounts(products);

  let overallStatus = 'PASS';
  if (failed.length || extraction.failures.some((item) => item.stage === 'coverage')) overallStatus = 'FAIL';
  else if (incomplete.length || productCounts.productsRateLimited || productCounts.productsRetryExhausted) overallStatus = 'INCOMPLETE';
  else if (warned.length || productCounts.productsNotPublished || invalidHandles.length) overallStatus = 'PASS_WITH_WARNINGS';

  const manifest = {
    schemaVersion: '3.0',
    runId,
    generatedAt: nowIso(),
    source: 'https://eastcoastdrywall.com',
    transport: publicBrowserlessManifest(options.browserless),
    seeds: options.seeds,
    directUrls: options.directUrls,
    safety: {
      allowedHosts: [...ALLOWED_HOSTS],
      maxPages: options.maxPages,
      canonicalWrites: false,
      eastCoastAuthenticationUsed: false,
      outputIgnoredByGit: true,
      transientFailuresCached: false,
    },
    counts: {
      pagesVisited: extraction.seen.size,
      schematicsDiscovered: extraction.schematicUrls.size,
      schematicsExtracted: schematics.length,
      validProductHandles: validHandles.length,
      invalidOrAnnotationHandles: invalidHandles.length,
      ...productCounts,
      failures: extraction.failures.length,
      validationFailures: failed.length,
      validationIncomplete: incomplete.length,
      validationWarnings: warned.length,
    },
    overallStatus,
  };

  await Promise.all([
    atomicWriteJson(path.join(runDir, 'manifest.json'), manifest),
    atomicWriteJson(path.join(runDir, 'schematics.json'), schematics),
    atomicWriteJson(path.join(runDir, 'products.json'), products),
    atomicWriteJson(path.join(runDir, 'validation.json'), validation),
    atomicWriteJson(path.join(runDir, 'failures.json'), extraction.failures),
    atomicWriteJson(path.join(runDir, 'diagnostics.json'), extraction.diagnostics),
    atomicWriteJson(path.join(runDir, 'rejected-handles.json'), invalidHandles),
  ]);

  process.stdout.write(`\nRun complete: ${runDir}\n`);
  process.stdout.write(`Schematics: ${schematics.length}/${extraction.schematicUrls.size}\n`);
  process.stdout.write(`Products: ${productCounts.productsResolved}/${products.length} resolved; ${productCounts.productsNotPublished} not published\n`);
  process.stdout.write(`Status: ${overallStatus}\n`);

  if (options.failOnIncomplete && ['INCOMPLETE', 'FAIL'].includes(overallStatus)) process.exitCode = 2;
}

main().catch((error) => {
  process.stderr.write(`ERROR: ${error.stack || error.message}\n`);
  process.exitCode = 1;
});
