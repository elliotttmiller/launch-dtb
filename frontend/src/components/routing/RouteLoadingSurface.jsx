function getSurfaceVariant(pathname = '/') {
  if (/^\/products\/[^/]+(?:\/variations\/[^/]+)?$/.test(pathname) || pathname.startsWith('/product/')) return 'product';
  if (pathname === '/products' || pathname.startsWith('/products/brands') || pathname === '/parts' || pathname.startsWith('/category/')) return 'catalog';
  if (pathname === '/dashboard' || pathname.startsWith('/settings/') || pathname.startsWith('/dashboard/')) return 'account';
  return 'content';
}

export default function RouteLoadingSurface({ pathname = '/', label = 'Loading page' }) {
  const variant = getSurfaceVariant(pathname);

  return (
    <section className={`dtb-route-pending dtb-route-pending--${variant}`} role="status" aria-live="polite" aria-busy="true" aria-label={label}>
      <span className="sr-only">{label}</span>
      {variant === 'product' ? (
        <div className="dtb-route-pending__product" aria-hidden="true">
          <div className="dtb-route-pending__media dtb-route-pending__block" />
          <div className="dtb-route-pending__stack">
            <div className="dtb-route-pending__line dtb-route-pending__line--short" />
            <div className="dtb-route-pending__line dtb-route-pending__line--title" />
            <div className="dtb-route-pending__line dtb-route-pending__line--medium" />
            <div className="dtb-route-pending__panel dtb-route-pending__block" />
          </div>
        </div>
      ) : variant === 'catalog' ? (
        <div className="dtb-route-pending__catalog" aria-hidden="true">
          <div className="dtb-route-pending__heading">
            <div className="dtb-route-pending__line dtb-route-pending__line--short" />
            <div className="dtb-route-pending__line dtb-route-pending__line--title" />
          </div>
          <div className="dtb-route-pending__grid">
            {Array.from({ length: 6 }, (_, index) => <div className="dtb-route-pending__card dtb-route-pending__block" key={index} />)}
          </div>
        </div>
      ) : (
        <div className="dtb-route-pending__content" aria-hidden="true">
          <div className="dtb-route-pending__line dtb-route-pending__line--short" />
          <div className="dtb-route-pending__line dtb-route-pending__line--title" />
          <div className="dtb-route-pending__panel dtb-route-pending__block" />
        </div>
      )}
    </section>
  );
}
