import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Wrench } from 'lucide-react';
import StorefrontRail from '../storefront/StorefrontRail.jsx';
import { buildCategoryPageUrl } from '../../utils/catalogFacets.js';
import { resolveCategoryThumbnail } from '../../utils/categoryThumbnailImages.js';
import '../../styles/category-hero.css';

function ToolTypeTile({ displayCategory }) {
  const [imageFailed, setImageFailed] = useState(false);
  const image = resolveCategoryThumbnail(displayCategory);
  const hasImage = Boolean(image) && !imageFailed;
  const count = Number(displayCategory?.count || 0);

  return (
    <Link
      to={buildCategoryPageUrl(displayCategory.slug)}
      className={`dtb-tool-type-tile${hasImage ? '' : ' dtb-tool-type-tile--no-image'}`}
    >
      <span className="dtb-tool-type-tile__media">
        {hasImage ? (
          <img
            src={image}
            alt=""
            className="dtb-tool-type-tile__image"
            width={348}
            height={128}
            loading="lazy"
            decoding="async"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <Wrench size={22} strokeWidth={1.75} aria-hidden="true" className="dtb-tool-type-tile__icon" />
        )}
      </span>
      <span className="dtb-tool-type-tile__label">{displayCategory.name}</span>
      {count > 0 && (
        <span className="dtb-tool-type-tile__count">
          {count.toLocaleString()} product{count === 1 ? '' : 's'}
        </span>
      )}
    </Link>
  );
}

/**
 * "Shop by Tool Type" row for the `/category/:slug` hero — renders the
 * same consolidated display-category list (name/slug/count) that feeds the
 * filter sidebar (`ProductsCatalogPlatform`'s `filterCategories`, built via
 * `mergeDisplayCategories()`), rather than the category's raw granular
 * `children` subcategory terms. Threaded in as a prop so this component
 * never derives or refetches its own category grouping.
 */
export default function ShopByToolType({ displayCategories = [], onOpenFilters }) {
  const items = Array.isArray(displayCategories) ? displayCategories : [];
  if (items.length === 0) return null;

  const handleViewAll = (event) => {
    if (typeof window === 'undefined') return;
    const target = document.getElementById('dtb-category-filters');
    if (!target) return;
    event.preventDefault();
    onOpenFilters?.();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="dtb-tool-type-section mb-6 sm:mb-8">
      <div className="storefront-section__head">
        <div className="storefront-section__head-text">
          <h2 className="storefront-section__title">Shop by Tool Type</h2>
        </div>
        <a href="#dtb-category-filters" className="storefront-section__view-all" onClick={handleViewAll}>
          View all tool types
          <ArrowRight size={14} aria-hidden="true" />
        </a>
      </div>

      <StorefrontRail label="Shop by tool type" className="dtb-tool-type-rail dtb-tool-type-rail--grid">
        {items.map((displayCategory) => (
          <ToolTypeTile key={displayCategory.slug} displayCategory={displayCategory} />
        ))}
      </StorefrontRail>
    </div>
  );
}
