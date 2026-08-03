/**
 * frontend/src/utils/schematicProductLookup.js
 *
 * Resolves a schematic id (e.g. 'columbia-predator-taper') to the real
 * WooCommerce SKU that represents it, so schematic selector cards can show
 * truthful product photos and product names instead of the schematic
 * diagram/placeholder.
 *
 * Built once from PRODUCT_SCHEMATIC_LINKS (SKU -> schematic id), which is
 * itself generated from the live catalog — see
 * frontend/src/data/productSchematicLinks.generated.js.
 */

import { PRODUCT_SCHEMATIC_LINKS } from '../data/productSchematicLinks.generated.js';

// One representative SKU per schematic id. Prefer a non-variant, non-page-specific
// entry (the "base" product); otherwise take the first SKU encountered for that id.
const SCHEMATIC_ID_TO_SKU = (() => {
  const map = {};
  const priority = {}; // schematicId -> current candidate's rank (lower is better)

  Object.entries(PRODUCT_SCHEMATIC_LINKS).forEach(([sku, entry]) => {
    const { schematicId } = entry;
    if (!schematicId) return;

    const rank = (entry.variant == null ? 0 : 1) + (entry.page == null ? 0 : 2);

    if (!(schematicId in map) || rank < priority[schematicId]) {
      map[schematicId] = sku;
      priority[schematicId] = rank;
    }
  });

  return map;
})();

/**
 * @param {string} schematicId
 * @returns {string|null} The representative catalog SKU, or null if none exists.
 */
export function getRepresentativeSkuForSchematic(schematicId) {
  return SCHEMATIC_ID_TO_SKU[schematicId] || null;
}

export default SCHEMATIC_ID_TO_SKU;
