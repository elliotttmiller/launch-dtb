import ProductsCatalogPlatform from './ProductsCatalogPlatform.jsx';
import './parts.css';

function PartsHero() {
  return (
    <header className="dtb-parts-hero" aria-labelledby="dtb-parts-hero-title">
      <div className="dtb-parts-hero__inner">
        <div className="dtb-parts-hero__content">
          <div className="dtb-parts-hero__eyebrow-row" aria-hidden="true">
            <span className="dtb-parts-hero__eyebrow">Parts</span>
            <span className="dtb-parts-hero__eyebrow-rule" />
          </div>
          <h1 id="dtb-parts-hero-title" className="dtb-parts-hero__title">Parts</h1>
          <p className="dtb-parts-hero__description">Replacement parts and service components.</p>
          <p className="dtb-parts-hero__strapline">Keep your tools working. Genuine parts. Real support.</p>
        </div>

        <div className="dtb-parts-hero__art" aria-hidden="true">
          <span className="dtb-parts-hero__beam dtb-parts-hero__beam--one" />
          <span className="dtb-parts-hero__beam dtb-parts-hero__beam--two" />
          <span className="dtb-parts-hero__beam dtb-parts-hero__beam--three" />
          <span className="dtb-parts-hero__spring">
            {Array.from({ length: 10 }, (_, index) => <i key={index} />)}
          </span>
          <span className="dtb-parts-hero__fitting" />
          <span className="dtb-parts-hero__pin" />
        </div>

        <div className="dtb-parts-hero__statement" aria-hidden="true">
          <span>Parts</span>
          <span>Service</span>
          <span>Uptime</span>
          <span>Confidence</span>
          <i />
        </div>
      </div>
    </header>
  );
}

export default function Parts() {
  return (
    <div className="dtb-parts-page">
      <PartsHero />
      <ProductsCatalogPlatform forceProductGrid title="Parts" isPartsFilter={1} />
    </div>
  );
}
