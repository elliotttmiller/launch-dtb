import { Link } from 'react-router-dom';
import { ShoppingCart, X, Package, Minus, Plus, ArrowRight, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, lazy, Suspense } from 'react';
import { useCart } from '../../context/CartContext.jsx';
import ProductModal from '../product/ProductModal.jsx';

// ProductDetail (~19KB gzip) is only needed when the cart-sheet quick-view
// modal is actually opened, but was previously a static import here — pulling
// the full quick-view component into every page's initial bundle even though
// most page loads never open the cart sheet. Lazy-load it on first open.
const ProductDetail = lazy(() => import('../product/ProductDetail.jsx'));
import { getProduct, getProductVariations } from '../../services/api.js';
import { getVariationSelectionMap } from '../../utils/variationSelection.js';

const CART_QTY_SYNC_DELAY_MS = 260;
const MAX_CART_QUANTITY = 99;
const CHECKOUT_HREF = `${ ( process.env.PUBLIC_URL || '' ).replace( /\/+$/, '' ) }/checkout`;

function getCartItemKey(item) {
  return String(item?.cartKey || item?.key || item?.id || '');
}

function getDisplayQuantity(item, localQuantities) {
  const key = getCartItemKey(item);
  const localQty = Number(localQuantities[key]);
  const itemQty = Number(item?.quantity);
  if (Number.isFinite(localQty) && localQty >= 1) return localQty;
  if (Number.isFinite(itemQty) && itemQty >= 1) return itemQty;
  return 1;
}

