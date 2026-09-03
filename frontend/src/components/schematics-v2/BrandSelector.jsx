/**
 * frontend/src/components/schematics-v2/BrandSelector.jsx
 *
 * Schematics owns its brand data/count semantics; shared selector primitives
 * own the cross-storefront brand-card presentation and responsive geometry.
 */
import { BrandSelectorCard, SelectorGrid } from '../selectors/SelectorCards.jsx';
import { resolveBrandLogo } from '../../utils/brandLogoAssets.js';

export function resolveSchematicBrandLogo(name) {
  return resolveBrandLogo(name) || null;
}

export function SchematicBrandLogo({ brand, className = '' }) {
  const name = brand?.name || brand?.id || 'Brand';
  const logo = resolveBrandLogo(brand || name);

  if (!logo) return null;

  return (
    <img
      src={logo}
      alt={`${name} logo`}
      className={className}
      loading="eager"
      decoding="async"
    />
  );
}

export default function BrandSelector({ brands, onSelectBrand }) {
  if (brands.length === 0) {
    return (
      <div className="dtb-schematics-empty" role="status">
        <p>No schematic brands are available right now.</p>
      </div>
    );
  }

  return (
    <SelectorGrid variant="brands">
      {brands.map((brand) => (
        <BrandSelectorCard
          key={brand.id}
          name={brand.name}
          logo={resolveBrandLogo(brand)}
          meta={`${brand.count} schematic${brand.count === 1 ? '' : 's'}`}
          onClick={() => onSelectBrand(brand.id)}
        />
      ))}
    </SelectorGrid>
  );
}
