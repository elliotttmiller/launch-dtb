import '../../styles/express-checkout-methods.css';

const PUBLIC_ASSET_BASE = String(process.env.PUBLIC_URL || '').replace(/\/+$/, '');

const EXPRESS_CHECKOUT_METHODS = Object.freeze([
  {
    readinessKey: 'applePay',
    id: 'apple-pay',
    label: 'Apple Pay',
    src: `${PUBLIC_ASSET_BASE}/payment_logos/apple-pay.svg`,
    framed: true,
  },
  {
    readinessKey: 'googlePay',
    id: 'google-pay',
    label: 'Google Pay',
    src: `${PUBLIC_ASSET_BASE}/payment_logos/google-pay.svg`,
  },
  {
    // Cash App Pay has no backend readiness flag yet (unlike the Stripe UPM
    // wallets, which are gated on live capability checks) — always shown
    // rather than silently hidden for lack of a signal.
    readinessKey: null,
    id: 'cash-app',
    label: 'Cash App',
    src: `${PUBLIC_ASSET_BASE}/payment_logos/cashapp-color-black.svg`,
    large: true,
  },
  {
    readinessKey: 'klarna',
    id: 'klarna',
    label: 'Klarna',
    src: `${PUBLIC_ASSET_BASE}/payment_logos/klarna.svg`,
    framed: true,
  },
  {
    readinessKey: 'affirm',
    id: 'affirm',
    label: 'Affirm',
    src: `${PUBLIC_ASSET_BASE}/payment_logos/affirm.svg`,
  },
  {
    readinessKey: 'paypal',
    id: 'paypal',
    label: 'PayPal',
    src: `${PUBLIC_ASSET_BASE}/payment_logos/paypal-blue.svg`,
  },
  {
    readinessKey: 'afterpay',
    id: 'afterpay',
    label: 'Afterpay',
    src: `${PUBLIC_ASSET_BASE}/payment_logos/afterpay.svg`,
    framed: true,
  },
]);

export default function ExpressCheckoutMethods({ paymentMethods = {}, className = '' }) {
  const availableMethods = EXPRESS_CHECKOUT_METHODS.filter(
    (method) => method.readinessKey === null || paymentMethods?.[method.readinessKey] === true,
  );

  if (availableMethods.length === 0) return null;

  return (
    <div className={`dtb-express-checkout-methods${className ? ` ${className}` : ''}`}>
      <p className="dtb-express-checkout-methods__label">Express checkout with</p>
      <ul
        className="dtb-express-checkout-methods__list"
        aria-label="Payment methods available at checkout"
      >
        {availableMethods.map((method) => (
          <li
            key={method.id}
            className={[method.framed && 'is-framed', method.large && 'is-large'].filter(Boolean).join(' ') || undefined}
            aria-label={method.label}
            title={method.label}
          >
            <img src={method.src} alt="" loading="eager" decoding="async" />
          </li>
        ))}
      </ul>
    </div>
  );
}
