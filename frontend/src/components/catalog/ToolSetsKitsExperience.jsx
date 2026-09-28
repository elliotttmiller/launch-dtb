import { ArrowRight, Settings2, ShieldCheck, UsersRound } from 'lucide-react';
import { Link } from 'react-router-dom';
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

export default function ToolSetsKitsExperience({ category, breadcrumbs = [], products = [] }) {
  const featured = products.slice(0, 4);
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
        <div className="dtb-toolsets-hero__art" aria-hidden="true"><img src="/images/tool-sets-kits-hero.png" alt="" /></div>
      </div>

      <div className="dtb-toolsets-content">
        <header className="dtb-toolsets-section-head">
          <p>Choose a system</p>
          <h2>Start with the work your crew performs.</h2>
          <span>Find the right tool set for your crew, your workflow, and your finish goals.</span>
        </header>
        <div className="dtb-toolsets-system-grid">
          {SYSTEMS.map(([title, description], index) => (
            <a className="dtb-toolsets-system" href="#dtb-category-filters" key={title}>
              <img src={`${IMAGE_ROOT}/automatic-taping-tool-sets.webp`} alt="" loading={index > 1 ? 'lazy' : 'eager'} />
              <h3>{title}</h3><p>{description}</p><ArrowRight aria-hidden="true" />
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
            return <Link className="dtb-toolsets-product" key={product.id || product.sku || product.slug} to={product.slug ? `/products/${product.slug}` : `/product/${product.id}`}>
              <img src={productImage(product)} alt="" loading="lazy" />
              <div><h3>{product.name}</h3>{price ? <strong>${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong> : null}</div>
            </Link>;
          })}
        </div>}
        <div className="dtb-toolsets-brands" aria-label="Trusted brands">
          <div><p>Trusted brands</p><span>Build with the industry’s most trusted brands.</span></div>
          {['Drywall Toolbox', 'TAPERPRO', 'Columbia Tools', 'LEVEL5', 'REFINA', 'DEWALT', 'Makita'].map((brand) => <span key={brand}>{brand}</span>)}
        </div>
      </div>
    </section>
  );
}
