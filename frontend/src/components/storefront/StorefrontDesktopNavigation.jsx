import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronDown,
  ChevronRight,
  ArrowRight,
  Wrench,
  Layers,
  Box,
  PenTool,
  Ruler,
  Hammer,
  Package,
  Settings2,
  ShoppingBag,
  Award,
} from 'lucide-react';
import '../../styles/storefront-desktop-navigation.css';
import '../../styles/storefront-desktop-navigation-integrity.css';
import '../../styles/storefront-navigation-taxonomy.css';
import '../../styles/storefront-desktop-navigation-megamenu.css';

const RESILIENT_DROPDOWN_IDS = new Set(['products', 'brands', 'parts', 'repairs', 'schematics']);
const POINTER_CLOSE_DELAY_MS = 160;

// Deterministic, label-derived icon selection. These are generic category
// placeholders (no per-product-line icon asset exists in the codebase yet) —
// see report notes for follow-up if brand/category-specific art is desired.
const ENTRY_ICONS = [Wrench, Layers, Box, PenTool, Ruler, Hammer, Package, Settings2, ShoppingBag, Award];
// Every dropdown now uses the same borderless editorial thumbnail treatment
// (see MegaMenuThumb below), so there's only one icon-size variant — sized
// for the ~86px thumbnail region.
const ENTRY_ICON_ELEMENTS_LARGE = ENTRY_ICONS.map((Icon, index) => (
  <Icon key={index} size={30} strokeWidth={1.6} />
));

function pickEntryIconIndex(label) {
  const text = String(label || '');
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  return hash % ENTRY_ICONS.length;
}

// Unified borderless "editorial" thumbnail — used by every dropdown now
// (All Products category rows, Brands/Parts/Schematics brand logo rows).
// No bordered/backgrounded icon box anywhere: a bare, contain-fit image
// floating directly on white, or a bare fallback icon (no box) if there's
// no image. Brand logos get a wide/short region (wordmark aspect ratio);
// category/product thumbnails get a squarer region. Falls back to the
// generic icon (not the raw browser broken-image glyph) if the image URL
// 404s at runtime — mirrors the onError-fallback pattern already used by
// ProductsCategorySelector.jsx/ProductCardImage.jsx for the same assets.
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

function DesktopNavEntry({ entry, onNavigate, hideIcon }) {
  const children = Array.isArray(entry.children) ? entry.children : [];

  if (children.length === 0) {
    return (
      <Link
        to={entry.to}
        className={`dtb-desktop-nav-dropdown__link${hideIcon ? ' dtb-desktop-nav-dropdown__link--no-icon' : ''}`}
        onClick={onNavigate}
      >
        {hideIcon ? null : <MegaMenuThumb label={entry.label} logo={entry.logo} thumbnail={entry.thumbnail} />}
        <span className="dtb-desktop-nav-row-text">
          <span className="dtb-desktop-nav-row-title">{entry.label}</span>
          {entry.description ? (
            <span className="dtb-desktop-nav-row-desc">{entry.description}</span>
          ) : null}
        </span>
        <ChevronRight size={16} className="dtb-desktop-nav-row-chevron" aria-hidden="true" />
      </Link>
    );
  }

  return (
    <div className="dtb-desktop-nav-taxonomy-group" role="group" aria-label={entry.label}>
      <Link
        to={entry.to}
        className="dtb-desktop-nav-taxonomy-group__heading"
        onClick={onNavigate}
      >
        <span>{entry.label}</span>
        <ChevronRight size={14} aria-hidden="true" />
      </Link>
      <div className="dtb-desktop-nav-taxonomy-group__children">
        {children.map((child) => (
          <Link
            key={child.to || child.slug || child.label}
            to={child.to}
            className="dtb-desktop-nav-taxonomy-group__child"
            onClick={onNavigate}
          >
            <MegaMenuThumb label={child.label} thumbnail={child.thumbnail} />
            <span className="dtb-desktop-nav-row-text">
              <span className="dtb-desktop-nav-row-title">{child.label}</span>
              {child.description ? (
                <span className="dtb-desktop-nav-row-desc">{child.description}</span>
              ) : null}
            </span>
            <ChevronRight size={18} className="dtb-desktop-nav-row-chevron" aria-hidden="true" />
          </Link>
        ))}
      </div>
      {entry.viewAllTo ? (
        <Link to={entry.viewAllTo} className="dtb-desktop-nav-taxonomy-group__view-all" onClick={onNavigate}>
          <span>{entry.viewAllLabel || `View all ${entry.label}`}</span>
          <ArrowRight size={13} strokeWidth={2.2} aria-hidden="true" />
        </Link>
      ) : null}
    </div>
  );
}

