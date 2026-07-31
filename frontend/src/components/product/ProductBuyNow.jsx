import { useEffect, useId, useRef, useState } from 'react';
import { getProductBuyNowReadiness } from '../../api/checkoutCapabilities.js';
import { useCart } from '../../context/CartContext.jsx';
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
    id: 'afterpay-clearpay',
    label: 'Afterpay Clearpay',
    src: `${PUBLIC_ASSET_BASE}/payment_logos/afterpay-clearpay.svg`,
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
  pending = false,
  disabled = false,
  disabledReason = '',
}) {
  const statusId = useId();
  const clickLockedRef = useRef(false);
  const observedPendingRef = useRef(false);
  const [readiness, setReadiness] = useState(DEFAULT_READINESS);
  const [interactionError, setInteractionError] = useState('');
  const { isMutating = false } = useCart();

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
  const paymentMethods = EXPRESS_CHECKOUT_METHODS.filter(
    (method) => readiness.paymentMethods?.[method.readinessKey] === true,
  );

  const statusMessage = interactionError
    || (disabled && disabledReason)
    || (pending
      ? 'Preparing secure checkout…'
      : isMutating
        ? 'Updating cart…'
        : readinessMessage(readiness));
  const statusVisible = Boolean(
    interactionError
    || (disabled && disabledReason)
    || readiness.state === 'unavailable',
  );
  const buttonLabel = pending
    ? 'Preparing Checkout…'
    : isMutating
      ? 'Updating Cart…'
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
        onClick={handleBuyNow}
        onFocus={scheduleCheckoutPrewarm}
        onPointerEnter={scheduleCheckoutPrewarm}
        disabled={blocked}
        aria-busy={busy}
        aria-describedby={statusId}
      >
        <span aria-live="polite">{buttonLabel}</span>
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
