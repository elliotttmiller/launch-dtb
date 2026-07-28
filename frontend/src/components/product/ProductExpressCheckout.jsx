import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ArrowRight, Zap } from 'lucide-react';
import { getProductExpressCheckoutReadiness } from '../../api/checkoutCapabilities.js';
import { useCart } from '../../context/CartContext.jsx';
import {
  clearExpressCheckoutHandoff,
  requestExpressCheckoutHandoff,
} from '../../utils/checkoutUrl.js';
import { scheduleCheckoutPrewarm } from '../../utils/checkoutPrewarm.js';
import '../../styles/product-express-checkout.css';

const DEFAULT_READINESS = Object.freeze({
  state: 'unknown',
  provider: 'WooCommerce Stripe',
  checks: {},
  reasons: [],
});

const WALLET_LABELS = Object.freeze(['Apple Pay', 'Google Pay', 'Link']);

function readinessMessage(readiness) {
  if (readiness.state === 'ready') {
    return 'Eligible wallet methods are presented and completed by Stripe on the secure checkout page.';
  }
  if (readiness.state === 'unavailable') {
    return 'Express wallets are not available for the current store configuration. Standard secure checkout remains available.';
  }
  return 'Eligible wallet methods are detected and presented securely by Stripe on checkout.';
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
      clearExpressCheckoutHandoff();
      clickLockedRef.current = false;
      observedPendingRef.current = false;
    }
  }, [pending]);

  useEffect(() => {
    if (!disabled) return;
    clearExpressCheckoutHandoff();
    clickLockedRef.current = false;
  }, [disabled]);

  const busy = pending || isMutating;
  const blocked = disabled || busy;
  const expressReady = readiness.state !== 'unavailable';
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

    if (expressReady) requestExpressCheckoutHandoff();
    else clearExpressCheckoutHandoff();

    try {
      const result = onExpressCheckout();
      if (result && typeof result.catch === 'function') {
        result.catch((error) => {
          clearExpressCheckoutHandoff();
          clickLockedRef.current = false;
          setInteractionError(error?.message || 'Secure checkout could not be prepared. Please try again.');
        });
      }
    } catch (error) {
      clearExpressCheckoutHandoff();
      clickLockedRef.current = false;
      setInteractionError(error?.message || 'Secure checkout could not be prepared. Please try again.');
    }
  };

  const buttonLabel = readiness.state === 'unavailable'
    ? 'Buy now securely'
    : 'Buy now with express checkout';
  const dividerLabel = readiness.state === 'unavailable' ? 'Buy now' : 'Express checkout';

  return (
    <section
      className="dtb-product-express-checkout"
      data-readiness={readiness.state}
      aria-label="Express checkout"
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
          {busy ? 'Preparing secure checkout…' : buttonLabel}
        </span>
        <ArrowRight className="dtb-product-express-checkout__arrow" size={17} aria-hidden="true" />
      </button>

      {expressReady ? (
        <ul className="dtb-product-express-checkout__methods" aria-label="Eligible express payment methods may include">
          {WALLET_LABELS.map((label) => <li key={label}>{label}</li>)}
        </ul>
      ) : null}

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
