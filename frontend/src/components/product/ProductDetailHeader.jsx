import { Link } from 'react-router-dom';
import '../../styles/product-detail-approved-mockup.css';
import '../../styles/product-detail-overview-refinements.css';

function getProductUrl(product) {
  const slug = product?.slug || product?.post_name || '';
  if (slug) return `/products/${slug}`;
  const id = product?.id || product?.part_number || product?.sku || '';
  return id ? `/product/${encodeURIComponent(id)}` : '';
}

function toPlainSummary(value = '') {
  const compact = String(value || '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#039;|&apos;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();

  return compact;
}

function toFinitePrice(value) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function getExplicitSalePrice(product) {
  const priceObject = product?.price && typeof product.price === 'object' ? product.price : null;
  return [product?.sale_price, product?.salePrice, priceObject?.sale]
    .map(toFinitePrice)
    .find((value) => value != null && value > 0) ?? null;
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
  const summary = toPlainSummary(product?.short_description || product?.shortDescription || '');
  const compareAtValue = toFinitePrice(compareAt);
  const rawPriceValue = toFinitePrice(rawPrice);
  const explicitSalePrice = getExplicitSalePrice(product);
  const isVariableParent = Boolean(product?.is_variable || product?.type === 'variable');

  // WooCommerce remains price authority. For simple products, prefer an explicit
  // valid sale price over a stale/regular `price` projection. Selected variations
  // remain driven by ProductDetail's resolved variation price (`rawPrice`).
  const primaryPriceValue = !isVariableParent
    && explicitSalePrice != null
    && compareAtValue != null
    && explicitSalePrice < compareAtValue
    ? explicitSalePrice
    : rawPriceValue;

  const showCompareAt = compareAtValue != null
    && compareAtValue > 0
    && primaryPriceValue != null
    && compareAtValue > primaryPriceValue;
  const primaryPrice = primaryPriceValue != null ? money(primaryPriceValue) : displayPrice;

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
            {pricePrefix}{primaryPrice}
          </span>
          {showCompareAt ? (
            <span className="dtb-pdp-header__compare-at">
              ${money(compareAtValue)}
            </span>
          ) : null}
        </div>
      </div>

      {summary ? <p className="dtb-pdp-header__summary">{summary}</p> : null}
    </header>
  );
}
