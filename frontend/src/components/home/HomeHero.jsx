import HomeHeroBrands from './HomeHeroBrands';
import HomeHeroButton from './HomeHeroButton';
import HomeHeroQuickLinks from './HomeHeroQuickLinks';

const HERO_COPY = {
  title: ['The New Standard', 'in Drywall.'],
  description: 'Premium tools for every drywall job — unbeatable prices, lightning-fast shipping, expert support.',
};

export default function HomeHero({ brands = [] }) {
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
          <h1 id="home-hero-title" className="home-hero__title">
            {HERO_COPY.title.map((line) => <span key={line}>{line}</span>)}
          </h1>
          <p className="home-hero__description">{HERO_COPY.description}</p>
          <div className="home-hero__actions">
            <HomeHeroButton to="/all-products">Shop All Products</HomeHeroButton>
            <HomeHeroButton to="/parts" variant="secondary">Shop Parts</HomeHeroButton>
          </div>
        </div>
      </div>

      <HomeHeroQuickLinks />
      <HomeHeroBrands brands={brands} />
    </section>
  );
}
