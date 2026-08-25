export const SCHEMATIC_BRANDS = [
  { id: 'tape-tech', name: 'TapeTech', slug: 'tape-tech', aliases: ['tapetech'] },
  { id: 'columbia', name: 'Columbia Taping Tools', slug: 'columbia', aliases: ['columbia-taping-tools', 'columbia-tools'] },
  { id: 'sur-pro', name: 'SurPro', slug: 'sur-pro', aliases: ['surpro'] },
  { id: 'platinum', name: 'Platinum Drywall Tools', slug: 'platinum', aliases: ['platinum-drywall-tools'] },
  { id: 'dura-stilts', name: 'Dura-Stilts', slug: 'dura-stilts', aliases: ['durastilts'] },
  { id: 'level5', name: 'Level5', slug: 'level5', aliases: ['level-5'] },
];

export const SCHEMATIC_BRAND_TO_SLUG = Object.fromEntries(
  SCHEMATIC_BRANDS.map(({ name, slug }) => [name, slug])
);

export const SCHEMATIC_SLUG_TO_BRAND = Object.fromEntries(
  SCHEMATIC_BRANDS.flatMap(({ id, name, aliases }) => [id, ...aliases].map((value) => [value, name]))
);

const SCHEMATIC_BRAND_ID_BY_ALIAS = new Map(
  SCHEMATIC_BRANDS.flatMap(({ id, aliases }) => [id, ...aliases].map((value) => [value, id]))
);

/** Resolve public/legacy route aliases to the canonical schematic API brand ID. */
export function canonicalizeSchematicBrandId(value = '') {
  const key = String(value).trim().toLowerCase();
  return SCHEMATIC_BRAND_ID_BY_ALIAS.get(key) || key;
}

/** Resolve a customer-facing brand label to its canonical schematic API ID. */
export function getSchematicBrandIdByName(name = '') {
  const normalizedName = String(name).trim().toLowerCase();
  return SCHEMATIC_BRANDS.find(({ name: candidate }) => candidate.toLowerCase() === normalizedName)?.id || '';
}
