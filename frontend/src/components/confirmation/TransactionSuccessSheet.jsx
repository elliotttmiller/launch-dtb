import { Link } from 'react-router-dom';
import { Check, PackageCheck, RotateCcw, Wrench } from 'lucide-react';
import '../../styles/transaction-success-sheet.css';
import '../../styles/transaction-success-sheet-embedded.css';

const VARIANTS = {
  order: {
    eyebrow: 'Payment successful',
    Icon: PackageCheck,
    accentLabel: 'Order confirmed',
  },
  repair: {
    eyebrow: 'Repair request received',
    Icon: Wrench,
    accentLabel: 'Repair request confirmed',
  },
  return: {
    eyebrow: 'Return request received',
    Icon: RotateCcw,
    accentLabel: 'Return request confirmed',
  },
  default: {
    eyebrow: 'Request received',
    Icon: Check,
    accentLabel: 'Request confirmed',
  },
};

function Action({ action, primary }) {
  if (!action?.label) return null;
  const className = `dtb-success-sheet__button ${primary ? 'dtb-success-sheet__button--primary' : 'dtb-success-sheet__button--secondary'}`;

  if (action.to) {
    return <Link to={action.to} className={className}>{action.label}</Link>;
  }

  return (
    <button type="button" className={className} onClick={action.onClick}>
      {action.label}
    </button>
  );
}

export default function TransactionSuccessSheet({
  type = 'default',
  title,
  message,
  reference,
  referenceLabel,
  titleId,
  primaryAction,
  secondaryAction,
  details = [],
  children,
  embedded = false,
}) {
  const variant = VARIANTS[type] || VARIANTS.default;
  const Icon = variant.Icon;
  const visibleDetails = details.filter((item) => item?.label && item?.value);
  const className = `dtb-success-sheet dtb-success-sheet--${type}${embedded ? ' dtb-success-sheet--embedded' : ''}`;

  return (
    <section className={className} role="status" aria-live="polite" aria-labelledby={titleId}>
      <div className="dtb-success-sheet__hero">
        <div className="dtb-success-sheet__mark-wrap" aria-hidden="true">
          <span className="dtb-success-sheet__pulse" />
          <span className="dtb-success-sheet__mark">
            <svg className="dtb-success-sheet__ring" viewBox="0 0 64 64" aria-hidden="true">
              <circle cx="32" cy="32" r="29" fill="none" />
            </svg>
            <Icon className="dtb-success-sheet__icon" size={30} strokeWidth={2.2} />
          </span>
        </div>
        <p className="dtb-success-sheet__eyebrow">{variant.eyebrow}</p>
        <h1 id={titleId} className="dtb-success-sheet__title">{title || variant.accentLabel}</h1>
        {reference ? (
          <p className="dtb-success-sheet__reference">
            <span>{referenceLabel || 'Reference'}</span>
            <strong>{reference}</strong>
          </p>
        ) : null}
        {message ? <p className="dtb-success-sheet__message">{message}</p> : null}
      </div>

      {(visibleDetails.length > 0 || children) ? (
        <div className="dtb-success-sheet__body">
          {visibleDetails.length > 0 ? (
            <dl className="dtb-success-sheet__details">
              {visibleDetails.map((item) => (
                <div key={`${item.label}-${item.value}`}>
                  <dt>{item.label}</dt>
                  <dd>{item.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
          {children}
        </div>
      ) : null}

      {(primaryAction || secondaryAction) ? (
        <div className="dtb-success-sheet__actions" aria-label="Confirmation actions">
          <Action action={primaryAction} primary />
          <Action action={secondaryAction} />
        </div>
      ) : null}
    </section>
  );
}
