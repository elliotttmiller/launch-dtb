import { Link, useLocation, useNavigate } from 'react-router-dom';
import { startTransition, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useCart } from '../../context/CartContext';
import { useAuthContext } from '../../auth/AuthContext.js';
import { ShoppingCart, X, ChevronRight, User, LogIn, UserPlus, LogOut, Search } from 'lucide-react';
import LogoWhite from '/logo-white.svg';
import StorefrontSearchOverlay from './StorefrontSearchOverlay';
import StorefrontMobileDrawer from './StorefrontMobileDrawer';
import AccountHubSheet from '../account/AccountHubSheet.jsx';
import { searchProducts } from '../../services/catalog';
import { searchWithNivo } from '../../api/nivoSearch.js';
import StorefrontSearchDock from './StorefrontSearchDock';
import StorefrontSearchLoading from './StorefrontSearchLoading.jsx';
import StorefrontDesktopNavigation from './StorefrontDesktopNavigation.jsx';
import { useCatalogFacets } from '../../hooks/useCatalogFacets.js';
import { getRepairPackageGroups } from '../../data/repairPackages.js';
import { SCHEMATIC_BRANDS } from '../../data/schematicBrands.js';
import '../../styles/mobile-hamburger.css';
import '../../styles/mobile-header-actions.css';
import '../../styles/storefront-nivo-runtime-bridge.css';
import {
  buildDisplayCategoryUrl,
  mapCatalogBrands,
  mergeCatalogDisplayCategories,
  normalizeDisplayCategorySlug,
} from '../../utils/catalogFacets.js';

const SEARCH_OVERLAY_EXIT_MS = 360;
const DESKTOP_SEARCH_DELAY_MS = 180;
const MOBILE_SEARCH_DELAY_MS = 220;
const MAX_SEARCH_PRODUCTS = 6;
const MAX_SEARCH_SUGGESTIONS = 8;

const DRAWER_NAV_ROWS = [
  { to: '/products?sort=newest', label: 'New Arrivals' },
  // { to: '/toolset-builder', label: 'Toolset Builder' }, // DISABLED: temporarily hide Toolset Builder
  { to: '/repairs', label: 'Repairs' },
  { to: '/calculators', label: 'Calculators' },
  { to: '/faq', label: 'FAQ' },
  { to: '/contact', label: 'Contact' },
];

function MobileDrawerChevron({ expanded = false, className = '' }) {
  return (
    <ChevronRight
      size={18}
      strokeWidth={2.35}
      className={`storefront-mobile-drawer__chevron${expanded ? ' is-expanded' : ''}${className ? ` ${className}` : ''}`}
      aria-hidden="true"
    />
  );
}

function MobileHamburgerToggle({ checked, onCheckedChange }) {
  const label = checked ? 'Close menu' : 'Open menu';

  return (
    <label className="header-mobile-toggle header-icon hamburger" aria-label={label}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onCheckedChange(event.target.checked)}
        aria-label={label}
        aria-expanded={checked}
      />
      <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
        <path
          className="line line-top-bottom"
          d="M27 10 13 10C10.8 10 9 8.2 9 6 9 3.5 10.8 2 13 2 15.2 2 17 3.8 17 6L17 26C17 28.2 18.8 30 21 30 23.2 30 25 28.2 25 26 25 23.8 23.2 22 21 22L7 22"
        />
        <path className="line" d="M7 16 27 16" />
      </svg>
    </label>
  );
}

const buildProductsBrandRoute = (slug) => `/products/brands/${slug}`;
const buildPartsBrandRoute = (slug) => `/parts?brand=${encodeURIComponent(slug)}`;
const buildSchematicsBrandRoute = (slug) => `/schematics?brand=${encodeURIComponent(slug)}`;

function toFallbackSearchProduct(product) {
  return {
    ...product,
    priceText: typeof product?.price === 'number' ? `$${product.price.toFixed(2)}` : 'View product',
    source: product?.source || 'dtb-fallback',
  };
}

function searchProductPrice(product) {
  if (product?.priceText) return product.priceText;
  if (typeof product?.price === 'number') return `$${product.price.toFixed(2)}`;
  return 'View product';
}

