/**
 * frontend/src/pages/ReturnPortal.jsx
 *
 * Customer return portal.
 * WooCommerce order lookup is performed server-side through DTB Returns.
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
  {
    Icon: CheckCircle,
    to: '/return-policy',
    title: 'Return policy',
    body: 'Review eligibility, the 45-day return window, and refund timing.',
  },
  {
    Icon: Package,
    to: '/return-policy',
    title: 'Return shipping',
    body: 'See how shipping is handled for damaged, defective, warranty, and customer-error returns.',
  },
  {
    Icon: AlertCircle,
    to: '/return-policy',
    title: 'Non-returnable items',
    body: 'Review exclusions for used, final-sale, special-order, direct-ship, and consumable items.',
  },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function InlineAlert({ children, tone = 'error' }) {
  const error = tone === 'error';
  return (
    <div
      role={error ? 'alert' : 'status'}
      aria-live="polite"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        padding: '12px 14px',
        borderRadius: 6,
        border: `1px solid ${error ? '#fecaca' : '#bfdbfe'}`,
        background: error ? '#fef2f2' : '#eff6ff',
        color: error ? '#991b1b' : '#1e3a8a',
        fontSize: '0.85rem',
        lineHeight: 1.5,
        marginBottom: 18,
      }}
    >
      {error ? <AlertCircle size={16} aria-hidden="true" /> : <CheckCircle size={16} aria-hidden="true" />}
      <span>{children}</span>
    </div>
  );
}

function StepIndicator({ step }) {
  return (
    <ol
      aria-label="Return request progress"
      style={{
        display: 'flex',
        gap: 8,
        listStyle: 'none',
        margin: '0 0 20px',
        padding: 0,
      }}
    >
      {[
        { n: 1, label: 'Find order' },
        { n: 2, label: 'Return details' },
      ].map(({ n, label }, index) => (
        <li key={n} style={{ display: 'flex', alignItems: 'center', flex: index === 0 ? 1 : 'initial', gap: 8 }}>
          <span
            aria-current={step === n ? 'step' : undefined}
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              fontSize: '0.72rem',
              fontWeight: 800,
              color: step >= n ? '#fff' : '#64748b',
              background: step >= n ? 'var(--primary-600)' : '#e2e8f0',
            }}
          >
            {step > n ? <CheckCircle size={14} aria-hidden="true" /> : n}
          </span>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: step >= n ? '#0f172a' : '#64748b' }}>
            {label}
          </span>
          {index === 0 && <span aria-hidden="true" style={{ height: 1, flex: 1, minWidth: 24, background: '#dbe2ea' }} />}
        </li>
      ))}
    </ol>
  );
}

function OrderResult({ order, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(order)}
      aria-pressed={selected}
      style={{
        width: '100%',
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        gap: 16,
        alignItems: 'center',
        textAlign: 'left',
        padding: '16px 18px',
        borderRadius: 7,
        border: selected ? '2px solid var(--primary-600)' : '1px solid #dbe2ea',
        background: selected ? '#f8fbff' : '#fff',
        color: '#0f172a',
        cursor: 'pointer',
      }}
    >
      <span>
        <span style={{ display: 'block', fontSize: '0.95rem', fontWeight: 800 }}>Order #{order.order_number}</span>
        <span style={{ display: 'block', marginTop: 5, color: '#64748b', fontSize: '0.8rem' }}>
          {order.date || 'Order date unavailable'} · {order.item_count} {order.item_count === 1 ? 'item' : 'items'}
        </span>
      </span>
      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>{order.status}</span>
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

    const trimmedOrder = orderNumber.trim();
    const trimmedEmail = lookupEmail.trim().toLowerCase();
    const trimmedName = lookupName.trim();

    if (!trimmedOrder && !trimmedEmail && !trimmedName) {
      setLookupError('Enter at least one detail so we can search for your order.');
      return;
    }

    if (trimmedEmail && !EMAIL_RE.test(trimmedEmail)) {
      setLookupError('Enter a valid email address or leave the email field blank.');
      return;
    }

    setLookupLoading(true);
    try {
      const response = await apiClient('/wp-json/dtb/v1/returns/lookup', {
        method: 'POST',
        body: JSON.stringify({
          order_number: trimmedOrder,
          customer_email: trimmedEmail,
          customer_name: trimmedName,
        }),
      });

      const orders = Array.isArray(response?.orders) ? response.orders : [];
      setLookupResults(orders);
      if (orders.length === 1) {
        setSelectedOrder(orders[0]);
      }
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
    <div className="page-wrapper" style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <SEOHead
        title="Return Portal"
        description="Find an order and start a return or exchange with Drywall Toolbox. Search using an order number, checkout email, or customer name."
        canonical="/returns"
      />

      <section style={{ background: '#0f172a', padding: 'clamp(42px, 7vw, 72px) clamp(1.25rem, 5vw, 3rem)' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div style={{ color: '#93c5fd', fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Returns &amp; exchanges
          </div>
          <h1 style={{ margin: '10px 0 0', color: '#fff', fontSize: 'clamp(2rem, 5vw, 3.4rem)', lineHeight: 1.05, letterSpacing: '-0.035em' }}>
            Start a return
          </h1>
          <p style={{ maxWidth: 620, margin: '14px 0 0', color: '#cbd5e1', fontSize: 'clamp(0.92rem, 2vw, 1.03rem)', lineHeight: 1.65 }}>
            Find the order with any detail you have, choose the matching order, and tell us what you need help with.
          </p>
        </div>
      </section>

      <main style={{ maxWidth: 1180, margin: '0 auto', padding: 'clamp(28px, 5vw, 56px) clamp(1.25rem, 5vw, 3rem) 72px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) minmax(260px, 0.8fr)', gap: 'clamp(28px, 5vw, 54px)', alignItems: 'start' }}>
          <section aria-labelledby="return-form-heading">
            {step < 3 && <StepIndicator step={step} />}

            <div style={{ background: '#fff', border: '1px solid #dbe2ea', borderRadius: 8, padding: 'clamp(22px, 4vw, 36px)', boxShadow: '0 8px 24px rgba(15, 23, 42, 0.04)' }}>
              {step === 1 && (
                <>
                  <h2 id="return-form-heading" style={{ margin: 0, color: '#0f172a', fontSize: '1.35rem', letterSpacing: '-0.02em' }}>
                    Find your order
                  </h2>
                  <p id="lookup-help" style={{ margin: '8px 0 24px', color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6 }}>
                    Enter <strong>any one</strong> of the details below. Adding more details can narrow the results.
                  </p>

                  {lookupError && <InlineAlert>{lookupError}</InlineAlert>}

                  <form onSubmit={handleLookup} noValidate>
                    <div style={{ display: 'grid', gap: 18 }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="machined-label text-blue-600" htmlFor="return-order-number">Order number</label>
                        <input
                          id="return-order-number"
                          type="text"
                          inputMode="numeric"
                          autoComplete="off"
                          value={orderNumber}
                          onChange={(event) => setOrderNumber(event.target.value)}
                          placeholder="e.g. 10042"
                          className="machined-input text-black"
                          aria-describedby="lookup-help"
                        />
                      </div>

                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="machined-label text-blue-600" htmlFor="return-email">Checkout email</label>
                        <input
                          id="return-email"
                          type="email"
                          autoComplete="email"
                          value={lookupEmail}
                          onChange={(event) => setLookupEmail(event.target.value)}
                          placeholder="you@example.com"
                          className="machined-input text-black"
                          aria-describedby="lookup-help"
                        />
                      </div>

                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="machined-label text-blue-600" htmlFor="return-name">Customer name</label>
                        <input
                          id="return-name"
                          type="text"
                          autoComplete="name"
                          value={lookupName}
                          onChange={(event) => setLookupName(event.target.value)}
                          placeholder="Full name used at checkout"
                          className="machined-input text-black"
                          aria-describedby="lookup-help"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="alloy-button w-full justify-center"
                      disabled={lookupLoading}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 22 }}
                    >
                      {lookupLoading ? <Loader size={16} className="animate-spin" aria-hidden="true" /> : <Search size={16} aria-hidden="true" />}
                      {lookupLoading ? 'Searching…' : 'Find order'}
                    </button>
                  </form>

                  {lookupResults.length > 0 && (
                    <div aria-live="polite" style={{ marginTop: 28, paddingTop: 24, borderTop: '1px solid #e2e8f0' }}>
                      <h3 style={{ margin: 0, fontSize: '1rem', color: '#0f172a' }}>
                        {lookupResults.length === 1 ? 'Order found' : `${lookupResults.length} matching orders`}
                      </h3>
                      <p style={{ margin: '6px 0 14px', color: '#64748b', fontSize: '0.82rem' }}>
                        Select the order you want to return.
                      </p>
                      <div style={{ display: 'grid', gap: 10 }}>
                        {lookupResults.map((order) => (
                          <OrderResult
                            key={`${order.order_number}-${order.lookup_token}`}
                            order={order}
                            selected={selectedOrder?.lookup_token === order.lookup_token}
                            onSelect={setSelectedOrder}
                          />
                        ))}
                      </div>
                      <button
                        type="button"
                        className="alloy-button w-full justify-center"
                        disabled={!selectedOrder}
                        onClick={continueWithOrder}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16 }}
                      >
                        Start return <ArrowRight size={16} aria-hidden="true" />
                      </button>
                    </div>
                  )}
                </>
              )}

              {step === 2 && selectedOrder && (
                <>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: 0, background: 'transparent', padding: 0, marginBottom: 20, color: 'var(--primary-600)', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    <ArrowLeft size={15} aria-hidden="true" /> Change order
                  </button>

                  <h2 id="return-form-heading" style={{ margin: 0, color: '#0f172a', fontSize: '1.35rem', letterSpacing: '-0.02em' }}>
                    Return details
                  </h2>
                  <div style={{ margin: '16px 0 24px', padding: '14px 16px', borderRadius: 7, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <strong style={{ display: 'block', color: '#0f172a', fontSize: '0.9rem' }}>Order #{selectedOrder.order_number}</strong>
                    <span style={{ display: 'block', marginTop: 4, color: '#64748b', fontSize: '0.8rem' }}>
                      {selectedOrder.date} · {selectedOrder.item_count} {selectedOrder.item_count === 1 ? 'item' : 'items'} · {selectedOrder.status}
                    </span>
                  </div>

                  {submitError && <InlineAlert>{submitError}</InlineAlert>}

                  <form onSubmit={handleSubmit}>
                    <div className="form-group">
                      <label className="machined-label text-blue-600" htmlFor="return-reason">Reason for return</label>
                      <select
                        id="return-reason"
                        value={returnReason}
                        onChange={(event) => setReturnReason(event.target.value)}
                        className="machined-input text-black"
                        required
                      >
                        <option value="">Select a reason</option>
                        {RETURN_REASONS.map((reason) => <option key={reason} value={reason}>{reason}</option>)}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="machined-label text-blue-600" htmlFor="return-notes">Additional details <span style={{ color: '#64748b', fontWeight: 500 }}>(optional)</span></label>
                      <textarea
                        id="return-notes"
                        value={additionalNotes}
                        onChange={(event) => setAdditionalNotes(event.target.value)}
                        placeholder="Tell us what happened, what condition the item is in, or anything else that will help us review the request."
                        className="machined-input text-black"
                        rows={5}
                        style={{ resize: 'vertical', minHeight: 120 }}
                      />
                    </div>

                    <button
                      type="submit"
                      className="alloy-button w-full justify-center"
                      disabled={submitLoading}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                    >
                      {submitLoading ? <Loader size={16} className="animate-spin" aria-hidden="true" /> : <RotateCcw size={16} aria-hidden="true" />}
                      {submitLoading ? 'Submitting…' : 'Submit return request'}
                    </button>
                  </form>
                </>
              )}

              {step === 3 && (
                <div style={{ textAlign: 'center', padding: '10px 0' }}>
                  <span style={{ width: 54, height: 54, margin: '0 auto 16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ecfdf5', color: '#047857' }}>
                    <CheckCircle size={28} aria-hidden="true" />
                  </span>
                  <h2 id="return-form-heading" style={{ margin: 0, color: '#0f172a', fontSize: '1.45rem' }}>Request received</h2>
                  <p style={{ maxWidth: 520, margin: '10px auto 0', color: '#64748b', fontSize: '0.9rem', lineHeight: 1.65 }}>
                    We received your return request and will review it. Keep your Return ID for reference and wait for return instructions before shipping anything back.
                  </p>

                  {returnTracking?.id && (
                    <div style={{ display: 'inline-block', marginTop: 20, padding: '12px 18px', borderRadius: 7, border: '1px solid #bfdbfe', background: '#eff6ff', color: '#1e3a8a', fontWeight: 800 }}>
                      Return ID: {returnTracking.id}
                    </div>
                  )}

                  {returnTracking?.id && returnTracking?.token && (
                    <div style={{ marginTop: 20 }}>
                      <Link
                        to={`/returns/status/${returnTracking.id}?token=${encodeURIComponent(returnTracking.token)}`}
                        className="alloy-button"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
                      >
                        Track return <ArrowRight size={15} aria-hidden="true" />
                      </Link>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={resetAll}
                    style={{ display: 'block', margin: '22px auto 0', border: 0, background: 'transparent', color: 'var(--primary-600)', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Start another return
                  </button>
                </div>
              )}
            </div>

            {step === 1 && (
              <p style={{ margin: '16px 0 0', color: '#64748b', fontSize: '0.82rem', lineHeight: 1.6 }}>
                Still can&apos;t find the order? <Link to="/contact" style={{ color: 'var(--primary-600)', fontWeight: 700 }}>Contact support</Link> and we can help locate it.
              </p>
            )}
          </section>

          <aside aria-label="Return information" style={{ display: 'grid', gap: 14 }}>
            <div style={{ padding: '18px 20px', borderRadius: 8, background: '#fff', border: '1px solid #dbe2ea' }}>
              <h2 style={{ margin: 0, fontSize: '1rem', color: '#0f172a' }}>Before you start</h2>
              <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: '0.83rem', lineHeight: 1.6 }}>
                You do not need every order detail. One matching field is enough to search. Do not ship a product back until you receive return instructions.
              </p>
            </div>

            {POLICY_LINKS.map(({ Icon, to, title, body }) => (
              <Link
                key={title}
                to={to}
                style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 12, padding: '16px 18px', borderRadius: 8, background: '#fff', border: '1px solid #dbe2ea', color: 'inherit', textDecoration: 'none' }}
              >
                <Icon size={18} color="var(--primary-600)" aria-hidden="true" />
                <span>
                  <strong style={{ display: 'block', color: '#0f172a', fontSize: '0.86rem' }}>{title}</strong>
                  <span style={{ display: 'block', marginTop: 4, color: '#64748b', fontSize: '0.78rem', lineHeight: 1.5 }}>{body}</span>
                </span>
              </Link>
            ))}
          </aside>
        </div>
      </main>
    </div>
  );
}
