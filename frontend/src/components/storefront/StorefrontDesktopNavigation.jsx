import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Award,
  Box,
  ChevronDown,
  ChevronRight,
  Hammer,
  Layers,
  Package,
  PenTool,
  Ruler,
  Settings2,
  ShoppingBag,
  Wrench,
} from 'lucide-react';
import { getDropdownHero } from '../../utils/dropdownHeroAssets.js';
import '../../styles/storefront-desktop-navigation.css';
import '../../styles/storefront-navigation-taxonomy.css';

const RESILIENT_DROPDOWN_IDS = new Set(['products', 'brands', 'parts', 'repairs', 'schematics']);
const CATALOG_BACKED_DROPDOWN_IDS = new Set(['products', 'brands', 'parts']);
const POINTER_CLOSE_DELAY_MS = 160;

const ENTRY_ICONS = [Wrench, Layers, Box, PenTool, Ruler, Hammer, Package, Settings2, ShoppingBag, Award];
const ENTRY_ICON_ELEMENTS_LARGE = ENTRY_ICONS.map((Icon, index) => (
  <Icon key={index} size={30} strokeWidth={1.6} />
));

const LOADING_SURFACE_STYLE = {
  position: 'relative',
  minHeight: '244px',
  padding: '24px',
  background: '#f3f6fa',
};

const LOADING_SPINNER_STYLE = {
  position: 'absolute',
  top: '20px',
  right: '24px',
  width: '22px',
  height: '22px',
};

function pickEntryIconIndex(label) {
  const text = String(label || '');
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  return hash % ENTRY_ICONS.length;
}

function usePrefersReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (event) => setReducedMotion(event.matches);
    query.addEventListener?.('change', onChange);
    return () => query.removeEventListener?.('change', onChange);
  }, []);

  return reducedMotion;
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

function MegaMenuLoadingSpinner({ reducedMotion }) {
  return (
    <svg viewBox="0 0 24 24" style={LOADING_SPINNER_STYLE} aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="9" fill="none" stroke="rgba(20, 87, 245, 0.16)" strokeWidth="2.2" />
      <path d="M12 3a9 9 0 0 1 8.35 5.65" fill="none" stroke="var(--mega-blue, #1457f5)" strokeWidth="2.2" strokeLinecap="round">
        {!reducedMotion ? (
          <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.9s" repeatCount="indefinite" />
        ) : null}
      </path>
    </svg>
  );
}

function MegaMenuLoadingCard({ compact, index, reducedMotion }) {
  const delay = `${(index % 4) * 0.12}s`;
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'grid',
        gridTemplateColumns: compact ? '76px minmax(0, 1fr)' : '118px minmax(0, 1fr)',
        alignItems: 'center',
        minHeight: compact ? '86px' : '104px',
        overflow: 'hidden',
        border: '1px solid rgba(15, 23, 42, 0.08)',
        borderRadius: '13px',
        background: '#fff',
        boxShadow: '0 2px 7px rgba(15, 23, 42, 0.035)',
      }}
    >
      <span style={{ height: '100%', borderRight: '1px solid #e7ecf3', background: '#edf2f7' }}>
        <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="none">
          <rect width="100" height="100" fill="#edf2f7">
            {!reducedMotion ? <animate attributeName="opacity" values="0.48;0.86;0.48" dur="1.55s" begin={delay} repeatCount="indefinite" /> : null}
          </rect>
        </svg>
      </span>
      <span style={{ display: 'grid', gap: '10px', padding: compact ? '14px' : '18px 20px' }}>
        <svg viewBox="0 0 180 32" width="100%" height="32" preserveAspectRatio="none">
          <rect x="0" y="2" width="118" height="9" rx="4.5" fill="#dbe3ed">
            {!reducedMotion ? <animate attributeName="opacity" values="0.5;0.92;0.5" dur="1.55s" begin={delay} repeatCount="indefinite" /> : null}
          </rect>
          <rect x="0" y="20" width="78" height="7" rx="3.5" fill="#e6ebf2">
            {!reducedMotion ? <animate attributeName="opacity" values="0.42;0.78;0.42" dur="1.55s" begin={delay} repeatCount="indefinite" /> : null}
          </rect>
        </svg>
      </span>
    </span>
  );
}