function toNumericId(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function getCartItemSku(item) {
  return String(item?.sku || item?.part_number || item?.raw?.sku || '').trim();
}

function buildFallbackProductFromCartItem(item) {
  const image = item?.image || '';
  const sku = getCartItemSku(item);
  const id = toNumericId(item?.parent_id) || toNumericId(item?.id) || sku || getCartItemKey(item);

  return {
    id,
    name: item?.name || sku || 'Product',
    brand: item?.brand || '',
    sku,
    part_number: sku,
    price: Number(item?.price) || 0,
    regular_price: item?.price != null ? String(item.price) : '',
    sale_price: '',
    image,
    images: image ? [image] : [],
    stock_status: 'instock',
    type: 'simple',
    is_variable: false,
    variation_attributes: [],
    variation_attribute_values: null,
    attributes: [],
    meta_data: [],
    short_description: '',
    description_full: '',
    _source: 'cart-fallback',
  };
}

function buildFallbackVariationFromCartItem(item) {
  const fallback = buildFallbackProductFromCartItem(item);
  return {
    ...fallback,
    id: toNumericId(item?.variation_id) || toNumericId(item?.id) || fallback.id,
    parent_id: toNumericId(item?.parent_id) || null,
    type: 'variation',
    is_variable: false,
    variation_attribute_values: Array.isArray(item?.variation_attribute_values)
      ? item.variation_attribute_values
      : [],
    variation_attribute: item?.variation_name || '',
  };
}

function findCartItemVariation(variations, item) {
  if (!Array.isArray(variations) || variations.length === 0) return null;

  const variationId = toNumericId(item?.variation_id) || toNumericId(item?.id);
  const sku = getCartItemSku(item).toLowerCase();

  return variations.find((variation) => (
    (variationId && String(variation?.id) === String(variationId))
    || (sku && String(variation?.sku || variation?.part_number || '').trim().toLowerCase() === sku)
  )) || null;
}

export default function StorefrontCartSheet({
  isOpen,
  onClose,
  cartItems = [],
  removeFromCart,
  updateQuantity,
  clearCart,
  isMutating = false,
}) {
  const { addToCart } = useCart();
  const overlayRef = useRef(null);
  const closeButtonRef = useRef(null);
  const previouslyFocusedRef = useRef(null);
  const syncTimersRef = useRef(new Map());
  const syncingKeysRef = useRef(new Set());
  const localQuantitiesRef = useRef({});

  const [removingKey, setRemovingKey] = useState(null);
  const [isClearing, setIsClearing] = useState(false);
  const [syncingKeys, setSyncingKeys] = useState(() => new Set());
  const [localQuantities, setLocalQuantities] = useState({});
  const [productModalState, setProductModalState] = useState(null);
  const [productModalLoadingKey, setProductModalLoadingKey] = useState('');

  const setItemSyncing = useCallback((key, isSyncing) => {
    if (!key) return;
    const next = new Set(syncingKeysRef.current);
    if (isSyncing) next.add(key);
    else next.delete(key);
    syncingKeysRef.current = next;
    setSyncingKeys(next);
  }, []);

  const clearQuantityTimer = useCallback((key) => {
    const timer = syncTimersRef.current.get(key);
    if (timer) {
      window.clearTimeout(timer);
      syncTimersRef.current.delete(key);
    }
  }, []);

  const handleClose = useCallback(() => {
    if (overlayRef.current?.contains(document.activeElement)) {
      document.activeElement?.blur?.();
    }
    setProductModalState(null);
    onClose?.();
  }, [onClose]);

  const handleNavAndClose = useCallback((event) => {
    event.currentTarget?.blur?.();
    handleClose();
  }, [handleClose]);

  const closeProductModal = useCallback(() => {
    setProductModalState(null);
    setProductModalLoadingKey('');
  }, []);

  const handleProductModalAddToCart = useCallback(async (product, quantity = 1) => {
    await addToCart(product, quantity);
  }, [addToCart]);

  const handleOpenProduct = useCallback(async (item) => {
    const key = getCartItemKey(item);
    if (!item || !key || productModalLoadingKey === key) return;

    const fallbackProduct = buildFallbackProductFromCartItem(item);
    const fallbackVariation = buildFallbackVariationFromCartItem(item);
    const parentId = toNumericId(item?.parent_id);
    const variationId = toNumericId(item?.variation_id);

    setProductModalLoadingKey(key);

    try {
      let parentProduct = null;
      let selectedVariation = null;
      let initialVariations = [];

      if (parentId) {
        parentProduct = await getProduct(parentId);
        initialVariations = await getProductVariations(parentId);
        selectedVariation = findCartItemVariation(initialVariations, item) || fallbackVariation;
      } else {
        const fetchedProduct = await getProduct(item.id);
        if (fetchedProduct?.parent_id) {
          parentProduct = await getProduct(fetchedProduct.parent_id);
          initialVariations = await getProductVariations(fetchedProduct.parent_id);
          selectedVariation = findCartItemVariation(initialVariations, item) || fetchedProduct;
        } else {
          parentProduct = fetchedProduct || fallbackProduct;
        }
      }

      const shouldSeedVariation = Boolean(selectedVariation && (parentId || variationId || selectedVariation?.parent_id));

      setProductModalState({
        key,
        product: parentProduct || fallbackProduct,
        initialVariations,
        initialResolvedVariation: shouldSeedVariation ? selectedVariation : null,
        initialSelectedAttrs: shouldSeedVariation ? getVariationSelectionMap(selectedVariation) : {},
      });
    } catch {
      setProductModalState({
        key,
        product: fallbackProduct,
        initialVariations: [],
        initialResolvedVariation: null,
        initialSelectedAttrs: {},
      });
    } finally {
      setProductModalLoadingKey((current) => (current === key ? '' : current));
    }
  }, [productModalLoadingKey]);

  const handleRemove = useCallback(async (key) => {
    if (!key || removingKey === key || isClearing) return;
    clearQuantityTimer(key);
    setItemSyncing(key, false);
    setRemovingKey(key);

    try {
      await removeFromCart?.(key);
    } finally {
      setRemovingKey((current) => (current === key ? null : current));
    }
  }, [clearQuantityTimer, isClearing, removeFromCart, removingKey, setItemSyncing]);

  const handleClearCart = useCallback(async () => {
    if (cartItems.length === 0 || isClearing || isMutating) return;

    syncTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    syncTimersRef.current.clear();
    syncingKeysRef.current = new Set();
    setSyncingKeys(new Set());
    setIsClearing(true);

    try {
      await clearCart?.();
    } catch {
      // CartContext restores the optimistic snapshot and exposes the error.
    } finally {
      setIsClearing(false);
    }
  }, [cartItems.length, clearCart, isClearing, isMutating]);

  const scheduleQuantitySync = useCallback((key, quantity) => {
    clearQuantityTimer(key);
    setItemSyncing(key, true);

    const timer = window.setTimeout(async () => {
      syncTimersRef.current.delete(key);
      try {
        await updateQuantity?.(key, quantity);
      } finally {
        setItemSyncing(key, false);
      }
    }, CART_QTY_SYNC_DELAY_MS);

    syncTimersRef.current.set(key, timer);
  }, [clearQuantityTimer, setItemSyncing, updateQuantity]);

  const handleQtyChange = useCallback((key, delta, currentQty) => {
    if (!key || removingKey === key || isClearing) return;

    const baseQty = Number(localQuantitiesRef.current[key] ?? currentQty);
    const nextQuantity = (Number.isFinite(baseQty) ? baseQty : 1) + Number(delta || 0);

    if (nextQuantity < 1) {
      handleRemove(key);
      return;
    }

    if (nextQuantity > MAX_CART_QUANTITY) return;

    setLocalQuantities((current) => {
      const next = { ...current, [key]: nextQuantity };
      localQuantitiesRef.current = next;
      return next;
    });

    scheduleQuantitySync(key, nextQuantity);
  }, [handleRemove, isClearing, removingKey, scheduleQuantitySync]);

  useEffect(() => {
    const next = {};
    const activeSyncKeys = syncingKeysRef.current;

    for (const item of cartItems) {
      const key = getCartItemKey(item);
      if (!key) continue;
      const localQty = localQuantitiesRef.current[key];
      next[key] = activeSyncKeys.has(key) && Number.isFinite(Number(localQty))
        ? Number(localQty)
        : item.quantity;
    }

    localQuantitiesRef.current = next;
    setLocalQuantities(next);
  }, [cartItems]);

  useEffect(() => () => {
    syncTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    syncTimersRef.current.clear();
  }, []);

  useEffect(() => {
    if (isOpen) {
      previouslyFocusedRef.current = document.activeElement;
      closeButtonRef.current?.focus?.();
      return;
    }

    closeProductModal();

    if (previouslyFocusedRef.current?.focus) {
      previouslyFocusedRef.current.focus();
    }
  }, [isOpen, closeProductModal]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        handleClose();
        return;
      }
      if (event.key !== 'Tab' || !overlayRef.current) return;

      const focusable = Array.from(overlayRef.current.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )).filter((element) => element.getClientRects().length > 0);
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, handleClose]);

  const subtotal = useMemo(
    () => cartItems.reduce((total, item) => total + (Number(item.price) || 0) * getDisplayQuantity(item, localQuantities), 0),
    [cartItems, localQuantities]
  );

  const itemCount = useMemo(
    () => cartItems.reduce((count, item) => count + getDisplayQuantity(item, localQuantities), 0),
    [cartItems, localQuantities]
  );

  return (
    <div
      ref={overlayRef}
      className={`cart-overlay${isOpen ? ' active' : ''}`}
      onClick={handleClose}
      aria-hidden={!isOpen}
      inert={!isOpen ? true : undefined}
    >
      <aside
        className="cart-panel storefront-cart-sheet"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal={isOpen ? 'true' : 'false'}
        aria-label="Shopping cart"
      >
        <header className="scs-header">
          <div className="scs-header-left">
            <div className="scs-header-icon">
              <ShoppingCart size={15} strokeWidth={2.3} />
            </div>
            <h3 className="scs-title">Your Toolbox</h3>
            {itemCount > 0 && (
              <span className="scs-count">{itemCount}</span>
            )}
          </div>
          <div className="scs-header-actions">
            {cartItems.length > 0 ? (
              <button
                type="button"
                className="scs-clear-cart"
                onClick={handleClearCart}
                disabled={isClearing || isMutating}
                aria-label="Clear all items from cart"
                aria-busy={isClearing ? 'true' : 'false'}
              >
                <Trash2 size={14} strokeWidth={2.2} aria-hidden="true" />
                <span>{isClearing ? 'Clearing' : 'Clear cart'}</span>
              </button>
            ) : null}
            <button ref={closeButtonRef} type="button" onClick={handleClose} aria-label="Close cart" className="scs-close">
              <X size={17} strokeWidth={2.5} />
            </button>
          </div>
        </header>

        <div className="scs-body">
          {cartItems.length === 0 ? (
            <div className="scs-empty">
              <div className="scs-empty-icon">
                <Package size={30} strokeWidth={1.3} />
              </div>
              <strong className="scs-empty-title">Your cart is empty</strong>
              <p className="scs-empty-body">Add products to get started.</p>
              <Link to="/products" onClick={handleNavAndClose} className="scs-browse-btn">
                Browse Products
              </Link>
            </div>
          ) : (
            <ul className="scs-item-list" role="list">
              {cartItems.map((item) => {
                const key = getCartItemKey(item);
                const quantity = getDisplayQuantity(item, localQuantities);
                const isSyncing = syncingKeys.has(key);
                const isRemoving = removingKey === key;
                const isPreviewLoading = productModalLoadingKey === key;
                const skuText = getCartItemSku(item);
                const lineTotal = ((Number(item.price) || 0) * quantity).toFixed(2);

                return (
                  <li
                    key={key}
                    className={`scs-item${isSyncing ? ' scs-item--syncing' : ''}${isRemoving ? ' scs-item--removing' : ''}${isPreviewLoading ? ' scs-item--preview-loading' : ''}`}
                    role="listitem"
                    aria-busy={isSyncing || isRemoving || isPreviewLoading || isClearing ? 'true' : 'false'}
                  >
                    <button
                      type="button"
                      className="scs-item-img scs-item-open-target"
                      onClick={() => handleOpenProduct(item)}
                      aria-label={`View ${item.name} details`}
                      disabled={isRemoving || isPreviewLoading || isClearing}
                    >
                      {item.image
                        ? <img src={item.image} alt="" loading="lazy" decoding="async" />
                        : <Package size={22} strokeWidth={1.4} className="scs-item-img-placeholder" />}
                    </button>

                    <div className="scs-item-body">
                      <div className="scs-item-top">
                        <button
                          type="button"
                          className="scs-item-name scs-item-name-button"
                          onClick={() => handleOpenProduct(item)}
                          disabled={isRemoving || isPreviewLoading || isClearing}
                          aria-label={`View ${item.name} details`}
                        >
                          {item.name}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemove(key)}
                          aria-label={`Remove ${item.name}`}
                          className="scs-item-remove"
                          disabled={isRemoving || isClearing}
                        >
                          <X size={13} strokeWidth={2.5} />
                        </button>
                      </div>

                      {skuText ? <span className="scs-item-sku">SKU: {skuText}</span> : null}

                      <div className="scs-item-bottom">
                        <div className="scs-item-qty-row" role="group" aria-label={`Quantity for ${item.name}`}>
                          <button
                            type="button"
                            className="scs-qty-btn"
                            onClick={() => handleQtyChange(key, -1, quantity)}
                            aria-label={quantity === 1 ? `Remove ${item.name}` : 'Decrease quantity'}
                            disabled={isRemoving || isClearing}
                          >
                            {quantity === 1
                              ? <Trash2 size={11} strokeWidth={2.2} />
                              : <Minus size={11} strokeWidth={2.5} />}
                          </button>
                          <span className="scs-qty-display" aria-live="polite">{quantity}</span>
                          <button
                            type="button"
                            className="scs-qty-btn"
                            onClick={() => handleQtyChange(key, 1, quantity)}
                            aria-label="Increase quantity"
                            disabled={isRemoving || isClearing || quantity >= MAX_CART_QUANTITY}
                          >
                            <Plus size={11} strokeWidth={2.5} />
                          </button>
                        </div>

                        <span className="scs-item-line-total">
                          {isSyncing || isPreviewLoading ? <span className="scs-sync-dot" aria-hidden="true" /> : null}
                          ${lineTotal}
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {cartItems.length > 0 && (
          <footer className="scs-footer">
            <div className="scs-subtotal-row">
              <div className="scs-subtotal-info">
                <span className="scs-subtotal-label">Subtotal</span>
                <span className="scs-subtotal-hint">Shipping &amp; taxes at checkout</span>
              </div>
              <strong className="scs-subtotal-amount">
                ${subtotal.toFixed(2)}
              </strong>
            </div>
            <a
              href={CHECKOUT_HREF}
              onClick={handleNavAndClose}
              className="scs-checkout-btn"
            >
              <span>Checkout</span>
              <ArrowRight size={16} strokeWidth={2.2} />
            </a>
            <Link
              to="/cart"
              onClick={handleNavAndClose}
              className="scs-view-cart-btn"
            >
              View full cart
            </Link>
          </footer>
        )}
      </aside>

      <ProductModal
        isOpen={Boolean(productModalState?.product)}
        product={productModalState?.product || null}
        onClose={closeProductModal}
      >
        {productModalState?.product ? (
          <Suspense fallback={<div className="scs-product-detail-loading" aria-busy="true" />}>
            <ProductDetail
              key={`${productModalState.product?.id || productModalState.key}:${productModalState.initialResolvedVariation?.id || 'parent'}`}
              product={productModalState.product}
              onAddToCart={handleProductModalAddToCart}
              onClose={closeProductModal}
              initialVariations={productModalState.initialVariations || []}
              initialResolvedVariation={productModalState.initialResolvedVariation || null}
              initialSelectedAttrs={productModalState.initialSelectedAttrs || {}}
            />
          </Suspense>
        ) : null}
      </ProductModal>
    </div>
  );
}
