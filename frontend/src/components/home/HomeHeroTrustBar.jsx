import { Headphones, ShieldCheck, Tag, Truck } from 'lucide-react';

const TRUST_ITEMS = [
  { id: 'quality', Icon: ShieldCheck, lines: ['Professional', 'Quality'] },
  { id: 'shipping', Icon: Truck, lines: ['Fast & Reliable', 'Shipping'] },
  { id: 'support', Icon: Headphones, lines: ['Expert', 'Support'] },
  { id: 'pricing', Icon: Tag, lines: ['Unbeatable', 'Prices'] },
];

export default function HomeHeroTrustBar() {
  return (
    <div className="home-hero-trustbar" role="list" aria-label="Why shop Drywall Toolbox">
      {TRUST_ITEMS.map(({ id, Icon, lines }) => (
        <div className="home-hero-trustbar__item" role="listitem" key={id}>
          <Icon className="home-hero-trustbar__icon" size={26} strokeWidth={1.8} aria-hidden="true" />
          <span className="home-hero-trustbar__label">
            {lines[0]}
            <br />
            {lines[1]}
          </span>
        </div>
      ))}
    </div>
  );
}
