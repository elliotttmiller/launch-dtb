/**
 * frontend/src/components/schematics-v2/SchematicVariantPills.jsx
 *
 * Size/variant switcher for schematic families where the underlying catalog
 * items are genuinely distinct REST records (Case B: multiple schematic ids
 * sharing one `family_id`, each with its own populated `variant_label`, e.g.
 * Level5's 10"/12"/14" flat boxes). Renders as a pill row above the diagram
 * and switches the active schematic in place (URL-driven, no full reload).
 *
 * Does NOT render anything for Case A (one shared record spanning multiple
 * physical sizes with an empty `variant_label`, e.g. Columbia's Automatic
 * Flat Box) — that grouping is a WooCommerce product-variation concern, out
 * of scope here. Callers derive the sibling list from the already-fetched
 * catalog collection (see useSchematicCatalog) — no extra network request.
 */
import { useRef } from 'react';

/** Numeric-first sort so "10 in." sorts after "8 in." rather than before it lexically. */
function variantSortValue(label) {
  const match = /-?\d+(\.\d+)?/.exec(label || '');
  return match ? parseFloat(match[0]) : Number.POSITIVE_INFINITY;
}

export function sortVariants(items) {
  return [...items].sort((a, b) => {
    const diff = variantSortValue(a.variant_label) - variantSortValue(b.variant_label);
    if (diff !== 0) return diff;
    return (a.variant_label || '').localeCompare(b.variant_label || '');
  });
}

export default function SchematicVariantPills({ variants, activeSchematicId, onSelectVariant }) {
  const pillRefs = useRef(new Map());

  if (!variants || variants.length <= 1) return null;

  function focusPillAt(index) {
    const variant = variants[index];
    if (!variant) return;
    const node = pillRefs.current.get(variant.id);
    node?.focus();
    onSelectVariant(variant.id);
  }

  function handleKeyDown(event, index) {
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        focusPillAt((index + 1) % variants.length);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        focusPillAt((index - 1 + variants.length) % variants.length);
        break;
      case 'Home':
        event.preventDefault();
        focusPillAt(0);
        break;
      case 'End':
        event.preventDefault();
        focusPillAt(variants.length - 1);
        break;
      default:
        break;
    }
  }

  return (
    <div className="dtb-schematic-variant-pills" role="tablist" aria-label="Size">
      <span className="dtb-schematic-variant-pills__label" aria-hidden="true">Size</span>
      {variants.map((variant, index) => {
        const selected = String(variant.id) === String(activeSchematicId);
        return (
          <button
            key={variant.id}
            ref={(node) => {
              if (node) pillRefs.current.set(variant.id, node);
              else pillRefs.current.delete(variant.id);
            }}
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            className={`dtb-schematic-variant-pill${selected ? ' dtb-schematic-variant-pill--active' : ''}`}
            onClick={() => onSelectVariant(variant.id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
          >
            {variant.variant_label}
          </button>
        );
      })}
    </div>
  );
}
