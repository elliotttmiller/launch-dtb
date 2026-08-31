import { useRef } from 'react';
import { Link } from 'react-router-dom';

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
  const tabRefs = useRef([]);
  const tabs = [
    { key: 'description', label: 'Overview' },
    { key: 'specs', label: 'Specifications' },
    { key: 'shipping', label: 'Shipping & Returns' },
    { key: 'reviews', label: 'Reviews' },
  ];

  const activeTabConfig = tabs.find((tab) => tab.key === activeTab) || tabs[0];

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

    if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = tabs.length - 1;

    if (nextIndex === null) return;

    event.preventDefault();
    activateTab(tabs[nextIndex].key, nextIndex, { focus: true });
  };

  return (
    <div className="dtb-pdp-sections">
      <div className="dtb-pdp-tabs" role="tablist" aria-label="Product details">
        {tabs.map((tab, index) => (
          <button
            key={tab.key}
            ref={(node) => { tabRefs.current[index] = node; }}
            type="button"
            onClick={() => activateTab(tab.key, index)}
            onKeyDown={(event) => handleTabKeyDown(event, index)}
            role="tab"
            id={`product-tab-${tab.key}`}
            aria-controls={`product-tabpanel-${tab.key}`}
            aria-selected={activeTab === tab.key}
            tabIndex={activeTab === tab.key ? 0 : -1}
            className={`dtb-pdp-tabs__tab ${activeTab === tab.key ? 'is-active' : ''}`}
          >
            {tab.label}
          </button>
        ))}
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
