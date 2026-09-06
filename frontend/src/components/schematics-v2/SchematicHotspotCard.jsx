/**
 * frontend/src/components/schematics-v2/SchematicHotspotCard.jsx
 *
 * Ported verbatim (markup, BEM class names, and title auto-fit logic) from
 * the legacy `docs/_working/frontend-legacy/frontend/src/components/schematics/
 * SchematicHotspotCard.jsx`. Styling lives in `mobile-schematic.css` /
 * `schematic-hotspot-card-polish.css` under the `.schematic-hotspot-card*`
 * selectors — do not rename these classes without updating both files.
 *
 * Data wiring: the dtb-schematics REST payload
 * (`GET /wp-json/dtb/v1/schematics/{id}`, see `frontend/src/api/schematicsApi.js`)
 * carries the stored schematic relationship plus a compact, live
 * WooCommerce product/variation projection. That projection is the primary
 * image/price/stock source and avoids one request per opened hotspot. The
 * SKU lookup remains only as backward compatibility while an older backend
 * response may still be cached or deployed.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useHotspotProduct } from '../../hooks/useHotspotProduct';
import { resolveStorefrontUrl } from '../../utils/documentNavigation';

function getTitleFitStyle(name = '') {
  const value = String(name || '').trim();
  const length = value.length;
  const longestToken = value
    .split(/[\s/|,()]+/)
    .reduce((max, token) => Math.max(max, token.length), 0);

  let fontSize = 16;
  if (length > 34) fontSize -= Math.min(5.2, (length - 34) * 0.12);
  if (longestToken > 14) fontSize -= Math.min(1.8, (longestToken - 14) * 0.11);

  fontSize = Math.max(9.5, Math.round(fontSize * 10) / 10);

  return {
    '--hotspot-title-font-size': `${fontSize}px`,
    '--hotspot-title-line-height': fontSize <= 10.5 ? 1.12 : fontSize <= 12 ? 1.16 : 1.2,
    '--hotspot-title-letter-spacing': fontSize <= 11 ? '0.01em' : fontSize <= 13 ? '0.02em' : '0.035em',
  };
}

function StockBadge({ stockStatus }) {
  const label =
    stockStatus === 'instock' ? '● In Stock'
      : stockStatus === 'outofstock' ? '● Out of Stock'
        : stockStatus == null ? '…'
          : '● Unavailable';
  const color =
    stockStatus === 'instock' ? '#16a34a'
      : stockStatus === 'outofstock' ? '#dc2626'
        : '#6b7280';
  return <span style={{ fontWeight: 700, color, fontSize: 'inherit' }}>{label}</span>;
}

function HotspotCardSkeleton({ displayCode, codeLabel }) {
  return (
    <div className="schematic-hotspot-card__skeleton" aria-hidden="true">
      <div className="schematic-hotspot-card__stock">
        <span className="schematic-hotspot-card__stock-skeleton" />
      </div>

      <div className="schematic-hotspot-card__title-skeleton">
        <span />
        <span />
      </div>

      {displayCode ? (
        <div className="schematic-hotspot-card__sku schematic-hotspot-card__sku--loading">
          {codeLabel}: {displayCode}
        </div>
      ) : null}

      <div className="schematic-hotspot-card__footer schematic-hotspot-card__footer--loading">
        <span className="schematic-hotspot-card__price-skeleton" />
        <span className="schematic-hotspot-card__cta-skeleton" />
      </div>
    </div>
  );
}

function resolveHotspotProductUrl(wcProduct, fallbackUrl = '') {
  // Variation resolution already supplies the precise parent-product deep link
  // (`/products/{parentSlug}?variant={variationId}`), so preserve it first.
  if (wcProduct?.product_url) return resolveStorefrontUrl(wcProduct.product_url);
  if (wcProduct?.permalink) return resolveStorefrontUrl(wcProduct.permalink);

  // Normalized simple/variable WooCommerce products expose their canonical
  // product slug but intentionally do not carry WordPress permalink fields.
  // The React storefront owns presentation/routing and its canonical product
  // route is `/products/:slug`; never fall back to WordPress's legacy
  // `?product={slug}` shape when the live product identity is available.
  const slug = String(wcProduct?.slug || '').trim();
  if (slug) return `/products/${encodeURIComponent(slug)}`;

  return resolveStorefrontUrl(fallbackUrl);
}

export default function SchematicHotspotCard({ part, onClose, onAddToCart, addingToCart }) {
  const { addToCart } = useCart();
  const [localAdding, setLocalAdding] = useState(false);

  const projectedProduct = part?.product && typeof part.product === 'object'
    ? part.product
    : null;
  const { product: fetchedProduct, stockStatus: liveStockStatus, isLoading } =
    useHotspotProduct(projectedProduct ? null : part?.sku);

  if (!part) return null;

  const displayName = part.title || 'Part';
  const displayCode = part.sku || part.mpn || '';
  const codeLabel = 'SKU';

  const wcProduct = projectedProduct || fetchedProduct;
  const isStaticResolved = part.resolution_state === 'resolved';
  const isStaticAvailable = part.available !== false;
  const staticStockStatus = isStaticResolved && isStaticAvailable ? 'instock' : 'unknown';

  const hasLiveProduct = Boolean(wcProduct?.id);
  const stockStatus = isLoading
    ? null
    : hasLiveProduct ? (wcProduct.stock_status || liveStockStatus || 'unknown') : staticStockStatus;

  const primaryImage = wcProduct?.images?.[0] || '';
  const parsedPrice = parseFloat(wcProduct?.price);
  const canAddToCart = hasLiveProduct
    && Number.isFinite(parsedPrice)
    && wcProduct?.purchasable !== false
    && stockStatus !== 'outofstock';
  const effectiveProductUrl = resolveHotspotProductUrl(wcProduct, part.product_url || '');
  const isUnavailable = !isLoading && !canAddToCart && !effectiveProductUrl;
  const isAdding = addingToCart === part.part_ref || localAdding;

  const priceLabel = canAddToCart ? `$${parsedPrice.toFixed(2)}` : null;

  const titleNode = effectiveProductUrl ? (
    <Link
      to={effectiveProductUrl}
      onClick={(e) => e.stopPropagation()}
      style={{ color: 'inherit', textDecoration: 'none' }}
      className="hotspot-modal-title-link"
    >
      {displayName}
    </Link>
  ) : displayName;

  const handleAdd = async (event) => {
    event.stopPropagation();
    if (!canAddToCart || isAdding) return;

    if (onAddToCart) {
      onAddToCart();
      return;
    }

    setLocalAdding(true);
    try {
      await addToCart({
        id: wcProduct.id,
        name: wcProduct.name || part.title,
        brand: part.brand,
        price: parsedPrice,
        part_number: wcProduct.sku || part.mpn || part.sku,
        sku: wcProduct.sku || part.sku || part.mpn,
        image: primaryImage,
        permalink: effectiveProductUrl,
      }, 1);
      onClose?.();
    } finally {
      setLocalAdding(false);
    }
  };

  const handleClose = (event) => {
    event.preventDefault();
    event.stopPropagation();
    onClose?.();
  };

  return (
    <div
      className={`schematic-hotspot-card${isLoading ? ' schematic-hotspot-card--resolving' : ''}`}
      aria-busy={isLoading ? 'true' : 'false'}
    >
      <div className="schematic-hotspot-card__image">
        {primaryImage ? (
          <img src={primaryImage} alt={displayName} className="hotspot-modal-image" />
        ) : isLoading ? (
          <div className="hotspot-modal-image-skeleton" aria-hidden="true" />
        ) : null}
      </div>

      <div className="schematic-hotspot-card__info">
        {onClose && (
          <button
            type="button"
            className="schematic-hotspot-card__close"
            onPointerDown={(event) => event.stopPropagation()}
            onPointerUp={(event) => event.stopPropagation()}
            onClick={handleClose}
            aria-label="Close part details"
            style={{
              zIndex: 20,
              pointerEvents: 'auto',
              touchAction: 'manipulation',
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              aria-hidden="true"
              focusable="false"
              style={{ pointerEvents: 'none' }}
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        )}

        {isLoading ? (
          <HotspotCardSkeleton displayCode={displayCode} codeLabel={codeLabel} />
        ) : (
          <>
            <div className="schematic-hotspot-card__stock">
              <StockBadge stockStatus={stockStatus} />
            </div>

            <h3 className="schematic-hotspot-card__title" style={getTitleFitStyle(displayName)}>
              {titleNode}
            </h3>

            {displayCode ? (
              <div className="schematic-hotspot-card__sku">
                {codeLabel}: {displayCode}
              </div>
            ) : null}

            <div className="schematic-hotspot-card__footer">
              {canAddToCart ? (
                <>
                  <span className="schematic-hotspot-card__price-group">
                    <span className="schematic-hotspot-card__price">{priceLabel}</span>
                  </span>
                  <button
                    type="button"
                    className="schematic-hotspot-card__cta"
                    disabled={isAdding}
                    onClick={handleAdd}
                    data-dtb-cart-action="add"
                  >
                    {isAdding ? 'Adding…' : 'Add'}
                  </button>
                </>
              ) : !isUnavailable ? (
                <Link
                  to={effectiveProductUrl}
                  onClick={(e) => { e.stopPropagation(); onClose?.(); }}
                  className="schematic-hotspot-card__cta"
                  style={{ textDecoration: 'none', textAlign: 'center' }}
                >
                  View
                </Link>
              ) : null}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
