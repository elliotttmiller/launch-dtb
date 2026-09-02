import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  buildCategoryPageUrl,
  canonicalCatalogCategorySlug,
  normalizeCatalogNavigationGroups,
} from '../src/utils/catalogFacets.js';

const repoRoot = new URL('../../', import.meta.url);

async function canonicalPopulatedChildren() {
  const taxonomy = JSON.parse(await readFile(new URL('products/catalog/source/taxonomy.json', repoRoot), 'utf8'));
  const assignmentCsv = await readFile(new URL('products/catalog/source/product_categories.csv', repoRoot), 'utf8');
  const assignedKeys = new Set(
    assignmentCsv
      .replace(/^\uFEFF/, '')
      .split(/\r?\n/)
      .slice(1)
      .filter(Boolean)
      .map((line) => line.split(',')[1]),
  );
  const root = taxonomy.taxa.find((taxon) => taxon.key === 'taping_finishing_tools');
  const children = taxonomy.taxa
    .filter((taxon) => taxon.parent_key === root.key && (taxon.publish_when_empty || assignedKeys.has(taxon.key)))
    .sort((left, right) => left.sort - right.sort)
    .map((taxon) => ({
      key: taxon.key,
      label: taxon.label,
      slug: taxon.slug,
      sort: taxon.sort,
      productCount: 1,
    }));
  return { root, children };
}

test('desktop navigation normalization preserves canonical populated order and destinations', async () => {
  const { root, children } = await canonicalPopulatedChildren();
  const groups = normalizeCatalogNavigationGroups([{
    key: root.key,
    label: root.label,
    slug: root.slug,
    sort: root.sort,
    children,
  }]);

  assert.equal(groups.length, 1);
  assert.deepEqual(groups[0].children.map(({ slug }) => slug), children.map(({ slug }) => slug));
  assert.deepEqual(
    groups[0].children.map(({ slug }) => buildCategoryPageUrl(slug)),
    children.map(({ slug }) => `/category/${slug}`),
  );
});

test('legacy aliases and repeated backend rows cannot create duplicate desktop destinations', () => {
  const rawChildren = [
    { label: 'Tool Sets & Kits', slug: 'tool-sets-kits', productCount: 15 },
    { label: 'Legacy Tool Sets', slug: 'automatic-tool-sets', productCount: 15 },
    { label: 'Corner Finishers', slug: 'corner-finishers', productCount: 4 },
    { label: 'Legacy Angle Heads', slug: 'angle-heads', productCount: 4 },
  ];
  const [group] = normalizeCatalogNavigationGroups([{
    label: 'Taping & Finishing Tools',
    slug: 'taping-finishing-tools',
    children: rawChildren,
  }]);
  const destinations = group.children.map(({ slug }) => buildCategoryPageUrl(slug));

  assert.deepEqual(destinations, ['/category/tool-sets-kits', '/category/corner-finishers']);
  assert.equal(new Set(destinations).size, destinations.length);
  assert.deepEqual(
    group.children.map(({ slug }) => slug),
    [...new Set(rawChildren.map(({ slug }) => canonicalCatalogCategorySlug(slug)))],
  );
});

test('StorefrontHeader has no parallel hardcoded desktop category authority', async () => {
  const source = await readFile(new URL('frontend/src/components/storefront/StorefrontHeader.jsx', repoRoot), 'utf8');
  assert.doesNotMatch(source, /CURATED_DESKTOP_PRODUCT_TAXONOMY/);
  assert.match(source, /items:\s*desktopProductNavigation/);
  assert.match(source, /normalizeCatalogNavigationGroups\(facets\?\.navigationGroups\)/);
});
