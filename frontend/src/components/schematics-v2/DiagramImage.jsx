/**
 * frontend/src/components/schematics-v2/DiagramImage.jsx
 *
 * Renders the diagram <img> reserving real layout space via width/height
 * from the API (avoids CLS), and uses responsive `sources`/`srcset` data
 * where the API provides it.
 */

function buildSrcSet(sources) {
  if (!Array.isArray(sources) || sources.length === 0) return undefined;
  return sources
    .filter((s) => s?.url && s?.width)
    .map((s) => `${s.url} ${s.width}w`)
    .join(', ') || undefined;
}

export default function DiagramImage({ page, onLoad, imgRef }) {
  if (!page?.url) return null;

  const srcSet = buildSrcSet(page.sources);

  return (
    <img
      ref={imgRef}
      src={page.url}
      srcSet={srcSet}
      sizes={srcSet ? '(max-width: 768px) 100vw, 80vw' : undefined}
      width={page.width || undefined}
      height={page.height || undefined}
      alt={page.label || `Schematic diagram page ${page.page_number}`}
      className="dtb-schematic-diagram__image"
      decoding="async"
      draggable={false}
      onLoad={onLoad}
    />
  );
}
