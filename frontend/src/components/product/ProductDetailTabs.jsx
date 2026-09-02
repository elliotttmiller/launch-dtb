import { useLayoutEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FileText, ListChecks, Star, Truck } from 'lucide-react';

const DETAIL_TABS = [
  { key: 'description', label: 'Overview', Icon: FileText },
  { key: 'specs', label: 'Specifications', Icon: ListChecks },
  { key: 'shipping', label: 'Shipping & Returns', Icon: Truck },
  { key: 'reviews', label: 'Reviews', Icon: Star },
];

function ShippingReturnsPanel() {
  return (
    <div className="dtb-pdp-policy-panel">
      <div className="dtb-pdp-policy-panel__item">
        <h3>Shipping</h3>
        <p>Shipping options and final delivery charges are calculated during checkout.</p>
        <Link to="/shipping-policy">View shipping policy</Link>
      </div>
      <div className="dtb-pdp-policy-panel__item">
        <h3>Returns</h3>
        <p>Review eligibility, timing, and return requirements before starting a return.</p>
        <Link to="/return-policy">View return policy</Link>
      </div>
    </div>
  );
}

export default function ProductDetailTabs({
  activeTab,
  setActiveTab,
  descriptionNode,
  specsNode,
  reviewsNode,
}) {
  const tabsRef = useRef(null);
  const pillRef = useRef(null);
  const tabRefs = useRef([]);

  // `includes` was the legacy tool-set tab key. Tool-set composition now lives
  // exclusively in Specifications, so normalize any stale caller state to the
  // canonical Specifications tab until all legacy callers are removed.
  const resolvedActiveTab = activeTab === 'includes' ? 'specs' : activeTab;
  const activeTabConfig = DETAIL_TABS.find((tab) => tab.key === resolvedActiveTab) || DETAIL_TABS[0];

  useLayoutEffect(() => {
    const tabsNode = tabsRef.current;
    const pillNode = pillRef.current;
    const activeIndex = DETAIL_TABS.findIndex((tab) => tab.key === activeTabConfig.key);
    const activeTabNode = tabRefs.current[activeIndex];

    if (!tabsNode || !pillNode || !activeTabNode) return undefined;

    let frame = 0;
    const repositionPill = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        pillNode.style.transform = `translateX(${activeTabNode.offsetLeft}px)`;
        pillNode.style.width = `${activeTabNode.offsetWidth}px`;
        pillNode.classList.add('is-ready');
      });
    };

    repositionPill();

    const resizeObserver = typeof ResizeObserver === 'function'
      ? new ResizeObserver(repositionPill)
      : null;
    resizeObserver?.observe(tabsNode);
    resizeObserver?.observe(activeTabNode);
    window.addEventListener('resize', repositionPill);
    document.fonts?.ready.then(repositionPill).catch(() => {});

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      window.removeEventListener('resize', repositionPill);
    };
  }, [activeTabConfig.key]);

  const overviewNode = (
    <div className="dtb-pdp-overview">
      <div className="dtb-pdp-overview__editorial">
        <h2 className="dtb-pdp-overview__title">Overview</h2>
        {descriptionNode}
      </div>
    </div>
  );

  const contentByTab = {
    description: overviewNode,
    specs: specsNode,
    shipping: <ShippingReturnsPanel />,
    reviews: reviewsNode,
  };

  const activateTab = (key, index, { focus = false } = {}) => {
    setActiveTab(key);
    const tab = tabRefs.current[index];
    if (tab) {
      tab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      if (focus) tab.focus();
    }
  };

  const handleTabKeyDown = (event, index) => {
    let nextIndex = null;

    if (event.key === 'ArrowRight') nextIndex = (index + 1) % DETAIL_TABS.length;
    if (event.key === 'ArrowLeft') nextIndex = (index - 1 + DETAIL_TABS.length) % DETAIL_TABS.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = DETAIL_TABS.length - 1;

    if (nextIndex === null) return;

    event.preventDefault();
    activateTab(DETAIL_TABS[nextIndex].key, nextIndex, { focus: true });
  };

  return (
    <div className="dtb-pdp-sections">
      <div
        ref={tabsRef}
        className="dtb-pdp-tabs"
        role="tablist"
        aria-label="Product details"
        aria-orientation="horizontal"
      >
        <span ref={pillRef} className="dtb-pdp-tabs__pill" aria-hidden="true" />
        {DETAIL_TABS.map((tab, index) => {
          const Icon = tab.Icon;
          return (
          <button
            key={tab.key}
            ref={(node) => { tabRefs.current[index] = node; }}
            type="button"
            onClick={() => activateTab(tab.key, index)}
            onKeyDown={(event) => handleTabKeyDown(event, index)}
            role="tab"
            id={`product-tab-${tab.key}`}
            aria-controls={`product-tabpanel-${tab.key}`}
            aria-selected={resolvedActiveTab === tab.key}
            tabIndex={resolvedActiveTab === tab.key ? 0 : -1}
            className={`dtb-pdp-tabs__tab ${resolvedActiveTab === tab.key ? 'is-active' : ''}`}
          >
            <Icon className="dtb-pdp-tabs__icon" aria-hidden="true" strokeWidth={1.9} />
            <span className="dtb-pdp-tabs__label">{tab.label}</span>
          </button>
          );
        })}
      </div>

      <section className="dtb-pdp-section" aria-live="polite">
        <div
          key={activeTabConfig.key}
          role="tabpanel"
          id={`product-tabpanel-${activeTabConfig.key}`}
          aria-labelledby={`product-tab-${activeTabConfig.key}`}
          className={`dtb-pdp-section__content dtb-pdp-section__content--${activeTabConfig.key} dtb-pdp-section__content--transitioning`}
        >
          {contentByTab[activeTabConfig.key]}
        </div>
      </section>
    </div>
  );
}
