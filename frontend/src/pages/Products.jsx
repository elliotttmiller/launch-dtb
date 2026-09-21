import { useLocation } from 'react-router-dom';
import ProductsCatalogPlatform from './ProductsCatalogPlatform.jsx';
import Breadcrumb from '../components/shared/Breadcrumb.jsx';
import './products.css';
import './products-selector.css';
import '../styles/tool-selector.css';
import '../styles/selector-cards.css';

function ProductsHero() {
  return (
    <>
      <div className="dtb-products-breadcrumb-shell">
        <Breadcrumb items={[{ label: 'Home', path: '/' }, { label: 'All Products' }]} />
      </div>

      <header className="dtb-products-hero" aria-labelledby="dtb-products-hero-title">
        <div className="dtb-products-hero__inner">
          <div className="dtb-products-hero__content">
            <div className="dtb-products-hero__eyebrow-row">
              <span className="dtb-products-hero__eyebrow">Products</span>
              <span className="dtb-products-hero__eyebrow-rule" aria-hidden="true" />
            </div>
            <h1 id="dtb-products-hero-title" className="dtb-products-hero__title">All Products</h1>
            <p className="dtb-products-hero__description">Professional drywall tools, parts and supplies.</p>
          </div>

          <div className="dtb-products-hero__art" aria-hidden="true">
            <span className="dtb-products-hero__slash dtb-products-hero__slash--one" />
            <span className="dtb-products-hero__slash dtb-products-hero__slash--two" />
            <span className="dtb-products-hero__slash dtb-products-hero__slash--three" />
            <div className="dtb-products-hero__statement">
              <span>The Tools</span>
              <span>The Parts</span>
              <span>The Expertise</span>
              <span>You Need</span>
              <span className="dtb-products-hero__statement-rule" />
            </div>
          </div>
        </div>
      </header>
    </>
  );
}

export default function Products(props) {
  const location = useLocation();
  const isAllProductsRoute = location.pathname === '/products';

  return (
    <div className="dtb-products-page">
      {isAllProductsRoute ? <ProductsHero /> : null}
      <ProductsCatalogPlatform {...props} />
    </div>
  );
}
