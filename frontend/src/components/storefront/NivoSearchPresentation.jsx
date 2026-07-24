import { Search, X, ArrowRight } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchWithNivo } from '../../api/nivoSearch.js';
import { searchProducts } from '../../services/catalog.js';
import StorefrontSearchLoading from './StorefrontSearchLoading.jsx';
import '../../styles/storefront-nivo-search.css';

const DESKTOP_DEBOUNCE_MS = 180;
const MOBILE_DEBOUNCE_MS = 220;
const MAX_PRODUCTS = 6;
const MAX_SUGGESTIONS = 8;

function resolveProductPath(product) {
  if (product?.slug) return `/products/${product.slug}`;
  if (product?.id) return `/product/${product.id}`;
  return '/products';
}

function fallbackProduct(product) {
  return {
    ...product,
    name: String(product?.name || ''),
    priceText: typeof product?.price === 'number' ? `$${product.price.toFixed(2)}` : 'View product',
    source: 'dtb-fallback',
  };
}

function useSearchTargets() {
  const [targets, setTargets] = useState({ desktop: null, mobile: null });

  useEffect(() => {
    const resolve = () => {
      const desktop = document.querySelector('.header-center--desktop-search');
      const mobile = document.querySelector('.header-mobile-search-dock');
      setTargets((current) => (
        current.desktop === desktop && current.mobile === mobile ? current : { desktop, mobile }
      ));
    };

    resolve();
    const observer = new MutationObserver(resolve);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('resize', resolve);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', resolve);
    };
  }, []);

  return targets;
}

function usePredictiveSearch(query, delayMs) {
  const [state, setState] = useState({
    products: [],
    suggestions: [],
    didYouMean: '',
    loading: false,
    source: 'idle',
    error: null,
  });
  const controllerRef = useRef(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const normalized = String(query || '').trim();
    requestIdRef.current += 1;
    const requestId = requestIdRef.current;

    controllerRef.current?.abort();
    controllerRef.current = null;

    if (!normalized) {
      setState({ products: [], suggestions: [], didYouMean: '', loading: false, source: 'idle', error: null });
      return undefined;
    }

    setState((current) => ({ ...current, loading: true, error: null }));

    const timer = window.setTimeout(async () => {
      const controller = new AbortController();
      controllerRef.current = controller;

      try {
        const result = await searchWithNivo(normalized, { signal: controller.signal });
        if (requestId !== requestIdRef.current || controller.signal.aborted) return;
        setState({
          products: result.products.slice(0, MAX_PRODUCTS),
          suggestions: result.suggestions.slice(0, MAX_SUGGESTIONS),
          didYouMean: result.didYouMean || '',
          loading: false,
          source: 'nivo',
          error: null,
        });
      } catch (error) {
        if (controller.signal.aborted || requestId !== requestIdRef.current) return;
        try {
          const products = (await searchProducts(normalized)).slice(0, MAX_PRODUCTS).map(fallbackProduct);
          if (controller.signal.aborted || requestId !== requestIdRef.current) return;
          console.warn('[search] NivoSearch unavailable; using DTB catalog fallback.', error);
          setState({
            products,
            suggestions: [],
            didYouMean: '',
            loading: false,
            source: 'dtb-fallback',
            error,
          });
        } catch (fallbackError) {
          if (controller.signal.aborted || requestId !== requestIdRef.current) return;
          setState({
            products: [],
            suggestions: [],
            didYouMean: '',
            loading: false,
            source: 'error',
            error: fallbackError,
          });
        }
      }
    }, delayMs);

    return () => {
      window.clearTimeout(timer);
      controllerRef.current?.abort();
    };
  }, [query, delayMs]);

  return state;
}

function SearchProductRow({ product, index, onSelect, active = false }) {
  return (
    <button
      id={`dtb-nivo-product-${product.id}-${index}`}
      type="button"
      className={`dtb-nivo-search__product${active ? ' is-active' : ''}`}
      onClick={() => onSelect(product)}
      role="option"
      aria-selected={active}
    >
      <span className="dtb-nivo-search__thumb">
        {product.image ? <img src={product.image} alt="" loading="lazy" /> : <Search size={18} aria-hidden="true" />}
      </span>
      <span className="dtb-nivo-search__product-copy">
        <strong>{product.name}</strong>
        {product.sku ? <small>SKU {product.sku}</small> : null}
      </span>
      <span className="dtb-nivo-search__price">{product.priceText || 'View product'}</span>
    </button>
  );
}

