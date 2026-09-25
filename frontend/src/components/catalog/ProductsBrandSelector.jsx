import { useMemo } from 'react';
import Breadcrumb from '../shared/Breadcrumb.jsx';
import brandsHeroImage from '../../assets/media/hero-background.webp';
import { dedupeCatalogBrandEntries } from '../../utils/catalogFacets.js';
import { resolveProductBrandLogo } from '../../utils/brandLogoAssets.js';
import { resolveFeaturedBrandPresentation } from '../../utils/brandSelectorPresentation.js';
import { BrandSelectorCard, SelectorGrid } from '../selectors/SelectorCards.jsx';
import './products-selector.css';

function normalizeBrandList(brands = [], { includeSchematicOnly = false } = {}) {
  if (!Array.isArray(brands) || brands.length === 0) return [];
  return dedupeCatalogBrandEntries(brands).map((brand) => {
    const presentation = resolveFeaturedBrandPresentation(brand, { includeSchematicOnly });
    return {
      ...brand,
      logo: presentation?.logo || resolveProductBrandLogo(brand),
      selectorClassName: presentation?.className || '',
      selectorStyle: presentation?.cardStyle,
      selectorLogoStyle: presentation?.logoStyle,
    };
  });
}

export default function ProductsBrandSelector({ brands, onSelectBrand, showHero = true, includeSchematicOnly = false }) {
  const sortedBrands = useMemo(
    () => normalizeBrandList(brands, { includeSchematicOnly }),
    [brands, includeSchematicOnly],
  );

  return (
    <div className="products-brand-selector">
      {showHero && <header className="products-brand-selector__hero" aria-labelledby="dtb-brands-hero-title">
        <div className="products-brand-selector__hero-inner">
          <div className="products-brand-selector__breadcrumb-shell">
            <Breadcrumb items={[{ label: 'Home', path: '/' }, { label: 'Brands' }]} />
          </div>

          <div className="products-brand-selector__hero-content">
            <div className="products-brand-selector__eyebrow-row">
              <span className="products-brand-selector__eyebrow">Brands</span>
              <span className="products-brand-selector__eyebrow-rule" aria-hidden="true" />
            </div>
            <h1 id="dtb-brands-hero-title" className="products-brand-selector__title">
              Shop the brands professionals rely on.
            </h1>
            <p className="products-brand-selector__description">
              Browse professional drywall tools, replacement parts, and equipment by manufacturer.
            </p>
          </div>

          <div className="products-brand-selector__hero-media" aria-hidden="true">
            <img
              src={brandsHeroImage}
              alt=""
              className="products-brand-selector__hero-image"
              loading="eager"
              fetchPriority="high"
              decoding="async"
            />
          </div>
        </div>
      </header>}

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