export default function Header({ onCartToggle, onMobileMenuOpen, hasTopTicker = false }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { getCartCount } = useCart();
  const { user, isAuthenticated, isLoading, logout } = useAuthContext();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [productsExpanded, setProductsExpanded] = useState(false);
  const [brandsExpanded, setBrandsExpanded] = useState(false);
  const [partsExpanded, setPartsExpanded] = useState(false);
  const [schematicsExpanded, setSchematicsExpanded] = useState(false);
  const [desktopNavOpen, setDesktopNavOpen] = useState(null);
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const [accountHubOpen, setAccountHubOpen] = useState(false);
  const [accountUnreadCount, setAccountUnreadCount] = useState(0);
  const [desktopSearchOpen, setDesktopSearchOpen] = useState(false);
  const [desktopSearchQuery, setDesktopSearchQuery] = useState('');
  const [desktopSearchResults, setDesktopSearchResults] = useState([]);
  const [desktopSearchSuggestions, setDesktopSearchSuggestions] = useState([]);
  const [desktopSearchLoading, setDesktopSearchLoading] = useState(false);
  const [searchOverlayOpen, setSearchOverlayOpen] = useState(false);
  const [mobileSearchQuery, setMobileSearchQuery] = useState('');
  const [mobileSearchResults, setMobileSearchResults] = useState([]);
  const [mobileSearchSuggestions, setMobileSearchSuggestions] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const { facets } = useCatalogFacets();
  const { facets: partsFacets } = useCatalogFacets({ isParts: 1 });
  const accountDropdownRef = useRef(null);
  const desktopSearchRef = useRef(null);
  const desktopSearchInputRef = useRef(null);
  const mobileSearchInputRef = useRef(null);
  const desktopSearchRequestIdRef = useRef(0);
  const searchOverlayRequestIdRef = useRef(0);
  const desktopSearchAbortRef = useRef(null);
  const mobileSearchAbortRef = useRef(null);
  const searchOverlayResetTimerRef = useRef(null);
  const prevPathnameRef = useRef(location.pathname);
  const [isTablet, setIsTablet] = useState(() => {
    try { return typeof window !== 'undefined' && window.matchMedia('(min-width: 641px) and (max-width: 1024px)').matches; }
    catch { return false; }
  });

  const isActive = (path) => location.pathname === path;
  const drawerBrands = useMemo(() => mapCatalogBrands(facets?.brands), [facets]);
  const partsBrands = useMemo(() => mapCatalogBrands(partsFacets?.brands), [partsFacets]);
  const drawerCategoryLinks = useMemo(() => {
    const displayCategories = mergeCatalogDisplayCategories(facets?.displayCategoriesByBrand || {})
      .filter((category) => category?.slug)
      .map((category) => ({
        ...category,
        to: buildDisplayCategoryUrl(category.slug),
      }))
      .sort((a, b) => String(a.label || '').localeCompare(String(b.label || '')));

    if (displayCategories.length > 0) {
      return displayCategories;
    }

    return (Array.isArray(facets?.categories) ? facets.categories : [])
      .map((category) => {
        const label = category?.label || category?.name || category?.key || '';
        const slug = category?.slug || category?.key || normalizeDisplayCategorySlug(label);
        return {
          slug,
          label,
          count: Number(category?.productCount || category?.count || 0),
          to: buildDisplayCategoryUrl(slug),
        };
      })
      .filter((category) => category.slug && category.label && category.count > 0)
      .sort((a, b) => String(a.label).localeCompare(String(b.label)));
  }, [facets]);
  const desktopNavItems = useMemo(() => [
    {
      id: 'products',
      label: 'All Products',
      landingTo: '/products',
      landingLabel: 'View all products',
      description: 'Browse the complete catalog by tool category.',
      size: 'wide',
      columns: 2,
      activePrefixes: ['/products'],
      items: drawerCategoryLinks.map(({ label, to }) => ({ label, to })),
    },
    {
      id: 'brands',
      label: 'Brands',
      landingTo: '/products/brands',
      landingLabel: 'View all brands',
      description: 'Shop every professional brand in the catalog.',
      size: 'wide',
      columns: 2,
      activePrefixes: ['/products/brands'],
      items: drawerBrands.map(({ name, slug }) => ({ label: name, to: buildProductsBrandRoute(slug) })),
    },
    {
      id: 'parts',
      label: 'Parts',
      landingTo: '/parts',
      landingLabel: 'View all replacement parts',
      description: 'Choose a brand with available replacement parts.',
      columns: 2,
      activePrefixes: ['/parts'],
      items: partsBrands.map(({ name, slug }) => ({ label: name, to: buildPartsBrandRoute(slug) })),
    },
    {
      id: 'new-arrivals',
      label: 'New Arrivals',
      landingTo: '/products?sort=newest',
      activePrefixes: [],
      items: [],
    },
    {
      id: 'repairs',
      label: 'Repair Services',
      landingTo: '/repairs',
      landingLabel: 'View all repair services',
      description: 'Compare repair packages for your tool type.',
      activePrefixes: ['/repairs'],
      items: getRepairPackageGroups()
        .filter(({ id }) => id !== 'diagnostic')
        .map(({ id, label }) => ({
          label,
          to: `/repairs/packages?tool=${encodeURIComponent(id)}`,
        })),
    },
    {
      id: 'schematics',
      label: 'Schematics',
      landingTo: '/schematics',
      landingLabel: 'Open schematic selector',
      description: 'Open the schematic selector for a supported brand.',
      activePrefixes: ['/schematics'],
      items: SCHEMATIC_BRANDS.map(({ name, slug }) => ({
        label: name,
        to: buildSchematicsBrandRoute(slug),
      })),
    },
    {
      id: 'calculators',
      label: 'Calculators',
      landingTo: '/calculators',
      activePrefixes: ['/calculators'],
      items: [],
    },
    {
      id: 'support',
      label: 'Support',
      landingTo: '/contact',
      activePrefixes: ['/contact'],
      items: [],
    },
  ], [drawerBrands, drawerCategoryLinks, partsBrands]);

  const closeMobileMenu = () => setMobileMenuOpen(false);
  const closeMenus = () => {
    setDesktopNavOpen(null);
    setMobileMenuOpen(false);
    setAccountDropdownOpen(false);
    setDesktopSearchOpen(false);
  };

  const closeSearchOverlay = useCallback(() => {
    if (searchOverlayResetTimerRef.current) {
      window.clearTimeout(searchOverlayResetTimerRef.current);
    }
    searchOverlayRequestIdRef.current += 1;
    mobileSearchAbortRef.current?.abort();
    setSearchOverlayOpen(false);
    searchOverlayResetTimerRef.current = window.setTimeout(() => {
      setMobileSearchQuery('');
      setMobileSearchResults([]);
      setMobileSearchSuggestions([]);
      setSearchLoading(false);
      searchOverlayResetTimerRef.current = null;
    }, SEARCH_OVERLAY_EXIT_MS);
  }, []);

  const openSearchOverlay = useCallback(() => {
    if (searchOverlayResetTimerRef.current) {
      window.clearTimeout(searchOverlayResetTimerRef.current);
      searchOverlayResetTimerRef.current = null;
    }
    setSearchOverlayOpen(true);
  }, []);

  useEffect(() => () => {
    if (searchOverlayResetTimerRef.current) {
      window.clearTimeout(searchOverlayResetTimerRef.current);
    }
    desktopSearchAbortRef.current?.abort();
    mobileSearchAbortRef.current?.abort();
  }, []);

  const handleMobileMenuCheckedChange = useCallback((checked) => {
    if (checked) {
      onMobileMenuOpen?.();
      setAccountDropdownOpen(false);
      closeSearchOverlay();
    }
    setMobileMenuOpen(checked);
  }, [closeSearchOverlay, onMobileMenuOpen]);

  const handleCartToggle = useCallback(() => {
    setMobileMenuOpen(false);
    closeSearchOverlay();
    onCartToggle?.();
  }, [closeSearchOverlay, onCartToggle]);

  const resetDrawerExpansions = useCallback(() => {
    setProductsExpanded(false);
    setBrandsExpanded(false);
    setPartsExpanded(false);
    setSchematicsExpanded(false);
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) return;
    resetDrawerExpansions();
  }, [mobileMenuOpen, resetDrawerExpansions]);

  useEffect(() => {
    if (prevPathnameRef.current === location.pathname) return;
    prevPathnameRef.current = location.pathname;
    const t = setTimeout(() => { closeMenus(); closeSearchOverlay(); resetDrawerExpansions(); }, 0);
    return () => clearTimeout(t);
  }, [location.pathname, closeSearchOverlay, resetDrawerExpansions]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeMenus();
        closeSearchOverlay();
        resetDrawerExpansions();
        desktopSearchInputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeSearchOverlay, resetDrawerExpansions]);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 641px) and (max-width: 1024px)');
    const handler = (e) => setIsTablet(e.matches);
    if (mq.addEventListener) mq.addEventListener('change', handler);
    else mq.addListener(handler);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', handler);
      else mq.removeListener(handler);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      const header = document.querySelector('.site-header');
      if (header && !header.contains(e.target)) {
        setDesktopNavOpen(null);
        setDesktopSearchOpen(false);
      }
      if (accountDropdownRef.current && !accountDropdownRef.current.contains(e.target)) setAccountDropdownOpen(false);
      if (desktopSearchRef.current && !desktopSearchRef.current.contains(e.target)) setDesktopSearchOpen(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!desktopSearchOpen || !window.matchMedia('(min-width: 1025px)').matches) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [desktopSearchOpen]);

  useEffect(() => {
    const root = document.documentElement;
    const header = document.querySelector('.site-header');
    if (!root || !header) return undefined;

    const updateHeaderHeight = () => {
      const { bottom } = header.getBoundingClientRect();
      root.style.setProperty('--header-height', `${Math.ceil(bottom)}px`);
    };

    updateHeaderHeight();

    const rafId = window.requestAnimationFrame(updateHeaderHeight);
    const resizeObserver = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(() => updateHeaderHeight())
      : null;

    resizeObserver?.observe(header);
    window.addEventListener('resize', updateHeaderHeight);
    window.addEventListener('orientationchange', updateHeaderHeight);

    return () => {
      window.cancelAnimationFrame(rafId);
      resizeObserver?.disconnect();
      window.removeEventListener('resize', updateHeaderHeight);
      window.removeEventListener('orientationchange', updateHeaderHeight);
    };
  }, [hasTopTicker, mobileMenuOpen, isTablet]);

  useEffect(() => {
    const query = desktopSearchQuery.trim();
    const requestId = desktopSearchRequestIdRef.current + 1;
    desktopSearchRequestIdRef.current = requestId;
    desktopSearchAbortRef.current?.abort();
    desktopSearchAbortRef.current = null;

    if (!query) {
      setDesktopSearchResults([]);
      setDesktopSearchSuggestions([]);
      setDesktopSearchLoading(false);
      return undefined;
    }

    setDesktopSearchLoading(true);
    const t = window.setTimeout(async () => {
      const controller = new AbortController();
      desktopSearchAbortRef.current = controller;
      try {
        const result = await searchWithNivo(query, { signal: controller.signal });
        if (controller.signal.aborted || desktopSearchRequestIdRef.current !== requestId) return;

        let products = Array.isArray(result?.products) ? result.products.slice(0, MAX_SEARCH_PRODUCTS) : [];
        if (products.length === 0 && result?.didYouMean) {
          products = (await searchProducts(result.didYouMean)).slice(0, MAX_SEARCH_PRODUCTS).map(toFallbackSearchProduct);
        }

        if (controller.signal.aborted || desktopSearchRequestIdRef.current !== requestId) return;
        startTransition(() => {
          setDesktopSearchResults(products);
          setDesktopSearchSuggestions((Array.isArray(result?.suggestions) ? result.suggestions : []).slice(0, MAX_SEARCH_SUGGESTIONS));
        });
      } catch (err) {
        if (controller.signal.aborted || desktopSearchRequestIdRef.current !== requestId) return;
        console.warn('[search] NivoSearch unavailable; using DTB catalog fallback.', err);
        try {
          const products = (await searchProducts(query)).slice(0, MAX_SEARCH_PRODUCTS).map(toFallbackSearchProduct);
          if (desktopSearchRequestIdRef.current === requestId) {
            startTransition(() => {
              setDesktopSearchResults(products);
              setDesktopSearchSuggestions([]);
            });
          }
        } catch (fallbackError) {
          if (desktopSearchRequestIdRef.current === requestId) {
            console.error('Desktop search error:', fallbackError);
            setDesktopSearchResults([]);
            setDesktopSearchSuggestions([]);
          }
        }
      } finally {
        if (desktopSearchRequestIdRef.current === requestId) setDesktopSearchLoading(false);
      }
    }, DESKTOP_SEARCH_DELAY_MS);

    return () => {
      window.clearTimeout(t);
      controllerAbortSafe(desktopSearchAbortRef.current);
    };
  }, [desktopSearchQuery]);

  useEffect(() => {
    const query = mobileSearchQuery.trim();
    const requestId = searchOverlayRequestIdRef.current + 1;
    searchOverlayRequestIdRef.current = requestId;
    mobileSearchAbortRef.current?.abort();
    mobileSearchAbortRef.current = null;

    if (!query) {
      setMobileSearchResults([]);
      setMobileSearchSuggestions([]);
      setSearchLoading(false);
      return undefined;
    }

    setSearchLoading(true);
    const t = window.setTimeout(async () => {
      const controller = new AbortController();
      mobileSearchAbortRef.current = controller;
      try {
        const result = await searchWithNivo(query, { signal: controller.signal });
        if (controller.signal.aborted || searchOverlayRequestIdRef.current !== requestId) return;

        let products = Array.isArray(result?.products) ? result.products.slice(0, MAX_SEARCH_PRODUCTS) : [];
        if (products.length === 0 && result?.didYouMean) {
          products = (await searchProducts(result.didYouMean)).slice(0, MAX_SEARCH_PRODUCTS).map(toFallbackSearchProduct);
        }

        if (controller.signal.aborted || searchOverlayRequestIdRef.current !== requestId) return;
        startTransition(() => {
          setMobileSearchResults(products);
          setMobileSearchSuggestions((Array.isArray(result?.suggestions) ? result.suggestions : []).slice(0, MAX_SEARCH_SUGGESTIONS));
        });
      } catch (err) {
        if (controller.signal.aborted || searchOverlayRequestIdRef.current !== requestId) return;
        console.warn('[search] NivoSearch unavailable; using DTB catalog fallback.', err);
        try {
          const products = (await searchProducts(query)).slice(0, MAX_SEARCH_PRODUCTS).map(toFallbackSearchProduct);
          if (searchOverlayRequestIdRef.current === requestId) {
            startTransition(() => {
              setMobileSearchResults(products);
              setMobileSearchSuggestions([]);
            });
          }
        } catch (fallbackError) {
          if (searchOverlayRequestIdRef.current === requestId) {
            console.error('Search overlay error:', fallbackError);
            setMobileSearchResults([]);
            setMobileSearchSuggestions([]);
          }
        }
      } finally {
        if (searchOverlayRequestIdRef.current === requestId) setSearchLoading(false);
      }
    }, MOBILE_SEARCH_DELAY_MS);

    return () => {
      window.clearTimeout(t);
      controllerAbortSafe(mobileSearchAbortRef.current);
    };
  }, [mobileSearchQuery]);

  const handleDesktopResultClick = (product) => {
    const target = product?.slug ? `/products/${product.slug}` : `/product/${product?.id}`;
    navigate(target);
    setDesktopSearchOpen(false);
    setDesktopSearchQuery('');
    setDesktopSearchResults([]);
    setDesktopSearchSuggestions([]);
  };

  const handleDesktopSuggestionClick = (suggestion) => {
    const value = suggestion?.value || suggestion?.label || '';
    if (!value) return;
    setDesktopSearchQuery(value);
    setDesktopSearchOpen(true);
    window.requestAnimationFrame(() => desktopSearchInputRef.current?.focus());
  };

  const handleDesktopViewAll = () => {
    const q = desktopSearchQuery.trim();
    navigate(`/products${q ? `?search=${encodeURIComponent(q)}` : ''}`);
    setDesktopSearchOpen(false);
  };

  const handleMobileAccountClick = () => {
    setMobileMenuOpen(false);
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setAccountHubOpen(true);
  };

  const navigateShopDestination = useCallback((to, { closeMobile = false } = {}) => {
    resetDrawerExpansions();
    setDesktopNavOpen(null);
    if (closeMobile) setMobileMenuOpen(false);
    navigate(to);
  }, [navigate, resetDrawerExpansions]);

  const closeDrawerAndNavigate = (to) => navigateShopDestination(to, { closeMobile: true });

  const handleDrawerBrandNavigate = (slug) => closeDrawerAndNavigate(buildProductsBrandRoute(slug));
  const handleDrawerPartsBrandNavigate = (slug) => closeDrawerAndNavigate(buildPartsBrandRoute(slug));
  const handleDrawerSchematicsBrandNavigate = (slug) => closeDrawerAndNavigate(buildSchematicsBrandRoute(slug));
  const handleDrawerBrandsLanding = () => closeDrawerAndNavigate('/products/brands');
  const handleDrawerPartsLanding = () => closeDrawerAndNavigate('/parts');
  const handleDrawerSchematicsLanding = () => closeDrawerAndNavigate('/schematics');
  const handleDrawerProductsLanding = () => closeDrawerAndNavigate('/products');
  const handleDrawerProductCategoryNavigate = (to) => closeDrawerAndNavigate(to);

  const handleMobileViewAll = useCallback(() => {
    const q = mobileSearchQuery.trim();
    navigate(`/products${q ? `?search=${encodeURIComponent(q)}` : ''}`);
    closeSearchOverlay();
  }, [mobileSearchQuery, navigate, closeSearchOverlay]);

  const handleMobileSuggestionSelect = useCallback((suggestion) => {
    const value = suggestion?.value || suggestion?.label || '';
    if (!value) return;
    setMobileSearchQuery(value);
    window.requestAnimationFrame(() => mobileSearchInputRef.current?.focus());
  }, []);

  const desktopSearchHasQuery = desktopSearchQuery.trim().length > 0;
  const desktopSearchVisible = desktopSearchOpen && desktopSearchHasQuery;
  const isDesktopNavItemActive = useCallback((item) => {
    if (item.id === 'new-arrivals') {
      return location.pathname === '/products' && new URLSearchParams(location.search).get('sort') === 'newest';
    }
    if (item.id === 'products') {
      return location.pathname.startsWith('/products')
        && !location.pathname.startsWith('/products/brands')
        && new URLSearchParams(location.search).get('sort') !== 'newest';
    }
    return item.activePrefixes?.some((prefix) => location.pathname.startsWith(prefix)) || false;
  }, [location.pathname, location.search]);

  const renderDrawerListSection = ({ id, label, expanded, onToggle, onLanding, items, onItemNavigate }) => (
    <div className="storefront-mobile-drawer__row-wrap" key={id}>
      <div className="storefront-mobile-drawer__row">
        <button type="button" className="storefront-mobile-drawer__row-label" onClick={onLanding}>
          {label}
        </button>
        <button
          type="button"
          className="storefront-mobile-drawer__row-toggle"
          onClick={onToggle}
          aria-label={`${expanded ? 'Collapse' : 'Expand'} ${label.toLowerCase()}`}
          aria-expanded={expanded}
          aria-controls={`storefront-mobile-drawer-${id}`}
        >
          <MobileDrawerChevron expanded={expanded} />
        </button>
      </div>
      <div
        id={`storefront-mobile-drawer-${id}`}
        className={`storefront-mobile-drawer__brands${expanded ? ' is-expanded' : ''}`}
      >
        {items.map((item) => (
          <button
            key={`${id}-${item.slug || item.to || item.name || item.label}`}
            type="button"
            className="storefront-mobile-drawer__brand-link"
            onClick={() => onItemNavigate(item)}
          >
            {item.name || item.label}
          </button>
        ))}
      </div>
    </div>
  );

  const renderDrawerBrandSection = ({ id, label, expanded, onToggle, onLanding, onBrandNavigate }) => renderDrawerListSection({
    id,
    label,
    expanded,
    onToggle,
    onLanding,
    items: drawerBrands,
    onItemNavigate: (brand) => onBrandNavigate(brand.slug),
  });

  return (
    <>
      <header className={`site-header${hasTopTicker ? ' site-header--with-top-ticker' : ' site-header--no-ticker'}`} role="banner">
        <div className="site-header-inner">
          <div className="header-mobile-layout" style={{ display: isTablet ? 'flex' : undefined }}>
            <div className="header-mobile-slot header-mobile-slot--left">
              <MobileHamburgerToggle checked={mobileMenuOpen} onCheckedChange={handleMobileMenuCheckedChange} />
            </div>

            <Link to="/" className="header-mobile-logo" onClick={closeMobileMenu}>
              <img src={LogoWhite} alt="Drywall Toolbox Logo" className="logo-image-mobile" />
            </Link>

            <div className="header-mobile-slot header-mobile-slot--right">
              <button
                type="button"
                onClick={() => { if (!isLoading) handleMobileAccountClick(); }}
                className={`header-mobile-account-toggle header-icon${isLoading ? ' is-loading' : ''}`}
                aria-label={isLoading ? 'Loading account' : isAuthenticated ? 'Open account hub' : 'Sign in'}
                aria-busy={isLoading}
                disabled={isLoading}
              >
                <span className="header-account-toggle__icon" aria-hidden="true"><User size={20} /></span>
                {isAuthenticated && accountUnreadCount > 0 ? <span className="account-alert-badge">{accountUnreadCount > 99 ? '99+' : accountUnreadCount}</span> : null}
              </button>
              <button
                type="button"
                onClick={handleCartToggle}
                className="header-mobile-cart-toggle cart-toggle header-icon"
                aria-label="Open cart"
              >
                <ShoppingCart size={20} />
                {getCartCount() > 0 ? (
                  <span className="cart-badge" aria-label={`${getCartCount()} items in cart`}>
                    {getCartCount()}
                  </span>
                ) : null}
              </button>
            </div>
          </div>

          <div className={`header-desktop-layout${desktopSearchOpen ? ' is-desktop-search-open' : ''}`} style={{ display: isTablet ? 'none' : undefined }}>
            <div className="header-left"><Link to="/" className="header-logo-link" aria-label="Drywall Toolbox home"><img src={LogoWhite} alt="Drywall Toolbox Logo" className="logo-image" /></Link></div>
            <div className="header-desktop-nav-row">
              <StorefrontDesktopNavigation
                items={desktopNavItems}
                openMenuId={desktopNavOpen}
                onOpen={(id) => setDesktopNavOpen(id)}
                onClose={() => setDesktopNavOpen(null)}
                onNavigate={() => setDesktopNavOpen(null)}
                isItemActive={isDesktopNavItemActive}
              />
            </div>
            <div className="header-center header-center--desktop-search">
              <div ref={desktopSearchRef} className="dtb-desktop-search dtb-desktop-search--header" data-results-open={desktopSearchVisible ? 'true' : 'false'}>
                <div className="dtb-desktop-search-pill">
                  <span className="dtb-desktop-search-icon-wrap" aria-hidden="true"><Search className="dtb-desktop-search-icon" /></span>
                  <input ref={desktopSearchInputRef} type="search" value={desktopSearchQuery} onChange={(e) => { setDesktopSearchQuery(e.target.value); setDesktopSearchOpen(true); }} onFocus={() => { setDesktopNavOpen(null); setDesktopSearchOpen(true); }} onKeyDown={(e) => { if (e.key === 'Enter') handleDesktopViewAll(); if (e.key === 'Escape') { e.preventDefault(); setDesktopSearchOpen(false); e.currentTarget.blur(); } }} placeholder="Search products..." className="dtb-desktop-search-input" aria-label="Search products" aria-autocomplete="list" aria-controls="dtb-desktop-search-results" aria-expanded={desktopSearchVisible} autoComplete="off" />
                </div>
                <div id="dtb-desktop-search-results" className="dtb-desktop-search-dropdown" data-open={desktopSearchVisible ? 'true' : 'false'} aria-hidden={!desktopSearchVisible}>
                  {desktopSearchLoading ? <StorefrontSearchLoading compact /> : desktopSearchHasQuery ? (
                    <div className="dtb-nivo-runtime-layer" data-source="storefront-header">
                      <div className="dtb-nivo-runtime__layout">
                        <section className="dtb-nivo-runtime__products" aria-label="Product results">
                          <p className="dtb-nivo-runtime__eyebrow">Products</p>
                          {desktopSearchResults.length > 0 ? desktopSearchResults.map((product, index) => (
                            <button key={product.id || product.slug || product.sku || index} type="button" className="dtb-nivo-runtime__product" onClick={() => handleDesktopResultClick(product)}>
                              <span className="dtb-nivo-runtime__thumb">{product.image ? <img src={product.image} alt="" loading="lazy" /> : <Search size={17} aria-hidden="true" />}</span>
                              <span className="dtb-nivo-runtime__product-copy">
                                <strong>{product.name}</strong>
                                {product.sku ? <small>SKU {product.sku}</small> : null}
                              </span>
                              <span className="dtb-nivo-runtime__price">{searchProductPrice(product)}</span>
                            </button>
                          )) : <p className="dtb-nivo-runtime__empty">No products found.</p>}
                        </section>
                        {desktopSearchSuggestions.length > 0 ? (
                          <section className="dtb-nivo-runtime__suggestions" aria-label="Search suggestions">
                            <p className="dtb-nivo-runtime__eyebrow">Suggestions</p>
                            <div className="dtb-nivo-runtime__suggestion-list">
                              {desktopSearchSuggestions.map((suggestion) => (
                                <button key={suggestion.id || `${suggestion.type}-${suggestion.label}`} type="button" className="dtb-nivo-runtime__suggestion" onClick={() => handleDesktopSuggestionClick(suggestion)}>
                                  <span>{suggestion.label}</span>
                                  {suggestion.type === 'correction' ? <small>Did you mean</small> : suggestion.type ? <small>{suggestion.type}</small> : null}
                                </button>
                              ))}
                            </div>
                          </section>
                        ) : null}
                      </div>
                      <button type="button" className="dtb-nivo-runtime__view-all" onClick={handleDesktopViewAll}>View All Results</button>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="header-right header-desktop-actions">
              <div ref={accountDropdownRef} className="header-account">
                <button
                  type="button"
                  onClick={() => {
                    if (isLoading) return;
                    if (isAuthenticated) setAccountHubOpen(true);
                    else setAccountDropdownOpen((open) => !open);
                  }}
                  aria-label={isLoading ? 'Loading account' : isAuthenticated ? `Open account hub${accountUnreadCount ? `, ${accountUnreadCount} unread notifications` : ''}` : 'Account menu'}
                  aria-expanded={!isLoading && !isAuthenticated && accountDropdownOpen}
                  aria-busy={isLoading}
                  disabled={isLoading}
                  className={`header-account-toggle header-icon${isLoading ? ' is-loading' : ''}`}
                >
                  <span className="header-account-toggle__icon" aria-hidden="true"><User size={24} strokeWidth={1.9} /></span>
                  {isAuthenticated && accountUnreadCount > 0 ? <span className="account-alert-badge">{accountUnreadCount > 99 ? '99+' : accountUnreadCount}</span> : null}
                </button>
                {!isLoading && !isAuthenticated ? <div className={`header-account-panel${accountDropdownOpen ? ' is-open' : ''}`}><div className="header-account-guest-header"><p className="header-account-guest-title">My Account</p></div><Link to="/login" onClick={() => setAccountDropdownOpen(false)} className="header-account-link header-account-link--strong"><LogIn size={14} />Sign In</Link><div className="header-account-divider header-account-divider--inset" /><div className="header-account-guest-body"><Link to="/register" onClick={() => setAccountDropdownOpen(false)} className="header-account-cta"><UserPlus size={13} />Create Account</Link><p className="header-account-note">No account needed to browse or checkout.</p></div></div> : null}
              </div>
              <div className="cart-area"><button onClick={handleCartToggle} className="cart-toggle header-icon" aria-label="Toggle cart"><ShoppingCart size={24} strokeWidth={1.9} />{getCartCount() > 0 && <span className="cart-badge">{getCartCount()}</span>}</button></div>
            </div>
          </div>
        </div>

        <div className="header-mobile-search-dock">
          <StorefrontSearchDock
            inputRef={mobileSearchInputRef}
            value={mobileSearchQuery}
            active={searchOverlayOpen}
            onChange={(event) => {
              const nextQuery = event.target.value;
              setMobileSearchQuery(nextQuery);
              if (nextQuery.trim()) {
                if (!searchOverlayOpen) openSearchOverlay();
              }
            }}
            onFocus={() => {
              setMobileMenuOpen(false);
              openSearchOverlay();
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                handleMobileViewAll();
              }
            }}
            endAdornment={searchOverlayOpen && mobileSearchQuery.trim() ? (
              <button
                type="button"
                className="storefront-search-dock__clear"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  closeSearchOverlay();
                }}
                aria-label="Close search"
              >
                <X size={16} />
              </button>
            ) : null}
          />
        </div>

      </header>

      <button
        type="button"
        className={`dtb-desktop-search-backdrop${desktopSearchOpen ? ' is-open' : ''}`}
        onClick={() => {
          setDesktopSearchOpen(false);
          desktopSearchInputRef.current?.blur();
        }}
        aria-label="Close product search"
        tabIndex={desktopSearchOpen ? 0 : -1}
        aria-hidden={!desktopSearchOpen}
      />

      <StorefrontMobileDrawer isOpen={mobileMenuOpen} onClose={closeMobileMenu}>
        <nav className="storefront-mobile-drawer__nav" aria-label="Mobile navigation">
          {renderDrawerListSection({
            id: 'products',
            label: 'All Products',
            expanded: productsExpanded,
            onToggle: () => setProductsExpanded((open) => !open),
            onLanding: handleDrawerProductsLanding,
            items: drawerCategoryLinks,
            onItemNavigate: (category) => handleDrawerProductCategoryNavigate(category.to),
          })}
          {renderDrawerBrandSection({
            id: 'brands',
            label: 'Brands',
            expanded: brandsExpanded,
            onToggle: () => setBrandsExpanded((open) => !open),
            onLanding: handleDrawerBrandsLanding,
            onBrandNavigate: handleDrawerBrandNavigate,
          })}
          {renderDrawerBrandSection({
            id: 'parts',
            label: 'Parts',
            expanded: partsExpanded,
            onToggle: () => setPartsExpanded((open) => !open),
            onLanding: handleDrawerPartsLanding,
            onBrandNavigate: handleDrawerPartsBrandNavigate,
          })}
          {renderDrawerBrandSection({
            id: 'schematics',
            label: 'Schematics',
            expanded: schematicsExpanded,
            onToggle: () => setSchematicsExpanded((open) => !open),
            onLanding: handleDrawerSchematicsLanding,
            onBrandNavigate: handleDrawerSchematicsBrandNavigate,
          })}
          {DRAWER_NAV_ROWS.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`storefront-mobile-drawer__row-link${isActive(to) ? ' is-active' : ''}`}
              onClick={closeMobileMenu}
            >
              {label}
            </Link>
          ))}
        </nav>
      </StorefrontMobileDrawer>

      <StorefrontSearchOverlay
        isOpen={searchOverlayOpen}
        query={mobileSearchQuery}
        setQuery={setMobileSearchQuery}
        results={mobileSearchResults}
        suggestions={mobileSearchSuggestions}
        loading={searchLoading}
        onClose={closeSearchOverlay}
        onViewAll={handleMobileViewAll}
        onSuggestionSelect={handleMobileSuggestionSelect}
      />

      <AccountHubSheet
        isOpen={accountHubOpen}
        onClose={() => setAccountHubOpen(false)}
        user={user}
        onLogout={logout}
        onUnreadCountChange={setAccountUnreadCount}
      />
    </>
  );
}

function controllerAbortSafe(controller) {
  try {
    controller?.abort();
  } catch {
    // Abort cleanup is best-effort and must not disrupt unmount/rerender.
  }
}
