/**
 * frontend/src/components/schematics-v2/CategorySelector.jsx
 *
 * Renders the category grid for a selected brand.
 */
import { ChevronRight } from 'lucide-react';

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
          <span className="dtb-schematics-card__title">{category.name}</span>
          <span className="dtb-schematics-card__meta">
            {category.count} tool{category.count === 1 ? '' : 's'}
          </span>
          <ChevronRight className="dtb-schematics-card__chevron" size={18} aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}
