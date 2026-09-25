import ProductsCatalogPlatform from './ProductsCatalogPlatform.jsx';
import './parts.css';

function PartsHero() {
  return (
    <header className="dtb-parts-hero" aria-labelledby="dtb-parts-hero-title">
      <div className="dtb-parts-hero__inner">
        <div className="dtb-parts-hero__content">
          <div className="dtb-parts-hero__eyebrow-row" aria-hidden="true">
            <span className="dtb-parts-hero__eyebrow-rule" />
          </div>
          <h1 id="dtb-parts-hero-title" className="dtb-parts-hero__title">Parts</h1>
          <p className="dtb-parts-hero__description">Replacement parts and service components.</p>
        </div>

        <div className="dtb-parts-hero__art" aria-hidden="true">
          <span className="dtb-parts-hero__slash dtb-parts-hero__slash--one" />
          <span className="dtb-parts-hero__slash dtb-parts-hero__slash--two" />
          <span className="dtb-parts-hero__slash dtb-parts-hero__slash--three" />
          <div className="dtb-parts-hero__statement">
            <span>Genuine Parts</span>
            <span>Dependable Repairs</span>
            <span>Less Downtime</span>
            <span className="dtb-parts-hero__statement-rule" />
          </div>
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
