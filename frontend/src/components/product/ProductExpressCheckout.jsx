import { useEffect, useId, useRef, useState } from 'react';
import { ArrowRight, Zap } from 'lucide-react';
import { getProductExpressCheckoutReadiness } from '../../api/checkoutCapabilities.js';
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
});

function readinessMessage(state) {
  if (state === 'ready') {
    return 'Apple Pay, Google Pay, Link, and other eligible wallet options are shown securely by Stripe on checkout.';
  }
  if (state === 'unavailable') {
    return 'Secure checkout remains available. Express wallet buttons are not currently available for this store configuration.';
  }
  return 'Eligible wallet options are shown securely by Stripe on checkout.';
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

  const handleCheckout = () => {
    if (disabled || pending || clickLockedRef.current || typeof onExpressCheckout !== 'function') return;

    clickLockedRef.current = true;
    const expressReady = readiness.state !== 'unavailable';
    if (expressReady) {
      requestExpressCheckoutHandoff();
    } else {
      clearExpressCheckoutHandoff();
    }

    try {
      const result = onExpressCheckout();
      if (result && typeof result.catch === 'function') {
        result.catch(() => {
          clearExpressCheckoutHandoff();
          clickLockedRef.current = false;
        });
      }
    } catch {
      clearExpressCheckoutHandoff();
      clickLockedRef.current = false;
    }
  };

  const note = disabled && disabledReason
    ? disabledReason
    : readinessMessage(readiness.state);
  const buttonLabel = readiness.state === 'unavailable'
    ? 'Buy now'
    : 'Buy now with express checkout';

  return (
    <section
      className="dtb-product-express-checkout"
      data-readiness={readiness.state}
      aria-label="Express checkout"
    >
      <div className="dtb-product-express-checkout__divider" aria-hidden="true">
        <span>Express checkout</span>
      </div>

      <button
        type="button"
        className="dtb-product-express-checkout__button"
        onClick={handleCheckout}
        onFocus={scheduleCheckoutPrewarm}
        onPointerEnter={scheduleCheckoutPrewarm}
        disabled={disabled || pending}
        aria-busy={pending}
        aria-describedby={descriptionId}
      >
        <span className="dtb-product-express-checkout__icon" aria-hidden="true">
          <Zap size={16} strokeWidth={2.4} />
        </span>
        <span className="dtb-product-express-checkout__label" aria-live="polite">
          {pending ? 'Preparing secure checkout…' : buttonLabel}
        </span>
        <ArrowRight className="dtb-product-express-checkout__arrow" size={17} aria-hidden="true" />
      </button>

      <p id={descriptionId} className="dtb-product-express-checkout__note" role="status">
        {note}
      </p>
    </section>
  );
}
