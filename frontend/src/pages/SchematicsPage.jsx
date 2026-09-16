/**
 * frontend/src/pages/SchematicsPage.jsx
 *
 * Live implementation of the /schematics route (Phase 7 rebuild).
 *
 * Composition (per schematics_prompt.md "REACT FRONTEND REBUILD"):
 *   SchematicsPage
 *     -> useSchematicRouteState
 *     -> useSchematicCatalog
 *     -> SchematicsCatalog -> BrandSelector / CategorySelector / ToolSelector
 *     -> SchematicViewerPage -> SchematicHeader / SchematicPageTabs / DiagramViewer / SchematicPartDialog
 *
 * Consumes only the authoritative dtb-schematics public API (see
 * frontend/src/api/schematicsApi.js) — it does not decide which schematics,
 * pages, or products exist; that is entirely server-derived.
 *
 * The old frontend/src/pages/Schematics.jsx implementation (hardcoded tool
 * registries, static per-tool JSON imports, per-hotspot product lookups,
 * global DOM/history runtimes) has been disconnected from routing in favor
 * of this module. It is left in the repo pending Phase 9 removal.
 */
import { useCallback } from 'react';
import AppErrorBoundary from '../components/system/AppErrorBoundary';
import SEOHead from '../components/shared/SEOHead';
import PageHeroBanner from '../components/shared/PageHeroBanner';
import { buildBreadcrumbSchema } from '../utils/schema';
import { useSchematicRouteState } from '../hooks/useSchematicRouteState';
import { useSchematicCatalog } from '../hooks/useSchematicCatalog';
import SchematicsCatalog from '../components/schematics-v2/SchematicsCatalog';
import SchematicViewerPage from '../components/schematics-v2/SchematicViewerPage';
import '../styles/schematics-v2.css';
import '../styles/schematics-brand-header.css';
import '../styles/schematic-hotspot-card-polish.css';
import '../styles/schematic-linked-hotspot-glow.css';
import '../styles/schematics-loading.css';
import '../styles/schematic-diagram-fit.css';

function SchematicsPageInner() {
  const routeState = useSchematicRouteState();
  const catalog = useSchematicCatalog();

  const handleSelectBrand = useCallback((brandId) => {
    routeState.navigateToBrand(brandId);
  }, [routeState]);

  const handleSelectCategory = useCallback((brandId, categoryId) => {
    routeState.navigateToCategory(brandId, categoryId);
  }, [routeState]);

  const handleSelectTool = useCallback((schematicId) => {
    routeState.navigateToSchematic(schematicId);
  }, [routeState]);

  const handleBack = useCallback((brandId, categoryId) => {
    if (categoryId) {
      routeState.navigateToCategory(brandId, categoryId);
    } else if (brandId) {
      routeState.navigateToBrand(brandId);
    } else {
      routeState.navigateToCatalog();
    }
  }, [routeState]);

  const handlePageChange = useCallback((pageNumber) => {
    routeState.setPage(pageNumber);
  }, [routeState]);

  const handleSelectVariant = useCallback(({ type, id }) => {
    if (type === 'shared') {
      routeState.setVariant(id);
      return;
    }
    routeState.navigateToSchematic(id);
  }, [routeState]);

  const isViewer = routeState.view === 'schematic';
  const title = isViewer ? 'Schematics' : 'Parts Schematics';
  const description = isViewer
    ? 'Interactive parts schematic with linked replacement parts.'
    : 'Browse parts schematics by brand, category, and tool.';

  return (
    <>
      <SEOHead
        title={title}
        description={description}
        canonicalPath="/schematics"
        structuredData={buildBreadcrumbSchema([
          { name: 'Home', path: '/' },
          { name: 'Schematics', path: '/schematics' },
        ])}
      />

      {!isViewer && (
        <PageHeroBanner
          title="Parts Schematics"
          description="Find the diagram for your tool, then select a callout to identify and order the correct replacement part."
          eyebrow="Parts & Service"
        />
      )}

      <main className="dtb-schematics-page__content">
        {isViewer ? (
          <SchematicViewerPage
            schematicId={routeState.schematicId}
            initialPage={routeState.page}
            initialVariant={routeState.variant}
            onBack={handleBack}
            onPageChange={handlePageChange}
            catalogItems={catalog.items}
            onSelectVariant={handleSelectVariant}
          />
        ) : (
          <SchematicsCatalog
            catalog={catalog}
            routeState={routeState}
            onSelectBrand={handleSelectBrand}
            onSelectCategory={handleSelectCategory}
            onSelectTool={handleSelectTool}
          />
        )}
      </main>
    </>
  );
}

export default function SchematicsPage() {
  return (
    <AppErrorBoundary>
      <SchematicsPageInner />
    </AppErrorBoundary>
  );
}
