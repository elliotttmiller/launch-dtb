import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { getCategoryMerchandising } from '../src/data/categoryMerchandising.js';
import {
  getStructuredIncludedItems,
  getToolSetContentsSummary,
} from '../src/utils/productMerchandising.js';

const repoRoot = new URL('../../', import.meta.url);

test('tool-set summary is derived only from structured includes metadata', () => {
  const product = {
    display_category: 'automatic-tool-sets',
    meta_data: [
      { key: '_includes_2_name', value: '12 in Finishing Box' },
      { key: '_includes_0_name', value: 'Automatic Taper' },
      { key: '_includes_0_sku', value: 'TAPER-1' },
      { key: '_includes_1_name', value: 'Loading Pump' },
      { key: '_includes_1_sku', value: 'PUMP-1' },
      { key: '_specs_0_label', value: 'Warranty' },
      { key: '_specs_0_value', value: '5 years' },
    ],
  };

  assert.deepEqual(getStructuredIncludedItems(product), [
    { name: 'Automatic Taper', sku: 'TAPER-1' },
    { name: 'Loading Pump', sku: 'PUMP-1' },
    { name: '12 in Finishing Box', sku: '' },
  ]);

  const summary = getToolSetContentsSummary(product, 2);
  assert.equal(summary.count, 3);
  assert.deepEqual(summary.visibleItems.map(({ name }) => name), ['Automatic Taper', 'Loading Pump']);
  assert.equal(summary.hiddenCount, 1);
});

test('tool-set summary never infers contents from description or product name', () => {
  const product = {
    display_category: 'automatic-tool-sets',
    name: 'Complete 13 Piece Automatic Tool Set',
    description: 'Includes a taper, pump, boxes, corner tools, and handles.',
    meta_data: [],
  };

  assert.deepEqual(getStructuredIncludedItems(product), []);
  assert.equal(getToolSetContentsSummary(product), null);
});

test('non-tool-set products do not expose a set summary even when includes metadata exists', () => {
  const product = {
    display_category: 'automatic-tapers',
    meta_data: [{ key: '_includes_0_name', value: 'Cleaning Brush' }],
  };

  assert.equal(getToolSetContentsSummary(product), null);
});

test('child category workflow context is informational and highlights one canonical work stage', () => {
  const taper = getCategoryMerchandising({ slug: 'automatic-tapers' });
  const pump = getCategoryMerchandising({ slug: 'pumps' });
  const boxes = getCategoryMerchandising({ slug: 'flat-boxes' });
  const corners = getCategoryMerchandising({ slug: 'angle-heads' });

  assert.equal(taper.workflow.currentStage, 'tape');
  assert.equal(pump.workflow.currentStage, 'load');
  assert.equal(boxes.workflow.currentStage, 'flats');
  assert.equal(corners.workflow.currentStage, 'corners');
  assert.deepEqual(
    taper.workflow.steps.map(({ id }) => id),
    ['load', 'tape', 'flats', 'corners'],
  );
  assert.ok(taper.workflow.steps.every((step) => !Object.hasOwn(step, 'targetSlug')));
});

test('compatibility-aware PDP merchandising reuses canonical product meta and bounded Woo fallback', async () => {
  const source = await readFile(
    new URL('drywalltoolbox/wp/wp-content/mu-plugins/dtb-catalog-platform/Rest/ProductDetailController.php', repoRoot),
    'utf8',
  );

  assert.match(source, /DTB_ProductMeta::COMPATIBLE_TOOL_SKUS/);
  assert.match(source, /DTB_ProductMeta::REPLACEMENT_PART_FOR/);
  assert.match(source, /in_array\( \$source_sku, \$declared_tool_skus, true \)/);
  assert.match(source, /wc_get_related_products/);
  assert.match(source, /RELATED_PRODUCT_LIMIT \* 4/);
  assert.doesNotMatch(source, /similarity|levenshtein|fuzzy/i);
});

test('product cards do not introduce per-card merchandising requests', async () => {
  const source = await readFile(
    new URL('frontend/src/components/storefront/StorefrontProductTile.jsx', repoRoot),
    'utf8',
  );

  assert.match(source, /getToolSetContentsSummary/);
  assert.doesNotMatch(source, /fetch\(|apiClient\(|axios\./);
});
