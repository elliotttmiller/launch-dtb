import './bootstrapRuntimeAssetBase.js';
import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import '@fontsource-variable/geist/wght.css';
import '@fontsource-variable/geist/wght-italic.css';

/* Canonical global order: utilities -> tokens -> layout foundation. */
import './index.css';
import './styles/storefront-tokens.css';
import './styles/responsive-foundation.css';

/* Shared feature and component authorities. */
import './styles/machined-design.css';
import './styles/tool-selector.css';
import './styles/technical-specifications.css';
import './styles/product-detail-modern.css';
import './styles/product-variation-selector-overlay.css';
import './styles/reviews.css';
import './styles/hero-section.css';
import './styles/trusted-brands.css';
import './styles/home-hero.css';
import './styles/storefront-shell.css';
import './styles/storefront-sections.css';
import './styles/storefront-product-card.css';
import './styles/storefront-drawer.css';
import './styles/storefront-cart-sheet.css';
import './styles/storefront-search-product-cards.css';
import './styles/storefront-visibility.css';
import './styles/account-hub.css';
import './styles/account-hub-motion.css';
import './styles/account-hub-cta.css';
import './styles/order-item-images.css';
import './styles/order-tracking-layout.css';
import './styles/order-checkout-font-consistency.css';
import './styles/global-loading.css';
import './styles/cart-interaction-feedback.css';
import './styles/add-to-cart-button.css';
import './styles/loading-transitions.css';
import './styles/cart-page.css';
import './styles/global-typography.css';
import './styles/product-detail-typography.css';
import './styles/product-detail-production.css';
import './styles/product-detail-desktop-polish.css';
import './styles/product-detail-approved-mockup.css';
/* Product description/tabs are a feature presentation authority and load after
 * the PDP production layers so their narrow-screen component rules can replace
 * legacy grid-tab behavior without escalating specificity. */
import './styles/product-detail-description.css';
import './components/catalog/products-selector-overrides.css';
/* Selector grids/cards are shared presentation across product brand/category
 * discovery and schematics. Domain modules continue to own data and routing. */
import './styles/selector-cards.css';

/* Shared timing/easing authority loads after feature appearance styles so
 * component geometry remains local while transition behavior stays global. */
import './styles/storefront-motion.css';

/* Final and exclusive cross-route responsive authority. */
import './styles/unified-responsive.css';

import App from './App.jsx';
import ErrorBoundary from './components/system/AppErrorBoundary.jsx';
import GlobalMotionProvider from './components/motion/GlobalMotionProvider.jsx';
import { installRepairPackageSelectionRuntime } from './utils/repairPackageSelectionRuntime.js';
import { installCustomerFacingCopyRuntime } from './utils/customerFacingCopyRuntime.js';
import { prewarmCatalog } from './services/catalog.js';

// Note: the legacy schematicPageLabelRuntime / mobileSchematicNavRuntime
// global DOM/history runtimes were schematics-only compatibility shims for
// the old, now-removed frontend/src/pages/Schematics.jsx implementation.
// The /schematics route (frontend/src/pages/SchematicsPage.jsx) owns page
// labels and navigation directly through React state and React Router.
installRepairPackageSelectionRuntime();
installCustomerFacingCopyRuntime();

if (typeof window !== 'undefined') {
  const pathname = window.location.pathname.replace(/^\/drywall-toolbox(?=\/|$)/, '') || '/';
  const isCatalogRoute = pathname.startsWith('/products') || pathname.startsWith('/parts');
  const isHomePage = pathname === '/';
  const CATALOG_PREWARM_TIMEOUT_MS = 5000;

  if (!isCatalogRoute) {
    const scheduleCatalogPrewarm = () => prewarmCatalog();
    if (isHomePage) {
      scheduleCatalogPrewarm();
    } else {
      window.setTimeout(scheduleCatalogPrewarm, CATALOG_PREWARM_TIMEOUT_MS);
    }
  }
}

function markAppMounted() {
  if (typeof document !== 'undefined') {
    document.documentElement.classList.remove('dtb-document-transition-active');
    document.documentElement.classList.remove('dtb-checkout-handoff-active');
    document.documentElement.setAttribute('data-dtb-app-mounted', 'true');
  }
}

function AppBootMarker() {
  useEffect(() => {
    markAppMounted();
  }, []);

  return null;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <GlobalMotionProvider>
        <>
          <AppBootMarker />
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
        </>
      </GlobalMotionProvider>
    </HelmetProvider>
  </StrictMode>,
);
