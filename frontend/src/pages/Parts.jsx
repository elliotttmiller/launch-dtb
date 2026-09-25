import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ProductsCatalogPlatform from './ProductsCatalogPlatform.jsx';
import Breadcrumb from '../components/shared/Breadcrumb.jsx';
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
      <div className="dtb-parts-breadcrumb-shell">
        <Breadcrumb
          items={[{ label: 'Home', path: '/' }, { label: 'Parts' }]}
          activeFilters={activeFilters}
          onRemoveFilter={onRemoveFilter}
        />
      </div>

      <header className="dtb-parts-hero" aria-labelledby="dtb-parts-hero-title">
        <div className="dtb-parts-hero__inner">
          <div className="dtb-parts-hero__content">
            <hr className="dtb-parts-hero__divider" aria-hidden="true" />
            <h1 id="dtb-parts-hero-title" className="dtb-parts-hero__title">Parts</h1>
            <p className="dtb-parts-hero__description">Replacement parts and service components.</p>
          </div>

          <div className="dtb-parts-hero__art" aria-hidden="true">
            <span className="dtb-parts-hero__slash dtb-parts-hero__slash--one" />
            <span className="dtb-parts-hero__slash dtb-parts-hero__slash--two" />
            <span className="dtb-parts-hero__slash dtb-parts-hero__slash--three" />
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
