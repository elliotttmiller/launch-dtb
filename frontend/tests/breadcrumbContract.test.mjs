import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('shared breadcrumb supports accessible removable active filters', () => {
  const source = read('src/components/shared/Breadcrumb.jsx');
  assert.match(source, /activeFilters = \[\]/);
  assert.match(source, /aria-label="Active filters"/);
  assert.match(source, /Remove filter:/);
  assert.match(source, /onRemoveFilter\(filter\)/);
});

test('shared breadcrumb uses an encoding-safe separator and owns the compact variant', () => {
  const styles = read('src/styles/breadcrumb.css');
  assert.ok(styles.includes('content: "\\203A";'));
  assert.match(styles, /\.dtb-breadcrumb-bar--compact/);
  assert.doesNotMatch(styles, /content: "›"/);
});

test('catalog surfaces wire filter state into breadcrumb chips', () => {
  const catalog = read('src/pages/ProductsCatalogPlatform.jsx');
  const products = read('src/pages/Products.jsx');
  const parts = read('src/pages/Parts.jsx');

  assert.match(catalog, /activeBreadcrumbFilters/);
  assert.match(catalog, /onRemoveFilter=\{removeBreadcrumbFilter\}/);
  assert.match(products, /activeFilters=\{activeFilters\}/);
  assert.match(parts, /activeFilters=\{activeFilters\}/);
  assert.match(products, /className="dtb-breadcrumb-bar--compact"/);
  assert.match(parts, /className="dtb-breadcrumb-bar--compact"/);
});

test('all constrained storefront heroes use the shared compact breadcrumb variant', () => {
  const categoryHero = read('src/components/catalog/CategoryHero.jsx');
  const brands = read('src/components/catalog/ProductsBrandSelector.jsx');
  assert.match(categoryHero, /className="dtb-breadcrumb-bar--compact"/);
  assert.match(brands, /className="dtb-breadcrumb-bar--compact"/);
});

test('toolset builder uses the shared breadcrumb primitive', () => {
  const source = read('src/features/toolset-builder/ToolsetBuilderWorkspace.jsx');
  assert.match(source, /components\/shared\/Breadcrumb\.jsx/);
  assert.doesNotMatch(source, /<nav className="dtb-toolset-breadcrumb"/);
});
