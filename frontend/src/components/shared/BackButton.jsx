import { ArrowLeft } from 'lucide-react';

export default function BackButton({
  onClick,
  label = 'Back',
  className = '',
  hideLabelOnMobile = false,
  iconOnly = false,
}) {
  const classes = [
    'back-button',
    hideLabelOnMobile ? 'back-button--mobile-icon-only' : '',
    iconOnly ? 'back-button--icon-only' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      type="button"
      onClick={onClick}
      className={classes}
      aria-label={label}
      title={label}
    >
      <ArrowLeft
        size={iconOnly ? 16 : 20}
        strokeWidth={iconOnly ? 2 : undefined}
        aria-hidden="true"
      />
      {!iconOnly && (
        <span className={hideLabelOnMobile ? 'hidden sm:inline' : ''}>{label}</span>
      )}
    </button>
  );
}
