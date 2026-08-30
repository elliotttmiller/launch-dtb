/**
 * frontend/src/components/schematics-v2/BrandSelector.jsx
 *
 * Renders the brand grid for the schematics catalog root. Purely
 * presentational — derives everything from `brands` (see useSchematicCatalog).
 *
 * Brand-logo presentation is centralized here and reused by the brand
 * category view so schematic surfaces never maintain competing logo maps.
 */
import { ImageOff } from 'lucide-react';

import asgardLogo from '/brands/Asgard/asgard_logo.svg';
import columbiaLogo from '/brands/Columbia/columbia_taping_tools_logo.svg';
import duraStiltsLogo from '/brands/Dura-Stilts/dura-stilts-logo.svg';
import gracoLogo from '/brands/Graco/graco_logo.svg';
import level5Logo from '/brands/Level5/Level5.svg';
import platinumLogo from '/brands/Platinum/platinum_logo.svg';
import surproLogo from '/brands/SurPro/surpro_logo.svg';
import tapeTechLogo from '/brands/TapeTech/tapetech_logo.svg';

const BRAND_LOGO_MATCHERS = [
  { test: /durastilts?/, logo: duraStiltsLogo },
  { test: /tapetech/, logo: tapeTechLogo },
  { test: /columbia/, logo: columbiaLogo },
  { test: /surpro/, logo: surproLogo },
  { test: /asgard/, logo: asgardLogo },
  { test: /graco/, logo: gracoLogo },
  { test: /platinum/, logo: platinumLogo },
  { test: /level5/, logo: level5Logo },
];

export function resolveSchematicBrandLogo(name) {
  const normalized = (name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const match = BRAND_LOGO_MATCHERS.find(({ test }) => test.test(normalized));
  return match?.logo || null;
}

export function SchematicBrandLogo({ brand, className = '' }) {
  const name = brand?.name || brand?.id || 'Brand';
  const logo = resolveSchematicBrandLogo(name);

  if (!logo) return null;

  return (
    <img
      src={logo}
      alt={`${name} logo`}
      className={className}
      loading="eager"
      decoding="async"
    />
  );
}

export default function BrandSelector({ brands, onSelectBrand }) {
  if (brands.length === 0) {
    return (
      <div className="dtb-schematics-empty" role="status">
        <p>No schematic brands are available right now.</p>
      </div>
    );
  }

  return (
    <div className="dtb-schematics-grid dtb-schematics-grid--brands" role="list">
      {brands.map((brand) => {
        const logo = resolveSchematicBrandLogo(brand.name);
        return (
          <button
            key={brand.id}
            type="button"
            role="listitem"
            className="dtb-schematics-card dtb-schematics-card--brand"
            onClick={() => onSelectBrand(brand.id)}
          >
            {logo ? (
              <img
                src={logo}
                alt={`${brand.name} logo`}
                className="dtb-schematics-card__brand-logo"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <span className="dtb-schematics-card__brand-fallback" aria-hidden="true">
                <ImageOff size={28} />
              </span>
            )}
            <span className="dtb-schematics-card__title dtb-schematics-card__title--sr-fallback">
              {brand.name}
            </span>
            <span className="dtb-schematics-card__meta">
              {brand.count} schematic{brand.count === 1 ? '' : 's'}
            </span>
          </button>
        );
      })}
    </div>
  );
}
