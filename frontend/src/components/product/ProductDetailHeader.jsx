import { Link } from 'react-router-dom';
import '../../styles/product-detail-approved-mockup.css';

function getProductUrl(product) {
  const slug = product?.slug || product?.post_name || '';
  if (slug) return `/products/${slug}`;
  const id = product?.id || product?.part_number || product?.sku || '';
  return id ? `/product/${encodeURIComponent(id)}` : '';
}

export default function ProductDetailHeader({
  product,
  productUrl: productUrlOverride,
  effectiveName,
  effectiveSku,
  brandLabel,
  brandLogoSrc,
  brandLogoClassName = '',
  isOutOfStock,
  displayPrice,
  pricePrefix,
  compareAt,
  rawPrice,
  money,
  onProductTitleClick,
}) {
  const productUrl = productUrlOverride || getProductUrl(product);
  const title = effectiveName || product.sku || product.part_number;
  const compareAtValue = Number.parseFloat(compareAt);
  const rawPriceValue = Number.parseFloat(rawPrice);
  const showCompareAt = Number.isFinite(compareAtValue)
    && compareAtValue > 0
    && Number.isFinite(rawPriceValue)
    && compareAtValue > rawPriceValue;

  return (
    <header className="dtb-pdp-header">
      {brandLogoSrc ? (
        <div className="dtb-pdp-header__brand-logo-wrap">
          <img
            src={brandLogoSrc}
            alt={`${brandLabel || 'Product brand'} logo`}
            className={`dtb-pdp-header__brand-logo ${brandLogoClassName}`.trim()}
            loading="eager"
            decoding="async"
          />
        </div>
      ) : brandLabel ? (
        <div className="dtb-pdp-header__brand-eyebrow">{brandLabel}</div>
      ) : null}

      <h1 className="dtb-pdp-header__title">
        {productUrl ? (
          <Link
            to={productUrl}
            className="dtb-pdp-header__title-link"
            onClick={onProductTitleClick}
          >
            {title}
          </Link>
        ) : title}
      </h1>

      <div className="dtb-pdp-header__identity-row">
        {effectiveSku ? (
          <span className="dtb-pdp-header__identity-sku">SKU: {effectiveSku}</span>
        ) : null}
        <span className={`dtb-pdp-header__meta-stock${isOutOfStock ? ' is-out' : ''}`}>
          <span className="dtb-pdp-header__meta-stock-dot" aria-hidden="true" />
          {isOutOfStock ? 'Out of Stock' : 'In Stock'}
        </span>
      </div>

      <div className="dtb-pdp-header__price-block">
        <div className="dtb-pdp-header__price-row" aria-live="polite" aria-atomic="true">
          <span className="dtb-pdp-header__price">
            {pricePrefix}{displayPrice}
          </span>
          {showCompareAt ? (
            <span className="dtb-pdp-header__compare-at">
              ${money(compareAtValue)}
            </span>
          ) : null}
        </div>
      </div>
    </header>
  );
}
