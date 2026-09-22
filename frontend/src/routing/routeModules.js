import { lazy } from 'react';

const moduleLoaders = {
  products: () => import('../pages/Products'),
  parts: () => import('../pages/Parts'),
  productLegacy: () => import('../pages/Product'),
  productDetail: () => import('../pages/ProductDetailPage'),
  category: () => import('../pages/CategoryLandingPage'),
  schematics: () => import('../pages/SchematicsPage'),
  repairs: () => import('../pages/RepairLanding'),
  repairStart: () => import('../pages/RepairStart'),
  repairPackages: () => import('../pages/RepairPackages'),
  repairTrack: () => import('../pages/RepairTrack'),
  repairStatus: () => import('../pages/RepairStatus'),
  returnStatus: () => import('../pages/ReturnStatus'),
  supportStatus: () => import('../pages/SupportStatus'),
  cart: () => import('../pages/Cart'),
  checkout: () => import('../pages/WooNativeCheckout'),
  checkoutReturn: () => import('../pages/CheckoutReturn'),
  orderConfirmation: () => import('../pages/OrderConfirmation'),
  orderTracking: () => import('../pages/OrderTracking'),
  contact: () => import('../pages/Contact'),
  wooCommerceSettings: () => import('../pages/WooCommerceSettings'),
  login: () => import('../pages/Login'),
  register: () => import('../pages/Register'),
  forgotPassword: () => import('../pages/ForgotPassword'),
  resetPassword: () => import('../pages/ResetPassword'),
  dashboard: () => import('../pages/Dashboard'),
  calculators: () => import('../pages/Calculators'),
  faq: () => import('../pages/FAQ'),
  shippingPolicy: () => import('../pages/ShippingPolicy'),
  returnPortal: () => import('../pages/ReturnPortal'),
  storePolicies: () => import('../pages/StorePolicies'),
  returnPolicy: () => import('../pages/ReturnPolicy'),
  technicalSpecificationsPreview: () => import('../pages/TechnicalSpecificationsPreview'),
};

const modulePromises = new Map();

function loadModule(key) {
  const loader = moduleLoaders[key];
  if (!loader) return Promise.resolve(null);

  if (!modulePromises.has(key)) {
    const promise = loader().catch((error) => {
      modulePromises.delete(key);
      throw error;
    });
    modulePromises.set(key, promise);
  }

  return modulePromises.get(key);
}

function normalizePathname(input) {
  if (!input) return '/';

  try {
    const url = new URL(input, typeof window !== 'undefined' ? window.location.origin : 'https://drywalltoolbox.com');
    let pathname = url.pathname || '/';
    const basename = String(process.env.PUBLIC_URL || '').replace(/\/+$/, '');

    if (basename && basename !== '/' && pathname.startsWith(basename)) {
      pathname = pathname.slice(basename.length) || '/';
    }

    return pathname.startsWith('/') ? pathname : `/${pathname}`;
  } catch {
    const pathname = String(input).split(/[?#]/, 1)[0] || '/';
    return pathname.startsWith('/') ? pathname : `/${pathname}`;
  }
}

export function resolveRouteModuleKey(input) {
  const pathname = normalizePathname(input);

  if (pathname === '/' || pathname === '/all-products' || pathname === '/orders' || pathname === '/rewards' || pathname === '/account-settings' || pathname === '/addresses' || pathname === '/notifications') return null;
  if (pathname === '/products' || pathname.startsWith('/products/brands')) return 'products';
  if (/^\/products\/[^/]+(?:\/variations\/[^/]+)?$/.test(pathname)) return 'productDetail';
  if (pathname === '/parts') return 'parts';
  if (pathname.startsWith('/product/')) return 'productLegacy';
  if (pathname.startsWith('/category/')) return 'category';
  if (pathname === '/schematics') return 'schematics';
  if (pathname === '/repairs') return 'repairs';
  if (pathname === '/repairs/start') return 'repairStart';
  if (pathname === '/repairs/packages') return 'repairPackages';
  if (pathname === '/repairs/track') return 'repairTrack';
  if (pathname.startsWith('/repairs/status/') || pathname.startsWith('/dashboard/repairs/')) return 'repairStatus';
  if (pathname.startsWith('/returns/status/')) return 'returnStatus';
  if (pathname.startsWith('/support/status/')) return 'supportStatus';
  if (pathname === '/returns') return 'returnPortal';
  if (pathname === '/return-policy') return 'returnPolicy';
  if (pathname === '/policies') return 'storePolicies';
  if (pathname === '/cart') return 'cart';
  if (pathname === '/checkout') return 'checkout';
  if (pathname.startsWith('/checkout/')) return 'checkoutReturn';
  if (pathname.startsWith('/order-tracking/')) return 'orderTracking';
  if (pathname.startsWith('/order/')) return 'orderConfirmation';
  if (pathname === '/contact') return 'contact';
  if (pathname === '/settings/woocommerce') return 'wooCommerceSettings';
  if (pathname === '/login') return 'login';
  if (pathname === '/register') return 'register';
  if (pathname === '/forgot-password') return 'forgotPassword';
  if (pathname === '/reset-password') return 'resetPassword';
  if (pathname === '/dashboard') return 'dashboard';
  if (pathname === '/calculators') return 'calculators';
  if (pathname === '/faq') return 'faq';
  if (pathname === '/shipping-policy') return 'shippingPolicy';
  if (pathname === '/preview/technical-specifications') return 'technicalSpecificationsPreview';

  return null;
}

export function preloadRoute(input) {
  const key = resolveRouteModuleKey(input);
  if (!key) return Promise.resolve(null);
  return loadModule(key).catch(() => null);
}

function withChunkReload(key) {
  return loadModule(key).catch((error) => {
    const message = String(error?.message || '');
    const isChunkLoadFailure =
      /ChunkLoadError/i.test(message) ||
      /Loading chunk [\w-]+ failed/i.test(message) ||
      /Failed to fetch dynamically imported module/i.test(message);

    if (isChunkLoadFailure && typeof window !== 'undefined') {
      const retryKey = `dtb:lazy-retry:${window.location.pathname}`;
      const hasRetried = window.sessionStorage.getItem(retryKey) === '1';

      if (!hasRetried) {
        window.sessionStorage.setItem(retryKey, '1');
        window.location.reload();
        return new Promise(() => {});
      }

      window.sessionStorage.removeItem(retryKey);
    }

    throw error;
  });
}

export function createLazyRoute(key) {
  if (!moduleLoaders[key]) {
    throw new Error(`Unknown DTB route module: ${key}`);
  }

  return lazy(() => withChunkReload(key));
}
