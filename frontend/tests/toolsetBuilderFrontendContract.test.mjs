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

test('toolset builder remains lazy-routed while temporarily absent from storefront navigation', async () => {
  const [app, routes, header] = await Promise.all([
    read('src/App.jsx'),
    read('src/routing/routeModules.js'),
    read('src/components/storefront/StorefrontHeader.jsx'),
  ]);

  assert.match(routes, /toolsetBuilder:\s*\(\) => import\('\.\.\/pages\/ToolsetBuilder\.jsx'\)/);
  assert.match(routes, /pathname === '\/toolset-builder'\) return 'toolsetBuilder'/);
  assert.match(app, /const ToolsetBuilder = createLazyRoute\('toolsetBuilder'\)/);
  assert.match(app, /<Route path="\/toolset-builder" element={<ToolsetBuilder \/>} \/>/);
  assert.doesNotMatch(header, /to: '\/toolset-builder', label: 'Toolset Builder'/);
  assert.doesNotMatch(header, /id: 'toolset-builder'[\s\S]*landingTo: '\/toolset-builder'/);
});

test('toolset builder reads canonical catalog data and does not call legacy toolset templates', async () => {
  const api = await read('src/api/toolsetBuilderApi.js');

  assert.match(api, /fetchCatalogProducts/);
  assert.match(api, /toolFamily/);
  assert.match(api, /productKind:\s*'tool'/);
  assert.match(api, /displayCategory:\s*displayCategory \? \[displayCategory\] : \[\]/);
  assert.match(api, /isParts:\s*0/);
  assert.doesNotMatch(api, /\/toolsets(?:\/|')/);
  assert.doesNotMatch(api, /addToCart|storeAddToCart|CartContext/);
});

test('frontend workflow model contains no pricing, discount, shipping, or cart authority', async () => {
  const model = await read('src/features/toolset-builder/model.js');

  assert.match(model, /TOOLSET_WORKFLOWS/);
  assert.match(model, /toolFamily:\s*'automatic_taper'/);
  assert.match(model, /toolFamily:\s*'handle'/);
  assert.match(model, /toolFamily:\s*'angle_head'/);
  assert.match(model, /toolFamily:\s*'corner_roller'/);
  assert.match(model, /displayCategory:\s*'automatic_angle_boxes_corner_applicators'/);
  assert.doesNotMatch(model, /flat_box_handle|angle_head_handle|corner_roller_handle/);
  assert.match(model, /minimum:\s*1, maximum:\s*3/);
  assert.doesNotMatch(model, /savingsLabel\s*:|discount(?:Rate|Label)?\s*:|shipping\s*:|price\s*:/i);
});

test('workspace preserves server validation boundary and final cart mutation remains disabled', async () => {
  const workspace = await read('src/features/toolset-builder/ToolsetBuilderWorkspace.jsx');

  assert.match(workspace, /Price and availability are confirmed before purchase/);
  assert.match(workspace, /We’ll confirm your complete set before it is added to cart/);
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
