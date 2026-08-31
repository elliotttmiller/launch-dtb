import HomeHeroBrands from './HomeHeroBrands';
import HomeHeroButton from './HomeHeroButton';
import HomeHeroQuickLinks from './HomeHeroQuickLinks';
import HomeHeroTrustBar from './HomeHeroTrustBar';
import homeHeroUrl from '@assets/media/home/home-hero.webp';

const HERO_COPY = {
  eyebrow: 'Professional Drywall Tools',
  titleLines: ['Built for', 'the Work.', 'Ready for the Job.'],
  description: 'Shop professional drywall tools and replacement parts from leading brands, with repair support and schematics when you need them.',
};

export default function HomeHero({ brands = [] }) {
  const lastLineIndex = HERO_COPY.titleLines.length - 1;

  return (
    <section className="home-hero" aria-labelledby="home-hero-title">
      <div className="home-hero__stage">
        <div className="home-hero__ambient" aria-hidden="true" />

        <img
          className="home-hero__media"
          src={homeHeroUrl}
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
            <HomeHeroButton to="/all-products">Shop Products</HomeHeroButton>
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
