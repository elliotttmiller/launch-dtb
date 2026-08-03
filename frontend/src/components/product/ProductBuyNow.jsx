import { useEffect, useId, useRef, useState } from 'react';
import { getProductBuyNowReadiness } from '../../api/checkoutCapabilities.js';
import { scheduleCheckoutPrewarm } from '../../utils/checkoutPrewarm.js';
import '../../styles/product-buy-now.css';

const PUBLIC_ASSET_BASE = String(process.env.PUBLIC_URL || '').replace(/\/+$/, '');

const EXPRESS_CHECKOUT_METHODS = Object.freeze([
  {
    readinessKey: 'paypal',
    id: 'paypal',
    label: 'PayPal',
    src: `${PUBLIC_ASSET_BASE}/payment_logos/paypal-blue.svg`,
  },
  {
    readinessKey: 'klarna',
    id: 'klarna',
    label: 'Klarna',
    src: `${PUBLIC_ASSET_BASE}/payment_logos/klarna.svg`,
    framed: true,
  },
  {
    readinessKey: 'googlePay',
    id: 'google-pay',
    label: 'Google Pay',
    src: `${PUBLIC_ASSET_BASE}/payment_logos/google-pay.svg`,
  },
  {
    readinessKey: 'applePay',
    id: 'apple-pay',
    label: 'Apple Pay',
    src: `${PUBLIC_ASSET_BASE}/payment_logos/apple-pay.svg`,
    framed: true,
  },
  {
    readinessKey: 'afterpay',
    id: 'afterpay',
    label: 'Afterpay',
    src: `${PUBLIC_ASSET_BASE}/payment_logos/afterpay.svg`,
    framed: true,
  },
  {
    readinessKey: 'affirm',
    id: 'affirm',
    label: 'Affirm',
    src: `${PUBLIC_ASSET_BASE}/payment_logos/affirm.svg`,
  },
]);

const DEFAULT_READINESS = Object.freeze({
  state: 'unknown',
  paymentMethods: {},
});

function readinessMessage(readiness) {
  if (readiness.state === 'ready') {
    return 'Secure payment methods are presented by Stripe on the checkout page.';
  }
  if (readiness.state === 'unavailable') {
    return 'Checkout is available, but the Stripe payment configuration needs attention.';
  }
  return 'Available payment methods are confirmed on the secure checkout page.';
}

export default function ProductBuyNow({
  onBuyNow,
  status = 'idle',
  disabled = false,
  suspended = false,
  disabledReason = '',
}) {
  const statusId = useId();
  const clickLockedRef = useRef(false);
  const observedPendingRef = useRef(false);
  const [readiness, setReadiness] = useState(DEFAULT_READINESS);
  const [interactionError, setInteractionError] = useState('');

  useEffect(() => {
    let active = true;
    scheduleCheckoutPrewarm();

    getProductBuyNowReadiness().then((result) => {
      if (active) setReadiness(result || DEFAULT_READINESS);
    });

    return () => {
      active = false;
    };
  }, []);

  const pending = status === 'pending';
  const confirmed = status === 'confirmed';

  useEffect(() => {
    if (pending || confirmed) {
      observedPendingRef.current = true;
      return;
    }
    if (observedPendingRef.current) {
      clickLockedRef.current = false;
      observedPendingRef.current = false;
    }
  }, [pending, confirmed]);

  useEffect(() => {
    if (!disabled) return;
    clickLockedRef.current = false;
  }, [disabled]);

  // Only this button's own action drives its busy/success animation — a
  // separate, unrelated cart mutation (e.g. the Add to Cart button) must
  // never make this button spin too.
  const busy = pending || confirmed;
  const blocked = disabled || busy;
  const paymentMethods = EXPRESS_CHECKOUT_METHODS.filter(
    (method) => readiness.paymentMethods?.[method.readinessKey] === true,
  );

  const statusMessage = interactionError
    || (disabled && disabledReason)
    || (pending
      ? 'Preparing secure checkout…'
      : confirmed
        ? 'Redirecting to checkout…'
        : readinessMessage(readiness));
  const statusVisible = Boolean(
    interactionError
    || (disabled && disabledReason)
    || readiness.state === 'unavailable',
  );
  const buttonLabel = pending
    ? 'Preparing Checkout…'
    : confirmed
      ? 'Checkout Ready'
      : 'Checkout Now';

  const handleBuyNow = () => {
    if (blocked || clickLockedRef.current || typeof onBuyNow !== 'function') return;

    clickLockedRef.current = true;
    setInteractionError('');

    try {
      const result = onBuyNow();
      if (result && typeof result.catch === 'function') {
        result.catch((error) => {
          clickLockedRef.current = false;
          setInteractionError(error?.message || 'Checkout could not be prepared. Please try again.');
        });
      }
    } catch (error) {
      clickLockedRef.current = false;
      setInteractionError(error?.message || 'Checkout could not be prepared. Please try again.');
    }
  };

  return (
    <section
      className="dtb-product-buy-now"
      data-readiness={readiness.state}
      aria-label="Buy now"
    >
      <button
        type="button"
        className="dtb-product-buy-now__button"
        data-state={pending ? 'pending' : confirmed ? 'confirmed' : 'idle'}
        data-suspended={suspended ? 'true' : undefined}
        onClick={handleBuyNow}
        onFocus={scheduleCheckoutPrewarm}
        onPointerEnter={scheduleCheckoutPrewarm}
        disabled={blocked}
        aria-busy={busy}
        aria-describedby={statusId}
      >
        <span className="dtb-product-buy-now__content" aria-live="polite">{buttonLabel}</span>
        <span className="dtb-product-buy-now__spinner" aria-hidden="true" />
        <span className="dtb-product-buy-now__success" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <circle className="dtb-product-buy-now__success-ring" cx="12" cy="12" r="10" fill="none" />
            <path className="dtb-product-buy-now__success-check" fill="none" d="m5.5 12.5 4.2 4.2 8.8-9.4" />
          </svg>
        </span>
      </button>

      <p className="dtb-product-buy-now__eyebrow">Express checkout with</p>
      <ul
        className="dtb-product-buy-now__methods"
        aria-label="Payment methods available at checkout"
      >
        {paymentMethods.map((method) => (
          <li
            key={method.id}
            className={method.framed ? 'is-framed' : undefined}
            aria-label={method.label}
            title={method.label}
          >
            <img src={method.src} alt="" loading="eager" decoding="async" />
          </li>
        ))}
      </ul>

      <p
        id={statusId}
        className={`dtb-product-buy-now__status${statusVisible ? ' is-visible' : ''}${interactionError ? ' is-error' : ''}`}
        role={interactionError ? 'alert' : 'status'}
        aria-live={interactionError ? 'assertive' : 'polite'}
      >
        {statusMessage}
      </p>
    </section>
  );
}
