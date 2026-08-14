/**
 * frontend/src/components/schematics-v2/ToolSelector.jsx
 *
 * Renders the schematic cards for a selected brand + category. Preview
 * priority is already resolved server-side (`preview.source`) — this
 * component only renders accordingly and never substitutes a generic
 * placeholder for a genuinely missing preview.
 *
 * Visual language ported from the richer drywall-toolbox reference: square
 * cards with a full-bleed schematic/product photo, a bottom-heavy dark
 * scrim, and the title anchored at the bottom of the card (rather than a
 * plain white card with text below the image).
 */
import { ImageOff } from 'lucide-react';
import { humanizeLabel } from '../../utils/string.js';

function CardPreview({ preview }) {
  if (preview?.url) {
    return (
      <img
        src={preview.url}
        alt=""
        className="dtb-schematics-card__bg-image"
        loading="lazy"
        decoding="async"
      />
    );
  }

  return (
    <span className="dtb-schematics-card__bg-fallback" role="img" aria-label="Preview unavailable">
      <ImageOff size={28} aria-hidden="true" />
      <span>Preview unavailable</span>
    </span>
  );
}

export default function ToolSelector({ categoryName, tools, onSelectTool }) {
  if (tools.length === 0) {
    return (
      <div className="dtb-schematics-empty" role="status">
        <p>No schematics are available for {categoryName || 'this category'} yet.</p>
      </div>
    );
  }

  return (
    <div className="dtb-schematics-grid dtb-schematics-grid--tools" role="list">
      {tools.map((tool) => (
        <button
          key={tool.id}
          type="button"
          role="listitem"
          className="dtb-schematics-card dtb-schematics-card--tool"
          onClick={() => onSelectTool(tool.id)}
        >
          <CardPreview preview={tool.preview} />
          <span className="dtb-schematics-card__scrim" aria-hidden="true" />
          <span className="dtb-schematics-card__overlay dtb-schematics-card__overlay--center">
            <span className="dtb-schematics-card__title">{tool.title}</span>
            <span className="dtb-schematics-card__meta">
              {humanizeLabel(tool.brand?.name, tool.brand?.id)}
              {tool.page_count ? ` · ${tool.page_count} page${tool.page_count === 1 ? '' : 's'}` : ''}
            </span>
          </span>
        </button>
      ))}
    </div>
  );
}
