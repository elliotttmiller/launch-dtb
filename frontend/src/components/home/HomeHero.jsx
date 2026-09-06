import HomeHeroBrands from './HomeHeroBrands';
import HomeHeroButton from './HomeHeroButton';
import HomeHeroQuickLinks from './HomeHeroQuickLinks';
import HomeHeroTrustBar from './HomeHeroTrustBar';
import homeHeroDesktopUrl from '@assets/media/home/home-hero-desktop.webp';
import homeHeroMobileUrl from '@assets/media/home/home-hero-mobile.webp';

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
        <picture className="home-hero__media" aria-hidden="true">
          <source media="(max-width: 640px)" srcSet={homeHeroMobileUrl} />
          <img
            className="home-hero__media-image"
            src={homeHeroDesktopUrl}
            alt=""
            decoding="async"
            fetchPriority="high"
          />
        </picture>

        <div className="home-hero__ambient" aria-hidden="true" />
        <div className="home-hero__scrim" aria-hidden="true" />

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
