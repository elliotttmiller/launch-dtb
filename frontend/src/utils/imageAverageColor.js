/**
 * Samples the outer border ring of a loaded image via an offscreen canvas
 * and returns its average color as an `rgb(r, g, b)` string.
 *
 * Product photography is typically shot on a near-uniform seamless
 * background, so sampling only the edge pixels (not the whole image, which
 * would be dominated by the product's own colors) gives a reliable read of
 * that background tone — used to color the category hero panel behind the
 * photo so it blends naturally with whatever gets uploaded, instead of
 * relying on a single static panel color that only matches some photos.
 *
 * Returns null if the canvas can't be read (a cross-origin image without
 * CORS headers taints the canvas, decode failures, etc.) — callers should
 * fall back to a static default color in that case.
 */
export function sampleImageEdgeColor(imgEl, { sampleSize = 24, ringWidth = 2 } = {}) {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = sampleSize;
    canvas.height = sampleSize;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;

    ctx.drawImage(imgEl, 0, 0, sampleSize, sampleSize);
    const { data } = ctx.getImageData(0, 0, sampleSize, sampleSize);

    let r = 0;
    let g = 0;
    let b = 0;
    let count = 0;

    for (let y = 0; y < sampleSize; y += 1) {
      for (let x = 0; x < sampleSize; x += 1) {
        const isEdge = x < ringWidth || y < ringWidth || x >= sampleSize - ringWidth || y >= sampleSize - ringWidth;
        if (!isEdge) continue;

        const i = (y * sampleSize + x) * 4;
        const alpha = data[i + 3];
        if (alpha < 8) continue; // skip fully/near-transparent pixels

        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
        count += 1;
      }
    }

    if (count === 0) return null;
    return `rgb(${Math.round(r / count)}, ${Math.round(g / count)}, ${Math.round(b / count)})`;
  } catch {
    return null;
  }
}
