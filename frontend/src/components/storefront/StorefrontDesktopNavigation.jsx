import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Award,
  BadgeCheck,
  Box,
  ChevronDown,
  ChevronRight,
  Hammer,
  Headphones,
  Layers,
  Package,
  PenTool,
  Ruler,
  Settings2,
  ShoppingBag,
  Truck,
  Wrench,
} from 'lucide-react';
import { getDropdownHero } from '../../utils/dropdownHeroAssets.js';
import '../../styles/storefront-desktop-navigation.css';
import '../../styles/storefront-navigation-taxonomy.css';

const RESILIENT_DROPDOWN_IDS = new Set(['products', 'brands', 'parts', 'repairs', 'schematics']);
const POINTER_CLOSE_DELAY_MS = 160;

const ENTRY_ICONS = [Wrench, Layers, Box, PenTool, Ruler, Hammer, Package, Settings2, ShoppingBag, Award];
const ENTRY_ICON_ELEMENTS_LARGE = ENTRY_ICONS.map((Icon, index) => (
  <Icon key={index} size={30} strokeWidth={1.6} />
));

const PRODUCT_ASSURANCE_ITEMS = [
  {
    id: 'professional-grade',
    title: 'Professional Grade',
    description: 'Built for daily jobsite performance',
    Icon: BadgeCheck,
  },
  {
    id: 'top-brands',
    title: 'Top Brands',
    description: 'Trusted professional tool brands',
    Icon: Award,
  },
  {
    id: 'fast-shipping',
    title: 'Fast Shipping',
    description: 'Quick, reliable delivery nationwide',
    Icon: Truck,
  },
  {
    id: 'expert-support',
    title: 'Expert Support',
    description: 'Real pros. Real answers.',
    Icon: Headphones,
  },
];

function pickEntryIconIndex(label) {
  const text = String(label || '');
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  return hash % ENTRY_ICONS.length;
}

function MegaMenuThumb({ label, logo, thumbnail }) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageSrc = logo || thumbnail;

  if (imageSrc && !imageFailed) {
    return (
      <span className={`dtb-desktop-nav-editorial-thumb${logo ? ' dtb-desktop-nav-editorial-thumb--logo' : ''}`}>
        <img src={imageSrc} alt="" loading="lazy" onError={() => setImageFailed(true)} />
      </span>
    );
  }

  const index = pickEntryIconIndex(label);
  return (
    <span className="dtb-desktop-nav-editorial-thumb dtb-desktop-nav-editorial-thumb--fallback" aria-hidden="true">
      {ENTRY_ICON_ELEMENTS_LARGE[index]}
    </span>
  );
}

function MegaMenuHero({ item, onNavigate }) {
  const heroImage = item.heroImage || item.heroMedia || getDropdownHero(item.id);
  const eyebrow = item.eyebrow || (item.id === 'products' ? 'Our Products' : item.label);
  const ctaLabel = item.heroCtaLabel || item.landingLabel || `View all ${String(item.label || '').toLowerCase()}`;

  return (
    <div className="dtb-mega-menu__hero">
      <div className="dtb-mega-menu__hero-copy">
        <span className="dtb-mega-menu__eyebrow">{eyebrow}</span>
        <p className="dtb-mega-menu__heading">{item.heading || item.label}</p>
        {item.description ? <p className="dtb-mega-menu__description">{item.description}</p> : null}
        {item.landingTo ? (
          <Link to={item.landingTo} className="dtb-mega-menu__hero-cta" onClick={onNavigate}>
            <span>{ctaLabel}</span>
            <ArrowRight size={16} strokeWidth={2.2} aria-hidden="true" />
          </Link>
        ) : null}
      </div>

      {heroImage ? (
        <div className="dtb-mega-menu__hero-media" aria-hidden="true">
          <img src={heroImage} alt="" loading="eager" />
        </div>
      ) : null}
    </div>
  );
}

function MegaMenuEmptyState({ item }) {
  return (
    <div className="dtb-desktop-nav-dropdown__empty" role="status">
      <strong>{item.emptyTitle || `${item.label} temporarily unavailable`}</strong>
      <span>{item.emptyMessage || 'Still loading — give it a moment, or try again in a bit.'}</span>
    </div>
  );
}

