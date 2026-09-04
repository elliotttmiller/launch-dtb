/**
 * frontend/src/components/schematics-v2/SchematicsCatalog.jsx
 *
 * Brand -> Category -> Tool drill-down for the schematics catalog root.
 * Purely a composition/state-forwarding layer over useSchematicCatalog +
 * useSchematicRouteState; no data fetching of its own.
 */
import { useMemo, useState } from 'react';
import BackButton from '../shared/BackButton';
import SearchBar from '../catalog/SearchBar';
import BrandSelector, { SchematicBrandLogo } from './BrandSelector';
import CategorySelector from './CategorySelector';
import ToolSelector from './ToolSelector';

export default function SchematicsCatalog({ catalog, routeState }) {
  const { status, error, brands, getCategoriesForBrand, getToolsForBrandCategory, search } = catalog;
  const { brandId, categoryId, goToBrand, goToCategory, goToSchematic, goToCatalogRoot } = routeState;
  const [searchQuery, setSearchQuery] = useState('');

  const searchResults = useMemo(() => search(searchQuery), [search, searchQuery]);
  const hasQuery = searchQuery.trim().length > 0;

  const currentBrand = brandId ? brands.find((b) => b.id === brandId) : null;
  const categories = brandId ? getCategoriesForBrand(brandId) : [];
  const currentCategory = categoryId ? categories.find((c) => c.id === categoryId) : null;
  const tools = brandId && categoryId ? getToolsForBrandCategory(brandId, categoryId) : [];

  if (status === 'loading') {
    return (
      <div className="dtb-schematics-catalog" aria-busy="true">
        <p className="dtb-schematics-status">Loading schematics…</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="dtb-schematics-catalog">
        <p className="dtb-schematics-status dtb-schematics-status--error" role="alert">
          {error || 'The schematics catalog could not be loaded. Please try again shortly.'}
        </p>
      </div>
    );
  }

  if (status === 'empty' && !hasQuery) {
    return (
      <div className="dtb-schematics-catalog">
        <p className="dtb-schematics-status">No schematics are published yet. Check back soon.</p>
      </div>
    );
  }

  return (
    <div className="dtb-schematics-catalog">
      {!brandId && (
        <SearchBar
          placeholder="Search schematics by brand, category, or tool name…"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
        />
      )}

      {hasQuery ? (
        <div>
          <p className="dtb-schematics-search-summary">
            {searchResults.length === 0
              ? `No schematics found for "${searchQuery}"`
              : `${searchResults.length} result${searchResults.length === 1 ? '' : 's'} found`}
          </p>
          {searchResults.length > 0 && (
            <ToolSelector
              categoryName="your search"
              tools={searchResults}
              onSelectTool={(id) => goToSchematic(id)}
            />
          )}
        </div>
      ) : !brandId ? (
        <BrandSelector brands={brands} onSelectBrand={goToBrand} />
      ) : !categoryId ? (
        <>
          <BackButton
            onClick={goToCatalogRoot}
            label="Back to brands"
            className="dtb-selector-nav-back"
            iconOnly
          />
          <div className="dtb-schematics-brand-header">
            <SchematicBrandLogo
              brand={currentBrand || { id: brandId, name: brandId }}
              className="dtb-schematics-brand-header__logo"
            />
            <span className="dtb-schematics-brand-header__name">
              {currentBrand?.name || brandId}
            </span>
          </div>
          <CategorySelector
            brandName={currentBrand?.name}
            categories={categories}
            onSelectCategory={(id) => goToCategory(brandId, id)}
          />
        </>
      ) : (
        <>
          <BackButton
            onClick={() => goToCategory(brandId, null)}
            label="Back to categories"
            className="dtb-selector-nav-back"
            iconOnly
          />
          <h2 className="dtb-schematics-heading">{currentCategory?.name || categoryId}</h2>
          <ToolSelector
            categoryName={currentCategory?.name}
            tools={tools}
            onSelectTool={(id) => goToSchematic(id)}
          />
        </>
      )}
    </div>
  );
}
