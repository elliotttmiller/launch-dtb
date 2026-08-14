/**
 * frontend/src/components/schematics-v2/CategorySelector.jsx
 *
 * Renders the category grid for a selected brand. Visual language ported
 * from the richer drywall-toolbox reference: landscape (3:2) cards with a
 * full-bleed representative photo, a bottom-heavy dark scrim, and the
 * title/count anchored to the bottom of the card. `category.preview` is a
 * client-side derivation (first item in the group with a preview) computed
 * in useSchematicCatalog — not a new API field.
 */
import { ChevronRight, ImageOff } from 'lucide-react';

export default function CategorySelector({ brandName, categories, onSelectCategory }) {
  if (categories.length === 0) {
    return (
      <div className="dtb-schematics-empty" role="status">
        <p>No categories are available for {brandName || 'this brand'} yet.</p>
      </div>
    );
  }

  return (
    <div className="dtb-schematics-grid dtb-schematics-grid--categories" role="list">
      {categories.map((category) => (
        <button
          key={category.id}
          type="button"
          role="listitem"
          className="dtb-schematics-card dtb-schematics-card--category"
          onClick={() => onSelectCategory(category.id)}
        >
          {category.preview?.url ? (
            <img
              src={category.preview.url}
              alt=""
              className="dtb-schematics-card__bg-image"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <span className="dtb-schematics-card__bg-fallback" aria-hidden="true">
              <ImageOff size={26} />
            </span>
          )}
          <span className="dtb-schematics-card__scrim" aria-hidden="true" />
          <span className="dtb-schematics-card__overlay">
            <span className="dtb-schematics-card__overlay-text">
              <span className="dtb-schematics-card__title">{category.name}</span>
              <span className="dtb-schematics-card__meta">
                {category.count} tool{category.count === 1 ? '' : 's'}
              </span>
            </span>
            <ChevronRight className="dtb-schematics-card__chevron" size={18} aria-hidden="true" />
          </span>
        </button>
      ))}
    </div>
  );
}
