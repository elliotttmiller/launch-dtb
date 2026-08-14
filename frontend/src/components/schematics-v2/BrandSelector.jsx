/**
 * frontend/src/components/schematics-v2/BrandSelector.jsx
 *
 * Renders the brand grid for the schematics catalog root. Purely
 * presentational — derives everything from `brands` (see useSchematicCatalog).
 *
 * Visual language ported from the richer drywall-toolbox reference
 * (frontend/src/components/schematics/BrandSelector.jsx): each brand renders
 * its actual logo image on a white card rather than plain text, using the
 * brand mark assets already published under /public/brands/. Brand-name
 * matching is done loosely (normalized substring match) because the REST
 * `brand.name` string is server-derived and not guaranteed to equal the
 * asset folder name exactly (e.g. "Columbia" vs "Columbia Taping Tools").
 */
import { ImageOff } from 'lucide-react';

// Static asset imports so webpack fingerprints/bundles them like any other
// local image — matches the pattern already used elsewhere in the app.
import asgardLogo from '/brands/Asgard/asgard_logo.svg';
import columbiaLogo from '/brands/Columbia/columbia_taping_tools_logo.svg';
import duraStiltsLogo from '/brands/Dura-Stilts/dura-stilts-logo.svg';
import gracoLogo from '/brands/Graco/graco_logo.svg';
import level5Logo from '/brands/Level5/Level5.svg';
import platinumLogo from '/brands/Platinum/platinum_logo.svg';
import surproLogo from '/brands/SurPro/surpro_logo.svg';
import tapeTechLogo from '/brands/TapeTech/tapetech_logo.svg';

// Ordered so more-specific keys ("dura-stilts") are checked before looser
// ones. Matched against a fully punctuation-stripped (lowercased,
// alphanumeric-only) version of the brand's REST `name` — the API name can
// vary in spacing/hyphenation/casing from the asset folder name (e.g.
// "Tape-Tech", "Tape Tech", "TapeTech" should all resolve the same logo), so
// the patterns below are also alphanumeric-only (no \s/- literals) to match
// against that normalized string.
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

function resolveBrandLogo(name) {
  const normalized = (name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const match = BRAND_LOGO_MATCHERS.find(({ test }) => test.test(normalized));
  return match?.logo || null;
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
        const logo = resolveBrandLogo(brand.name);
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
