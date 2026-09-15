import { useMemo } from 'react';
import { dedupeCatalogBrandEntries } from '../../utils/catalogFacets.js';
import { normalizeBrandAssetKey, resolveProductBrandLogo } from '../../utils/brandLogoAssets.js';
import { BrandSelectorCard, SelectorGrid } from '../selectors/SelectorCards.jsx';
import './products-selector.css';

const FEATURED_BRAND_PRESENTATION = {
  columbia: {
    logo: '/brands/Columbia/columbia_logo_white.svg',
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
    logo: '/brands/Level5/Level5-white.svg',
    className: 'products-brand-selector__card--level5',
    cardStyle: {
      backgroundColor: '#b5121b',
      backgroundImage: "url('/brands/Level5/level5-background.webp')",
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
  usgsheetrocktools: {
    logo: '/brands/USG-Sheetrock-Tools/usg-sheetrock-tools.svg',
    className: 'products-brand-selector__card--usg',
    cardStyle: {
      backgroundColor: '#00843d',
      backgroundImage: "url('/brands/USG-Sheetrock-Tools/USG-background.webp')",
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundSize: 'cover',
      padding: 0,
    },
    logoStyle: {
      width: '78%',
      height: 'auto',
      maxWidth: '78%',
      maxHeight: '48%',
    },
  },
};

function resolveFeaturedBrandPresentation(brand = {}) {
  const candidates = [brand.slug, brand.key, brand.label];

  for (const candidate of candidates) {
    const normalized = normalizeBrandAssetKey(candidate);
    if (!normalized) continue;

    if (normalized.includes('columbia')) return FEATURED_BRAND_PRESENTATION.columbia;
    if (normalized === 'level5') return FEATURED_BRAND_PRESENTATION.level5;
    if (normalized === 'usg' || normalized.includes('usgsheetrock')) {
      return FEATURED_BRAND_PRESENTATION.usgsheetrocktools;
    }
  }

  return null;
}

function normalizeBrandList(brands = []) {
  if (!Array.isArray(brands) || brands.length === 0) return [];
  return dedupeCatalogBrandEntries(brands).map((brand) => {
    const presentation = resolveFeaturedBrandPresentation(brand);
    return {
      ...brand,
      logo: presentation?.logo || resolveProductBrandLogo(brand),
      selectorClassName: presentation?.className || '',
      selectorStyle: presentation?.cardStyle,
      selectorLogoStyle: presentation?.logoStyle,
    };
  });
}

export default function ProductsBrandSelector({ brands, onSelectBrand }) {
  const sortedBrands = useMemo(() => normalizeBrandList(brands), [brands]);

  return (
    <div className="products-brand-selector">
      <h1 className="products-brand-selector__title">Brands</h1>
      <SelectorGrid variant="brands">
        {sortedBrands.map((brand) => {
          const label = brand.label || brand.key || '';
          return (
            <BrandSelectorCard
              key={brand.slug || brand.key || label}
              name={label}
              logo={brand.logo}
              className={brand.selectorClassName}
              style={brand.selectorStyle}
              logoStyle={brand.selectorLogoStyle}
              onClick={() => onSelectBrand(brand)}
            />
          );
        })}
      </SelectorGrid>
    </div>
  );
}
