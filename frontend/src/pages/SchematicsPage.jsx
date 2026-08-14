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

function SchematicsPageInner() {
  const routeState = useSchematicRouteState();
  const catalog = useSchematicCatalog();

  const handlePageChange = useCallback((pageNumber) => {
    routeState.setPage(pageNumber);
  }, [routeState]);

  const handleBackFromViewer = useCallback((derivedBrandId, derivedCategoryId) => {
    routeState.backFromViewer(derivedBrandId, derivedCategoryId);
  }, [routeState]);

  const handleSelectVariant = useCallback((nextSchematicId) => {
    routeState.goToSchematic(nextSchematicId);
  }, [routeState]);

  return (
    <div className="dtb-schematics-page">
      <SEOHead
        title="Tool Schematics & Diagrams"
        description="Interactive exploded-view schematics and part diagrams for professional drywall finishing tools. Find replacement parts for TapeTech, Columbia, and more."
        canonical="/schematics"
        schema={buildBreadcrumbSchema([
          { label: 'Home', path: '/' },
          { label: 'Schematics', path: '/schematics' },
        ])}
      />

      {routeState.view === 'catalog' && !routeState.brandId && (
        <PageHeroBanner
          eyebrow="Exploded-View Library"
          title="Tool Schematics"
          highlight="Find Parts With Confidence."
          description="Browse brand schematics, drill into tool diagrams, and source exact replacement components from one streamlined parts workflow."
          align="left"
        />
      )}

      <div className="dtb-schematics-page__content">
        {routeState.view === 'viewer' ? (
          <SchematicViewerPage
            schematicId={routeState.schematicId}
            initialPage={routeState.page}
            onBack={handleBackFromViewer}
            onPageChange={handlePageChange}
            catalogItems={catalog.items}
            onSelectVariant={handleSelectVariant}
          />
        ) : (
          <SchematicsCatalog catalog={catalog} routeState={routeState} />
        )}
      </div>
    </div>
  );
}

/**
 * Errors within the schematics route must never take down the storefront
 * shell — wrap the route content in its own error boundary.
 */
export default function SchematicsPage() {
  return (
    <AppErrorBoundary>
      <SchematicsPageInner />
    </AppErrorBoundary>
  );
}
