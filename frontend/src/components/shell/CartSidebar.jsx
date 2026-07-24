import { useEffect, useRef } from 'react';
import { useCart } from '../../context/CartContext';
import { useAuthContext } from '../../auth/AuthContext.js';
import { getCart } from '../../api/cart.js';
import StorefrontCartSheet from '../storefront/StorefrontCartSheet';
import { getWooCheckoutUrl } from '../../utils/checkoutUrl.js';
import { navigateDocument } from '../../utils/documentNavigation.js';

const CART_DEBOUNCE_DRAIN_MS = 350;
const CART_MUTATION_WAIT_LIMIT_MS = 8000;

function sleep(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export default function CartSidebar({ isOpen, onClose }) {
  const { cartItems, removeFromCart, updateQuantity, clearCart, getCartTotal, isMutating } = useCart();
  const { isAuthenticated, ensureNativeCheckoutReady } = useAuthContext();
  const isMutatingRef = useRef(isMutating);
  const checkoutPendingRef = useRef(false);

  useEffect(() => {
    isMutatingRef.current = isMutating;
  }, [isMutating]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const interceptCheckout = async (event) => {
      const anchor = event.target instanceof Element ? event.target.closest('a[href]') : null;
      if (!anchor || !anchor.closest('.storefront-cart-sheet')) return;

      let targetUrl;
      try {
        targetUrl = new URL(anchor.href, window.location.origin);
      } catch {
        return;
      }
      if (!/\/checkout\/?$/.test(targetUrl.pathname)) return;

      event.preventDefault();
      event.stopPropagation();
      if (checkoutPendingRef.current) return;
      checkoutPendingRef.current = true;

      try {
        // The cart sheet intentionally debounces quantity writes. Give that timer
        // time to fire, then wait for the CartContext Store API mutation to settle
        // before transferring the document to WooCommerce checkout.
        await sleep(CART_DEBOUNCE_DRAIN_MS);
        const startedAt = Date.now();
        while (isMutatingRef.current && Date.now() - startedAt < CART_MUTATION_WAIT_LIMIT_MS) {
          await sleep(75);
        }

        if (isMutatingRef.current) {
          window.alert('Your cart is still updating. Please wait a moment and try checkout again.');
          anchor.focus?.();
          return;
        }

        // A customer who signed in before opening checkout must first converge the
        // DTB HttpOnly session to native WordPress/Woo identity. Do this before the
        // final Store API read so the cart proof and the document handoff share the
        // same authenticated session boundary.
        if (isAuthenticated) {
          await ensureNativeCheckoutReady();
        }

        // Re-read WooCommerce immediately before document navigation. The visual
        // cart snapshot is never sufficient proof that the server-side session
        // has the same items/quantities.
        const authoritativeCart = await getCart();
        if (!Array.isArray(authoritativeCart?.items) || authoritativeCart.items.length === 0) {
          window.alert('Your checkout cart could not be confirmed. Please refresh your cart and try again.');
          anchor.focus?.();
          return;
        }

        navigateDocument(getWooCheckoutUrl(), { transition: 'checkout' });
        onClose?.();
      } catch (error) {
        window.alert(error?.message || 'We could not confirm your signed-in checkout session. Please try again.');
        anchor.focus?.();
      } finally {
        checkoutPendingRef.current = false;
      }
    };

    document.addEventListener('click', interceptCheckout, true);
    return () => document.removeEventListener('click', interceptCheckout, true);
  }, [ensureNativeCheckoutReady, isAuthenticated, isOpen, onClose]);

  return (
    <StorefrontCartSheet
      isOpen={isOpen}
      onClose={onClose}
      cartItems={cartItems}
      removeFromCart={removeFromCart}
      updateQuantity={updateQuantity}
      clearCart={clearCart}
      getCartTotal={getCartTotal}
      isMutating={isMutating}
    />
  );
}
