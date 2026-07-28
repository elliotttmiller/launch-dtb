import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ArrowRight, Zap } from 'lucide-react';
import { getProductExpressCheckoutReadiness } from '../../api/checkoutCapabilities.js';
import { useCart } from '../../context/CartContext';
import { scheduleCheckoutPrewarm } from '../../utils/checkoutPrewarm.js';
import '../../styles/product-express-checkout.css';

const DEFAULT_READINESS = Object.freeze({
  state: 'unknown',
  provider: 'Payment Plugins for Stripe',
  checks: {},
  reasons: [],
});

function readinessMessage(readiness) {
  if (readiness.state === 'ready') {
    return 'Eligible payment methods are presented securely by Stripe on checkout.';
  }
  if (readiness.state === 'unavailable') {
    return 'Secure checkout is available, but the Stripe Universal Payment Method configuration needs attention.';
  }
  return 'Stripe determines eligible cards, wallets, and payment methods on the secure checkout page.';
}

function busyMessage({ pending, isMutating }) {
  if (pending) return 'Preparing the selected product and secure checkout…';
  if (isMutating) return 'Waiting for the current cart update to finish…';
  return '';
}

export default function ProductExpressCheckout({
  onExpressCheckout,
  pending = false,
  disabled = false,
  disabledReason = '',
}) {
  const descriptionId = useId();
  const clickLockedRef = useRef(false);
  const observedPendingRef = useRef(false);
  const [readiness, setReadiness] = useState(DEFAULT_READINESS);
  const [interactionError, setInteractionError] = useState('');
  const { isMutating = false } = useCart();

  useEffect(() => {
    let active = true;
    scheduleCheckoutPrewarm();

    getProductExpressCheckoutReadiness().then((result) => {
      if (active) setReadiness(result || DEFAULT_READINESS);
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (pending) {
      observedPendingRef.current = true;
      return;
    }
    if (observedPendingRef.current) {
      clickLockedRef.current = false;
      observedPendingRef.current = false;
    }
  }, [pending]);

  useEffect(() => {
    if (!disabled) return;
    clickLockedRef.current = false;
  }, [disabled]);

  const busy = pending || isMutating;
  const blocked = disabled || busy;
  const statusMessage = useMemo(() => {
    if (interactionError) return interactionError;
    if (disabled && disabledReason) return disabledReason;
    const currentBusyMessage = busyMessage({ pending, isMutating });
    return currentBusyMessage || readinessMessage(readiness);
  }, [disabled, disabledReason, interactionError, isMutating, pending, readiness]);

  const handleCheckout = () => {
    if (blocked || clickLockedRef.current || typeof onExpressCheckout !== 'function') return;

    clickLockedRef.current = true;
    setInteractionError('');

    try {
      const result = onExpressCheckout();
      if (result && typeof result.catch === 'function') {
        result.catch((error) => {
          clickLockedRef.current = false;
          setInteractionError(error?.message || 'Secure checkout could not be prepared. Please try again.');
        });
      }
    } catch (error) {
      clickLockedRef.current = false;
      setInteractionError(error?.message || 'Secure checkout could not be prepared. Please try again.');
    }
  };

  const buttonLabel = 'Buy now securely';
  const activeButtonLabel = pending
    ? 'Preparing secure checkout…'
    : isMutating
      ? 'Updating cart…'
      : buttonLabel;
  const dividerLabel = 'Secure checkout';

  return (
    <section
      className="dtb-product-express-checkout"
      data-readiness={readiness.state}
      aria-label="Secure checkout"
    >
      <div className="dtb-product-express-checkout__divider" aria-hidden="true">
        <span>{dividerLabel}</span>
      </div>

      <button
        type="button"
        className="dtb-product-express-checkout__button"
        onClick={handleCheckout}
        onFocus={scheduleCheckoutPrewarm}
        onPointerEnter={scheduleCheckoutPrewarm}
        disabled={blocked}
        aria-busy={busy}
        aria-describedby={descriptionId}
      >
        <span className="dtb-product-express-checkout__icon" aria-hidden="true">
          <Zap size={16} strokeWidth={2.4} />
        </span>
        <span className="dtb-product-express-checkout__label" aria-live="polite">
          {activeButtonLabel}
        </span>
        <ArrowRight className="dtb-product-express-checkout__arrow" size={17} aria-hidden="true" />
      </button>

      <p
        id={descriptionId}
        className={`dtb-product-express-checkout__note${interactionError ? ' is-error' : ''}`}
        role={interactionError ? 'alert' : 'status'}
        aria-live={interactionError ? 'assertive' : 'polite'}
      >
        {statusMessage}
      </p>
    </section>
  );
}
