/**
 * frontend/src/components/schematics-v2/DiagramViewer.jsx
 *
 * Composes DiagramImage + ZoomControls + HotspotLayer and owns desktop
 * (wheel + drag) and touch (pinch + drag) zoom/pan state. Handles explicit
 * missing-page / missing-media / missing-hotspot-data states.
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AlertTriangle, ImageOff } from 'lucide-react';
import DiagramImage from './DiagramImage';
import ZoomControls from './ZoomControls';
import HotspotLayer from './HotspotLayer';

const MIN_SCALE = 1;
const MAX_SCALE = 4;

function clampScale(scale) {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
}

function clampOffset(offset, scale, containerSize, stageSize) {
  if (scale <= 1 || !containerSize || !stageSize) return { x: 0, y: 0 };
  const maxOffset = {
    x: Math.max(0, ((stageSize.width * scale) - containerSize.width) / 2),
    y: Math.max(0, ((stageSize.height * scale) - containerSize.height) / 2),
  };
  return {
    x: Math.min(maxOffset.x, Math.max(-maxOffset.x, offset.x)),
    y: Math.min(maxOffset.y, Math.max(-maxOffset.y, offset.y)),
  };
}

function fitStageToContainer(containerSize, intrinsicSize) {
  if (
    !containerSize?.width
    || !containerSize?.height
    || !intrinsicSize?.width
    || !intrinsicSize?.height
  ) {
    return null;
  }

  const fitScale = Math.min(
    containerSize.width / intrinsicSize.width,
    containerSize.height / intrinsicSize.height,
  );

  return {
    width: Math.max(1, Math.floor(intrinsicSize.width * fitScale)),
    height: Math.max(1, Math.floor(intrinsicSize.height * fitScale)),
  };
}

export default function DiagramViewer({ page, parts, onSelectPart }) {
  const containerRef = useRef(null);
  const imgRef = useRef(null);
  const pointers = useRef(new Map());
  const gesture = useRef(null);
  const lastTap = useRef({ time: 0, x: 0, y: 0 });
  const suppressHotspotUntil = useRef(0);

  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isGesturing, setIsGesturing] = useState(false);
  const [stageSize, setStageSize] = useState(null);

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
    setStageSize(null);
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

  const measureFittedStage = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const image = imgRef.current;
    const intrinsicSize = {
      width: (imageLoaded && image?.naturalWidth) || Number(page?.width) || 0,
      height: (imageLoaded && image?.naturalHeight) || Number(page?.height) || 0,
    };
    const containerSize = {
      width: container.clientWidth,
      height: container.clientHeight,
    };
    const nextStageSize = fitStageToContainer(containerSize, intrinsicSize);
    if (!nextStageSize) return;

    setStageSize((current) => (
      current?.width === nextStageSize.width && current?.height === nextStageSize.height
        ? current
        : nextStageSize
    ));
    setOffset((current) => clampOffset(current, scale, containerSize, nextStageSize));
  }, [imageLoaded, page?.height, page?.width, scale]);

  // The fitted diagram rectangle is also the hotspot coordinate space. Keep
  // it synchronized with the real viewer dimensions before paint and across
  // responsive/container resizes.
  useLayoutEffect(() => {
    measureFittedStage();
    const container = containerRef.current;
    if (!container) return undefined;

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(measureFittedStage);
      observer.observe(container);
      return () => observer.disconnect();
    }

    window.addEventListener('resize', measureFittedStage);
    return () => window.removeEventListener('resize', measureFittedStage);
  }, [measureFittedStage, page?.page_id]);

  const applyScale = useCallback((nextScale, nextOffset) => {
    const container = containerRef.current;
    const size = container ? { width: container.clientWidth, height: container.clientHeight } : null;
    const clampedScale = clampScale(nextScale);
    setScale(clampedScale);
    setOffset(clampOffset(nextOffset ?? offset, clampedScale, size, stageSize));
  }, [offset, stageSize]);

  const zoomAtPoint = useCallback((nextScale, clientX, clientY, baseScale = scale, baseOffset = offset) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const point = { x: clientX - rect.left - rect.width / 2, y: clientY - rect.top - rect.height / 2 };
    const clampedScale = clampScale(nextScale);
    const ratio = clampedScale / baseScale;
    applyScale(clampedScale, {
      x: point.x - ((point.x - baseOffset.x) * ratio),
      y: point.y - ((point.y - baseOffset.y) * ratio),
    });
  }, [applyScale, offset, scale]);

  const handleWheel = useCallback((event) => {
    if (!event.ctrlKey && !event.metaKey && Math.abs(event.deltaY) < 4) return;
    event.preventDefault();
    const delta = -event.deltaY * 0.0015;
    zoomAtPoint(scale + delta * scale, event.clientX, event.clientY);
  }, [scale, zoomAtPoint]);

  const handlePointerDown = useCallback((event) => {
    if (event.pointerType === 'mouse' && scale <= 1) return;
    containerRef.current?.setPointerCapture?.(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.current.size === 1) {
      gesture.current = {
        type: scale > 1 ? 'pan' : 'pending',
        startOffset: offset,
        startPoint: { x: event.clientX, y: event.clientY },
      };
      setIsGesturing(true);
    } else if (pointers.current.size === 2) {
      const [a, b] = Array.from(pointers.current.values());
      gesture.current = {
        type: 'pinch',
        startDistance: Math.hypot(a.x - b.x, a.y - b.y),
        startScale: scale,
        startOffset: offset,
        startMidpoint: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
      };
    }
  }, [scale, offset]);

  const handlePointerMove = useCallback((event) => {
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointers.current.size === 2) {
      suppressHotspotUntil.current = Date.now() + 250;
      const [a, b] = Array.from(pointers.current.values());
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      if (!gesture.current || gesture.current.type !== 'pinch') return;
      const midpoint = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const nextScale = gesture.current.startScale * (distance / gesture.current.startDistance);
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (!containerRect) return;
      const center = { x: containerRect.left + containerRect.width / 2, y: containerRect.top + containerRect.height / 2 };
      const startPoint = {
        x: gesture.current.startMidpoint.x - center.x,
        y: gesture.current.startMidpoint.y - center.y,
      };
      const currentPoint = { x: midpoint.x - center.x, y: midpoint.y - center.y };
      const clampedScale = clampScale(nextScale);
      const ratio = clampedScale / gesture.current.startScale;
      applyScale(clampedScale, {
        x: currentPoint.x - ((startPoint.x - gesture.current.startOffset.x) * ratio),
        y: currentPoint.y - ((startPoint.y - gesture.current.startOffset.y) * ratio),
      });
      return;
    }

    if (gesture.current?.type === 'pan') {
      const dx = event.clientX - gesture.current.startPoint.x;
      const dy = event.clientY - gesture.current.startPoint.y;
      if (Math.hypot(dx, dy) > 8) suppressHotspotUntil.current = Date.now() + 250;
      applyScale(scale, { x: gesture.current.startOffset.x + dx, y: gesture.current.startOffset.y + dy });
    }
  }, [scale, applyScale]);

  const handlePointerUp = useCallback((event) => {
    const endedGesture = gesture.current;
    pointers.current.delete(event.pointerId);
    if (pointers.current.size === 0) {
      gesture.current = null;
      setIsGesturing(false);
      if (event.pointerType !== 'mouse' && endedGesture?.startPoint) {
        const drift = Math.hypot(
          event.clientX - endedGesture.startPoint.x,
          event.clientY - endedGesture.startPoint.y,
        );
        const now = Date.now();
        const previous = lastTap.current;
        if (drift < 12 && now - previous.time < 320 && Math.hypot(event.clientX - previous.x, event.clientY - previous.y) < 28) {
          zoomAtPoint(scale > 1 ? 1 : 2, event.clientX, event.clientY);
          lastTap.current = { time: 0, x: 0, y: 0 };
        } else if (drift < 12) {
          lastTap.current = { time: now, x: event.clientX, y: event.clientY };
        }
      }
    } else if (pointers.current.size === 1 && scale > 1) {
      const [point] = Array.from(pointers.current.values());
      gesture.current = { type: 'pan', startOffset: offset, startPoint: point };
    }
  }, [offset, scale, zoomAtPoint]);

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
        onDoubleClick={(event) => zoomAtPoint(scale > 1 ? 1 : 2, event.clientX, event.clientY)}
        style={{ touchAction: 'none', cursor: scale > 1 ? (isGesturing ? 'grabbing' : 'grab') : 'default' }}
      >
        <div
          className={`dtb-schematic-diagram__stage${stageSize ? ' is-fitted' : ''}`}
          style={{
            width: stageSize ? `${stageSize.width}px` : undefined,
            height: stageSize ? `${stageSize.height}px` : undefined,
            aspectRatio: !stageSize && page.width && page.height ? `${page.width} / ${page.height}` : undefined,
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transition: reduceMotion || isGesturing ? 'none' : 'transform 120ms ease-out',
          }}
        >
          <DiagramImage
            page={page}
            onLoad={() => {
              setImageLoaded(true);
              measureFittedStage();
            }}
            imgRef={imgRef}
          />
          {imageLoaded && (
            <HotspotLayer
              hotspotDataset={hotspotDataset}
              parts={parts}
              onSelectPart={(partRef) => {
                if (Date.now() >= suppressHotspotUntil.current) onSelectPart(partRef);
              }}
            />
          )}
        </div>
      </div>

      {hotspotDataset && hotspotDataset.available === false && (
        <p className="dtb-schematic-diagram__note" role="status">
          Interactive part links are temporarily unavailable for this diagram.
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
