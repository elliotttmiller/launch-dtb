import partsHero from '@assets/media/catalog/dropdown-heroes/parts.webp';
import schematicsHero from '@assets/media/catalog/dropdown-heroes/schematics.webp';

/**
 * Canonical desktop mega-menu hero media registry.
 *
 * Hero artwork lives under:
 * frontend/src/assets/media/catalog/dropdown-heroes/
 *
 * Add new approved hero assets here as they are created rather than importing
 * them ad hoc from header or panel components. Missing heroes intentionally
 * resolve to an empty string so renderers omit the media region cleanly.
 */
export const DROPDOWN_HERO_ASSETS = Object.freeze({
  parts: partsHero,
  schematics: schematicsHero,
});

export function getDropdownHero(menuId) {
  const key = String(menuId || '').trim().toLowerCase();
  return DROPDOWN_HERO_ASSETS[key] || '';
}

export default getDropdownHero;
