import HomeHeroBrands from './HomeHeroBrands';
import HomeHeroButton from './HomeHeroButton';
import HomeHeroQuickLinks from './HomeHeroQuickLinks';
import HomeHeroTrustBar from './HomeHeroTrustBar';
import homeHeroDesktopUrl from '@assets/media/home/home-hero-desktop-1600.webp';
import homeHeroMobileUrl from '@assets/media/home/home-hero-mobile-640.webp';

const HERO_COPY = {
  eyebrow: 'Pro Quality. Pro Results.',
  mobileTitleLines: ['A New', 'Standard in', 'Drywall.'],
  desktopTitleLines: ['A New Standard', 'in Drywall.'],
  accessibleTitle: 'A New Standard in Drywall.',
  description: 'Everything you need for taping and finishing—from professional tools and parts to expert repair service.',
};

function HeroTitleLines({ lines, variant }) {
  const lastLineIndex = lines.length - 1;

  return (
    <span className={`home-hero__title-set home-hero__title-set--${variant}`} aria-hidden="true">
      {lines.map((line, index) => (
        <span
          className={`home-hero__title-line${index === lastLineIndex ? ' home-hero__title-line--accent' : ''}`}
          key={line}
        >
          {line}
          {index < lastLineIndex && <br />}
        </span>
      ))}
    </span>
  );
}

export default function HomeHero({ brands = [] }) {
  return (
    <section className="home-hero" aria-labelledby="home-hero-title">
      <div className="home-hero__stage">
        <picture className="home-hero__media" aria-hidden="true">
          <source
            media="(max-width: 640px)"
            srcSet={homeHeroMobileUrl}
            type="image/webp"
            width="640"
            height="1138"
          />
          <img
            className="home-hero__media-image"
            src={homeHeroDesktopUrl}
            width="1600"
            height="640"
            sizes="100vw"
            alt=""
            decoding="async"
            loading="eager"
            fetchPriority="high"
            draggable="false"
          />
        </picture>

        <div className="home-hero__ambient" aria-hidden="true" />
        <div className="home-hero__scrim" aria-hidden="true" />

        <div className="home-hero__content">
          <p className="home-hero__eyebrow">
            <span className="home-hero__eyebrow-bar" aria-hidden="true" />
            {HERO_COPY.eyebrow}
          </p>
          <h1 id="home-hero-title" className="home-hero__title" aria-label={HERO_COPY.accessibleTitle}>
            <HeroTitleLines lines={HERO_COPY.mobileTitleLines} variant="mobile" />
            <HeroTitleLines lines={HERO_COPY.desktopTitleLines} variant="desktop" />
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
