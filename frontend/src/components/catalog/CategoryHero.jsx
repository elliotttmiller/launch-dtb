import { Link } from 'react-router-dom';
import { buildCategoryPageUrl } from '../../utils/catalogFacets.js';

/**
 * Hero/landing block for the dedicated `/category/:slug` route. Renders
 * above the shared catalog engine (search/filter/grid) — it never owns
 * product data itself, only the category term metadata passed in.
 */
export default function CategoryHero({ category, breadcrumbs = [], productCount: productCountOverride }) {
  if (!category) return null;

  const { label, description, image, productCount: metaProductCount, children } = category;
  const productCount = Number.isFinite(productCountOverride) ? productCountOverride : metaProductCount;
  const hasChildren = Array.isArray(children) && children.length > 0;

  return (
    <div className="dtb-category-hero mb-6 sm:mb-8">
      {breadcrumbs.length > 0 && (
        <nav className="dtb-product-breadcrumb mb-3" aria-label="Breadcrumb">
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            return isLast ? (
              <span key={crumb.path} className="dtb-product-breadcrumb__current">{crumb.label}</span>
            ) : (
              <span key={crumb.path} className="contents">
                <Link to={crumb.path}>{crumb.label}</Link>
                <span aria-hidden="true">›</span>
              </span>
            );
          })}
        </nav>
      )}

      <div className={`flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-6${image ? '' : ' sm:items-start'}`}>
        {image && (
          <img
            src={image}
            alt=""
            className="h-32 w-full rounded-2xl object-cover sm:h-28 sm:w-40 shrink-0"
            width={320}
            height={224}
            loading="eager"
            decoding="async"
          />
        )}
        <div className="min-w-0">
          <h1 className="dtb-listing-heading__title">{label}</h1>
          {typeof productCount === 'number' && (
            <p className="dtb-listing-heading__meta">{productCount.toLocaleString()} product{productCount === 1 ? '' : 's'}</p>
          )}
          {description && (
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">{description}</p>
          )}
        </div>
      </div>

      {hasChildren && (
        <div className="mt-5 flex flex-wrap gap-2" role="list" aria-label="Subcategories">
          {children.map((child) => (
            <Link
              key={child.slug}
              to={buildCategoryPageUrl(child.slug)}
              role="listitem"
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700"
            >
              {child.label}
              {typeof child.productCount === 'number' && (
                <span className="text-xs text-slate-400">{child.productCount}</span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
