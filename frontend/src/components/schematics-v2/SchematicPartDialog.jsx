/**
 * frontend/src/components/schematics-v2/SchematicPartDialog.jsx
 *
 * Positioning wrapper ported from the legacy `Schematics.jsx` desktop
 * "detached modal" + mobile overlay behavior:
 *   - Desktop: a `.part-modal.part-modal-detached` div, `position: absolute`
 *     with inline `top`/`left` px computed relative to the diagram wrapper
 *     (the legacy `.schematic-container` equivalent here is the
 *     `.dtb-schematic-diagram-wrap` element, passed in via `wrapRef`),
 *     placed below the clicked hotspot and flipped above / clamped to the
 *     wrapper bounds when it would otherwise overflow.
 *   - Mobile (<=768px): a fixed, viewport-centered `.mobile-part-modal-overlay`
 *     with a `.mobile-modal-backdrop`, matching the legacy mobile behavior
 *     (CSS in mobile-schematic.css only shows these under max-width:768px).
 *
 * Renders `SchematicHotspotCard` — the exact ported card markup — inside
 * whichever wrapper is active.
 */
import { useLayoutEffect, useRef, useState } from 'react';
import SchematicHotspotCard from './SchematicHotspotCard';

const OFFSET = 12; // gap between hotspot and modal
const PADDING = 8; // minimum clearance from wrapper edges
const MODAL_WIDTH_FALLBACK = 280;
const MODAL_HEIGHT_FALLBACK = 320;

/**
 * Ported from the legacy `calculateAndSetModalPosition` in Schematics.jsx:
 * prefers placing the modal below the hotspot, flips above when it would
 * overflow the bottom edge, and clamps both axes to the wrapper bounds.
 */
function calculatePosition(hotspotRect, wrapRect, modalSize) {
  if (!hotspotRect || !wrapRect) return null;

  const modalWidth = modalSize?.width || MODAL_WIDTH_FALLBACK;
  const modalHeight = modalSize?.height || MODAL_HEIGHT_FALLBACK;

  const hotspotCenterX = (hotspotRect.left + hotspotRect.width / 2) - wrapRect.left;
  const hotspotBottom = hotspotRect.bottom - wrapRect.top;
  const hotspotTop = hotspotRect.top - wrapRect.top;

  let top = hotspotBottom + OFFSET;
  let left = hotspotCenterX - modalWidth / 2;

  left = Math.max(PADDING, Math.min(left, wrapRect.width - modalWidth - PADDING));

  if (top + modalHeight > wrapRect.height - PADDING) {
    top = hotspotTop - modalHeight - OFFSET;
  }

  top = Math.max(PADDING, Math.min(top, wrapRect.height - modalHeight - PADDING));

  return { top, left };
}

export default function SchematicPartDialog({ part, anchorRect, wrapRef, isMobile, onClose }) {
  const cardRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useLayoutEffect(() => {
    if (isMobile || !anchorRect || !wrapRef?.current) return;
    const wrapRect = wrapRef.current.getBoundingClientRect();
    const modalSize = cardRef.current
      ? { width: cardRef.current.offsetWidth, height: cardRef.current.offsetHeight }
      : null;
    const next = calculatePosition(anchorRect, wrapRect, modalSize);
    if (next) setPosition(next);
  }, [anchorRect, isMobile, wrapRef, part]);

  useLayoutEffect(() => {
    if (isMobile) return;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobile, onClose]);

  if (!part) return null;

  if (isMobile) {
    return (
      <>
        <div className="mobile-modal-backdrop" onClick={onClose} />
        <div className="mobile-part-modal-overlay" onClick={(e) => e.stopPropagation()}>
          <SchematicHotspotCard part={part} onClose={onClose} />
        </div>
      </>
    );
  }

  return (
    <div
      ref={cardRef}
      className="part-modal part-modal-detached"
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'absolute',
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      <SchematicHotspotCard part={part} onClose={onClose} />
    </div>
  );
}
