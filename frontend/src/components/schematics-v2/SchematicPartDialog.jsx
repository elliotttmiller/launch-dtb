/**
 * frontend/src/components/schematics-v2/SchematicPartDialog.jsx
 *
 * Accessible dialog / mobile drawer presenting the resolved part looked up
 * from the already-fetched `parts` array (no network request on open).
 * Focus entry/containment, Escape-to-close, focus return, dynamic viewport
 * units for mobile full-height, and prefers-reduced-motion are honored.
 */
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import AddToCartButton from '../ui/AddToCartButton.jsx';

const RESOLUTION_LABELS = {
  explicit_product_id: 'In stock',
  exact_sku: 'In stock',
  exact_brand_mpn: 'In stock',
  compatibility: 'Compatible part',
  intentionally_unavailable: 'Not sold separately',
  unresolved: 'Product unavailable',
};

export default function SchematicPartDialog({ part, onClose }) {
  const { addToCart } = useCart();
  const dialogRef = useRef(null);
  const returnFocusRef = useRef(null);

  useEffect(() => {
    returnFocusRef.current = document.activeElement;
    const dialog = dialogRef.current;
    const focusable = dialog?.querySelector('button, a[href]');
    focusable?.focus();

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusables = Array.from(
        dialogRef.current.querySelectorAll('button, a[href], input, [tabindex]:not([tabindex="-1"])'),
      ).filter((el) => !el.disabled);
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      returnFocusRef.current?.focus?.();
    };
  }, [onClose]);

  if (!part) return null;

  const resolutionLabel = RESOLUTION_LABELS[part.resolution_state] || 'Product unavailable';
  const isUnavailable = part.resolution_state === 'intentionally_unavailable' || part.available === false;
  const isUnresolved = part.resolution_state === 'unresolved';

  // Cart action requires a real resolved product identity (id + price).
  // The documented part contract guarantees identity/URL, not necessarily
  // price/id — only offer "Add to cart" when those fields are present, and
  // fall back to a "View product" link otherwise, never a synthetic add.
  const parsedPrice = parseFloat(part.price);
  const canAddToCart = Boolean(part.product_id && Number.isFinite(parsedPrice));

  const handleAdd = async () => {
    if (!canAddToCart) return;
    await addToCart({
      id: part.product_id,
      name: part.title,
      brand: part.brand,
      price: parsedPrice,
      part_number: part.mpn || part.sku,
      sku: part.sku || part.mpn,
      image: part.image || '',
      permalink: part.product_url || '',
    }, 1);
    onClose();
  };

  return createPortal(
    <div className="dtb-schematic-part-dialog-overlay" onClick={onClose}>
      <div
        ref={dialogRef}
        className="dtb-schematic-part-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dtb-schematic-part-dialog-title"
        onClick={(event) => event.stopPropagation()}
      >
        {part.image && (
          <div className="dtb-schematic-part-dialog__image">
            <img src={part.image} alt={part.title || 'Part'} loading="lazy" decoding="async" />
          </div>
        )}

        <div className="dtb-schematic-part-dialog__body">
          <button
            type="button"
            className="dtb-schematic-part-dialog__close"
            onClick={onClose}
            aria-label="Close part details"
          >
            <X size={18} aria-hidden="true" />
          </button>

          <p className="dtb-schematic-part-dialog__status">{resolutionLabel}</p>
          <h2 id="dtb-schematic-part-dialog-title" className="dtb-schematic-part-dialog__title">
            {part.title || 'Part'}
          </h2>

          <dl className="dtb-schematic-part-dialog__meta">
            {part.brand && (
              <div><dt>Brand</dt><dd>{part.brand}</dd></div>
            )}
            {part.mpn && (
              <div><dt>MPN</dt><dd>{part.mpn}</dd></div>
            )}
            {part.sku && (
              <div><dt>SKU</dt><dd>{part.sku}</dd></div>
            )}
            {part.occurrence_count > 1 && (
              <div><dt>Used</dt><dd>{part.occurrence_count} places on this diagram</dd></div>
            )}
          </dl>

          {canAddToCart && (
            <p className="dtb-schematic-part-dialog__price">${parsedPrice.toFixed(2)}</p>
          )}

          {isUnavailable && (
            <p className="dtb-schematic-part-dialog__notice">
              This part is not sold separately.
            </p>
          )}
          {isUnresolved && (
            <p className="dtb-schematic-part-dialog__notice">
              We don't have a linked product for this part yet.
            </p>
          )}

          <div className="dtb-schematic-part-dialog__actions">
            {canAddToCart ? (
              <AddToCartButton
                label="Add to cart"
                state="idle"
                productId={part.product_id}
                onClick={handleAdd}
              />
            ) : part.product_url ? (
              <Link to={part.product_url} className="dtb-schematic-part-dialog__link" onClick={onClose}>
                View product
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
