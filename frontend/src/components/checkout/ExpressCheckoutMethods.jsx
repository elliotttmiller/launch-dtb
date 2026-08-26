import '../../styles/express-checkout-methods.css';
import { EXPRESS_CHECKOUT_METHODS } from '@assets/payment-methods/index.js';

export default function ExpressCheckoutMethods({ paymentMethods = {}, className = '' }) {
  const availableMethods = EXPRESS_CHECKOUT_METHODS.filter(
    (method) => paymentMethods?.[method.readinessKey] === true,
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
