import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Wrench } from 'lucide-react';
import StorefrontRail from '../storefront/StorefrontRail.jsx';
import { buildCategoryPageUrl } from '../../utils/catalogFacets.js';
import { resolveCategoryThumbnail } from '../../utils/categoryThumbnailImages.js';
import '../../styles/category-hero.css';

function ToolTypeTile({ category }) {
  const [imageFailed, setImageFailed] = useState(false);
  const image = resolveCategoryThumbnail(category);
  const hasImage = Boolean(image) && !imageFailed;
  const count = Number(category?.count || 0);

  return (
    <Link
      to={buildCategoryPageUrl(category.slug)}
      className={`dtb-tool-type-tile${hasImage ? '' : ' dtb-tool-type-tile--no-image'}`}
    >
      <span className="dtb-tool-type-tile__media">
        {hasImage ? (
          <img
            src={image}
            alt=""
            className="dtb-tool-type-tile__image"
            loading="lazy"
            decoding="async"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <Wrench size={22} strokeWidth={1.75} aria-hidden="true" className="dtb-tool-type-tile__icon" />
        )}
      </span>
      <span className="dtb-tool-type-tile__label">{category.name}</span>
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
 * authoritative WooCommerce child terms returned by the category metadata
 * endpoint. Display-category metadata remains a filtering/merchandising facet
 * and must not define the storefront taxonomy architecture.
 *
 * Category thumbnail source assets intentionally have intrinsic, tool-specific
 * aspect ratios. The fixed media viewport and `object-fit: contain` CSS own
 * layout stability and fitment; the image element must not assert a legacy
 * 348x128 intrinsic ratio.
 */
export default function ShopByToolType({ categories = [], onOpenFilters }) {
  const items = Array.isArray(categories) ? categories : [];
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

      <StorefrontRail label="Shop by tool type" className="dtb-tool-type-rail">
        {items.map((category) => (
          <ToolTypeTile key={category.slug} category={category} />
        ))}
      </StorefrontRail>
    </div>
  );
}
