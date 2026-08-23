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
  hasIncludes = false,
}) {
  const tabs = [
    { key: 'description', label: 'Overview' },
    ...(hasIncludes ? [{ key: 'includes', label: "What's Included" }] : []),
    { key: 'specs', label: 'Specifications' },
    { key: 'shipping', label: 'Shipping & Returns' },
    { key: 'reviews', label: 'Reviews' },
  ];

  const activeTabConfig = tabs.find((tab) => tab.key === activeTab) || tabs[0];

  const overviewNode = (
    <div className="dtb-pdp-overview">
      <div className="dtb-pdp-overview__editorial">
        {descriptionNode}
      </div>
      {specsNode ? (
        <aside className="dtb-pdp-overview__quick" aria-label="Quick product details">
          <h2 className="dtb-pdp-overview__quick-title">Quick Details</h2>
          {specsNode}
        </aside>
      ) : null}
    </div>
  );

  const contentByTab = {
    description: overviewNode,
    includes: specsNode,
    specs: specsNode,
    shipping: <ShippingReturnsPanel />,
    reviews: reviewsNode,
  };

  return (
    <div className="dtb-pdp-sections">
      <div className="dtb-pdp-tabs" role="tablist" aria-label="Product details">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
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
          role="tabpanel"
          id={`product-tabpanel-${activeTabConfig.key}`}
          aria-labelledby={`product-tab-${activeTabConfig.key}`}
          className={`dtb-pdp-section__content dtb-pdp-section__content--${activeTabConfig.key}`}
        >
          {contentByTab[activeTabConfig.key]}
        </div>
      </section>
    </div>
  );
}
