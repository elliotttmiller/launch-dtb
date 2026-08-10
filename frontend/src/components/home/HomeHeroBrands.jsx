import { Link } from 'react-router-dom';

function BrandLink({ brand, isClone = false }) {
  return (
    <Link
      to={brand.to}
      className={`home-hero-brands__link${isClone ? ' home-hero-brands__link--clone' : ''}`}
      aria-label={isClone ? undefined : `Shop ${brand.name}`}
      aria-hidden={isClone || undefined}
      tabIndex={isClone ? -1 : undefined}
    >
      <img src={brand.src} alt="" loading="lazy" decoding="async" />
    </Link>
  );
}

export default function HomeHeroBrands({ brands = [] }) {
  if (!brands.length) return null;

  return (
    <section className="home-hero-brands" aria-labelledby="home-hero-brands-title">
      <h2 id="home-hero-brands-title" className="home-hero-brands__title">
        Trusted by professionals. Powered by quality.
      </h2>
      <div className="home-hero-brands__viewport">
        <div className="home-hero-brands__track">
          {brands.map((brand) => (
            <BrandLink key={brand.name} brand={brand} />
          ))}
          {brands.map((brand) => (
            <BrandLink key={`${brand.name}-clone`} brand={brand} isClone />
          ))}
        </div>
      </div>
    </section>
  );
}
