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
import '../styles/schematics-loading.css';

function SchematicsPageInner() {
  const routeState = useSchematicRouteState();
  const catalog = useSchematicCatalog();

  const handlePageChange = useCallback((pageNumber) => {
    routeState.setPage(pageNumber);
  }, [routeState]);

  const handleBackFromViewer = useCallback((derivedBrandId, derivedCategoryId) => {
    routeState.backFromViewer(derivedBrandId, derivedCategoryId);
  }, [routeState]);

  const handleSelectVariant = useCallback((selection) => {
    if (selection.type === 'shared') {
      routeState.setVariant(selection.id);
      return;
    }
    routeState.goToSchematic(selection.id);
  }, [routeState]);

  const isViewer = routeState.view === 'viewer';

  return (
    <div className={`dtb-schematics-page${isViewer ? ' dtb-schematics-page--viewer' : ''}`}>
      <SEOHead
        title="Tool Schematics & Diagrams"
        description="Browse exploded-view schematics and parts diagrams for professional drywall finishing tools, then identify the replacement parts you need."
        canonical="/schematics"
        schema={buildBreadcrumbSchema([
          { label: 'Home', path: '/' },
          { label: 'Schematics', path: '/schematics' },
        ])}
      />

      {routeState.view === 'catalog' && !routeState.brandId && (
        <PageHeroBanner
          eyebrow="Parts & Schematics"
          title="Tool Schematics"
          highlight="Identify the Right Part."
          description="Choose a brand and tool to view exploded diagrams, identify components, and continue to matching replacement parts when available."
          align="left"
        />
      )}

      <div className={`dtb-schematics-page__content${isViewer ? ' dtb-schematics-page__content--viewer' : ''}`}>
        {isViewer ? (
          <SchematicViewerPage
            schematicId={routeState.schematicId}
            initialPage={routeState.page}
            initialVariant={routeState.variant}
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
