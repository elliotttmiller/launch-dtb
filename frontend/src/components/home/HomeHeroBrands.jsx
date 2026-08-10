import { Link } from 'react-router-dom';

export default function HomeHeroBrands({ brands = [] }) {
  if (!brands.length) return null;

  return (
    <section className="home-hero-brands" aria-labelledby="home-hero-brands-title">
      <h2 id="home-hero-brands-title" className="home-hero-brands__title">
        Trusted by professionals. Powered by quality.
      </h2>
      <div className="home-hero-brands__track">
        {brands.map((brand) => (
          <Link
            key={brand.name}
            to={brand.to}
            className="home-hero-brands__link"
            aria-label={`Shop ${brand.name}`}
          >
            <img src={brand.src} alt="" loading="lazy" decoding="async" />
          </Link>
        ))}
      </div>
    </section>
  );
}
