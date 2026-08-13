/**
 * frontend/src/components/schematics-v2/HotspotLayer.jsx
 *
 * Renders EVERY hotspot occurrence for the active page (never collapsed to
 * one marker per part). Coordinates are normalized fractions (0-1) of the
 * diagram's intrinsic width/height. An occurrence with invalid/missing
 * coordinates is hidden — it is never defaulted to the image center.
 */
import { useMemo } from 'react';

function isFraction(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1;
}

function toStyle(coordinates) {
  const { x, y, width, height } = coordinates || {};
  if (!isFraction(x) || !isFraction(y)) return null;

  if (isFraction(width) && isFraction(height) && width > 0 && height > 0) {
    return {
      left: `${x * 100}%`,
      top: `${y * 100}%`,
      width: `${width * 100}%`,
      height: `${height * 100}%`,
    };
  }

  // Point hotspot — render as a small centered marker.
  return {
    left: `${x * 100}%`,
    top: `${y * 100}%`,
    width: '0',
    height: '0',
  };
}

export default function HotspotLayer({ hotspotDataset, parts, onSelectPart }) {
  const occurrences = useMemo(() => {
    if (!hotspotDataset?.available || !Array.isArray(hotspotDataset.occurrences)) return [];
    return hotspotDataset.occurrences
      .map((occurrence) => ({ occurrence, style: toStyle(occurrence.coordinates) }))
      .filter((entry) => entry.style !== null);
  }, [hotspotDataset]);

  if (occurrences.length === 0) return null;

  return (
    <div className="dtb-schematic-hotspot-layer" aria-label="Part hotspots">
      {occurrences.map(({ occurrence, style }) => {
        const part = parts?.find((p) => p.part_ref === occurrence.part_ref) || null;
        const isPoint = style.width === '0';
        const label = occurrence.label || part?.title || 'Part';

        return (
          <button
            key={occurrence.hotspot_id}
            type="button"
            className={`dtb-schematic-hotspot${isPoint ? ' dtb-schematic-hotspot--point' : ' dtb-schematic-hotspot--region'}`}
            style={style}
            onClick={() => onSelectPart(occurrence.part_ref)}
            aria-label={label}
            title={label}
          />
        );
      })}
    </div>
  );
}
