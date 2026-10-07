import { ArrowRight, Settings2, ShieldCheck, ShoppingCart, UsersRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getBrandLogo } from '../../utils/brandAssets.js';
import ProductRating from '../product/ProductRating.jsx';
import '../../styles/tool-sets-kits-experience.css';

const IMAGE_ROOT = 'https://drywalltoolbox.com/wp/wp-content/uploads/2026/categories/thumbnails';
const SYSTEMS = [
  ['Complete Automatic Systems', 'Taping, loading, flat finishing, and corner finishing in one coordinated setup.'],
  ['Taping Sets', 'Automatic taper plus the equipment required to load and run it.'],
  ['Flat Finishing Sets', 'Finishing boxes, compatible handles, and loading equipment.'],
  ['Corner Finishing Sets', 'Rollers, applicators, corner finishers, and compatible handles.'],
  ['Starter / Upgrade Sets', 'Focused systems for contractors moving beyond hand tools.'],
  ['Production Crew Sets', 'Broader systems for high-volume professional finishing.'],
];

function productImage(product) {
  return product?.image || product?.image_url || product?.images?.[0]?.src || `${IMAGE_ROOT}/automatic-taping-tool-sets.webp`;
}

function productPrice(product) {
  const amount = Number(String(product?.price ?? '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

export default function ToolSetsKitsExperience({ category, breadcrumbs = [], products = [], brands = [], onAddToCart, onOpenProduct }) {
  const featured = products.slice(0, 4);
  const trustedBrands = brands
    .map((brand) => ({ name: brand.name || brand.label, src: brand.logo || getBrandLogo(brand.name || brand.label), to: `/products/brands/${brand.slug}` }))
    .filter((brand) => brand.name && brand.src && brand.to)
    .slice(0, 7);
  return (
    <section className="dtb-toolsets-page" aria-label="Tool Sets and Kits">
      <div className="dtb-toolsets-hero">
        <div className="dtb-toolsets-hero__crumbs">
          {breadcrumbs.map((crumb, index) => (
            <span key={crumb.path || crumb.label}>
              {index ? <b aria-hidden="true">›</b> : null}
              {crumb.path && index < breadcrumbs.length - 1 ? <Link to={crumb.path}>{crumb.label}</Link> : <strong>{crumb.label}</strong>}
            </span>
          ))}
        </div>
        <div className="dtb-toolsets-hero__copy">
          <p>Taping &amp; Finishing Tools</p>
          <h1>{category.label}</h1>
          <div>Complete drywall tool sets built for higher productivity, better finishes, and a more efficient workflow. From full automatic systems to starter kits, find the right set for your crew.</div>
          <ul>
            <li><ShieldCheck aria-hidden="true" /><span>Pro-grade tools</span></li>
            <li><Settings2 aria-hidden="true" /><span>Complete workflow solutions</span></li>
            <li><UsersRound aria-hidden="true" /><span>Trusted by professionals</span></li>
          </ul>
        </div>
      </div>

      <div className="dtb-toolsets-content">
        <header className="dtb-toolsets-section-head">
          <p>Choose a system</p>
          <h2>Start with the work your crew performs.</h2>
          <span>Find the right tool set for your crew, your workflow, and your finish goals.</span>
        </header>
        <div className="dtb-toolsets-system-grid">
          {SYSTEMS.map(([title, description]) => (
            <a className="dtb-toolsets-system" href="#dtb-category-filters" key={title}>
              <div className="dtb-toolsets-system__body"><div className="dtb-toolsets-system__copy"><h3>{title}</h3><p>{description}</p></div><span className="dtb-toolsets-system__action"><ArrowRight aria-hidden="true" /></span></div>
            </a>
          ))}
        </div>

        <div className="dtb-toolsets-featured-head">
          <div><h2>Featured Tool Sets &amp; Kits</h2><span>Explore available systems selected for professional drywall work.</span></div>
          <a href="#dtb-category-filters">View all Tool Sets &amp; Kits <ArrowRight aria-hidden="true" /></a>
        </div>
        {featured.length > 0 && <div className="dtb-toolsets-featured-grid">
          {featured.map((product) => {
            const price = productPrice(product);
            const productPath = product.slug ? `/products/${product.slug}` : `/product/${product.id}`;
            const canAddDirectly = !product.is_variable && typeof onAddToCart === 'function';
            return <article className="dtb-toolsets-product" key={product.id || product.sku || product.slug}>
              <Link className="dtb-toolsets-product__media" to={productPath} aria-label={`View ${product.name}`}><img src={productImage(product)} alt="" loading="lazy" /></Link>
              <div className="dtb-toolsets-product__body"><Link to={productPath}><h3>{product.name}</h3></Link><ProductRating rating={product.average_rating ?? product.rating} ratingCount={product.rating_count ?? product.reviews} compact /><div className="dtb-toolsets-product__purchase">{price ? <strong>${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong> : <span>See details</span>}{canAddDirectly ? <button type="button" onClick={() => onAddToCart(product.cardProduct || product)}><ShoppingCart aria-hidden="true" />Add to cart</button> : <button type="button" onClick={() => onOpenProduct?.(product)}>Options <ArrowRight aria-hidden="true" /></button>}</div></div>
            </article>;
          })}
        </div>}
        {trustedBrands.length > 0 ? <section className="dtb-toolsets-trusted-brands" aria-labelledby="dtb-toolsets-trusted-brands-title">
          <div className="dtb-toolsets-trusted-brands__copy"><p>Trusted brands</p><span id="dtb-toolsets-trusted-brands-title">Build with the industry&apos;s most trusted brands.</span></div>
          <div className="dtb-toolsets-trusted-brands__logos">{trustedBrands.map((brand) => <Link key={brand.to} to={brand.to} className="dtb-toolsets-trusted-brands__logo" aria-label={`Shop ${brand.name}`}><img src={brand.src} alt={brand.name} loading="lazy" decoding="async" /></Link>)}</div>
          <Link className="dtb-toolsets-trusted-brands__all" to="/products/brands">Shop All Brands <ArrowRight aria-hidden="true" /></Link>
        </section> : null}
      </div>
    </section>
  );
}
