import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { buildCartProductUrl } from '../src/utils/variationUrl.js';

const cartSheetSource = new URL('../src/components/storefront/StorefrontCartSheet.jsx', import.meta.url);

test('cart product routes use parent slug and retain selected variation', () => {
  assert.equal(buildCartProductUrl({ id: 921, slug: 'columbia-throttle-corner-flusher-box' }, 17700),
    '/products/columbia-throttle-corner-flusher-box?variant=17700');
  assert.equal(buildCartProductUrl({ id: 10, slug: 'simple-tool' }), '/products/simple-tool');
  assert.equal(buildCartProductUrl({ id: 921, slug: 'parent' }, 17701), '/products/parent?variant=17701');
});

test('cart URL builder refuses missing and child slugs instead of legacy numeric routes', () => {
  assert.equal(buildCartProductUrl({ id: 17700, slug: 'variation', parent_id: 921 }, 17700), null);
  assert.equal(buildCartProductUrl({ id: 921 }), null);
  assert.equal(buildCartProductUrl({ slug: 'bad/path' }, 17700), null);
  assert.equal(buildCartProductUrl({ slug: 'parent' }, -1), '/products/parent');
});

test('mini cart title navigates to canonical PDP without changing image quick view', async () => {
  const source = await readFile(cartSheetSource, 'utf8');
  assert.ok(source.includes('onClick={() => handleNavigateProduct(item)}'));
  assert.ok(source.includes('onClick={() => handleOpenProduct(item)}'));
  assert.ok(source.includes('getProduct(parentId || itemId)'));
  assert.ok(source.includes('buildCartProductUrl(parent, variationId)'));
  assert.ok(source.includes('role="alert"'));
  assert.ok(!source.includes('navigate(\`/product/'));
});
