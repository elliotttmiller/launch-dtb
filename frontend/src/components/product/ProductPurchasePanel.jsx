import { Link } from 'react-router-dom';
import { Minus, Plus } from 'lucide-react';
import ProductBuyNow from './ProductBuyNow.jsx';
import AddToCartButton from '../ui/AddToCartButton.jsx';

export default function ProductPurchasePanel({
  quantity,
  onDecrease,
  onIncrease,
  onQuantityChange,
  onAddToCart,
  onBuyNow,
  buyNowState = 'idle',
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
  const isBuyNowPending = buyNowState === 'pending' || buyNowState === 'confirmed';
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
      <span className="dtb-pdp-purchase-panel__quantity-label">Quantity</span>
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
          suspended={canAddToCart && isBuyNowPending}
          className="dtb-pdp-add-to-cart"
          size="wide"
          label={addToCartLabel}
          state={addToCartState}
          feedbackMode="controlled"
        />
      </div>

      <ProductBuyNow
        onBuyNow={onBuyNow}
        status={buyNowState}
        disabled={!canBuyNow || addToCartPending}
        suspended={canBuyNow && addToCartPending}
        disabledReason={buyNowDisabledReason}
      />

      <div className="dtb-pdp-assurance-row" aria-label="Purchase information">
        <div>
          <strong>Secure Checkout</strong>
          <span>Payments processed securely</span>
        </div>
        <div>
          <strong>Shipping</strong>
          <span>Calculated at checkout</span>
        </div>
        <div>
          <strong>Returns</strong>
          <span><Link to="/return-policy">View return policy</Link></span>
        </div>
      </div>
    </div>
  );
}
