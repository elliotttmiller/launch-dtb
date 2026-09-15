import { normalizeBrandAssetKey, resolveBrandLogo } from './brandLogoAssets.js';

const sitegroundLogoAsset = (filename) => `/logos/${filename}`;

export const FEATURED_BRAND_PRESENTATION = {
  tapetech: {
    logo: resolveBrandLogo('TapeTech'),
    className: 'products-brand-selector__card--tapetech',
    cardStyle: {
      backgroundColor: 'rgb(236, 170, 31)',
      padding: 0,
    },
    logoStyle: {
      width: '82%',
      height: 'auto',
      maxWidth: '82%',
      maxHeight: '54%',
    },
  },
  columbia: {
    logo: sitegroundLogoAsset('columbia_logo_white.svg'),
    className: 'products-brand-selector__card--columbia',
    cardStyle: {
      background: '#080808',
      padding: 0,
    },
    logoStyle: {
      width: '72%',
      height: 'auto',
      maxWidth: '72%',
      maxHeight: '48%',
    },
  },
  level5: {
    logo: sitegroundLogoAsset('Level5-white.svg'),
    className: 'products-brand-selector__card--level5',
    cardStyle: {
      backgroundColor: '#b5121b',
      backgroundImage: `url("${sitegroundLogoAsset('level5-background.webp')}")`,
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundSize: 'cover',
      padding: 0,
    },
    logoStyle: {
      width: '74%',
      height: 'auto',
      maxWidth: '74%',
      maxHeight: '48%',
    },
  },
  surpro: {
    logo: sitegroundLogoAsset('surpro_logo_white.svg'),
    className: 'products-brand-selector__card--surpro',
    cardStyle: {
      backgroundColor: 'rgb(255, 102, 0)',
      padding: 0,
    },
    logoStyle: {
      width: '74%',
      height: 'auto',
      maxWidth: '74%',
      maxHeight: '48%',
    },
  },
  usgsheetrocktools: {
    // Selector artwork is intentionally separate from the canonical USG logo
    // used by headers and other storefront surfaces.
    logo: sitegroundLogoAsset('usg-sheetrock-tools-transparent.svg'),
    className: 'products-brand-selector__card--usg',
    cardStyle: {
      backgroundColor: '#00843d',
      backgroundImage: `url("${sitegroundLogoAsset('USG-background.webp')}")`,
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundSize: 'cover',
      padding: 0,
    },
    logoStyle: {
      width: '88%',
      height: 'auto',
      maxWidth: '88%',
      maxHeight: '56%',
    },
  },
};

export function resolveFeaturedBrandPresentation(brand = {}) {
  const candidates = [brand.slug, brand.key, brand.label, brand.name, brand.id];

  for (const candidate of candidates) {
    const normalized = normalizeBrandAssetKey(candidate);
    if (!normalized) continue;

    if (normalized.includes('columbia')) return FEATURED_BRAND_PRESENTATION.columbia;
    if (normalized === 'tapetech' || normalized === 'tapetechtools') return FEATURED_BRAND_PRESENTATION.tapetech;
    if (normalized === 'level5') return FEATURED_BRAND_PRESENTATION.level5;
    if (normalized === 'surpro' || normalized === 'sur') return FEATURED_BRAND_PRESENTATION.surpro;
    if (normalized === 'usg' || normalized.includes('usgsheetrock')) {
      return FEATURED_BRAND_PRESENTATION.usgsheetrocktools;
    }
  }

  return null;
}
