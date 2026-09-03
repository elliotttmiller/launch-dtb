/**
 * ui/Toast.jsx — IndoUI Alert Toast
 */

import { useEffect, useCallback, useState, useRef } from 'react';
import { m as Motion, useReducedMotion } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, ShoppingCart, AlertTriangle } from 'lucide-react';
import { createPortal } from 'react-dom';
import { dtbSpring, reducedTransition } from '../../motion/dtbMotion.js';

const CONFIG = {
  success: { icon: CheckCircle, accent: '#16a34a', bg: '#f0fdf4', iconColor: '#16a34a', text: '#14532d' },
  error: { icon: AlertCircle, accent: '#dc2626', bg: '#fef2f2', iconColor: '#dc2626', text: '#7f1d1d' },
  info: { icon: Info, accent: 'var(--primary-600)', bg: '#eff6ff', iconColor: 'var(--primary-600)', text: '#1e3a8a' },
  cart: { icon: ShoppingCart, accent: 'var(--primary-600)', bg: 'rgba(255,255,255,0.97)', iconColor: 'var(--primary-600)', text: '#0f172a' },
  warning: { icon: AlertTriangle, accent: '#d97706', bg: '#fffbeb', iconColor: '#d97706', text: '#78350f' },
};

function getVisibleCartAnchor() {
  if (typeof document === 'undefined') return null;
  const candidates = Array.from(document.querySelectorAll(
    '.header-mobile-cart-toggle.cart-toggle, .cart-area .cart-toggle, .cart-toggle'
  ));
  return candidates.find((element) => {
    const rect = element.getBoundingClientRect();
    const styles = window.getComputedStyle(element);
    return rect.width > 0 && rect.height > 0 && styles.visibility !== 'hidden' && styles.display !== 'none';
  }) || null;
}

function getCartToastPosition() {
  if (typeof window === 'undefined') return null;
  const anchor = getVisibleCartAnchor();
  if (!anchor) {
    return { top: 'calc(var(--header-height, 70px) + 10px)', right: '16px', width: 'min(320px, calc(100vw - 24px))' };
  }

  const rect = anchor.getBoundingClientRect();
  const width = Math.min(320, window.innerWidth - 24);
  const right = Math.max(12, Math.min(window.innerWidth - rect.right - 4, window.innerWidth - width - 12));
  const top = Math.max(12, rect.bottom + 10);
  return {
    top: `${Math.round(top)}px`,
    right: `${Math.round(right)}px`,
    width: `min(${width}px, calc(100vw - 24px))`,
  };
}

export default function Toast({ message, type = 'success', onClose, duration = 3000 }) {
  const reduceMotion = useReducedMotion();
  const [cartPosition, setCartPosition] = useState(() => (type === 'cart' ? getCartToastPosition() : null));
  const positionFrameRef = useRef(0);
  const cfg = CONFIG[type] || CONFIG.info;
  const IconComponent = cfg.icon;
  const isCartToast = type === 'cart';

  const handleClose = useCallback(() => { onClose?.(); }, [onClose]);

  useEffect(() => {
    if (isCartToast) {
      handleClose();
      return undefined;
    }
    const timer = setTimeout(handleClose, duration);
    return () => clearTimeout(timer);
  }, [duration, handleClose, isCartToast]);

  useEffect(() => {
    if (!isCartToast) return undefined;
    const update = () => {
      if (positionFrameRef.current) return;
      positionFrameRef.current = window.requestAnimationFrame(() => {
        positionFrameRef.current = 0;
        setCartPosition(getCartToastPosition());
      });
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    window.addEventListener('scroll', update, true);

    return () => {
      if (positionFrameRef.current) window.cancelAnimationFrame(positionFrameRef.current);
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [isCartToast]);

  const fixedPosition = isCartToast
    ? (cartPosition || getCartToastPosition() || {})
    : { top: 'calc(var(--header-height, 70px) + 10px)', right: '16px', width: 'min(420px, calc(100vw - 24px))' };

  if (isCartToast) return null;

  const toastNode = (
    <Motion.div
      role="alert"
      aria-live="polite"
      aria-atomic="true"
      initial={{ opacity: 0, x: reduceMotion ? 0 : 28, scale: reduceMotion ? 1 : 0.985 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: reduceMotion ? 0 : 16, scale: reduceMotion ? 1 : 0.992 }}
      transition={reduceMotion ? reducedTransition : dtbSpring.responsive}
      style={{
        position: 'fixed', zIndex: 99999, ...fixedPosition, background: cfg.bg, borderRadius: '12px',
        boxShadow: '0 8px 30px rgba(15,23,42,0.14), 0 2px 8px rgba(15,23,42,0.06)',
        border: '1px solid rgba(15,23,42,0.07)', overflow: 'visible', pointerEvents: 'auto',
      }}
    >
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px',
        background: cfg.accent, borderRadius: '12px 0 0 12px',
      }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px 14px 10px 18px' }}>
        <span style={{ color: cfg.iconColor, flexShrink: 0, display: 'inline-flex', marginTop: '1px' }}>
          <IconComponent size={18} />
        </span>

        <span style={{ flex: 1, fontSize: '0.875rem', fontWeight: 600, color: cfg.text, lineHeight: 1.35 }}>
          {message}
        </span>

        <button
          onClick={handleClose}
          aria-label="Close notification"
          style={{
            flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px',
            borderRadius: '6px', border: 'none', background: 'rgba(15,23,42,0.06)', color: 'rgba(15,23,42,0.45)',
            cursor: 'pointer', transition: 'background-color var(--dtb-motion-fast)', padding: 0,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(15,23,42,0.12)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(15,23,42,0.06)'; }}
        >
          <X size={13} />
        </button>
      </div>

      <div style={{ height: '3px', background: 'rgba(15,23,42,0.06)', borderRadius: '0 0 12px 12px', overflow: 'hidden' }}>
        <div
          className="dtb-toast-progress"
          style={{ '--dtb-toast-duration': `${duration}ms`, background: cfg.accent, borderRadius: '0 0 12px 12px' }}
        />
      </div>
    </Motion.div>
  );

  if (typeof document === 'undefined') return toastNode;
  return createPortal(toastNode, document.body);
}
