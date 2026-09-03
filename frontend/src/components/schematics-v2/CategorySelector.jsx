/**
 * frontend/src/components/schematics-v2/CategorySelector.jsx
 *
 * Schematics owns category identity/count/preview derivation. The shared
 * selector primitives own the 3:2 media-card presentation used consistently
 * by schematics and product brand/category discovery.
 */
import { MediaSelectorCard, SelectorGrid } from '../selectors/SelectorCards.jsx';

export default function CategorySelector({ brandName, categories, onSelectCategory }) {
  if (categories.length === 0) {
    return (
      <div className="dtb-schematics-empty" role="status">
        <p>No categories are available for {brandName || 'this brand'} yet.</p>
      </div>
    );
  }

  return (
    <SelectorGrid variant="categories">
      {categories.map((category) => (
        <MediaSelectorCard
          key={category.id}
          title={category.name}
          meta={`${category.count} tool${category.count === 1 ? '' : 's'}`}
          image={category.preview?.url || ''}
          imageAlt=""
          onClick={() => onSelectCategory(category.id)}
        />
      ))}
    </SelectorGrid>
  );
}
