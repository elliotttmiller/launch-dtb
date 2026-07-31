import { LockKeyhole, Minus, Plus, RotateCcw, Truck } from 'lucide-react';
import ProductBuyNow from './ProductBuyNow.jsx';
import AddToCartButton from '../ui/AddToCartButton.jsx';

export default function ProductPurchasePanel({
  quantity,
  onDecrease,
  onIncrease,
  onQuantityChange,
  onAddToCart,
  onBuyNow,
  isBuyNowPending,
  canBuyNow,
  canAddToCart,
  isOutOfStock,
  needsVariation,
  hasCompleteSelection,
  addToCartState = 'idle',
}) {
  const handleInputChange = (e) => {
    const val = parseInt(e.target.value, 10);
    if (Number.isFinite(val) && val >= 1 && val <= 99) {
      onQuantityChange?.(val);
    }
  };

  const addToCartPending = addToCartState === 'adding' || addToCartState === 'added';
  const purchaseBusy = addToCartPending || isBuyNowPending;
  const addToCartLabel = isOutOfStock
    ? 'Out of Stock'
    : needsVariation && !hasCompleteSelection
      ? 'Select Options'
      : 'Add to Cart';
  const buyNowDisabledReason = isOutOfStock
    ? 'This product is currently out of stock.'
    : needsVariation && !hasCompleteSelection
      ? 'Select all required product options before continuing to secure checkout.'
      : '';

  return (
    <div
      className="product-detail-purchase-panel dtb-pdp-purchase-panel"
      aria-busy={purchaseBusy}
    >
      <div className="dtb-pdp-purchase-row">
        <div className="dtb-pdp-qty-root" role="group" aria-label="Quantity">
          <button
            type="button"
            onClick={onDecrease}
            disabled={purchaseBusy || quantity <= 1}
            className="dtb-pdp-qty-btn"
            aria-label="Decrease quantity"
          >
            <Minus size={14} strokeWidth={2.5} />
          </button>
          <input
            type="number"
            className="dtb-pdp-qty-input"
            value={quantity}
            min={1}
            max={99}
            onChange={handleInputChange}
            disabled={purchaseBusy}
            aria-label="Quantity"
          />
          <button
            type="button"
            onClick={onIncrease}
            disabled={purchaseBusy || quantity >= 99}
            className="dtb-pdp-qty-btn"
            aria-label="Increase quantity"
          >
            <Plus size={14} strokeWidth={2.5} />
          </button>
        </div>

        <AddToCartButton
          onClick={onAddToCart}
          disabled={!canAddToCart || purchaseBusy}
          className="dtb-pdp-add-to-cart"
          size="wide"
          label={addToCartLabel}
          state={addToCartState}
          feedbackMode="controlled"
        />
      </div>

      <ProductBuyNow
        onBuyNow={onBuyNow}
        pending={isBuyNowPending}
        disabled={!canBuyNow || addToCartPending}
        disabledReason={buyNowDisabledReason}
      />

      <div className="dtb-pdp-trust-row" aria-label="Purchase assurances">
        <div><LockKeyhole aria-hidden="true" /><span><strong>Secure Checkout</strong><small>SSL encrypted payments</small></span></div>
        <div><Truck aria-hidden="true" /><span><strong>Fast Shipping</strong><small>Orders ship same day</small></span></div>
        <div><RotateCcw aria-hidden="true" /><span><strong>Easy Returns</strong><small>90-day returns</small></span></div>
      </div>
    </div>
  );
}
