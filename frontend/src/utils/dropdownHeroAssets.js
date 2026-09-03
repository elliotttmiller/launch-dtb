import partsHero from '@assets/media/catalog/dropdown-heroes/parts.webp';
import repairsHero from '@assets/media/catalog/dropdown-heroes/repairs.webp';
import schematicsHero from '@assets/media/catalog/dropdown-heroes/schematics.webp';

const brandsHero = '/wp/wp-content/uploads/2026/categories/heroes/brands.webp';

/**
 * Canonical desktop mega-menu hero media registry.
 *
 * Bundled hero artwork lives under
 * frontend/src/assets/media/catalog/dropdown-heroes/. WordPress-owned
 * artwork uses a same-origin uploads URL here so every dropdown renderer
 * continues through this single registry.
 *
 * Add new approved hero assets here as they are created rather than importing
 * them ad hoc from header or panel components. Missing heroes intentionally
 * resolve to an empty string so renderers omit the media region cleanly.
 */
export const DROPDOWN_HERO_ASSETS = Object.freeze({
  brands: brandsHero,
  parts: partsHero,
  repairs: repairsHero,
  schematics: schematicsHero,
});

export function getDropdownHero(menuId) {
  const key = String(menuId || '').trim().toLowerCase();
  return DROPDOWN_HERO_ASSETS[key] || '';
}

export default getDropdownHero;
