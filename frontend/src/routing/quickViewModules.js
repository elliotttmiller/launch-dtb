let quickViewPromise = null;

export function preloadQuickViewModules() {
  if (!quickViewPromise) {
    quickViewPromise = Promise.all([
      import('../components/product/ProductModal.jsx'),
      import('../components/product/ProductDetail.jsx'),
    ]).catch((error) => {
      quickViewPromise = null;
      throw error;
    });
  }

  return quickViewPromise;
}