function ProductCard({ entry, onNavigate }) {
  return (
    <Link to={entry.to} className="dtb-mega-menu__product-card" onClick={onNavigate}>
      <MegaMenuThumb label={entry.label} thumbnail={entry.thumbnail} />
      <span className="dtb-desktop-nav-row-text">
        <span className="dtb-desktop-nav-row-title">{entry.label}</span>
        {entry.description ? <span className="dtb-desktop-nav-row-desc">{entry.description}</span> : null}
      </span>
      <ChevronRight size={16} className="dtb-desktop-nav-row-chevron" aria-hidden="true" />
    </Link>
  );
}

function ProductsPanelRenderer({ item, onNavigate }) {
  const groups = Array.isArray(item.items) ? item.items : [];
  const entries = groups.flatMap((group) => {
    const children = Array.isArray(group.children) ? group.children : [];
    return children.length > 0 ? children : [group];
  });

  return (
    <>
      <MegaMenuHero item={item} onNavigate={onNavigate} />
      {entries.length > 0 ? (
        <div className="dtb-mega-menu__products-grid">
          {entries.map((entry) => (
            <ProductCard key={entry.to || entry.slug || entry.label} entry={entry} onNavigate={onNavigate} />
          ))}
        </div>
      ) : (
        <MegaMenuEmptyState item={item} />
      )}
      <div className="dtb-mega-menu__assurance-bar" aria-label="Drywall Toolbox service benefits">
        {PRODUCT_ASSURANCE_ITEMS.map(({ id, title, description, Icon }) => (
          <div key={id} className="dtb-mega-menu__assurance-item">
            <span className="dtb-mega-menu__assurance-icon" aria-hidden="true">
              <Icon size={24} strokeWidth={1.8} />
            </span>
            <span className="dtb-desktop-nav-row-text">
              <span className="dtb-desktop-nav-row-title">{title}</span>
              <span className="dtb-desktop-nav-row-desc">{description}</span>
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

function BrandCard({ entry, onNavigate }) {
  return (
    <Link to={entry.to} className="dtb-mega-menu__brand-card" onClick={onNavigate}>
      <MegaMenuThumb label={entry.label} logo={entry.logo} thumbnail={entry.thumbnail} />
      <span className="dtb-desktop-nav-row-text">
        <span className="dtb-desktop-nav-row-title">{entry.label}</span>
        {entry.description ? <span className="dtb-desktop-nav-row-desc">{entry.description}</span> : null}
      </span>
      <ChevronRight size={17} className="dtb-desktop-nav-row-chevron" aria-hidden="true" />
    </Link>
  );
}

function BrandGridPanelRenderer({ item, onNavigate }) {
  const entries = Array.isArray(item.items) ? item.items : [];

  return (
    <>
      <MegaMenuHero item={item} onNavigate={onNavigate} />
      {entries.length > 0 ? (
        <div className="dtb-mega-menu__brand-grid">
          {entries.map((entry) => (
            <BrandCard key={entry.to || entry.slug || entry.label} entry={entry} onNavigate={onNavigate} />
          ))}
        </div>
      ) : (
        <MegaMenuEmptyState item={item} />
      )}
    </>
  );
}

function BrandsPanelRenderer(props) {
  return <BrandGridPanelRenderer {...props} />;
}

function PartsPanelRenderer(props) {
  return <BrandGridPanelRenderer {...props} />;
}

function SchematicsPanelRenderer(props) {
  return <BrandGridPanelRenderer {...props} />;
}

function RepairCard({ entry, onNavigate }) {
  return (
    <Link to={entry.to} className="dtb-mega-menu__repair-card" onClick={onNavigate}>
      <MegaMenuThumb label={entry.label} thumbnail={entry.thumbnail} />
      <span className="dtb-desktop-nav-row-text">
        <span className="dtb-desktop-nav-row-title">{entry.label}</span>
        {entry.description ? <span className="dtb-desktop-nav-row-desc">{entry.description}</span> : null}
      </span>
      <ChevronRight size={17} className="dtb-desktop-nav-row-chevron" aria-hidden="true" />
    </Link>
  );
}

function RepairsPanelRenderer({ item, onNavigate }) {
  const entries = Array.isArray(item.items) ? item.items : [];

  return (
    <>
      <MegaMenuHero item={item} onNavigate={onNavigate} />
      {entries.length > 0 ? (
        <div className="dtb-mega-menu__repair-grid">
          {entries.map((entry) => (
            <RepairCard key={entry.to || entry.slug || entry.label} entry={entry} onNavigate={onNavigate} />
          ))}
        </div>
      ) : (
        <MegaMenuEmptyState item={item} />
      )}
    </>
  );
}

const PANEL_RENDERERS = {
  products: ProductsPanelRenderer,
  brands: BrandsPanelRenderer,
  parts: PartsPanelRenderer,
  repairs: RepairsPanelRenderer,
  schematics: SchematicsPanelRenderer,
};

function DeliberatePanelRenderer({ item, onNavigate }) {
  const Renderer = PANEL_RENDERERS[item.id];

  if (!Renderer) {
    return <MegaMenuEmptyState item={item} />;
  }

  return <Renderer item={item} onNavigate={onNavigate} />;
}

function DesktopNavDropdown({ item, isOpen, active, onOpen, onRequestClose, onCloseImmediate, onNavigate }) {
  const triggerRef = useRef(null);
  const panelId = useId();

  const closeAndFocus = () => {
    triggerRef.current?.focus();
    onCloseImmediate();
  };

  return (
    <div
      className={`dtb-desktop-nav-menu${isOpen ? ' is-open' : ''}`}
      onPointerEnter={onOpen}
      onPointerLeave={onRequestClose}
      onFocus={onOpen}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) onCloseImmediate();
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        className={`dtb-desktop-nav-tab${active ? ' is-active' : ''}`}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => {
          if (!isOpen) onOpen();
          else onCloseImmediate();
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            closeAndFocus();
          }
        }}
      >
        <span className="dtb-desktop-nav-tab__label">{item.label}</span>
        <ChevronDown size={14} aria-hidden="true" />
      </button>

      <section
        id={panelId}
        className={`dtb-desktop-nav-dropdown dtb-desktop-nav-dropdown--${item.id} dtb-desktop-nav-dropdown--${item.size || 'medium'}`}
        aria-label={`${item.label} navigation`}
        onPointerEnter={onOpen}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            closeAndFocus();
          }
        }}
      >
        <div className="dtb-desktop-nav-dropdown__scroller" style={{ padding: 0 }}>
          <DeliberatePanelRenderer item={item} onNavigate={onNavigate} />
        </div>
      </section>
    </div>
  );
}

