// Cart checkout remains WooCommerce-authoritative.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, Lock, ChevronLeft, ShoppingCart, ShieldAlert } from 'lucide-react';

import SEOHead from '../components/shared/SEOHead';
import { Container, SidebarLayout } from '../components/layout';
import { useCart } from '../context/CartContext';
import { useAuthContext } from '../auth/AuthContext.js';
import { getWooCheckoutUrl } from '../utils/checkoutUrl.js';
import { beginCheckoutHandoff } from '../utils/checkoutHandoff.js';
import { useEditableComponent } from '../designer/useEditableComponent.js';

function parseStoreMoney(value, minorUnit) {
  const raw = Number(value);
  const unit = Number(minorUnit);
  if (!Number.isFinite(raw)) return null;
  return Number.isFinite(unit) && unit >= 0 ? raw / (10 ** unit) : raw;
}

export default function Cart() {
  const { cart, cartItems, updateQuantity, removeFromCart, refreshCart, isMutating } = useCart();
  const { isAuthenticated, ensureNativeCheckoutReady } = useAuthContext();
  const [checkoutPending, setCheckoutPending] = useState(false);
  const [checkoutNotice, setCheckoutNotice] = useState('');

  const itemsList = useEditableComponent('cart', 'cart-items-list');
  const orderSummary = useEditableComponent('cart', 'order-summary');
  const checkoutButton = useEditableComponent('cart', 'proceed-to-checkout');
  const checkoutWidth = checkoutButton.getValue('width', 'full') === 'auto' ? 'auto' : '100%';

  const localSubtotal = cartItems.reduce((sum, item) => sum + (Number(item?.price) || 0) * (Number(item?.quantity) || 1), 0);
  const serverSubtotal = parseStoreMoney(cart?.totals?.total_items, cart?.totals?.currency_minor_unit);
  const subtotal = serverSubtotal ?? localSubtotal;
  const checkoutDisabled = isMutating || checkoutPending;

  const handleCheckout = async (event) => {
    event.preventDefault();
    if (checkoutDisabled) return;

    setCheckoutPending(true);
    setCheckoutNotice('');
    try {
      await beginCheckoutHandoff({
        isAuthenticated,
        ensureNativeCheckoutReady,
        isCartMutating: () => isMutating,
        settleDelayMs: 0,
        onSessionReconciled: async () => {
          await refreshCart();
        },
      });
    } catch (error) {
      const message = error?.message || 'We could not prepare your checkout session. Please try again.';
      if (error?.code === 'checkout_identity_reconciled') setCheckoutNotice(message);
      else window.alert(message);
    } finally {
      setCheckoutPending(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <Motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="dtb-cart-empty">
        <SEOHead noindex title="Shopping Cart" />
        <div className="dtb-cart-empty__card">
          <div className="dtb-cart-empty__icon"><ShoppingBag aria-hidden="true" strokeWidth={1.5} /></div>
          <h1>Your cart is empty</h1>
          <p>Discover professional drywall tools and equipment for every job.</p>
          <Link to="/products" className="dtb-cart-empty__action"><ShoppingBag size={16} aria-hidden="true" />Browse products</Link>
        </div>
      </Motion.div>
    );
  }

  return (
    <div className="page-wrapper dtb-cart-page">
      <SEOHead noindex title="Shopping Cart" />
      <Container width="wide" className="dtb-cart-page__container">
        <Motion.header initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="dtb-cart-page__header">
          <Link to="/products" className="dtb-cart-page__continue"><ChevronLeft size={16} aria-hidden="true" strokeWidth={2.5} />Continue shopping</Link>
          <h1>Shopping cart</h1>
          <p>{cartItems.length} item{cartItems.length !== 1 ? 's' : ''}</p>
        </Motion.header>

        {checkoutNotice && (
          <div role="alert" className="dtb-cart-page__notice">
            <ShieldAlert aria-hidden="true" />
            <div><p><strong>Checkout session refreshed</strong></p><p>{checkoutNotice}</p></div>
          </div>
        )}

        <SidebarLayout side="end" sidebarWidth="22.5rem" className="dtb-cart-page__layout">
          <div {...itemsList.rootProps} className="dtb-cart-page__items">
            <AnimatePresence mode="popLayout" initial={false}>
              {cartItems.map((item, index) => {
                const itemKey = item.cartKey || item.id;
                const quantity = Number(item.quantity) || 1;
                const unitPrice = Number(item.price) || 0;
                const optionText = Array.isArray(item.variation_attribute_values) ? item.variation_attribute_values.map((attribute) => attribute.option).filter(Boolean).join(' / ') : '';
                return (
                  <Motion.article key={itemKey} layout initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -28, scale: 0.97, transition: { duration: 0.2 } }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1], delay: index * 0.055 }} className="dtb-cart-item-card">
                    <div className="dtb-cart-item-card__inner">
                      <div className="dtb-cart-item-card__image">{item.image ? <img src={item.image} alt={item.name} loading="lazy" decoding="async" /> : <div className="dtb-cart-item-card__placeholder"><ShoppingCart size={24} aria-hidden="true" strokeWidth={1.5} /></div>}</div>
                      <div className="dtb-cart-item-card__content">
                        <div className="dtb-cart-item-card__heading"><div>{item.brand && <p className="dtb-cart-item-card__brand">{item.brand}</p>}<h2>{item.name}</h2>{optionText && <p className="dtb-cart-item-card__option">{optionText}</p>}</div><button type="button" onClick={() => removeFromCart(itemKey)} disabled={isMutating} className="dtb-cart-item-card__remove" aria-label={`Remove ${item.name}`}><Trash2 size={14} aria-hidden="true" /></button></div>
                        <div className="dtb-cart-item-card__footer"><div className="dtb-cart-item-card__quantity" role="group" aria-label={`Quantity for ${item.name}`}><button type="button" onClick={() => updateQuantity(itemKey, quantity - 1)} disabled={isMutating} aria-label="Decrease quantity"><Minus size={12} aria-hidden="true" strokeWidth={2.5} /></button><span>{quantity}</span><button type="button" onClick={() => updateQuantity(itemKey, quantity + 1)} disabled={isMutating} aria-label="Increase quantity"><Plus size={12} aria-hidden="true" strokeWidth={2.5} /></button></div><div className="dtb-cart-item-card__price"><small>${unitPrice.toFixed(2)} each</small><strong>${(unitPrice * quantity).toFixed(2)}</strong></div></div>
                      </div>
                    </div>
                  </Motion.article>
                );
              })}
            </AnimatePresence>
          </div>

          <Motion.aside initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="dtb-cart-page__summary-wrap">
            <div {...orderSummary.rootProps} className="dtb-cart-summary-card"><div className="dtb-cart-summary-card__accent" /><div className="dtb-cart-summary-card__body"><h2>Order summary</h2><div className="dtb-cart-summary-card__row"><span>Merchandise subtotal</span><strong>${subtotal.toFixed(2)}</strong></div><p className="dtb-cart-summary-card__context">Shipping, discounts, and taxes are calculated at checkout.</p><a {...checkoutButton.rootProps} href={getWooCheckoutUrl()} onClick={handleCheckout} aria-disabled={checkoutDisabled ? 'true' : undefined} aria-busy={checkoutPending ? 'true' : undefined} style={{ width: checkoutWidth }} className="dtb-cart-summary-card__checkout"><Lock size={14} aria-hidden="true" strokeWidth={2.5} />{checkoutPending ? 'Preparing checkout…' : isMutating ? 'Updating cart…' : checkoutNotice ? 'Confirm refreshed cart and checkout' : 'Continue to secure checkout'}<ArrowRight size={14} aria-hidden="true" strokeWidth={2.5} /></a></div></div>
          </Motion.aside>
        </SidebarLayout>
      </Container>
    </div>
  );
}
