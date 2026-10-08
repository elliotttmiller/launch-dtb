import { Headphones, ShieldCheck, Tag, Truck } from 'lucide-react';

const TRUST_ITEMS = [
  { id: 'quality', Icon: ShieldCheck, label: 'Professional Quality' },
  { id: 'shipping', Icon: Truck, label: 'Fast & Reliable Shipping' },
  { id: 'support', Icon: Headphones, label: 'Expert Support' },
  { id: 'pricing', Icon: Tag, label: 'Competitive Pricing' },
];

export default function HomeHeroTrustBar() {
  return (
    <ul className="home-hero-trustbar" aria-label="Why shop Drywall Toolbox">
      {TRUST_ITEMS.map(({ id, Icon, label }) => (
        <li className="home-hero-trustbar__item" key={id}>
          <Icon className="home-hero-trustbar__icon" size={20} strokeWidth={1.9} aria-hidden="true" />
          <span className="home-hero-trustbar__label">{label}</span>
        </li>
      ))}
    </ul>
  );
}
