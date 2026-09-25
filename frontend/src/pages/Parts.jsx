import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ProductsCatalogPlatform from './ProductsCatalogPlatform.jsx';
import Breadcrumb from '../components/shared/Breadcrumb.jsx';
import partsHeroImage from '../assets/media/parts/hero.webp';
import {
  buildCatalogUrl,
  canonicalBrandLabel,
  parseCatalogQuery,
} from '../utils/catalogUrlState.js';
import './parts.css';

function formatFilterLabel(value = '') {
  return String(value || '')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function PartsHero({ activeFilters = [], onRemoveFilter = null }) {
  return (
    <>
      <header className="dtb-parts-hero" aria-labelledby="dtb-parts-hero-title">
        <div className="dtb-parts-hero__inner">
          <div className="dtb-parts-breadcrumb-shell">
            <Breadcrumb
              items={[{ label: 'Home', path: '/' }, { label: 'Parts' }]}
              activeFilters={activeFilters}
              onRemoveFilter={onRemoveFilter}
            />
          </div>
          <div className="dtb-parts-hero__content">
            <div className="dtb-parts-hero__eyebrow-row">
              <span className="dtb-parts-hero__eyebrow">Parts</span>
              <span className="dtb-parts-hero__eyebrow-rule" aria-hidden="true" />
            </div>
            <h1 id="dtb-parts-hero-title" className="dtb-parts-hero__title">
              Keep your tools working like they should.
            </h1>
            <p className="dtb-parts-hero__description">
              Find replacement parts and service components for professional drywall tools.
            </p>
          </div>

          <div className="dtb-parts-hero__media" aria-hidden="true">
            <img
              src={partsHeroImage}
              alt=""
              className="dtb-parts-hero__image"
              loading="eager"
              fetchPriority="high"
              decoding="async"
            />
          </div>
        </div>
      </header>
    </>
  );
}

export default function Parts() {
  const location = useLocation();
  const navigate = useNavigate();
  const query = useMemo(
    () => parseCatalogQuery(new URLSearchParams(location.search), { basePath: '/parts' }),
    [location.search],
  );

  const activeFilters = useMemo(() => {
    const filters = [];

    (query.brands || []).forEach((brand) => {
      const label = canonicalBrandLabel(brand);
      filters.push({
        id: `brand:${label}`,
        type: 'brand',
        value: label,
        label,
      });
    });

    (query.displayCategory || []).forEach((slug) => {
      filters.push({
        id: `display-category:${slug}`,
        type: 'displayCategory',
        value: slug,
        label: formatFilterLabel(slug),
      });
    });

    return filters;
  }, [query.brands, query.displayCategory]);

  const removeFilter = (filter) => {
    if (!filter) return;
    if (filter.type === 'brand') {
      navigate(buildCatalogUrl({ ...query, brands: [], displayCategory: [], page: 1 }, { basePath: '/parts' }));
      return;
    }
    if (filter.type === 'displayCategory') {
      navigate(buildCatalogUrl({
        ...query,
        displayCategory: (query.displayCategory || []).filter((slug) => slug !== filter.value),
        page: 1,
      }, { basePath: '/parts' }));
    }
  };

  return (
    <div className="dtb-parts-page">
      <PartsHero activeFilters={activeFilters} onRemoveFilter={removeFilter} />
      <ProductsCatalogPlatform forceProductGrid title="Parts" isPartsFilter={1} />
    </div>
  );
}