function SuggestionList({ suggestions, onSelect, activeIndex = -1, productCount = 0 }) {
  if (!suggestions.length) return null;
  return (
    <div className="dtb-nivo-search__suggestions">
      <p className="dtb-nivo-search__eyebrow">Suggestions</p>
      <div className="dtb-nivo-search__suggestion-list" role="listbox" aria-label="Search suggestions">
        {suggestions.map((item, index) => {
          const active = activeIndex === productCount + index;
          return (
            <button
              id={`dtb-nivo-suggestion-${index}`}
              key={item.id || `${item.type}-${item.label}`}
              type="button"
              className={`dtb-nivo-search__suggestion${active ? ' is-active' : ''}`}
              onClick={() => onSelect(item)}
              role="option"
              aria-selected={active}
            >
              <span>{item.label}</span>
              {item.type === 'correction' ? <small>Did you mean</small> : item.count > 0 ? <small>{item.count}</small> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DesktopSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef(null);
  const { products, suggestions, loading, source } = usePredictiveSearch(query, DESKTOP_DEBOUNCE_MS);
  const hasQuery = query.trim().length > 0;
  const totalOptions = products.length + suggestions.length;

  const close = useCallback(() => {
    setOpen(false);
    setActiveIndex(-1);
  }, []);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) close();
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [close]);

  const viewAll = useCallback((value = query) => {
    const normalized = String(value || '').trim();
    navigate(`/products${normalized ? `?search=${encodeURIComponent(normalized)}` : ''}`);
    close();
  }, [close, navigate, query]);

  const selectProduct = useCallback((product) => {
    navigate(resolveProductPath(product));
    setQuery('');
    close();
  }, [close, navigate]);

  const selectSuggestion = useCallback((suggestion) => {
    viewAll(suggestion.value || suggestion.label);
  }, [viewAll]);

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      event.currentTarget.blur();
      return;
    }
    if (event.key === 'ArrowDown' && totalOptions > 0) {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % totalOptions);
      return;
    }
    if (event.key === 'ArrowUp' && totalOptions > 0) {
      event.preventDefault();
      setActiveIndex((index) => (index <= 0 ? totalOptions - 1 : index - 1));
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      if (activeIndex >= 0 && activeIndex < products.length) selectProduct(products[activeIndex]);
      else if (activeIndex >= products.length && suggestions[activeIndex - products.length]) selectSuggestion(suggestions[activeIndex - products.length]);
      else viewAll();
    }
  };

  const visible = open && hasQuery;
  const activeDescendant = activeIndex < 0
    ? undefined
    : activeIndex < products.length
      ? `dtb-nivo-product-${products[activeIndex]?.id}-${activeIndex}`
      : `dtb-nivo-suggestion-${activeIndex - products.length}`;

  return (
    <div ref={rootRef} className="dtb-nivo-search dtb-nivo-search--desktop" data-open={visible ? 'true' : 'false'} data-source={source}>
      <div className="dtb-nivo-search__input-shell">
        <Search size={17} aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search products..."
          aria-label="Search products"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={visible}
          aria-controls="dtb-nivo-desktop-results"
          aria-activedescendant={activeDescendant}
          autoComplete="off"
        />
        {query ? (
          <button type="button" className="dtb-nivo-search__clear" onClick={() => { setQuery(''); close(); }} aria-label="Clear search">
            <X size={15} />
          </button>
        ) : null}
      </div>

      <div id="dtb-nivo-desktop-results" className="dtb-nivo-search__panel" hidden={!visible}>
        {loading ? <StorefrontSearchLoading compact /> : (
          <>
            <div className="dtb-nivo-search__grid">
              <section className="dtb-nivo-search__products" aria-label="Product results">
                <p className="dtb-nivo-search__eyebrow">Products</p>
                {products.length ? products.map((product, index) => (
                  <SearchProductRow key={product.id} product={product} index={index} onSelect={selectProduct} active={activeIndex === index} />
                )) : <p className="dtb-nivo-search__empty">No products found.</p>}
              </section>
              <SuggestionList suggestions={suggestions} onSelect={selectSuggestion} activeIndex={activeIndex} productCount={products.length} />
            </div>
            <button type="button" className="dtb-nivo-search__view-all" onClick={() => viewAll()}>
              <span>View all results for “{query.trim()}”</span>
              <ArrowRight size={15} aria-hidden="true" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function MobileSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const { products, suggestions, loading, source } = usePredictiveSearch(query, MOBILE_DEBOUNCE_MS);

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [open]);

  const close = useCallback(() => setOpen(false), []);
  const viewAll = useCallback((value = query) => {
    const normalized = String(value || '').trim();
    navigate(`/products${normalized ? `?search=${encodeURIComponent(normalized)}` : ''}`);
    close();
  }, [close, navigate, query]);
  const selectProduct = useCallback((product) => {
    navigate(resolveProductPath(product));
    setQuery('');
    close();
  }, [close, navigate]);
  const selectSuggestion = useCallback((suggestion) => viewAll(suggestion.value || suggestion.label), [viewAll]);

  const dock = (
    <div className="dtb-nivo-mobile-dock">
      <div className="dtb-nivo-search__input-shell">
        <Search size={16} aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(event) => { setQuery(event.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') { event.preventDefault(); viewAll(); }
            if (event.key === 'Escape') { event.preventDefault(); close(); event.currentTarget.blur(); }
          }}
          placeholder="Search products, brands, SKU..."
          aria-label="Search products"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls="dtb-nivo-mobile-results"
          autoComplete="off"
        />
        {open ? (
          <button type="button" className="dtb-nivo-search__clear" onClick={close} aria-label="Close search">
            <X size={16} />
          </button>
        ) : null}
      </div>
    </div>
  );

  const overlay = open ? (
    <div className="dtb-nivo-mobile-overlay" data-source={source}>
      <button type="button" className="dtb-nivo-mobile-overlay__backdrop" onClick={close} aria-label="Close search" />
      <section id="dtb-nivo-mobile-results" className="dtb-nivo-mobile-overlay__sheet" aria-label="Search results">
        <div className="dtb-nivo-mobile-overlay__header">
          <strong>Search</strong>
          <button type="button" onClick={close} aria-label="Close search"><X size={20} /></button>
        </div>
        {suggestions.length ? <SuggestionList suggestions={suggestions} onSelect={selectSuggestion} /> : null}
        <div className="dtb-nivo-mobile-overlay__products">
          <p className="dtb-nivo-search__eyebrow">Products</p>
          {loading ? <StorefrontSearchLoading /> : products.length ? products.map((product, index) => (
            <SearchProductRow key={product.id} product={product} index={index} onSelect={selectProduct} />
          )) : query.trim() ? <p className="dtb-nivo-search__empty">No products found.</p> : <p className="dtb-nivo-search__empty">Start typing to search the catalog.</p>}
        </div>
        {query.trim() ? (
          <button type="button" className="dtb-nivo-search__view-all dtb-nivo-search__view-all--mobile" onClick={() => viewAll()}>
            <span>View all results for “{query.trim()}”</span>
            <ArrowRight size={15} aria-hidden="true" />
          </button>
        ) : null}
      </section>
    </div>
  ) : null;

  return { dock, overlay };
}

export default function NivoSearchPresentation() {
  const targets = useSearchTargets();
  const mobile = useMemo(() => <MobileSearch />, []);

  useEffect(() => {
    document.documentElement.classList.add('dtb-nivo-search-active');
    return () => document.documentElement.classList.remove('dtb-nivo-search-active');
  }, []);

  return (
    <>
      {targets.desktop ? createPortal(<DesktopSearch />, targets.desktop) : null}
      {targets.mobile ? createPortal(mobile, targets.mobile) : null}
    </>
  );
}
