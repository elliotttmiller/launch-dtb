import { m as Motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { normalizeAttributeKey } from '../../utils/variationSelection.js';
import { dtbSpring, dtbTransition, reducedTransition } from '../../motion/dtbMotion.js';

function attributeLabel(attr) {
  return (attr?.name || '').replace(/^pa_/i, '').replace(/[_-]+/g, ' ').trim();
}

export default function ProductVariationSelector({
  variationAttributes,
  variantOptionMeta,
  selectedAttrs,
  setSelectedAttrs,
  variationsLoading,
  selectedVariation,
  hasCompleteSelection,
}) {
  const reduceMotion = useReducedMotion();
  if (!Array.isArray(variationAttributes) || variationAttributes.length === 0) return null;

  const usesGenericOptionsLabel = variationAttributes.length === 1;

  return (
    <div className="product-variation-panel" aria-label="Product options">
      {variationAttributes.map((attr) => {
        const selectedValue = selectedAttrs?.[attr.name]
          ?? Object.entries(selectedAttrs || {}).find(
            ([name]) => normalizeAttributeKey(name) === normalizeAttributeKey(attr.name)
          )?.[1]
          ?? '';
        const options = variantOptionMeta[attr.name] || [];
        const normalizedLabel = attributeLabel(attr);
        const label = usesGenericOptionsLabel
          ? (/corner/i.test(`${attr?.name || ''} ${normalizedLabel}`) ? 'Select Corner Style' : `Select ${normalizedLabel || 'Options'}`)
          : normalizedLabel;

        return (
          <section key={attr.name} className="product-variation-group">
            <div className="product-variation-group__header">
              <span className="product-variation-group__label">{label}</span>
            </div>

            <div className="dtb-variant-rail">
              {options.map((option) => {
                const selected = `${selectedValue}` === `${option.value}`;
                const soldOut = option.status === 'sold-out';
                const unavailable = option.status === 'unavailable';
                const disabled = !variationsLoading && unavailable;

                let ariaLabel = option.value;
                if (variationsLoading) ariaLabel += ' - loading';
                else if (soldOut) ariaLabel += ' - sold out';
                else if (unavailable) ariaLabel += ' - unavailable';

                const pillClasses = ['dtb-variant-pill'];
                if (selected) pillClasses.push('is-selected', 'dtb-variant-pill--selected');
                if (!variationsLoading) {
                  if (soldOut) pillClasses.push('is-sold-out');
                  else if (unavailable) pillClasses.push('is-disabled', 'dtb-variant-pill--disabled');
                } else {
                  pillClasses.push('is-loading');
                }

                return (
                  <Motion.button
                    key={`${attr.name}-${option.value}`}
                    type="button"
                    onClick={() => setSelectedAttrs((prev) => ({ ...prev, [attr.name]: option.value }))}
                    disabled={disabled}
                    aria-pressed={selected}
                    aria-disabled={disabled}
                    aria-label={ariaLabel}
                    className={pillClasses.join(' ')}
                    whileTap={disabled || reduceMotion ? undefined : { scale: 0.985 }}
                    transition={reduceMotion ? reducedTransition : dtbSpring.responsive}
                  >
                    <AnimatePresence>
                      {!variationsLoading && selected ? (
                        <Motion.span
                          className="dtb-variant-pill__selection-overlay"
                          aria-hidden="true"
                          initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.94 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: reduceMotion ? 1 : 0.98 }}
                          transition={reduceMotion ? reducedTransition : dtbTransition.fast}
                        />
                      ) : null}
                    </AnimatePresence>
                    <span className="dtb-variant-pill__label">{option.value}</span>
                    {!variationsLoading && (soldOut || unavailable) ? (
                      <span className="sr-only">Unavailable</span>
                    ) : null}
                  </Motion.button>
                );
              })}
            </div>
          </section>
        );
      })}

      <AnimatePresence>
        {selectedVariation?.stock_status === 'outofstock' && (
          <Motion.p
            className="product-variation-alert product-variation-alert--out-of-stock"
            initial={{ opacity: 0, y: reduceMotion ? 0 : -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduceMotion ? 0 : -4 }}
            transition={reduceMotion ? reducedTransition : dtbTransition.standard}
          >
            This option is currently out of stock.
          </Motion.p>
        )}
        {!variationsLoading && hasCompleteSelection && !selectedVariation && (
          <Motion.p
            className="product-variation-alert product-variation-alert--unavailable"
            initial={{ opacity: 0, y: reduceMotion ? 0 : -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduceMotion ? 0 : -4 }}
            transition={reduceMotion ? reducedTransition : dtbTransition.standard}
          >
            This option combination is not available. Please try a different selection.
          </Motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
