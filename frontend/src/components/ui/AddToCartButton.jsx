import { ShoppingCart } from 'lucide-react';

const SIZE_CLASSES = {
  compact: 'dtb-add-to-cart--compact',
  card: 'dtb-add-to-cart--card',
  default: 'dtb-add-to-cart--default',
  wide: 'dtb-add-to-cart--wide',
};

export default function AddToCartButton({
  label = 'Add to Cart',
  pendingLabel = 'Adding…',
  state = 'idle',
  size = 'default',
  productId,
  feedbackMode,
  cartAction = true,
  className = '',
  children,
  disabled,
  type = 'button',
  ...buttonProps
}) {
  const normalizedState = ['adding', 'added'].includes(state) ? state : 'idle';
  const visibleLabel = normalizedState === 'adding' ? pendingLabel : label;
  const classes = [
    'dtb-add-to-cart',
    SIZE_CLASSES[size] || SIZE_CLASSES.default,
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      {...buttonProps}
      type={type}
      disabled={disabled}
      className={classes}
      data-state={normalizedState}
      data-dtb-cart-action={cartAction ? 'add' : undefined}
      data-dtb-cart-product-id={productId != null ? String(productId) : undefined}
      data-dtb-cart-feedback-mode={feedbackMode}
      aria-busy={normalizedState === 'adding' || undefined}
    >
      <span className="dtb-add-to-cart__surface" aria-hidden="true" />
      <span className="dtb-add-to-cart__content">
        <ShoppingCart className="dtb-add-to-cart__cart" aria-hidden="true" />
        <span className="dtb-add-to-cart__label">{children || visibleLabel}</span>
      </span>
      <span className="dtb-add-to-cart__success" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path className="dtb-add-to-cart__success-check" fill="none" d="m5.5 12.5 4.2 4.2 8.8-9.4" />
        </svg>
      </span>
      {normalizedState === 'added' ? (
        <span className="sr-only" role="status" aria-live="polite">Added to cart</span>
      ) : null}
    </button>
  );
}
