import { Headphones, ShieldCheck, Tag, Truck } from 'lucide-react';

const TRUST_ITEMS = [
  { id: 'quality', Icon: ShieldCheck, lines: ['Professional', 'Tools'] },
  { id: 'shipping', Icon: Truck, lines: ['Shipping &', 'Tracking'] },
  { id: 'support', Icon: Headphones, lines: ['Product', 'Support'] },
  { id: 'pricing', Icon: Tag, lines: ['Clear', 'Pricing'] },
];

export default function HomeHeroTrustBar() {
  return (
    <ul className="home-hero-trustbar" aria-label="Why shop Drywall Toolbox">
      {TRUST_ITEMS.map(({ id, Icon, lines }) => (
        <li className="home-hero-trustbar__item" key={id}>
          <Icon className="home-hero-trustbar__icon" size={26} strokeWidth={1.8} aria-hidden="true" />
          <span className="home-hero-trustbar__label">
            {lines[0]}
            <br />
            {lines[1]}
          </span>
        </li>
      ))}
    </ul>
  );
}
