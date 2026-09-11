import assert from 'node:assert/strict';
import test from 'node:test';

import { sourceIdentityEvidence } from '../lib/products.mjs';
import { normalizeOccurrence, validateProductHandle } from '../lib/source.mjs';
import { validateSchematic } from '../lib/validation.mjs';

test('source handle validation accepts real East Coast part handles', () => {
  assert.deepEqual(validateProductHandle('TT-219080'), {
    valid: true,
    reason: null,
    sourcePartNumber: '219080',
  });
  assert.equal(validateProductHandle('COL-AH7-2.5').valid, true);
  assert.equal(validateProductHandle('DM-T-163').valid, true);
  assert.equal(validateProductHandle('COL-13').valid, true);
});

test('source handle validation rejects annotations and malformed encoded text', () => {
  assert.equal(validateProductHandle('TT-Updated').valid, false);
  assert.equal(validateProductHandle('DM-Parts').valid, false);
  assert.equal(validateProductHandle('COL-2%22%26').valid, false);
});

test('source rectangle geometry is converted to center-based normalized geometry', () => {
  const occurrence = normalizeOccurrence({
    occurrenceIndex: 0,
    page: 1,
    callout: '219080',
    productHandle: 'TT-219080',
    href: 'https://eastcoastdrywall.com/products/TT-219080',
    tag: 'A',
    attrs: {
      style: 'position:absolute;left:28.96%;top:27.90%;width:3.26%;height:2.07%',
    },
    overlayAttrs: {},
    nodeRect: null,
    overlayRect: null,
  });

  assert.equal(occurrence.sourcePartNumber, '219080');
  assert.equal(occurrence.sourceGeometry.anchorSemantics, 'top_left_rectangle');
  assert.equal(occurrence.normalizedGeometry.xPct, 30.59);
  assert.equal(occurrence.normalizedGeometry.yPct, 28.935);
});

test('source identity does not require variant SKU equality when handle and title confirm the part', () => {
  const evidence = sourceIdentityEvidence('219080', 'TT-219080', {
    title: '[219080] TapeTech 6-32 x 5/8 FILLISTER HEAD SST SCREW',
    variants: [{ id: 1, sku: 'INTERNAL-001', title: 'Default Title' }],
  });

  assert.equal(evidence.status, 'handle_and_title_confirmed');
  assert.equal(evidence.handleConfirmed, true);
  assert.equal(evidence.titleConfirmed, true);
  assert.deepEqual(evidence.variantSkuMatches, []);
});

test('brand-prefixed commerce SKU can independently confirm a manufacturer identifier', () => {
  const evidence = sourceIdentityEvidence('CFB1A', 'COL-CFB1A', {
    title: 'Columbia Hinge Seal',
    variants: [{ id: 2, sku: 'COL-CFB1A', title: 'Default Title' }],
  });

  assert.equal(evidence.status, 'variant_confirmed');
  assert.equal(evidence.handleConfirmed, true);
  assert.equal(evidence.variantSkuMatches.length, 1);
});

test('transient product resolution marks a structurally valid schematic incomplete', () => {
  const result = validateSchematic({
    declaredPageCount: 1,
    pages: [{ page: 1 }],
    occurrences: [{
      occurrenceIndex: 0,
      callout: 'FA245',
      productHandle: 'COL-FA245',
      sourcePartNumber: 'FA245',
      sourceIdentity: { handleValid: true },
      normalizedGeometry: { xPct: 50, yPct: 50, widthPct: 2, heightPct: 2 },
      productResolution: {
        status: 'source_product_resolution_incomplete',
        classification: 'rate_limited_retry_exhausted',
      },
    }],
  });

  assert.equal(result.status, 'INCOMPLETE');
  assert.equal(result.errors.length, 0);
  assert.equal(result.incomplete.length, 1);
});

test('404 source-only product is a warning, not an incomplete extraction', () => {
  const result = validateSchematic({
    declaredPageCount: 1,
    pages: [{ page: 1 }],
    occurrences: [{
      occurrenceIndex: 0,
      callout: 'FA245',
      productHandle: 'COL-FA245',
      sourcePartNumber: 'FA245',
      sourceIdentity: { handleValid: true },
      normalizedGeometry: { xPct: 50, yPct: 50, widthPct: 2, heightPct: 2 },
      productResolution: {
        status: 'source_part_only',
        classification: 'not_published',
      },
    }],
  });

  assert.equal(result.status, 'PASS_WITH_WARNINGS');
  assert.equal(result.incomplete.length, 0);
});
