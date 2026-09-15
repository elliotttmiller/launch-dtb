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
      <header className="products-brand-selector__hero">
        <div className="products-brand-selector__hero-content">
          <div className="products-brand-selector__hero-heading">
            <div className="products-brand-selector__eyebrow-row">
              <span className="products-brand-selector__eyebrow">Brands</span>
              <span className="products-brand-selector__eyebrow-rule" aria-hidden="true" />
            </div>
            <h1 className="products-brand-selector__title">Shop by Brand</h1>
            <p className="products-brand-selector__description">
              Professional drywall tools from the brands you trust.<br className="products-brand-selector__description-break" />
              Browse tools, replacement parts, and equipment by manufacturer.
            </p>
          </div>
        </div>

        <div className="products-brand-selector__hero-art" aria-hidden="true">
          <span className="products-brand-selector__slash products-brand-selector__slash--one" />
          <span className="products-brand-selector__slash products-brand-selector__slash--two" />
          <span className="products-brand-selector__slash products-brand-selector__slash--three" />
          <div className="products-brand-selector__statement">
            <span>The brands</span>
            <span>professionals</span>
            <span>count on.</span>
            <span className="products-brand-selector__statement-rule" />
          </div>
        </div>
      </header>

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