export default function StorefrontDesktopNavigation({ items, openMenuId, onOpen, onClose, onNavigate, isItemActive }) {
  const desktopItems = items.filter((item) => item.id !== 'support' && item.id !== 'new-arrivals');
  const closeTimerRef = useRef(null);

  const cancelPendingClose = () => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const openMenu = (id) => {
    cancelPendingClose();
    onOpen(id);
  };

  const closeImmediately = () => {
    cancelPendingClose();
    onClose();
  };

  const requestPointerClose = () => {
    cancelPendingClose();
    closeTimerRef.current = window.setTimeout(() => {
      closeTimerRef.current = null;
      onClose();
    }, POINTER_CLOSE_DELAY_MS);
  };

  useEffect(() => () => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
    }
  }, []);

  return (
    <nav className="dtb-desktop-nav" aria-label="Primary navigation">
      {desktopItems.map((item) => (item.hasDropdown || RESILIENT_DROPDOWN_IDS.has(item.id) || item.items?.length) ? (
        <DesktopNavDropdown
          key={item.id}
          item={item}
          isOpen={openMenuId === item.id}
          active={isItemActive(item)}
          onOpen={() => openMenu(item.id)}
          onRequestClose={requestPointerClose}
          onCloseImmediate={closeImmediately}
          onNavigate={onNavigate}
        />
      ) : (
        <Link
          key={item.id}
          to={item.landingTo}
          className={`dtb-desktop-nav-tab${isItemActive(item) ? ' is-active' : ''}`}
          onPointerEnter={closeImmediately}
          onClick={onNavigate}
        >
          <span className="dtb-desktop-nav-tab__label">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
