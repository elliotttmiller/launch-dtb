import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  buildCategoryPageUrl,
  canonicalCatalogCategorySlug,
  flattenCatalogNavigationGroups,
  normalizeCatalogNavigationGroups,
} from '../src/utils/catalogFacets.js';
import {
  getCategoryMerchandising,
  resolveIntentTarget,
} from '../src/data/categoryMerchandising.js';

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

test('All Products flattens navigation roots into the same populated tool-type entries', async () => {
  const { root, children } = await canonicalPopulatedChildren();
  const entries = flattenCatalogNavigationGroups([{
    key: root.key,
    label: root.label,
    slug: root.slug,
    children,
  }]);

  assert.deepEqual(entries.map(({ slug }) => slug), children.map(({ slug }) => slug));
  assert.ok(!entries.some(({ slug }) => slug === root.slug));
});

test('StorefrontHeader has no parallel hardcoded desktop category authority', async () => {
  const source = await readFile(new URL('frontend/src/components/storefront/StorefrontHeader.jsx', repoRoot), 'utf8');
  assert.doesNotMatch(source, /CURATED_DESKTOP_PRODUCT_TAXONOMY/);
  assert.match(source, /items:\s*desktopProductNavigation/);
  assert.match(source, /normalizeCatalogNavigationGroups\(facets\?\.navigationGroups\)/);
});

test('tool-set merchandising aliases resolve to one bounded presentation profile', () => {
  const canonical = getCategoryMerchandising({ slug: 'automatic-tool-sets' });
  const alias = getCategoryMerchandising({ slug: 'toolsets' });
  const displayAlias = getCategoryMerchandising({ key: 'tool_sets_and_kits' });

  assert.ok(canonical);
  assert.strictEqual(alias, canonical);
  assert.strictEqual(displayAlias, canonical);
  assert.ok(canonical.intents.every((intent) => !Object.hasOwn(intent, 'filterHint')));
});

test('contractor intent only resolves against authoritative category children', () => {
  const intent = {
    label: 'Tape',
    targetSlugs: ['automatic-tapers', 'automatic-taping-tools'],
  };
  const children = [
    { key: 'pumps', slug: 'pumps', label: 'Pumps' },
    { key: 'automatic_tapers', slug: 'automatic-tapers', label: 'Automatic Tapers' },
  ];

  assert.strictEqual(resolveIntentTarget(intent, children), children[1]);
  assert.equal(resolveIntentTarget(intent, [{ key: 'automatic_tapers', slug: 'tapers' }]), null);
  assert.equal(resolveIntentTarget(intent, []), null);
});

test('informational merchandising intents do not synthesize catalog targets', () => {
  const toolSets = getCategoryMerchandising({ slug: 'automatic-tool-sets' });
  assert.ok(toolSets);
  assert.ok(toolSets.intents.length > 0);
  assert.ok(toolSets.intents.every((intent) => resolveIntentTarget(intent, []) === null));
});
