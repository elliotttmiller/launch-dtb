import { Link } from 'react-router-dom';
import {
  FileChartColumn,
  Package,
  Settings,
  Wrench,
} from 'lucide-react';

const QUICK_LINKS = [
  { id: 'repairs', label: 'Repairs', description: 'Tool repair', to: '/repairs', Icon: Wrench },
  { id: 'products', label: 'Products', description: 'Full catalog', to: '/all-products', Icon: Package },
  { id: 'parts', label: 'Parts', description: 'Replacement parts', to: '/parts', Icon: Settings },
  { id: 'schematics', label: 'Schematics', description: 'Tool diagrams', to: '/schematics', Icon: FileChartColumn },
];

export default function HomeHeroQuickLinks() {
  return (
    <nav className="home-hero-nav" aria-label="Explore Drywall Toolbox">
      <div className="home-hero-nav__track">
        {QUICK_LINKS.map(({ id, label, description, to, Icon }) => (
          <Link
            key={id}
            to={to}
            className="home-hero-cutout home-hero-nav__item"
          >
            <span className="home-hero-nav__icon" aria-hidden="true">
              <Icon size={30} strokeWidth={1.9} />
            </span>
            <span className="home-hero-nav__copy">
              <span className="home-hero-nav__label">{label}</span>
              <span className="home-hero-nav__description">{description}</span>
            </span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
