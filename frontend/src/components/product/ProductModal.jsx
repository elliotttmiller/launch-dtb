import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useReducedMotion } from 'framer-motion';
import MotionBackdrop from '../motion/MotionBackdrop.jsx';
import MotionDialog from '../motion/MotionDialog.jsx';
import MotionDrawer from '../motion/MotionDrawer.jsx';
import MotionPresence from '../motion/MotionPresence.jsx';
import {
  productModalBackdropTransition,
  productModalDesktopVariants,
  productModalMobileVariants,
  productModalTransition,
  reducedTransition,
} from '../../motion/dtbMotion.js';
import '../../styles/product-quick-view-desktop.css';

function useIsMobileModal() {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 768px)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    const onChange = () => setIsMobile(mediaQuery.matches);
    onChange();
    mediaQuery.addEventListener?.('change', onChange);
    return () => mediaQuery.removeEventListener?.('change', onChange);
  }, []);

  return isMobile;
}

export default function ProductModal({ isOpen, product, onClose, children }) {
  const scrollRef = useRef(null);
  const openerRef = useRef(null);
  const scrollHideTimerRef = useRef(null);
  const bodyUnlockTimerRef = useRef(null);
  const bodyLockStateRef = useRef(null);
  const [isScrollActive, setIsScrollActive] = useState(false);
  const reduceMotion = useReducedMotion();
  const isMobile = useIsMobileModal();

  useEffect(() => {
    if (isOpen) {
      openerRef.current = document.activeElement;
    } else {
      const id = setTimeout(() => {
        if (openerRef.current && typeof openerRef.current.focus === 'function') {
          openerRef.current.focus({ preventScroll: true });
        }
        openerRef.current = null;
      }, reduceMotion ? 80 : 280);
      return () => clearTimeout(id);
    }
  }, [isOpen, reduceMotion]);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const body = document.body;

    const releaseBodyLock = () => {
      const state = bodyLockStateRef.current;
      if (!state) return;
      body.style.overflow = state.overflow;
      body.style.touchAction = state.touchAction;
      body.style.paddingRight = state.paddingRight;
      body.classList.remove('dtb-product-modal-open');
      bodyLockStateRef.current = null;
    };

    if (bodyUnlockTimerRef.current) {
      window.clearTimeout(bodyUnlockTimerRef.current);
      bodyUnlockTimerRef.current = null;
    }

    if (isOpen) {
      if (!bodyLockStateRef.current) {
        const scrollbarWidth = Math.max(0, window.innerWidth - document.documentElement.clientWidth);
        const computedPaddingRight = Number.parseFloat(window.getComputedStyle(body).paddingRight) || 0;

        bodyLockStateRef.current = {
          overflow: body.style.overflow,
          touchAction: body.style.touchAction,
          paddingRight: body.style.paddingRight,
        };

        body.style.overflow = 'hidden';
        if (isMobile) body.style.touchAction = 'none';
        if (scrollbarWidth > 0) {
          body.style.paddingRight = `${computedPaddingRight + scrollbarWidth}px`;
        }
        body.classList.add('dtb-product-modal-open');
      }
      return;
    }

    if (bodyLockStateRef.current) {
      // Keep document geometry locked until the opacity-only exit completes.
      // Releasing overflow immediately reintroduces the desktop scrollbar while
      // the modal is still visible, shifting the entire storefront underneath it.
      bodyUnlockTimerRef.current = window.setTimeout(
        releaseBodyLock,
        reduceMotion ? 20 : 190,
      );
    }
  }, [isMobile, isOpen, reduceMotion]);

  useEffect(() => () => {
    if (bodyUnlockTimerRef.current) {
      window.clearTimeout(bodyUnlockTimerRef.current);
    }
    const state = bodyLockStateRef.current;
    if (!state || typeof document === 'undefined') return;
    document.body.style.overflow = state.overflow;
    document.body.style.touchAction = state.touchAction;
    document.body.style.paddingRight = state.paddingRight;
    document.body.classList.remove('dtb-product-modal-open');
    bodyLockStateRef.current = null;
  }, []);

  useEffect(() => {
    if (isOpen && scrollRef.current) {
      requestAnimationFrame(() => {
        scrollRef.current?.focus({ preventScroll: true });
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [product?.id, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      if (scrollHideTimerRef.current) {
        clearTimeout(scrollHideTimerRef.current);
        scrollHideTimerRef.current = null;
      }
      const resetId = setTimeout(() => {
        setIsScrollActive(false);
      }, 0);
      return () => clearTimeout(resetId);
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (scrollHideTimerRef.current) {
        clearTimeout(scrollHideTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handler = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (typeof document === 'undefined') return null;

  const transition = reduceMotion ? reducedTransition : productModalTransition;
  const variants = isMobile ? productModalMobileVariants : productModalDesktopVariants;
  const PanelComponent = isMobile ? MotionDrawer : MotionDialog;

  return createPortal(
    <MotionPresence mode="sync" initial={false}>
      {isOpen && product && (
        <>
          <MotionBackdrop
            className="fixed inset-0 bg-slate-950/55 product-modal-backdrop"
            style={{ zIndex: 10001 }}
            reduceMotion={reduceMotion}
            transition={productModalBackdropTransition}
            onClick={onClose}
          />

          <PanelComponent
            key="product-modal-panel"
            ref={scrollRef}
            className={`product-modal-scroll-shell fixed left-0 right-0 bottom-0 overflow-y-auto overscroll-contain outline-none${isScrollActive ? ' product-modal-scroll-shell--active' : ''}`}
            style={{ zIndex: 10002 }}
            role="dialog"
            aria-modal="true"
            aria-label={product?.name || 'Product detail'}
            tabIndex={-1}
            reduceMotion={reduceMotion}
            transition={transition}
            variants={variants}
            onScroll={() => {
              setIsScrollActive(true);
              if (scrollHideTimerRef.current) clearTimeout(scrollHideTimerRef.current);
              scrollHideTimerRef.current = setTimeout(() => {
                setIsScrollActive(false);
              }, 900);
            }}
          >
            <div
              className="product-modal-scroll-inner flex items-end md:items-center justify-center min-h-full px-0 py-0 md:px-4 md:py-6 lg:px-6"
              onClick={onClose}
            >
              <div
                className="product-modal-card-shell dtb-product-page-shell w-full max-w-6xl"
                onClick={(e) => e.stopPropagation()}
              >
                {children}
              </div>
            </div>
          </PanelComponent>
          <style>{`
            .product-modal-backdrop {
              background: rgba(2, 6, 23, 0.58);
            }
            .product-modal-scroll-shell {
              top: 0;
              scrollbar-width: none;
              scrollbar-color: transparent transparent;
              -webkit-overflow-scrolling: touch;
            }
            .product-modal-scroll-shell::-webkit-scrollbar {
              width: 0;
              background: transparent;
            }

            /* Mobile quick view is a true full-viewport product surface rather
               than a bottom sheet. The dialog owns the viewport; product-detail
               internals continue to own their normal responsive spacing. */
            .product-modal-scroll-inner {
              min-height: 100dvh;
              align-items: stretch;
              background: #fff;
            }
            .product-modal-card-shell.dtb-product-page-shell {
              width: 100%;
              max-width: none;
              min-height: 100dvh;
              margin: 0;
              padding: 0;
              background: #fff;
            }
            .product-modal-card-shell > * {
              min-height: 100dvh;
              border-radius: 0;
              box-shadow: none;
              overflow: hidden;
            }

            @media (min-width: 48rem) {
              .product-modal-scroll-shell {
                top: 0;
                scrollbar-width: thin;
                scrollbar-color: transparent transparent;
              }
              .product-modal-scroll-inner {
                min-height: 100%;
                align-items: center;
                background: transparent;
              }
              .product-modal-card-shell.dtb-product-page-shell {
                width: 100%;
                max-width: 72rem;
                min-height: 0;
                margin-inline: auto;
                background: transparent;
              }
              .product-modal-card-shell > * {
                min-height: 0;
                border-radius: 26px;
                box-shadow: 0 32px 90px rgba(15, 23, 42, 0.28), 0 8px 22px rgba(15, 23, 42, 0.16);
              }
              .product-modal-scroll-shell::-webkit-scrollbar {
                width: 10px;
              }
              .product-modal-scroll-shell.product-modal-scroll-shell--active::-webkit-scrollbar-thumb {
                background: rgba(148, 163, 184, 0.32);
                border: 2px solid transparent;
                background-clip: padding-box;
                border-radius: 999px;
              }
              .product-modal-scroll-shell.product-modal-scroll-shell--active::-webkit-scrollbar-track {
                background: transparent;
              }
              .product-modal-scroll-shell.product-modal-scroll-shell--active {
                scrollbar-color: rgba(148, 163, 184, 0.32) transparent;
              }
            }
            @media (prefers-reduced-motion: reduce) {
              .product-modal-backdrop {
                -webkit-backdrop-filter: none;
                backdrop-filter: none;
              }
            }
          `}</style>
        </>
      )}
    </MotionPresence>,
    document.body
  );
}
