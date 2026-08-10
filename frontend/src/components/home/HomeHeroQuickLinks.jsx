import { Link } from 'react-router-dom';
import {
  Calculator,
  FileChartColumn,
  Package,
  Settings,
  Wrench,
} from 'lucide-react';

const QUICK_LINKS = [
  { id: 'repairs', label: 'Repairs', description: 'Expert service', to: '/repairs', Icon: Wrench },
  { id: 'products', label: 'Products', description: 'Full catalog', to: '/all-products', Icon: Package },
  { id: 'parts', label: 'Parts', description: 'Replacement parts', to: '/parts', Icon: Settings, featured: true },
  { id: 'schematics', label: 'Schematics', description: 'Tool diagrams', to: '/schematics', Icon: FileChartColumn },
  { id: 'calculators', label: 'Calculators', description: 'Estimate materials', to: '/calculators', Icon: Calculator },
];

export default function HomeHeroQuickLinks() {
  return (
    <nav className="home-hero-nav" aria-label="Explore Drywall Toolbox">
      <div className="home-hero-nav__track">
        {QUICK_LINKS.map(({ id, label, description, to, Icon, featured }) => (
          <Link
            key={id}
            to={to}
            className={`home-hero-cutout home-hero-nav__item${featured ? ' home-hero-nav__item--featured' : ''}`}
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
