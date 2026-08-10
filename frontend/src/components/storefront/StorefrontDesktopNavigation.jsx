import { useEffect, useId, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';
import '../../styles/storefront-desktop-navigation.css';
import '../../styles/storefront-desktop-navigation-integrity.css';
import '../../styles/storefront-navigation-taxonomy.css';

const RESILIENT_DROPDOWN_IDS = new Set(['products', 'brands', 'parts', 'repairs', 'schematics']);
const POINTER_CLOSE_DELAY_MS = 160;

function DesktopNavEntry({ entry, onNavigate }) {
  const children = Array.isArray(entry.children) ? entry.children : [];

  if (children.length === 0) {
    return (
      <Link to={entry.to} className="dtb-desktop-nav-dropdown__link" onClick={onNavigate}>
        <span>{entry.label}</span>
        <ChevronRight size={14} aria-hidden="true" />
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
            {child.label}
          </Link>
        ))}
      </div>
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
        className={`dtb-desktop-nav-dropdown dtb-desktop-nav-dropdown--${item.size || 'medium'}${hasGroupedEntries ? ' has-taxonomy-groups' : ''}`}
        aria-label={`${item.label} navigation`}
        onPointerEnter={onOpen}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            closeAndFocus();
          }
        }}
      >
        <div className="dtb-desktop-nav-dropdown__header">
          <p>{item.label}</p>
          <span>{item.description}</span>
        </div>
        <div className="dtb-desktop-nav-dropdown__scroller">
          {entries.length > 0 ? (
            <div className={`dtb-desktop-nav-dropdown__links${item.columns === 2 ? ' is-two-column' : ''}${hasGroupedEntries ? ' has-taxonomy-groups' : ''}`}>
              {entries.map((entry) => (
                <DesktopNavEntry
                  key={entry.to || entry.slug || entry.label}
                  entry={entry}
                  onNavigate={onNavigate}
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
        <Link to={item.landingTo} className="dtb-desktop-nav-dropdown__footer" onClick={onNavigate}>
          <span>{item.landingLabel}</span>
          <ChevronRight size={15} aria-hidden="true" />
        </Link>
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
