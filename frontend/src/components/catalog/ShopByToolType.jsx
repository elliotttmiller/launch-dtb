import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import StorefrontRail from '../storefront/StorefrontRail.jsx';
import { buildCategoryPageUrl } from '../../utils/catalogFacets.js';
import { resolveCategoryThumbnail } from '../../utils/categoryThumbnailImages.js';
import '../../styles/category-hero.css';

function ToolTypeTile({ child }) {
  const [imageFailed, setImageFailed] = useState(false);
  const image = resolveCategoryThumbnail(child);
  const hasImage = Boolean(image) && !imageFailed;

  return (
    <Link
      to={buildCategoryPageUrl(child.slug)}
      className={`dtb-tool-type-tile${hasImage ? '' : ' dtb-tool-type-tile--no-image'}`}
    >
      <span className="dtb-tool-type-tile__media">
        {hasImage && (
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
        )}
      </span>
      <span className="dtb-tool-type-tile__label">{child.label}</span>
    </Link>
  );
}

/**
 * "Shop by Tool Type" row for the `/category/:slug` hero — renders the
 * category's immediate subcategories (already returned by
 * GET /wp-json/dtb/v1/catalog/category as `children`, including per-child
 * image + productCount) as a scrollable/grid tile row.
 */
export default function ShopByToolType({ category, onOpenFilters }) {
  const children = Array.isArray(category?.children) ? category.children : [];
  if (children.length === 0) return null;

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
        {children.map((child) => (
          <ToolTypeTile key={child.slug} child={child} />
        ))}
      </StorefrontRail>
    </div>
  );
}