function MegaMenuLoadingState({ item }) {
  const reducedMotion = usePrefersReducedMotion();
  const compact = item.id === 'products';
  const skeletonCount = compact ? 8 : 6;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`${item.label || 'Menu'} content is loading`}
      aria-busy="true"
      style={{ ...LOADING_SURFACE_STYLE, minHeight: compact ? '244px' : '306px' }}
    >
      <MegaMenuLoadingSpinner reducedMotion={reducedMotion} />
      <div
        aria-hidden="true"
        style={{
          display: 'grid',
          gridTemplateColumns: compact ? 'repeat(4, minmax(0, 1fr))' : 'repeat(2, minmax(0, 1fr))',
          gap: compact ? '8px' : '12px',
          paddingTop: '12px',
        }}
      >
        {Array.from({ length: skeletonCount }, (_, index) => (
          <MegaMenuLoadingCard key={index} compact={compact} index={index} reducedMotion={reducedMotion} />
        ))}
      </div>
    </div>
  );
}

function MegaMenuDeferredState({ item }) {
  return CATALOG_BACKED_DROPDOWN_IDS.has(item.id) ? <MegaMenuLoadingState item={item} /> : null;
}

function ProductCard({ entry, onNavigate }) {
  const productCount = Number(entry.count || entry.productCount || 0);

  return (
    <Link
      to={entry.to}
      className="dtb-mega-menu__product-card"
      onClick={onNavigate}
    >
      <MegaMenuThumb label={entry.label} thumbnail={entry.thumbnail} />
      <span className="dtb-desktop-nav-row-text dtb-mega-menu__product-card-copy">
        <span className="dtb-desktop-nav-row-title">{entry.label}</span>
        {productCount > 0 ? (
          <span className="dtb-mega-menu__product-card-meta">
            {productCount} {productCount === 1 ? 'product' : 'products'}
          </span>
        ) : null}
      </span>
      <span className="dtb-mega-menu__product-card-action" aria-hidden="true">
        <ChevronRight size={17} strokeWidth={2.35} />
      </span>
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
        <MegaMenuDeferredState item={item} />
      )}
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
        <MegaMenuDeferredState item={item} />
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
    <Link
      to={entry.to}
      className="dtb-mega-menu__repair-card"
      onClick={onNavigate}
      style={{ gridTemplateColumns: 'minmax(0, 1fr) auto', minHeight: '76px', paddingBlock: '14px' }}
    >
      <span className="dtb-desktop-nav-row-text">
        <span className="dtb-desktop-nav-row-title">{entry.label}</span>
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
        <>
          <div style={{ padding: '18px 32px 12px' }}>
            <Link
              to="/repairs/packages"
              onClick={onNavigate}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--mega-ink)',
                fontWeight: 760,
                textDecoration: 'none',
              }}
            >
              <span>View all repair service packages</span>
              <ArrowRight size={16} strokeWidth={2.2} aria-hidden="true" />
            </Link>
          </div>
          <div className="dtb-mega-menu__repair-grid">
            {entries.map((entry) => (
              <RepairCard key={entry.to || entry.slug || entry.label} entry={entry} onNavigate={onNavigate} />
            ))}
          </div>
        </>
      ) : (
        <MegaMenuDeferredState item={item} />
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
    return <MegaMenuDeferredState item={item} />;
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
        aria-busy={CATALOG_BACKED_DROPDOWN_IDS.has(item.id) && !item.items?.length ? true : undefined}
        onPointerEnter={onOpen}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            closeAndFocus();
          }
        }}
      >
        <div className="dtb-desktop-nav-dropdown__scroller">
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
