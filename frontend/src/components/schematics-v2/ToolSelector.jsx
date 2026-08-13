/**
 * frontend/src/components/schematics-v2/ToolSelector.jsx
 *
 * Renders the schematic cards for a selected brand + category. Preview
 * priority is already resolved server-side (`preview.source`) — this
 * component only renders accordingly and never substitutes a generic
 * placeholder for a genuinely missing preview.
 */
import { ImageOff } from 'lucide-react';

function CardPreview({ preview, title }) {
  if (preview?.url) {
    return (
      <img
        src={preview.url}
        alt={title}
        className="dtb-schematics-card__image"
        loading="lazy"
        decoding="async"
      />
    );
  }

  return (
    <div className="dtb-schematics-card__image dtb-schematics-card__image--unavailable" role="img" aria-label="Preview unavailable">
      <ImageOff size={28} aria-hidden="true" />
      <span>Preview unavailable</span>
    </div>
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
          <CardPreview preview={tool.preview} title={tool.title} />
          <span className="dtb-schematics-card__body">
            <span className="dtb-schematics-card__title">{tool.title}</span>
            <span className="dtb-schematics-card__meta">
              {tool.brand?.name}
              {tool.page_count ? ` · ${tool.page_count} page${tool.page_count === 1 ? '' : 's'}` : ''}
            </span>
          </span>
        </button>
      ))}
    </div>
  );
}
