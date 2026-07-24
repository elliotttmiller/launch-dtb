import { ArrowRight, Search } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchWithNivo } from '../../api/nivoSearch.js';
import { searchProducts } from '../../services/catalog.js';
import StorefrontSearchLoading from './StorefrontSearchLoading.jsx';
import '../../styles/storefront-nivo-runtime-bridge.css';

const DESKTOP_DELAY = 180;
const MOBILE_DELAY = 220;
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

function useTargets() {
  const [targets, setTargets] = useState({
    desktopInput: null,
    desktopResults: null,
    mobileInput: null,
    mobileBody: null,
    mobileOverlay: null,
  });

  useEffect(() => {
    const resolve = () => {
      const next = {
        desktopInput: document.querySelector('.dtb-desktop-search-input'),
        desktopResults: document.querySelector('#dtb-desktop-search-results'),
        mobileInput: document.querySelector('.header-mobile-search-dock .storefront-search-dock input'),
        mobileBody: document.querySelector('.storefront-search-overlay__body'),
        mobileOverlay: document.querySelector('.storefront-search-overlay'),
      };
      setTargets((current) => (
        Object.keys(next).every((key) => current[key] === next[key]) ? current : next
      ));
    };

    resolve();
    const observer = new MutationObserver(resolve);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return targets;
}

function useNivoSurface(input, delay) {
  const [state, setState] = useState({ query: '', products: [], suggestions: [], loading: false, source: 'idle' });
  const requestIdRef = useRef(0);
  const controllerRef = useRef(null);

  useEffect(() => {
    if (!input) return undefined;

    const sync = () => setState((current) => ({ ...current, query: String(input.value || '') }));
    sync();
    input.addEventListener('input', sync);
    input.addEventListener('change', sync);
    return () => {
      input.removeEventListener('input', sync);
      input.removeEventListener('change', sync);
    };
  }, [input]);

  useEffect(() => {
    const query = state.query.trim();
    requestIdRef.current += 1;
    const requestId = requestIdRef.current;
    controllerRef.current?.abort();
    controllerRef.current = null;

    if (!query) {
      setState((current) => ({ ...current, products: [], suggestions: [], loading: false, source: 'idle' }));
      return undefined;
    }

    setState((current) => ({ ...current, loading: true }));
    const timer = window.setTimeout(async () => {
      const controller = new AbortController();
      controllerRef.current = controller;
      try {
        const result = await searchWithNivo(query, { signal: controller.signal });
        if (controller.signal.aborted || requestId !== requestIdRef.current) return;
        setState((current) => ({
          ...current,
          products: result.products.slice(0, MAX_PRODUCTS),
          suggestions: result.suggestions.slice(0, MAX_SUGGESTIONS),
          loading: false,
          source: result.source || 'nivo',
        }));
      } catch (error) {
        if (controller.signal.aborted || requestId !== requestIdRef.current) return;
        try {
          const products = (await searchProducts(query)).slice(0, MAX_PRODUCTS).map(fallbackProduct);
          if (controller.signal.aborted || requestId !== requestIdRef.current) return;
          console.warn('[search] NivoSearch unavailable; using DTB catalog fallback.', error);
          setState((current) => ({ ...current, products, suggestions: [], loading: false, source: 'dtb-fallback' }));
        } catch {
          if (controller.signal.aborted || requestId !== requestIdRef.current) return;
          setState((current) => ({ ...current, products: [], suggestions: [], loading: false, source: 'error' }));
        }
      }
    }, delay);

    return () => {
      window.clearTimeout(timer);
      controllerRef.current?.abort();
    };
  }, [state.query, delay]);

  return state;
}

function setControlledInputValue(input, value) {
  if (!input) return;
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
  if (setter) setter.call(input, value);
  else input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.focus();
}

function ProductRow({ product, onSelect }) {
  return (
    <button type="button" className="dtb-nivo-runtime__product" onClick={() => onSelect(product)}>
      <span className="dtb-nivo-runtime__thumb">
        {product.image ? <img src={product.image} alt="" loading="lazy" /> : <Search size={17} aria-hidden="true" />}
      </span>
      <span className="dtb-nivo-runtime__product-copy">
        <strong>{product.name}</strong>
        {product.sku ? <small>SKU {product.sku}</small> : null}
      </span>
      <span className="dtb-nivo-runtime__price">{product.priceText || (typeof product.price === 'number' ? `$${product.price.toFixed(2)}` : 'View product')}</span>
    </button>
  );
}

function Suggestions({ items, onSelect }) {
  if (!items.length) return null;
  return (
    <section className="dtb-nivo-runtime__suggestions" aria-label="Search suggestions">
      <p className="dtb-nivo-runtime__eyebrow">Suggestions</p>
      <div className="dtb-nivo-runtime__suggestion-list">
        {items.map((item) => (
          <button key={item.id || `${item.type}-${item.label}`} type="button" onClick={() => onSelect(item)} className="dtb-nivo-runtime__suggestion">
            <span>{item.label}</span>
            {item.type === 'correction' ? <small>Did you mean</small> : item.type ? <small>{item.type}</small> : null}
          </button>
        ))}
      </div>
    </section>
  );
}

function ResultLayer({ state, input, mobile = false }) {
  const navigate = useNavigate();
  const selectProduct = useCallback((product) => navigate(resolveProductPath(product)), [navigate]);
  const selectSuggestion = useCallback((suggestion) => {
    setControlledInputValue(input, suggestion.value || suggestion.label || '');
  }, [input]);
  const viewAll = useCallback(() => {
    const query = state.query.trim();
    navigate(`/products${query ? `?search=${encodeURIComponent(query)}` : ''}`);
  }, [navigate, state.query]);

  return (
    <div className={`dtb-nivo-runtime-layer${mobile ? ' dtb-nivo-runtime-layer--mobile' : ''}`} data-source={state.source}>
      {state.loading ? <StorefrontSearchLoading compact={!mobile} /> : (
        <>
          <div className="dtb-nivo-runtime__layout">
            <section className="dtb-nivo-runtime__products" aria-label="Product results">
              <p className="dtb-nivo-runtime__eyebrow">Products</p>
              {state.products.length ? state.products.map((product) => (
                <ProductRow key={product.id} product={product} onSelect={selectProduct} />
              )) : <p className="dtb-nivo-runtime__empty">No products found.</p>}
            </section>
            <Suggestions items={state.suggestions} onSelect={selectSuggestion} />
          </div>
          {state.query.trim() ? (
            <button type="button" className="dtb-nivo-runtime__view-all" onClick={viewAll}>
              <span>View all results for “{state.query.trim()}”</span>
              <ArrowRight size={15} aria-hidden="true" />
            </button>
          ) : null}
        </>
      )}
    </div>
  );
}

export default function NivoSearchRuntimeBridge() {
  const targets = useTargets();
  const desktop = useNivoSurface(targets.desktopInput, DESKTOP_DELAY);
  const mobile = useNivoSurface(targets.mobileInput, MOBILE_DELAY);

  useEffect(() => {
    const desktopOwned = targets.desktopResults && desktop.query.trim();
    targets.desktopResults?.classList.toggle('dtb-nivo-runtime-owned', Boolean(desktopOwned));

    const mobileOwned = targets.mobileBody && mobile.query.trim();
    targets.mobileBody?.classList.toggle('dtb-nivo-runtime-owned', Boolean(mobileOwned));
    if (targets.mobileOverlay) {
      if (mobileOwned) targets.mobileOverlay.setAttribute('data-dtb-nivo-runtime', 'true');
      else targets.mobileOverlay.removeAttribute('data-dtb-nivo-runtime');
    }

    return () => {
      targets.desktopResults?.classList.remove('dtb-nivo-runtime-owned');
      targets.mobileBody?.classList.remove('dtb-nivo-runtime-owned');
      targets.mobileOverlay?.removeAttribute('data-dtb-nivo-runtime');
    };
  }, [desktop.query, mobile.query, targets.desktopResults, targets.mobileBody, targets.mobileOverlay]);

  return (
    <>
      {targets.desktopResults && desktop.query.trim()
        ? createPortal(<ResultLayer state={desktop} input={targets.desktopInput} />, targets.desktopResults)
        : null}
      {targets.mobileBody && mobile.query.trim()
        ? createPortal(<ResultLayer state={mobile} input={targets.mobileInput} mobile />, targets.mobileBody)
        : null}
    </>
  );
}
