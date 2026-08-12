import HomeHeroBrands from './HomeHeroBrands';
import HomeHeroButton from './HomeHeroButton';
import HomeHeroQuickLinks from './HomeHeroQuickLinks';
import HomeHeroTrustBar from './HomeHeroTrustBar';

const HERO_COPY = {
  eyebrow: 'Pro Quality. Pro Results.',
  titleLines: ['A New', 'Standard in', 'Drywall.'],
  description: 'Professional-grade tools that help you work faster, finish better, and build your reputation.',
};

export default function HomeHero({ brands = [] }) {
  const lastLineIndex = HERO_COPY.titleLines.length - 1;

  return (
    <section className="home-hero" aria-labelledby="home-hero-title">
      <div className="home-hero__stage">
        <div className="home-hero__ambient" aria-hidden="true" />

        <img
          className="home-hero__media"
          src="/home/hero-drywall-tool.webp"
          alt=""
          decoding="async"
          fetchPriority="high"
        />

        <div className="home-hero__content">
          <p className="home-hero__eyebrow">
            <span className="home-hero__eyebrow-bar" aria-hidden="true" />
            {HERO_COPY.eyebrow}
          </p>
          <h1 id="home-hero-title" className="home-hero__title">
            {HERO_COPY.titleLines.map((line, index) => (
              <span
                className={`home-hero__title-line${index === lastLineIndex ? ' home-hero__title-line--accent' : ''}`}
                key={line}
              >
                {line}
                {index < lastLineIndex && <br />}
              </span>
            ))}
          </h1>
          <p className="home-hero__description">{HERO_COPY.description}</p>
          <div className="home-hero__actions">
            <HomeHeroButton to="/all-products">Shop All Products</HomeHeroButton>
            <HomeHeroButton to="/parts" variant="secondary">Shop Parts</HomeHeroButton>
          </div>
        </div>
      </div>

      <HomeHeroTrustBar />
      <HomeHeroQuickLinks />
      <HomeHeroBrands brands={brands} />
    </section>
  );
}
