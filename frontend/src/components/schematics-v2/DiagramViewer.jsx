/**
 * frontend/src/components/schematics-v2/DiagramViewer.jsx
 *
 * Composes DiagramImage + ZoomControls + HotspotLayer and owns desktop
 * (wheel + drag) and touch (pinch + drag) zoom/pan state. Handles explicit
 * missing-page / missing-media / missing-hotspot-data states.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, ImageOff } from 'lucide-react';
import DiagramImage from './DiagramImage';
import ZoomControls from './ZoomControls';
import HotspotLayer from './HotspotLayer';

const MIN_SCALE = 1;
const MAX_SCALE = 4;

function clampScale(scale) {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
}

function clampOffset(offset, scale, containerSize) {
  if (scale <= 1 || !containerSize) return { x: 0, y: 0 };
  const maxOffset = {
    x: (containerSize.width * (scale - 1)) / 2,
    y: (containerSize.height * (scale - 1)) / 2,
  };
  return {
    x: Math.min(maxOffset.x, Math.max(-maxOffset.x, offset.x)),
    y: Math.min(maxOffset.y, Math.max(-maxOffset.y, offset.y)),
  };
}

export default function DiagramViewer({ page, parts, onSelectPart }) {
  const containerRef = useRef(null);
  const imgRef = useRef(null);
  const pointers = useRef(new Map());
  const gesture = useRef(null);

  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isGesturing, setIsGesturing] = useState(false);

  const reduceMotion = typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  // Reset zoom/pan/load state when the active page changes. Adjusted
  // synchronously during render (not in an effect) so the reset is visible
  // on the same paint as the page switch.
  const [prevPageId, setPrevPageId] = useState(page?.page_id);
  if (prevPageId !== page?.page_id) {
    setPrevPageId(page?.page_id);
    setScale(1);
    setOffset({ x: 0, y: 0 });
    setImageLoaded(false);
  }

  // Browser-cached images can complete before the React `onLoad` handler is
  // attached, so the load event never fires and the hotspot layer would stay
  // hidden forever. Back-check `img.complete` after each page switch so the
  // hotspot overlay still mounts for already-cached diagrams.
  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current?.naturalWidth > 0) {
      setImageLoaded(true);
    }
  }, [page?.page_id]);

  const applyScale = useCallback((nextScale, nextOffset) => {
    const container = containerRef.current;
    const size = container ? { width: container.clientWidth, height: container.clientHeight } : null;
    setScale(clampScale(nextScale));
    setOffset(clampOffset(nextOffset ?? offset, nextScale, size));
  }, [offset]);

  const handleWheel = useCallback((event) => {
    if (!event.ctrlKey && !event.metaKey && Math.abs(event.deltaY) < 4) return;
    event.preventDefault();
    const delta = -event.deltaY * 0.0015;
    applyScale(scale + delta * scale);
  }, [scale, applyScale]);

  const handlePointerDown = useCallback((event) => {
    if (scale <= 1) return;
    containerRef.current?.setPointerCapture?.(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.current.size === 1) {
      gesture.current = { type: 'pan', startOffset: offset, startPoint: { x: event.clientX, y: event.clientY } };
      setIsGesturing(true);
    }
  }, [scale, offset]);

  const handlePointerMove = useCallback((event) => {
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointers.current.size === 2) {
      const [a, b] = Array.from(pointers.current.values());
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      if (!gesture.current || gesture.current.type !== 'pinch') {
        gesture.current = { type: 'pinch', startDistance: distance, startScale: scale };
      } else {
        const nextScale = gesture.current.startScale * (distance / gesture.current.startDistance);
        applyScale(nextScale);
      }
      return;
    }

    if (gesture.current?.type === 'pan') {
      const dx = event.clientX - gesture.current.startPoint.x;
      const dy = event.clientY - gesture.current.startPoint.y;
      applyScale(scale, { x: gesture.current.startOffset.x + dx, y: gesture.current.startOffset.y + dy });
    }
  }, [scale, applyScale]);

  const handlePointerUp = useCallback((event) => {
    pointers.current.delete(event.pointerId);
    if (pointers.current.size === 0) {
      gesture.current = null;
      setIsGesturing(false);
    }
  }, []);

  const zoomIn = () => applyScale(scale + 0.5);
  const zoomOut = () => applyScale(scale - 0.5);
  const resetZoom = () => applyScale(1, { x: 0, y: 0 });

  if (!page) {
    return (
      <div className="dtb-schematic-diagram dtb-schematic-diagram--missing" role="status">
        <AlertTriangle size={28} aria-hidden="true" />
        <p>This page isn't available.</p>
      </div>
    );
  }

  if (!page.url) {
    return (
      <div className="dtb-schematic-diagram dtb-schematic-diagram--missing" role="status">
        <ImageOff size={28} aria-hidden="true" />
        <p>This page's diagram image isn't available yet.</p>
      </div>
    );
  }

  const hotspotDataset = page.hotspot_dataset;

  return (
    <div className="dtb-schematic-diagram-wrap">
      <div
        ref={containerRef}
        className="dtb-schematic-diagram"
        id={`dtb-schematic-panel-${page.page_id}`}
        role="tabpanel"
        aria-labelledby={`dtb-schematic-tab-${page.page_id}`}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ touchAction: scale > 1 ? 'none' : 'pan-y' }}
      >
        <div
          className="dtb-schematic-diagram__stage"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transition: reduceMotion || isGesturing ? 'none' : 'transform 120ms ease-out',
          }}
        >
          <DiagramImage page={page} onLoad={() => setImageLoaded(true)} imgRef={imgRef} />
          {imageLoaded && (
            <HotspotLayer
              hotspotDataset={hotspotDataset}
              parts={parts}
              onSelectPart={onSelectPart}
            />
          )}
        </div>
      </div>

      {hotspotDataset && hotspotDataset.available === false && (
        <p className="dtb-schematic-diagram__note" role="status">
          Hotspot data is not available for this page{hotspotDataset.reason ? ` (${hotspotDataset.reason})` : ''}.
        </p>
      )}

      <ZoomControls
        scale={scale}
        minScale={MIN_SCALE}
        maxScale={MAX_SCALE}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onReset={resetZoom}
      />
    </div>
  );
}
