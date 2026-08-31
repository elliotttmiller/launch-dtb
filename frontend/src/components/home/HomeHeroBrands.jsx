import { Link } from 'react-router-dom';

// The marquee's viewport caps at 1540px (see .home-hero-brands__viewport),
// but the brand list itself can be as few as ~6 logos. If a single lap of
// the track is narrower than the viewport, both copies of the duplicated
// track are visible on screen simultaneously (a lap "sees" its own clone),
// and the loop resets so often it reads as a jarring flash rather than a
// continuous scroll. Repeating the source list until one lap is comfortably
// wider than the widest possible viewport guarantees a single lap always
// fills (and overflows) the visible area, so no logo is ever duplicated
// on-screen and the -50% reset always happens safely off-screen.
const MIN_LANE_LENGTH = 16;

function buildLane(brands) {
  if (brands.length === 0) return [];
  const repeatCount = Math.max(1, Math.ceil(MIN_LANE_LENGTH / brands.length));
  return Array.from({ length: repeatCount }, (_, i) => brands.map((brand) => ({ ...brand, laneKey: `${brand.name}-${i}` }))).flat();
}

function BrandLink({ brand, isClone = false }) {
  return (
    <Link
      to={brand.to}
      className={`home-hero-brands__link${isClone ? ' home-hero-brands__link--clone' : ''}`}
      aria-label={isClone ? undefined : `Shop ${brand.name}`}
      aria-hidden={isClone || undefined}
      tabIndex={isClone ? -1 : undefined}
    >
      {/* Eager, not lazy — this is a small, always-above-the-fold set of
          logos that continuously scrolls into view; lazy-loading them makes
          each one visibly pop in mid-scroll instead of already being ready. */}
      <img src={brand.src} alt="" loading="eager" decoding="async" />
    </Link>
  );
}

export default function HomeHeroBrands({ brands = [] }) {
  if (!brands.length) return null;

  const lane = buildLane(brands);

  return (
    <section className="home-hero-brands" aria-labelledby="home-hero-brands-title">
      <h2 id="home-hero-brands-title" className="home-hero-brands__title">
        Shop leading drywall tool brands.
      </h2>
      <div className="home-hero-brands__viewport">
        <div className="home-hero-brands__track">
          {lane.map((brand) => (
            <BrandLink key={brand.laneKey} brand={brand} />
          ))}
          {lane.map((brand) => (
            <BrandLink key={`${brand.laneKey}-clone`} brand={brand} isClone />
          ))}
        </div>
      </div>
    </section>
  );
}
