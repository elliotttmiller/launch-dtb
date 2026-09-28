import './product-rating.css';

const STAR_PATH = 'M10 1.65l2.57 5.2 5.74.83-4.15 4.04.98 5.71L10 14.73l-5.14 2.7.98-5.71L1.69 7.68l5.74-.83L10 1.65z';

function numberOrZero(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

function Star({ fill }) {
  return <span className="dtb-product-rating__star" aria-hidden="true"><svg viewBox="0 0 20 20"><path d={STAR_PATH} /></svg><span className="dtb-product-rating__star-fill" style={{ width: `${fill}%` }}><svg viewBox="0 0 20 20"><path d={STAR_PATH} /></svg></span></span>;
}

/** A display-only projection of WooCommerce's rating aggregate. */
export default function ProductRating({ rating = 0, ratingCount = 0, className = '', compact = false }) {
  const count = Math.floor(numberOrZero(ratingCount));
  const average = count > 0 ? Math.min(5, numberOrZero(rating)) : 0;
  const label = count > 0 ? `${average.toFixed(1)} out of 5 stars from ${count} review${count === 1 ? '' : 's'}` : 'No reviews yet';
  return <span className={`dtb-product-rating${compact ? ' dtb-product-rating--compact' : ''} ${className}`.trim()} aria-label={label}><span className="dtb-product-rating__stars">{[0, 1, 2, 3, 4].map((index) => <Star key={index} fill={Math.max(0, Math.min(1, average - index)) * 100} />)}</span><span className="dtb-product-rating__label">{count > 0 ? `${average.toFixed(1)} (${count})` : 'No reviews yet'}</span></span>;
}
