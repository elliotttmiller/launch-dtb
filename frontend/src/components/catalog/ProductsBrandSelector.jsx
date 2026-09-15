import { useMemo } from 'react';
import { dedupeCatalogBrandEntries } from '../../utils/catalogFacets.js';
import { resolveProductBrandLogo } from '../../utils/brandLogoAssets.js';
import { resolveFeaturedBrandPresentation } from '../../utils/brandSelectorPresentation.js';
import { BrandSelectorCard, SelectorGrid } from '../selectors/SelectorCards.jsx';
import './products-selector.css';

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
