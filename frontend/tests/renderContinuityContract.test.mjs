import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('route loading is centralized and uses geometry-preserving pending surfaces', async () => {
  const [app, routeModules, pendingSurface] = await Promise.all([
    read('src/App.jsx'),
    read('src/routing/routeModules.js'),
    read('src/components/routing/RouteLoadingSurface.jsx'),
  ]);

  assert.match(app, /createLazyRoute\('productDetail'\)/);
  assert.match(app, /<RouteIntentPreloader \/>/);
  assert.match(app, /<RouteLoadingSurface pathname=\{location\.pathname\} \/>/);
  assert.doesNotMatch(app, /RouteChunkFallback/);
  assert.match(routeModules, /export function preloadRoute/);
  assert.match(routeModules, /modulePromises = new Map\(\)/);
  assert.match(pendingSurface, /dtb-route-pending--\$\{variant\}/);
});

test('route motion never hides the rendered page and async replacement stays compact', async () => {
  const [motion, tokens, loading, storefrontMotion] = await Promise.all([
    read('src/motion/dtbMotion.js'),
    read('src/styles/storefront-tokens.css'),
    read('src/styles/loading-transitions.css'),
    read('src/styles/storefront-motion.css'),
  ]);

  assert.match(motion, /routeVariants[\s\S]*initial:\s*\{[\s\S]*opacity:\s*1/);
  assert.match(motion, /async:\s*0\.22/);
  assert.match(tokens, /--dtb-motion-duration-async:\s*220ms/);
  assert.match(loading, /--dtb-loading-crossfade-duration:\s*var\(--dtb-motion-duration-async, 220ms\)/);
  assert.match(storefrontMotion, /--dtb-loading-crossfade-duration:\s*var\(--dtb-motion-duration-async\)/);
  assert.doesNotMatch(storefrontMotion, /dtb-card-loading-transition__content[\s\S]{0,160}duration-slow/);
});

test('remediated route roots do not replay opacity-zero page entrances', async () => {
  const [cart, repair, tracking] = await Promise.all([
    read('src/pages/Cart.jsx'),
    read('src/pages/RepairStatus.jsx'),
    read('src/pages/OrderTracking.jsx'),
  ]);

  assert.doesNotMatch(cart, /initial=\{\{ opacity: 0, y: 20 \}\}[\s\S]{0,120}dtb-cart-empty/);
  assert.doesNotMatch(cart, /initial=\{\{ opacity: 0, y: -8 \}\}[\s\S]{0,160}dtb-listing-heading/);
  assert.doesNotMatch(cart, /initial=\{\{ opacity: 0, y: 20 \}\}[\s\S]{0,180}dtb-cart-sheet/);
  assert.doesNotMatch(repair, /initial=\{\{ opacity: 0 \}\}[\s\S]{0,180}dtb-container dtb-container--narrow/);
  assert.doesNotMatch(tracking, /initial=\{\{ opacity: 0, y: 12 \}\}[\s\S]{0,180}dtb-order-tracking-shell/);
});