function DesktopNavDropdown({ item, isOpen, active, onOpen, onRequestClose, onCloseImmediate, onNavigate }) {
  const triggerRef = useRef(null);
  const panelId = useId();
  const entries = Array.isArray(item.items) ? item.items : [];
  const hasGroupedEntries = entries.some((entry) => Array.isArray(entry.children) && entry.children.length > 0);

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
        className={`dtb-desktop-nav-dropdown dtb-desktop-nav-dropdown--${item.id} dtb-desktop-nav-dropdown--${item.size || 'medium'}${hasGroupedEntries ? ' has-taxonomy-groups' : ''}`}
        aria-label={`${item.label} navigation`}
        onPointerEnter={onOpen}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            closeAndFocus();
          }
        }}
      >
        {!item.hideHeader ? (
          <div className="dtb-desktop-nav-dropdown__header">
            <span className="dtb-desktop-nav-dropdown__eyebrow">{item.label}</span>
            <p className="dtb-desktop-nav-dropdown__heading">{item.heading || item.label}</p>
            <span className="dtb-desktop-nav-dropdown__subheading">{item.description}</span>
          </div>
        ) : null}
        <div className="dtb-desktop-nav-dropdown__scroller">
          {entries.length > 0 ? (
            <div className={`dtb-desktop-nav-dropdown__links${item.columns === 2 ? ' is-two-column' : ''}${hasGroupedEntries ? ' has-taxonomy-groups' : ''}`}>
              {entries.map((entry) => (
                <DesktopNavEntry
                  key={entry.to || entry.slug || entry.label}
                  entry={entry}
                  onNavigate={onNavigate}
                  hideIcon={item.hideIcon}
                />
              ))}
            </div>
          ) : (
            <div className="dtb-desktop-nav-dropdown__empty" role="status">
              <strong>{item.emptyTitle || `${item.label} temporarily unavailable`}</strong>
              <span>{item.emptyMessage || 'Still loading — give it a moment, or try again in a bit.'}</span>
            </div>
          )}
        </div>
        {!item.hideFooter ? (
          <Link to={item.landingTo} className="dtb-desktop-nav-dropdown__footer" onClick={onNavigate}>
            <span className="dtb-desktop-nav-dropdown__footer-icon" aria-hidden="true">
              <ArrowRight size={16} strokeWidth={2} />
            </span>
            <span className="dtb-desktop-nav-dropdown__footer-text">
              <span className="dtb-desktop-nav-dropdown__footer-title">{item.landingLabel}</span>
              {item.landingDescription ? (
                <span className="dtb-desktop-nav-dropdown__footer-desc">{item.landingDescription}</span>
              ) : null}
            </span>
            <ChevronRight size={16} className="dtb-desktop-nav-dropdown__footer-chevron" aria-hidden="true" />
          </Link>
        ) : null}
      </section>
    </div>
  );
}

export default function StorefrontDesktopNavigation({ items, openMenuId, onOpen, onClose, onNavigate, isItemActive }) {
  const desktopItems = items.filter((item) => item.id !== 'support');
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
