/**
 * frontend/src/components/schematics-v2/SchematicHeader.jsx
 *
 * Title/back-navigation bar for the schematic viewer. Page label text is
 * plain derived React state — no DOM mutation runtime required.
 */
import BackButton from '../shared/BackButton';

export default function SchematicHeader({ title, brandName, categoryName, onBack }) {
  return (
    <div className="dtb-schematic-viewer__header">
      <BackButton onClick={onBack} label="Schematics" />
      <div className="dtb-schematic-viewer__heading">
        <h1 className="dtb-schematic-viewer__title">{title}</h1>
        {(brandName || categoryName) && (
          <p className="dtb-schematic-viewer__subtitle">
            {[brandName, categoryName].filter(Boolean).join(' · ')}
          </p>
        )}
      </div>
    </div>
  );
}
