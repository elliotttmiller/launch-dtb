/**
 * frontend/src/pages/ReturnPortal.jsx
 *
 * Customer return portal. WooCommerce remains the order authority; this page
 * only sends lookup criteria and short-lived lookup tokens to DTB Returns.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Loader,
  Package,
  RotateCcw,
  Search,
} from 'lucide-react';
import SEOHead from '../components/shared/SEOHead';
import { apiClient } from '../api/client';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const RETURN_REASONS = [
  'Arrived damaged',
  'Wrong item received',
  'Item not as described',
  'Changed my mind / no longer needed',
  'Defective / not working',
  'Ordered by mistake',
  'Better price found elsewhere',
  'Other',
];

const POLICY_LINKS = [
  ['Return policy', 'Eligibility, the 45-day return window, and refund timing.', CheckCircle],
  ['Return shipping', 'Shipping rules for damaged, defective, warranty, and customer-error returns.', Package],
  ['Non-returnable items', 'Used, final-sale, special-order, direct-ship, and consumable-item exclusions.', AlertCircle],
];

function Notice({ children }) {
  return (
    <div className="returns-notice" role="alert" aria-live="polite">
      <AlertCircle size={16} aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}

function Steps({ step }) {
  return (
    <ol className="returns-steps" aria-label="Return request progress">
      {[
        [1, 'Find order'],
        [2, 'Return details'],
      ].map(([number, label], index) => (
        <li key={number}>
          <span className={`returns-step-dot ${step >= number ? 'is-active' : ''}`} aria-current={step === number ? 'step' : undefined}>
            {step > number ? <CheckCircle size={14} aria-hidden="true" /> : number}
          </span>
          <span className="returns-step-label">{label}</span>
          {index === 0 && <span className="returns-step-line" aria-hidden="true" />}
        </li>
      ))}
    </ol>
  );
}

function OrderChoice({ order, selected, onSelect }) {
  return (
    <button
      type="button"
      className={`returns-order-choice ${selected ? 'is-selected' : ''}`}
      onClick={() => onSelect(order)}
      aria-pressed={selected}
    >
      <span>
        <strong>Order #{order.order_number}</strong>
        <small>{order.date || 'Order date unavailable'} · {order.item_count} {order.item_count === 1 ? 'item' : 'items'}</small>
      </span>
      <span className="returns-order-status">{order.status}</span>
    </button>
  );
}

export default function ReturnPortal() {
  const [step, setStep] = useState(1);
  const [orderNumber, setOrderNumber] = useState('');
  const [lookupEmail, setLookupEmail] = useState('');
  const [lookupName, setLookupName] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [lookupResults, setLookupResults] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [returnReason, setReturnReason] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [returnTracking, setReturnTracking] = useState(null);

  const handleLookup = async (event) => {
    event.preventDefault();
    setLookupError('');
    setLookupResults([]);
    setSelectedOrder(null);

    const order = orderNumber.trim();
    const email = lookupEmail.trim().toLowerCase();
    const name = lookupName.trim();

    if (!order && !email && !name) {
      setLookupError('Enter at least one detail so we can search for your order.');
      return;
    }
    if (email && !EMAIL_RE.test(email)) {
      setLookupError('Enter a valid email address or leave the email field blank.');
      return;
    }

    setLookupLoading(true);
    try {
      const response = await apiClient('/wp-json/dtb/v1/returns/lookup', {
        method: 'POST',
        body: JSON.stringify({
          order_number: order,
          customer_email: email,
          customer_name: name,
        }),
      });
      const orders = Array.isArray(response?.orders) ? response.orders : [];
      setLookupResults(orders);
      setSelectedOrder(orders.length === 1 ? orders[0] : null);
      if (!orders.length) {
        setLookupError('No matching order was found. Check the detail you entered or add another detail to narrow the search.');
      }
    } catch (error) {
      setLookupError(error?.message || 'We could not search for your order. Please try again.');
    } finally {
      setLookupLoading(false);
    }
  };

  const continueWithOrder = () => {
    if (!selectedOrder?.lookup_token) {
      setLookupError('Select the order you want to return.');
      return;
    }
    setLookupError('');
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError('');

    if (!selectedOrder?.lookup_token) {
      setSubmitError('Your order verification has expired. Search for the order again.');
      return;
    }
    if (!returnReason) {
      setSubmitError('Select a return reason.');
      return;
    }

    setSubmitLoading(true);
    try {
      const response = await apiClient('/wp-json/dtb/v1/returns/request', {
        method: 'POST',
        body: JSON.stringify({
          lookup_token: selectedOrder.lookup_token,
          reason: returnReason,
          notes: additionalNotes.trim(),
        }),
      });
      setReturnTracking(
        response?.return_id && response?.public_token
          ? { id: response.return_id, token: response.public_token }
          : null
      );
      setStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      setSubmitError(error?.message || 'Unable to submit your return request. Please try again.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const resetAll = () => {
    setStep(1);
    setOrderNumber('');
    setLookupEmail('');
    setLookupName('');
    setLookupLoading(false);
    setLookupError('');
    setLookupResults([]);
    setSelectedOrder(null);
    setReturnReason('');
    setAdditionalNotes('');
    setSubmitLoading(false);
    setSubmitError('');
    setReturnTracking(null);
  };

  return (
    <div className="page-wrapper returns-portal">
      <SEOHead
        title="Return Portal"
        description="Find an order and start a return or exchange with Drywall Toolbox. Search using an order number, checkout email, or customer name."
        canonical="/returns"
      />

      <style>{`
        .returns-portal { min-height: 100vh; background: #f8fafc; color: #0f172a; }
        .returns-hero { background: #0f172a; padding: clamp(42px, 7vw, 72px) clamp(1.25rem, 5vw, 3rem); }
        .returns-shell { width: min(1180px, 100%); margin: 0 auto; }
        .returns-eyebrow { color: #93c5fd; font-size: .72rem; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
        .returns-hero h1 { margin: 10px 0 0; color: #fff; font-size: clamp(2rem, 5vw, 3.4rem); line-height: 1.05; letter-spacing: -.035em; }
        .returns-hero p { max-width: 620px; margin: 14px 0 0; color: #cbd5e1; font-size: clamp(.92rem, 2vw, 1.03rem); line-height: 1.65; }
        .returns-main { padding: clamp(28px, 5vw, 56px) clamp(1.25rem, 5vw, 3rem) 72px; }
        .returns-grid { display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(260px, .8fr); gap: clamp(28px, 5vw, 54px); align-items: start; }
        .returns-card { background: #fff; border: 1px solid #dbe2ea; border-radius: 8px; padding: clamp(22px, 4vw, 36px); box-shadow: 0 8px 24px rgba(15, 23, 42, .04); }
        .returns-card h2 { margin: 0; font-size: 1.35rem; letter-spacing: -.02em; }
        .returns-help { margin: 8px 0 24px; color: #64748b; font-size: .9rem; line-height: 1.6; }
        .returns-fields { display: grid; gap: 18px; }
        .returns-fields .form-group { margin: 0; }
        .returns-notice { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 18px; padding: 12px 14px; border: 1px solid #fecaca; border-radius: 6px; background: #fef2f2; color: #991b1b; font-size: .85rem; line-height: 1.5; }
        .returns-notice svg { flex: 0 0 auto; margin-top: 2px; }
        .returns-steps { display: flex; gap: 8px; list-style: none; margin: 0 0 20px; padding: 0; }
        .returns-steps li { display: flex; align-items: center; gap: 8px; min-width: 0; }
        .returns-steps li:first-child { flex: 1; }
        .returns-step-dot { width: 28px; height: 28px; flex: 0 0 auto; border-radius: 999px; display: inline-flex; align-items: center; justify-content: center; background: #e2e8f0; color: #64748b; font-size: .72rem; font-weight: 800; }
        .returns-step-dot.is-active { background: var(--primary-600); color: #fff; }
        .returns-step-label { white-space: nowrap; color: #475569; font-size: .75rem; font-weight: 700; }
        .returns-step-line { height: 1px; flex: 1; min-width: 18px; background: #dbe2ea; }
        .returns-results { margin-top: 28px; padding-top: 24px; border-top: 1px solid #e2e8f0; }
        .returns-results h3 { margin: 0; font-size: 1rem; }
        .returns-results > p { margin: 6px 0 14px; color: #64748b; font-size: .82rem; }
        .returns-result-list { display: grid; gap: 10px; }
        .returns-order-choice { width: 100%; display: grid; grid-template-columns: minmax(0,1fr) auto; gap: 16px; align-items: center; padding: 16px 18px; border: 1px solid #dbe2ea; border-radius: 7px; background: #fff; color: #0f172a; text-align: left; cursor: pointer; }
        .returns-order-choice.is-selected { border: 2px solid var(--primary-600); background: #f8fbff; }
        .returns-order-choice strong, .returns-order-choice small { display: block; }
        .returns-order-choice strong { font-size: .95rem; }
        .returns-order-choice small { margin-top: 5px; color: #64748b; font-size: .8rem; }
        .returns-order-status { color: #475569; font-size: .75rem; font-weight: 700; }
        .returns-summary { margin: 16px 0 24px; padding: 14px 16px; border: 1px solid #e2e8f0; border-radius: 7px; background: #f8fafc; }
        .returns-summary strong, .returns-summary span { display: block; }
        .returns-summary strong { font-size: .9rem; }
        .returns-summary span { margin-top: 4px; color: #64748b; font-size: .8rem; }
        .returns-back, .returns-reset { border: 0; background: transparent; color: var(--primary-600); font-size: .82rem; font-weight: 700; cursor: pointer; }
        .returns-back { display: inline-flex; align-items: center; gap: 6px; padding: 0; margin-bottom: 20px; }
        .returns-success { text-align: center; padding: 10px 0; }
        .returns-success-icon { width: 54px; height: 54px; margin: 0 auto 16px; border-radius: 999px; display: flex; align-items: center; justify-content: center; background: #ecfdf5; color: #047857; }
        .returns-success p { max-width: 520px; margin: 10px auto 0; color: #64748b; font-size: .9rem; line-height: 1.65; }
        .returns-id { display: inline-block; margin-top: 20px; padding: 12px 18px; border: 1px solid #bfdbfe; border-radius: 7px; background: #eff6ff; color: #1e3a8a; font-weight: 800; }
        .returns-help-link { margin: 16px 0 0; color: #64748b; font-size: .82rem; line-height: 1.6; }
        .returns-help-link a { color: var(--primary-600); font-weight: 700; }
        .returns-sidebar { display: grid; gap: 14px; }
        .returns-sidebar-card { display: grid; grid-template-columns: auto minmax(0,1fr); gap: 12px; padding: 16px 18px; border: 1px solid #dbe2ea; border-radius: 8px; background: #fff; color: inherit; text-decoration: none; }
        .returns-sidebar-card.is-intro { display: block; padding: 18px 20px; }
        .returns-sidebar-card h2, .returns-sidebar-card strong { margin: 0; color: #0f172a; font-size: .9rem; }
        .returns-sidebar-card p, .returns-sidebar-card span { display: block; margin: 6px 0 0; color: #64748b; font-size: .8rem; line-height: 1.55; }
        .returns-sidebar-card svg { color: var(--primary-600); }
        .returns-primary { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; margin-top: 22px; }
        .returns-results .returns-primary { margin-top: 16px; }
        .returns-track { display: inline-flex; align-items: center; gap: 8px; margin-top: 20px; }
        .returns-reset { display: block; margin: 22px auto 0; }
        @media (max-width: 820px) {
          .returns-grid { grid-template-columns: minmax(0, 1fr); }
          .returns-sidebar { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .returns-sidebar-card.is-intro { grid-column: 1 / -1; }
        }
        @media (max-width: 560px) {
          .returns-main { padding-left: 1rem; padding-right: 1rem; }
          .returns-hero { padding-left: 1rem; padding-right: 1rem; }
          .returns-sidebar { grid-template-columns: minmax(0, 1fr); }
          .returns-sidebar-card.is-intro { grid-column: auto; }
          .returns-order-choice { grid-template-columns: minmax(0,1fr); gap: 8px; }
          .returns-order-status { justify-self: start; }
          .returns-step-label { font-size: .7rem; }
        }
        @media (prefers-reduced-motion: reduce) {
          .returns-portal * { scroll-behavior: auto !important; }
        }
      `}</style>

      <header className="returns-hero">
        <div className="returns-shell">
          <div className="returns-eyebrow">Returns &amp; exchanges</div>
          <h1>Start a return</h1>
          <p>Find the order with any detail you have, choose the matching order, and tell us what you need help with.</p>
        </div>
      </header>

      <main className="returns-shell returns-main">
        <div className="returns-grid">
          <section aria-labelledby="return-form-heading">
            {step < 3 && <Steps step={step} />}

            <div className="returns-card">
              {step === 1 && (
                <>
                  <h2 id="return-form-heading">Find your order</h2>
                  <p id="lookup-help" className="returns-help">
                    Enter <strong>any one</strong> of the details below. Adding more details can narrow the results.
                  </p>
                  {lookupError && <Notice>{lookupError}</Notice>}

                  <form onSubmit={handleLookup} noValidate>
                    <div className="returns-fields">
                      <div className="form-group">
                        <label className="machined-label text-blue-600" htmlFor="return-order-number">Order number</label>
                        <input id="return-order-number" type="text" inputMode="numeric" autoComplete="off" value={orderNumber} onChange={(event) => setOrderNumber(event.target.value)} placeholder="e.g. 10042" className="machined-input text-black" aria-describedby="lookup-help" />
                      </div>
                      <div className="form-group">
                        <label className="machined-label text-blue-600" htmlFor="return-email">Checkout email</label>
                        <input id="return-email" type="email" autoComplete="email" value={lookupEmail} onChange={(event) => setLookupEmail(event.target.value)} placeholder="you@example.com" className="machined-input text-black" aria-describedby="lookup-help" />
                      </div>
                      <div className="form-group">
                        <label className="machined-label text-blue-600" htmlFor="return-name">Customer name</label>
                        <input id="return-name" type="text" autoComplete="name" value={lookupName} onChange={(event) => setLookupName(event.target.value)} placeholder="Full name used at checkout" className="machined-input text-black" aria-describedby="lookup-help" />
                      </div>
                    </div>

                    <button type="submit" className="alloy-button returns-primary" disabled={lookupLoading}>
                      {lookupLoading ? <Loader size={16} className="animate-spin" aria-hidden="true" /> : <Search size={16} aria-hidden="true" />}
                      {lookupLoading ? 'Searching…' : 'Find order'}
                    </button>
                  </form>

                  {lookupResults.length > 0 && (
                    <div className="returns-results" aria-live="polite">
                      <h3>{lookupResults.length === 1 ? 'Order found' : `${lookupResults.length} matching orders`}</h3>
                      <p>Select the order you want to return.</p>
                      <div className="returns-result-list">
                        {lookupResults.map((order) => (
                          <OrderChoice
                            key={`${order.order_number}-${order.lookup_token}`}
                            order={order}
                            selected={selectedOrder?.lookup_token === order.lookup_token}
                            onSelect={setSelectedOrder}
                          />
                        ))}
                      </div>
                      <button type="button" className="alloy-button returns-primary" disabled={!selectedOrder} onClick={continueWithOrder}>
                        Start return <ArrowRight size={16} aria-hidden="true" />
                      </button>
                    </div>
                  )}
                </>
              )}

              {step === 2 && selectedOrder && (
                <>
                  <button type="button" className="returns-back" onClick={() => setStep(1)}>
                    <ArrowLeft size={15} aria-hidden="true" /> Change order
                  </button>
                  <h2 id="return-form-heading">Return details</h2>
                  <div className="returns-summary">
                    <strong>Order #{selectedOrder.order_number}</strong>
                    <span>{selectedOrder.date} · {selectedOrder.item_count} {selectedOrder.item_count === 1 ? 'item' : 'items'} · {selectedOrder.status}</span>
                  </div>
                  {submitError && <Notice>{submitError}</Notice>}

                  <form onSubmit={handleSubmit}>
                    <div className="form-group">
                      <label className="machined-label text-blue-600" htmlFor="return-reason">Reason for return</label>
                      <select id="return-reason" value={returnReason} onChange={(event) => setReturnReason(event.target.value)} className="machined-input text-black" required>
                        <option value="">Select a reason</option>
                        {RETURN_REASONS.map((reason) => <option key={reason} value={reason}>{reason}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="machined-label text-blue-600" htmlFor="return-notes">Additional details <span style={{ color: '#64748b', fontWeight: 500 }}>(optional)</span></label>
                      <textarea id="return-notes" value={additionalNotes} onChange={(event) => setAdditionalNotes(event.target.value)} placeholder="Tell us what happened, what condition the item is in, or anything else that will help us review the request." className="machined-input text-black" rows={5} style={{ resize: 'vertical', minHeight: 120 }} />
                    </div>
                    <button type="submit" className="alloy-button returns-primary" disabled={submitLoading}>
                      {submitLoading ? <Loader size={16} className="animate-spin" aria-hidden="true" /> : <RotateCcw size={16} aria-hidden="true" />}
                      {submitLoading ? 'Submitting…' : 'Submit return request'}
                    </button>
                  </form>
                </>
              )}

              {step === 3 && (
                <div className="returns-success">
                  <span className="returns-success-icon"><CheckCircle size={28} aria-hidden="true" /></span>
                  <h2 id="return-form-heading">Request received</h2>
                  <p>We received your return request and will review it. Keep your Return ID for reference and wait for return instructions before shipping anything back.</p>
                  {returnTracking?.id && <div className="returns-id">Return ID: {returnTracking.id}</div>}
                  {returnTracking?.id && returnTracking?.token && (
                    <div>
                      <Link to={`/returns/status/${returnTracking.id}?token=${encodeURIComponent(returnTracking.token)}`} className="alloy-button returns-track">
                        Track return <ArrowRight size={15} aria-hidden="true" />
                      </Link>
                    </div>
                  )}
                  <button type="button" className="returns-reset" onClick={resetAll}>Start another return</button>
                </div>
              )}
            </div>

            {step === 1 && (
              <p className="returns-help-link">Still can&apos;t find the order? <Link to="/contact">Contact support</Link> and we can help locate it.</p>
            )}
          </section>

          <aside className="returns-sidebar" aria-label="Return information">
            <div className="returns-sidebar-card is-intro">
              <h2>Before you start</h2>
              <p>You do not need every order detail. One matching field is enough to search. Do not ship a product back until you receive return instructions.</p>
            </div>
            {POLICY_LINKS.map(([title, body, Icon]) => (
              <Link key={title} to="/return-policy" className="returns-sidebar-card">
                <Icon size={18} aria-hidden="true" />
                <span>
                  <strong>{title}</strong>
                  <span>{body}</span>
                </span>
              </Link>
            ))}
          </aside>
        </div>
      </main>
    </div>
  );
}
