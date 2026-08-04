import { Link } from 'react-router-dom';
import '../../styles/order-confirmed-hero.css';

export default function OrderConfirmedHero({
  orderId,
  trackingHref,
  continueHref = '/products',
  titleId,
  message = 'Thank you! Your order has been received and is being processed. A confirmation email with your order details has been sent to your inbox.',
}) {
  return (
    <section className="dtb-confirmed-hero" aria-labelledby={titleId}>
      <div className="dtb-confirmed-hero__content">
        <p className="dtb-confirmed-hero__eyebrow">Payment successful</p>
        <h1 id={titleId} className="dtb-confirmed-hero__title">Order confirmed!</h1>

        {orderId ? (
          <p className="dtb-confirmed-hero__order-number">
            Order <span>#{orderId}</span>
          </p>
        ) : null}

        <p className="dtb-confirmed-hero__message">{message}</p>

        <div className="dtb-confirmed-hero__actions">
          <Link to={trackingHref} className="dtb-confirmed-hero__button dtb-confirmed-hero__button--primary">
            Track My Order
          </Link>
          <Link to={continueHref} className="dtb-confirmed-hero__button dtb-confirmed-hero__button--secondary">
            Continue Shopping
          </Link>
        </div>
      </div>

      <div className="dtb-confirmed-hero__art" aria-hidden="true">
        <svg viewBox="0 0 300 260" className="dtb-confirmed-hero__art-svg" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path className="dtb-confirmed-hero__art-sparkle" d="M40 168h16M48 160v16" strokeLinecap="round" strokeWidth="2" />
          <path className="dtb-confirmed-hero__art-sparkle" d="M258 96h14M265 89v14" strokeLinecap="round" strokeWidth="2" />
          <path className="dtb-confirmed-hero__art-sparkle" d="M252 168h12M258 162v12" strokeLinecap="round" strokeWidth="2" />
          <circle className="dtb-confirmed-hero__art-dot" cx="30" cy="120" r="2.5" />
          <circle className="dtb-confirmed-hero__art-dot" cx="272" cy="140" r="2.5" />

          <g className="dtb-confirmed-hero__art-box">
            <path d="M70 90 150 60l80 30v90l-80 30-80-30V90Z" strokeWidth="2.5" strokeLinejoin="round" />
            <path d="M70 90l80 30 80-30" strokeWidth="2.5" strokeLinejoin="round" />
            <path d="M150 120v90" strokeWidth="2.5" />
            <path d="M105 76l80 30" strokeWidth="2" opacity="0.55" />
          </g>

          <g className="dtb-confirmed-hero__art-badge">
            <circle cx="210" cy="168" r="34" />
            <path d="M195 168l10 10 20-20" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        </svg>
      </div>
    </section>
  );
}
