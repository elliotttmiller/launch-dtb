import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export default function HomeHeroButton({ children, to, variant = 'primary' }) {
  return (
    <Link className={`home-hero-cutout home-hero__button home-hero__button--${variant}`} to={to}>
      <span className="home-hero__button-label">{children}</span>
      <ChevronRight className="home-hero__button-icon" size={18} strokeWidth={2.4} aria-hidden="true" />
    </Link>
  );
}
