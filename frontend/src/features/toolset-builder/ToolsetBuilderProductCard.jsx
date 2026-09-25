import { useMemo, useState } from 'react';
import { Check, ChevronDown, PackageCheck, RefreshCw } from 'lucide-react';
import { fetchToolsetVariations, normalizeToolsetSelection } from '../../api/toolsetBuilderApi.js';
import { resolveBrandLogo } from '../../utils/brandLogoAssets.js';

function formatCurrency(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 'Price unavailable';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(number);
}

function productPrice(product) {
  const value = product?.cardProduct?.price ?? product?.price?.value ?? product?.price ?? null;
  return Number.isFinite(Number(value)) ? Number(value) : null;
}

function productImage(product) {
  return product?.media?.image || product?.cardProduct?.image || product?.image || '';
}

function productBrand(product) {
  return product?.brand?.label || product?.brandLabel || '';
}

function productStockStatus(product) {
  return product?.inventory?.stockStatus || product?.cardProduct?.stockStatus || 'instock';
}

function variationLabel(variation) {
  return variation?.variation?.label
    || variation?.variation?.value
    || variation?.variationLabel
    || variation?.sku
    || 'Option';
}

export default function ToolsetBuilderProductCard({
  product,
  selectedItems = [],
  maximum = 1,
  onSelect,
  onRemove,
}) {
  const [variationOpen, setVariationOpen] = useState(false);
  const [variations, setVariations] = useState([]);
  const [variationLoading, setVariationLoading] = useState(false);
  const [variationError, setVariationError] = useState('');
  const [selectedVariationId, setSelectedVariationId] = useState('');

  const isVariable = product?.type === 'variable';
  const selectedProductItems = useMemo(
    () => selectedItems.filter((item) => Number(item.productId) === Number(product?.id)),
    [product?.id, selectedItems],
  );
  const isSelected = selectedProductItems.length > 0;
  const atMaximum = selectedItems.length >= Number(maximum || 1);
  const stockStatus = productStockStatus(product);
  const isOutOfStock = stockStatus === 'outofstock';
  const image = productImage(product);
  const price = productPrice(product);
  const brand = productBrand(product);
  const brandLogo = resolveBrandLogo(product?.brand || brand);
  const selectedVariationSku = isVariable
    ? selectedProductItems.find((item) => item?.variationId)?.sku || ''
    : '';
  const activeVariation = variations.find(
    (item) => String(item?.id || item?.variationId) === String(selectedVariationId),
  );
  const displayedSku = isVariable
    ? activeVariation?.sku || selectedVariationSku
    : product?.sku || '';

  const requestVariations = async () => {
    if (variationLoading) return;

    setVariationLoading(true);
    setVariationError('');

    try {
      const payload = await fetchToolsetVariations(product?.id);
      setVariations(Array.isArray(payload?.variations) ? payload.variations : []);
    } catch (error) {
      setVariations([]);
      setVariationError(error?.message || 'Could not load options for this product.');
    } finally {
      setVariationLoading(false);
    }
  };

  const toggleVariations = () => {
    const nextOpen = !variationOpen;
    setVariationOpen(nextOpen);
    if (nextOpen && variations.length === 0 && !variationLoading) {
      void requestVariations();
    }
  };

  const handleSimpleSelect = () => {
    if (isSelected) {
      selectedProductItems.forEach((item) => onRemove?.(item.key));
      return;
    }
    if (atMaximum || isOutOfStock) return;
    onSelect?.(normalizeToolsetSelection(product));
  };

  const handleVariationSelect = () => {
    const variation = variations.find((item) => String(item?.id || item?.variationId) === String(selectedVariationId));
    if (!variation) return;

    const normalized = normalizeToolsetSelection(product, variation);
    const alreadySelected = selectedItems.some((item) => item.key === normalized.key);
    if (alreadySelected) {
      onRemove?.(normalized.key);
      return;
    }
    if (atMaximum || normalized.stockStatus === 'outofstock') return;
    onSelect?.(normalized);
  };

  const activeVariationSelection = activeVariation
    ? normalizeToolsetSelection(product, activeVariation)
    : null;
  const activeVariationAlreadySelected = activeVariationSelection
    ? selectedItems.some((item) => item.key === activeVariationSelection.key)
    : false;

  return (
    <article className={'dtb-toolset-product-card' + (isSelected ? ' is-selected' : '')}>
      <div className="dtb-toolset-product-card__media">
        {image ? (
          <img
            src={image}
            alt=""
            width="420"
            height="320"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <span className="dtb-toolset-product-card__media-placeholder" aria-hidden="true">
            <PackageCheck size={34} />
          </span>
        )}
        {isSelected ? (
          <span className="dtb-toolset-product-card__selected-badge">
            <Check size={14} aria-hidden="true" />
            Selected
          </span>
        ) : null}
      </div>

      <div className="dtb-toolset-product-card__body">
        <div className="dtb-toolset-product-card__identity">
          {brandLogo ? (
            <span className="dtb-toolset-product-card__brand-logo-wrap">
              <img
                src={brandLogo}
                alt={`${brand || 'Product brand'} logo`}
                className="dtb-toolset-product-card__brand-logo"
                loading="lazy"
                decoding="async"
              />
            </span>
          ) : brand ? (
            <span className="dtb-toolset-product-card__brand">{brand}</span>
          ) : null}
          <h3>{product?.name || 'Unnamed product'}</h3>
          {displayedSku ? <span className="dtb-toolset-product-card__sku">SKU {displayedSku}</span> : null}
        </div>

        <div className="dtb-toolset-product-card__commerce">
          <strong>{formatCurrency(price)}</strong>
          <span className={'dtb-toolset-product-card__stock ' + (isOutOfStock ? 'is-out' : 'is-in')}>
            {isOutOfStock ? 'Out of stock' : 'Available'}
          </span>
        </div>

        {isVariable ? (
          <div className="dtb-toolset-product-card__variation">
            <button
              type="button"
              className="dtb-toolset-product-card__options-toggle"
              onClick={toggleVariations}
              aria-expanded={variationOpen}
            >
              <span>Choose configuration</span>
              <ChevronDown size={17} aria-hidden="true" />
            </button>

            {variationOpen ? (
              <div className="dtb-toolset-product-card__variation-panel">
                {variationLoading ? (
                  <div className="dtb-toolset-product-card__variation-status" role="status">
                    <RefreshCw size={16} aria-hidden="true" />
                    Loading options…
                  </div>
                ) : variationError ? (
                  <div className="dtb-toolset-product-card__variation-error" role="alert">
                    <span>{variationError}</span>
                    <button type="button" onClick={() => void requestVariations()}>
                      Retry
                    </button>
                  </div>
                ) : variations.length === 0 ? (
                  <p className="dtb-toolset-product-card__variation-status">No purchasable configurations are available.</p>
                ) : (
                  <>
                    <label htmlFor={'toolset-variation-' + product.id}>Configuration</label>
                    <select
                      id={'toolset-variation-' + product.id}
                      value={selectedVariationId}
                      onChange={(event) => setSelectedVariationId(event.target.value)}
                    >
                      <option value="">Select an option</option>
                      {variations.map((variation) => {
                        const id = variation?.id || variation?.variationId;
                        const stock = variation?.inventory?.stockStatus || variation?.stockStatus || 'instock';
                        const priceValue = variation?.price?.value ?? variation?.price ?? null;
                        return (
                          <option key={id} value={id} disabled={stock === 'outofstock'}>
                            {variationLabel(variation)} · {formatCurrency(priceValue)}
                            {stock === 'outofstock' ? ' · Out of stock' : ''}
                          </option>
                        );
                      })}
                    </select>
                    <button
                      type="button"
                      className="dtb-toolset-product-card__select"
                      disabled={!selectedVariationId || (atMaximum && !activeVariationAlreadySelected)}
                      onClick={handleVariationSelect}
                    >
                      {activeVariationAlreadySelected ? 'Remove selection' : 'Select configuration'}
                    </button>
                  </>
                )}
              </div>
            ) : null}
          </div>
        ) : (
          <button
            type="button"
            className="dtb-toolset-product-card__select"
            disabled={(atMaximum && !isSelected) || isOutOfStock}
            onClick={handleSimpleSelect}
          >
            {isSelected ? 'Remove selection' : atMaximum ? 'Selection limit reached' : 'Select tool'}
          </button>
        )}
      </div>
    </article>
  );
}
