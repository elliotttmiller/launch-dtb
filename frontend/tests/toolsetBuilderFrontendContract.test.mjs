import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

async function read(relativePath) {
  return readFile(path.join(root, relativePath), 'utf8');
}

test('toolset builder is lazy-routed and exposed through storefront navigation', async () => {
  const [app, routes, header] = await Promise.all([
    read('src/App.jsx'),
    read('src/routing/routeModules.js'),
    read('src/components/storefront/StorefrontHeader.jsx'),
  ]);

  assert.match(routes, /toolsetBuilder:\s*\(\) => import\('\.\.\/pages\/ToolsetBuilder\.jsx'\)/);
  assert.match(routes, /pathname === '\/toolset-builder'\) return 'toolsetBuilder'/);
  assert.match(app, /const ToolsetBuilder = createLazyRoute\('toolsetBuilder'\)/);
  assert.match(app, /<Route path="\/toolset-builder" element={<ToolsetBuilder \/>} \/>/);
  assert.match(header, /to: '\/toolset-builder', label: 'Toolset Builder'/);
  assert.match(header, /id: 'toolset-builder'[\s\S]*landingTo: '\/toolset-builder'/);
});

test('toolset builder reads canonical catalog data and does not call legacy toolset templates', async () => {
  const api = await read('src/api/toolsetBuilderApi.js');

  assert.match(api, /fetchCatalogProducts/);
  assert.match(api, /toolFamily/);
  assert.match(api, /isParts:\s*0/);
  assert.doesNotMatch(api, /\/toolsets(?:\/|')/);
  assert.doesNotMatch(api, /addToCart|storeAddToCart|CartContext/);
});

test('frontend workflow model contains no pricing, discount, shipping, or cart authority', async () => {
  const model = await read('src/features/toolset-builder/model.js');

  assert.match(model, /TOOLSET_WORKFLOWS/);
  assert.match(model, /toolFamily:\s*'automatic_taper'/);
  assert.match(model, /minimum:\s*1, maximum:\s*2/);
  assert.doesNotMatch(model, /savingsLabel\s*:|discount(?:Rate|Label)?\s*:|shipping\s*:|price\s*:/i);
});

test('workspace preserves server validation boundary and final cart mutation remains disabled', async () => {
  const workspace = await read('src/features/toolset-builder/ToolsetBuilderWorkspace.jsx');

  assert.match(workspace, /Final price, availability, compatibility, shipping, and tax are confirmed by the server and WooCommerce before purchase/);
  assert.match(workspace, /The production cart action will be enabled only after the backend validates the complete set/);
  assert.match(workspace, /<button type="button" className="dtb-toolset-primary-action" disabled>[\s\S]*Add set to cart/);
  assert.doesNotMatch(workspace, /useCart|addToCart|storeAddToCart/);
});

test('builder product cards load exact variations on demand', async () => {
  const productCard = await read('src/features/toolset-builder/ToolsetBuilderProductCard.jsx');

  assert.match(productCard, /fetchToolsetVariations/);
  assert.match(productCard, /normalizeToolsetSelection/);
  assert.match(productCard, /Select configuration/);
  assert.match(productCard, /variationId/);
});

test('builder styling replaces the legacy tsb prototype and includes responsive and reduced-motion behavior', async () => {
  const styles = await read('src/styles/toolset-builder.css');

  assert.doesNotMatch(styles, /\.tsb-/);
  assert.match(styles, /\.dtb-toolset-workspace/);
  assert.match(styles, /@media \(max-width: 47\.99rem\)/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.doesNotMatch(styles, /:root\s*\{/);
});
