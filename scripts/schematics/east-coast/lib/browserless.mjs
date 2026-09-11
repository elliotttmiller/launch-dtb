import { chromium } from 'playwright-core';
import { cleanText } from './io.mjs';

const DEFAULT_ENDPOINT = 'wss://production-sfo.browserless.io';

export function browserlessOptionsFromEnv() {
  return {
    endpoint: process.env.BROWSERLESS_WS_ENDPOINT || DEFAULT_ENDPOINT,
    proxy: cleanText(process.env.BROWSERLESS_PROXY || 'residential').toLowerCase(),
    proxyCountry: cleanText(process.env.BROWSERLESS_PROXY_COUNTRY || 'us').toLowerCase(),
    proxySticky: parseEnvBool('BROWSERLESS_PROXY_STICKY', true),
    stealth: parseEnvBool('BROWSERLESS_STEALTH', false),
    sessionTimeoutMs: Number.parseInt(process.env.BROWSERLESS_SESSION_TIMEOUT_MS || '', 10) || 120_000,
  };
}

function parseEnvBool(name, fallback) {
  const value = process.env[name];
  if (value == null || value === '') return fallback;
  return parseBoolean(value, name);
}

export function parseBoolean(value, label) {
  const normalized = String(value ?? '').trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  throw new Error(`${label} must be true or false.`);
}

export function validateBrowserlessOptions(options) {
  if (!['none', 'datacenter', 'residential'].includes(options.proxy)) {
    throw new Error('Browserless proxy must be one of: none, datacenter, residential.');
  }
  if (!/^[a-z]{2}$/i.test(options.proxyCountry)) {
    throw new Error('Browserless proxy country must be a two-letter country code.');
  }
  if (!Number.isInteger(options.sessionTimeoutMs) || options.sessionTimeoutMs < 60_000) {
    throw new Error('Browserless session timeout must be at least 60000ms.');
  }
}

export function buildBrowserlessUrl(options) {
  validateBrowserlessOptions(options);
  const token = cleanText(process.env.BROWSERLESS_TOKEN);
  if (!token) {
    throw new Error('BROWSERLESS_TOKEN is required. Store it in the environment; never commit it to Git.');
  }
  const url = new URL(options.endpoint);
  if (!['ws:', 'wss:'].includes(url.protocol)) {
    throw new Error('BROWSERLESS_WS_ENDPOINT must use ws:// or wss://.');
  }
  if (options.stealth && (url.pathname === '/' || url.pathname === '')) url.pathname = '/stealth';
  url.searchParams.set('token', token);
  url.searchParams.set('timeout', String(options.sessionTimeoutMs));
  url.searchParams.set('blockAds', 'true');
  if (options.proxy !== 'none') {
    url.searchParams.set('proxy', options.proxy);
    url.searchParams.set('proxyCountry', options.proxyCountry);
    url.searchParams.set('proxySticky', String(options.proxySticky));
    url.searchParams.set('proxyLocaleMatch', 'true');
  }
  return url.toString();
}

function redactConnectionError(error) {
  const token = cleanText(process.env.BROWSERLESS_TOKEN);
  let message = String(error?.message || error || 'unknown Browserless connection error');
  if (token) message = message.split(token).join('[REDACTED]');
  message = message.replace(/([?&]token=)[^&\s)]+/gi, '$1[REDACTED]');
  return new Error(`Browserless connection failed: ${message}`);
}

export async function openBrowserlessSession(options, timeoutMs) {
  let browser;
  try {
    browser = await chromium.connectOverCDP(buildBrowserlessUrl(options), { timeout: timeoutMs });
  } catch (error) {
    throw redactConnectionError(error);
  }
  const contexts = browser.contexts();
  if (!contexts.length) {
    await browser.close().catch(() => {});
    throw new Error('Browserless connected without its default browser context.');
  }
  const context = contexts[0];
  const page = context.pages()[0] || await context.newPage();
  page.setDefaultNavigationTimeout(timeoutMs);
  page.setDefaultTimeout(timeoutMs);
  return { browser, context, page };
}

export async function closeBrowserlessSession(session) {
  if (!session) return;
  await session.browser.close().catch(() => {});
}

export function publicBrowserlessManifest(options) {
  return {
    provider: 'browserless',
    endpointHost: new URL(options.endpoint).host,
    protocol: 'playwright-cdp',
    proxy: options.proxy,
    proxyCountry: options.proxy === 'none' ? null : options.proxyCountry,
    proxySticky: options.proxy === 'none' ? null : options.proxySticky,
    stealth: options.stealth,
    credentialsPersisted: false,
  };
}
