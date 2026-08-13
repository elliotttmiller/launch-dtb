/**
 * frontend/src/components/schematics-v2/BrandSelector.jsx
 *
 * Renders the brand grid for the schematics catalog root. Purely
 * presentational — derives everything from `brands` (see useSchematicCatalog).
 */
import { ChevronRight } from 'lucide-react';

export default function BrandSelector({ brands, onSelectBrand }) {
  if (brands.length === 0) {
    return (
      <div className="dtb-schematics-empty" role="status">
        <p>No schematic brands are available right now.</p>
      </div>
    );
  }

  return (
    <div className="dtb-schematics-grid dtb-schematics-grid--brands" role="list">
      {brands.map((brand) => (
        <button
          key={brand.id}
          type="button"
          role="listitem"
          className="dtb-schematics-card dtb-schematics-card--brand"
          onClick={() => onSelectBrand(brand.id)}
        >
          <span className="dtb-schematics-card__title">{brand.name}</span>
          <span className="dtb-schematics-card__meta">
            {brand.count} schematic{brand.count === 1 ? '' : 's'}
          </span>
          <ChevronRight className="dtb-schematics-card__chevron" size={18} aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}
