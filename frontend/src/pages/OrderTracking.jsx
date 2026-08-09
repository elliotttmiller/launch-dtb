/**
 * frontend/src/pages/OrderTracking.jsx
 *
 * Customer-facing product order tracking page.
 *
 * Routes:
 *   /order-tracking/:id              — authenticated customer tracking
 *   /order-tracking/:id?order_key=…  — guest tracking via order key
 */

import { useEffect, useMemo, useRef } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  Check,
  ExternalLink,
  Headphones,
  Loader,
  Package,
  Settings,
  Truck,
} from 'lucide-react';
import SEOHead from '../components/shared/SEOHead';
import OrderConfirmedHero from '../components/order/OrderConfirmedHero.jsx';
import { useOrderStatus } from '../hooks/useOrderStatus.js';
import { useOrderEventStream } from '../hooks/useOrderEventStream.js';
import { useOrderItemImageFallbacks } from '../hooks/useOrderItemImageFallbacks.js';
import { ORDER_STATUS_LABELS } from '../api/orders.js';
import { useCart } from '../context/CartContext.jsx';
import { getOrderItemKey, resolveOrderItemImage } from '../utils/orderItemImages.js';
import '../styles/order-pages.css';
import '../styles/order-tracking.css';

const TRACKING_STEPS = [
  { id: 'received', label: 'Received', description: 'Order captured', Icon: Check, eventTypes: ['order.created'] },
  { id: 'payment', label: 'Payment', description: 'Payment confirmed', Icon: Check, eventTypes: ['order.payment_confirmed'] },
  { id: 'processing', label: 'Processing', description: 'Preparing items', Icon: Settings, eventTypes: ['order.picked', 'order.packed', 'order.inventory_reserved'] },
  { id: 'shipped', label: 'Shipped', description: 'In transit', Icon: Truck, eventTypes: ['order.shipped'] },
  { id: 'complete', label: 'Delivered', description: 'Complete', Icon: Package, eventTypes: ['order.delivered', 'order.completed'] },
];

const CHECKOUT_COMPLETE_QUERY_KEYS = ['checkout_complete', 'payment_complete', 'dtb_checkout_complete'];
const CLEAR_CART_BLOCKED_STATUSES = new Set(['failed', 'cancelled', 'canceled', 'refunded']);

function formatDateTime(value) {
  if (!value) return '—';
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
    }).format(new Date(value));
  } catch { return '—'; }
}

function formatDate(value) {
  if (!value) return 'Pending';
  try {
    return new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date(value));
  } catch { return 'Pending'; }
}

function parseMoney(value) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatMoney(value, currency = 'USD') {
  const parsed = parseMoney(value);
  if (parsed === null) return '';
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(parsed);
  } catch { return `$${parsed.toFixed(2)}`; }
}

function humanizeToken(value) {
  const normalized = String(value || '').trim();
  if (!normalized) return '';
  return normalized.replace(/[_-]+/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/\s+/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function hasCheckoutCompleteSignal(searchParams) {
  return CHECKOUT_COMPLETE_QUERY_KEYS.some((key) => {
    const value = String(searchParams.get(key) || '').toLowerCase();
    return value === '1' || value === 'true' || value === 'yes';
  });
}

function shouldClearCartForCompletedCheckout(order) {
  const status = String(order?.status || '').toLowerCase();
  if (CLEAR_CART_BLOCKED_STATUSES.has(status)) return false;
  return !order?.payment_required;
}

function resolveStatusLabel(order) {
  if (order?.payment_required && order?.status === 'pending') return 'Payment pending';
  return order?.label || order?.status_label || ORDER_STATUS_LABELS[order?.status] || humanizeToken(order?.status) || 'Order received';
}

function getLineItems(order) {
  if (Array.isArray(order?.line_items)) return order.line_items;
  if (Array.isArray(order?.items)) return order.items;
  return [];
}

function getProductInitials(name) {
  const words = String(name || 'Product').replace(/[^a-z0-9\s]/gi, ' ').trim().split(/\s+/).filter(Boolean);
  return (words[0]?.[0] || 'P').toUpperCase() + (words[1]?.[0] || '').toUpperCase();
}

function OrderItemMedia({ item, fallbackImage = '' }) {
  const imageUrl = resolveOrderItemImage(item) || fallbackImage;
  const imageAlt = item?.image_alt || item?.name || 'Ordered product';
  return (
    <span className={`dtb-order-item__thumb ${imageUrl ? 'has-image' : ''}`} aria-hidden={!imageUrl}>
      {imageUrl ? <img src={imageUrl} srcSet={item?.image_srcset || undefined} sizes="72px" alt={imageAlt} loading="lazy" decoding="async" /> : <span className="dtb-order-item__thumb-initials" aria-hidden="true">{getProductInitials(item?.name)}</span>}
    </span>
  );
}

function getTracking(order) {
  const trackingSource = order?.tracking && typeof order.tracking === 'object' ? order.tracking : {};
  return {
    carrier: trackingSource.carrier || trackingSource.tracking_carrier || order?.tracking_carrier || '',
    number: trackingSource.tracking_number || trackingSource.number || order?.tracking_number || '',
    url: trackingSource.tracking_url || trackingSource.url || order?.tracking_url || '',
    estimatedDelivery: trackingSource.estimated_delivery || trackingSource.estimatedDelivery || order?.estimated_delivery || '',
    shipped: Boolean(trackingSource.shipped || trackingSource.tracking_number || trackingSource.number || order?.tracking_number || order?.tracking_url),
  };
}

function getPlacedAt(order) { return order?.placed_at || order?.date_created || order?.created_at; }
function getLastUpdatedAt(order) { return order?.last_updated_at || order?.date_modified || order?.updated_at || getPlacedAt(order); }

function getStepIndex(order) {
  const status = String(order?.status || '').toLowerCase();
  if (status === 'completed') return 4;
  if (status === 'shipped') return 3;
  if (status === 'processing') return 2;
  if (status === 'on-hold' || order?.payment_required) return 1;
  if (status === 'failed' || status === 'cancelled' || status === 'refunded') return 0;
  return 0;
}

function getStatusTone(status) {
  if (['completed', 'shipped'].includes(status)) return 'success';
  if (['failed', 'cancelled', 'refunded'].includes(status)) return 'danger';
  if (['pending', 'on-hold'].includes(status)) return 'warning';
  return 'info';
}

function findTimelineEventAt(order, eventTypes) {
  const timeline = Array.isArray(order?.timeline) ? order.timeline : [];
  const match = timeline.find((event) => eventTypes.includes(event?.type));
  return match?.occurred_at || null;
}

function getStepTimestamp(order, step, stepIndex, activeIndex) {
  if (stepIndex > activeIndex) return null;
  const eventTimestamp = findTimelineEventAt(order, step.eventTypes);
  if (eventTimestamp) return eventTimestamp;
  return stepIndex === activeIndex ? getLastUpdatedAt(order) : getPlacedAt(order);
}

function renderStatusIcon(status) {
  const props = { size: 22, strokeWidth: 1.8 };
  if (status === 'completed') return <Package {...props} />;
  if (status === 'shipped') return <Truck {...props} />;
  if (['failed', 'cancelled', 'refunded'].includes(status)) return <AlertCircle {...props} />;
  return <Settings {...props} />;
}

function TrackingSkeleton() {
  return <div className="dtb-order-page page-wrapper"><SEOHead noindex title="Order Tracking" /><div className="dtb-order-tracking-shell"><section className="dtb-order-status-panel dtb-order-status-panel--loading"><Loader className="animate-spin" size={28} strokeWidth={1.8} /><div className="dtb-order-loading-copy"><p className="dtb-order-eyebrow">Order tracking</p><h1 className="dtb-order-tracking-title">Loading order</h1><p className="dtb-order-tracking-copy">Retrieving the latest fulfillment and shipment information.</p></div></section></div></div>;
}

function hasMoneyField(value) { return value !== null && value !== undefined && value !== ''; }

function OrderSummaryCard({ order }) {
  if (!order) return null;
  const currency = order?.currency;
  const shippingTotal = parseMoney(order?.shipping_total);
  const hasShipping = Boolean(order?.has_shipping) && hasMoneyField(order?.shipping_total);
  return <section className="dtb-order-sheet-section dtb-order-sheet-section--tracking" aria-labelledby="order-summary-title"><header className="dtb-order-sheet-section__header"><h2 id="order-summary-title" className="dtb-order-card__title">Order summary</h2></header><div className="dtb-order-sheet-section__body"><div className="dtb-order-totals dtb-order-totals--summary"><div className="dtb-order-total-row"><span>Subtotal</span><strong>{formatMoney(order?.subtotal, currency) || '—'}</strong></div><div className="dtb-order-total-row"><span>Shipping</span><strong>{hasShipping ? (shippingTotal === 0 ? <span className="dtb-order-free">FREE</span> : formatMoney(shippingTotal, currency)) : '—'}</strong></div><div className="dtb-order-total-row dtb-order-total-row--grand"><span>Total</span><strong>{formatMoney(order?.total, currency) || '—'}</strong></div></div></div></section>;
}

function OrderTrackingHelpFooter() {
  return <section className="dtb-order-help-card" aria-labelledby="need-help-title"><div className="dtb-order-help-card__contact"><span className="dtb-order-help-card__icon" aria-hidden="true"><Headphones size={22} strokeWidth={1.8} /></span><div><p id="need-help-title" className="dtb-order-help-card__title">Need help?</p><p className="dtb-order-help-card__copy">If you have any questions about your order, our support team is here to help.</p><Link to="/contact" className="dtb-order-button dtb-order-button--secondary dtb-order-help-card__cta">Contact Support</Link></div></div></section>;
}

function OrderStatusTracker({ order, streaming }) {
  const status = String(order?.status || 'pending').toLowerCase();
  const activeIndex = getStepIndex(order);
  const label = resolveStatusLabel(order);
  const tone = getStatusTone(status);
  const isNegative = tone === 'danger';
  const statusDescription = order?.payment_required ? 'Your order is reserved. Complete secure payment to begin fulfillment.' : 'We are preparing your order for shipment.';
  return (
    <section className={`dtb-order-status-panel dtb-order-status-panel--${tone}`} aria-labelledby="tracking-order-title">
      <header className="dtb-order-status-panel__topline">
        <p className="dtb-order-eyebrow">Order tracking</p>
        <h1 id="tracking-order-title" className="dtb-order-tracking-title">Order #{order?.number || order?.id}</h1>
      </header>
      <div className="dtb-order-current-status">
        <span className={`dtb-order-current-status__icon dtb-order-current-status__icon--${tone}`} aria-hidden="true">{renderStatusIcon(status)}</span>
        <div><p className="dtb-order-status-panel__label">Current status</p><h2>{label}</h2><p>{statusDescription}</p></div>
        {streaming ? <span className="dtb-order-live-badge"><span /> Live updates</span> : null}
      </div>
      {isNegative ? <div className="dtb-order-status-alert" role="status">This order cannot continue in its current state. Contact support if you need help reviewing this order.</div> : null}
      <ol className="dtb-order-steps" aria-label="Order progress">
        {TRACKING_STEPS.map((step, index) => {
          const complete = index < activeIndex; const active = index === activeIndex; const future = !complete && !active; const StepIcon = step.Icon; const timestamp = getStepTimestamp(order, step, index, activeIndex);
          return <li key={step.id} className={`dtb-order-step ${complete ? 'is-complete' : ''} ${active ? 'is-active' : ''} ${future ? 'is-future' : ''}`} aria-current={active ? 'step' : undefined}><span className="dtb-order-step__connector" aria-hidden="true" /><span className="dtb-order-step__icon" aria-hidden="true">{complete ? <Check size={16} strokeWidth={3} /> : active ? <span className="dtb-order-step__dot" /> : <StepIcon size={16} strokeWidth={1.8} />}</span><strong>{step.label}</strong><small>{active ? statusDescription : step.description}</small>{timestamp ? <time>{formatDateTime(timestamp)}</time> : null}</li>;
        })}
      </ol>
    </section>
  );
}

function PaymentActionCard({ order }) {
  if (!order?.payment_required || !order?.payment_url) return null;
  return <section className="dtb-order-alert-card dtb-order-alert-card--payment" aria-labelledby="payment-action-title"><div><p className="dtb-order-alert-card__kicker">Action needed</p><h2 id="payment-action-title">Complete secure payment</h2><p>Your order has been created, but payment still needs to be completed before fulfillment can begin.</p></div><a href={order.payment_url} className="dtb-order-button dtb-order-button--primary">Continue payment <ExternalLink size={15} /></a></section>;
}

function ItemsCard({ items, currency, imageFallbacks = {} }) {
  if (!items.length) return null;
  return <section className="dtb-order-sheet-section dtb-order-sheet-section--tracking" aria-labelledby="tracking-items-title"><header className="dtb-order-sheet-section__header"><h2 id="tracking-items-title" className="dtb-order-card__title">Items ordered</h2></header><div className="dtb-order-sheet-section__body"><div className="dtb-order-items dtb-order-items--friendly">{items.map((item, i) => { const price = formatMoney(item.total ?? item.price, currency); return <article key={`${item.id || item.name || 'item'}-${i}`} className="dtb-order-item dtb-order-item--friendly"><div className="dtb-order-item__main"><OrderItemMedia item={item} fallbackImage={imageFallbacks[getOrderItemKey(item)]} /><div><h3 className="dtb-order-item__name">{item.name || 'Ordered item'}</h3><p className="dtb-order-item__meta">Quantity: {item.quantity || 1}</p></div></div>{price ? <strong className="dtb-order-item__price">{price}</strong> : null}</article>; })}</div></div></section>;
}

function ShipmentCard({ tracking, order }) {
  const hasTracking = Boolean(tracking?.shipped || tracking?.number || tracking?.url);
  return <section className="dtb-order-sheet-section dtb-order-sheet-section--tracking" aria-labelledby="shipment-title"><header className="dtb-order-sheet-section__header"><h2 id="shipment-title" className="dtb-order-card__title">Shipment</h2><span className={`dtb-order-card__chip ${hasTracking ? 'is-active' : ''}`}>{hasTracking ? 'Tracking ready' : 'Pending'}</span></header><div className="dtb-order-sheet-section__body">{hasTracking ? <dl className="dtb-order-detail-list dtb-order-detail-list--compact"><DetailRow label="Carrier" value={tracking.carrier || 'Pending assignment'} /><DetailRow label="Tracking number" value={tracking.number || 'Pending assignment'} /><DetailRow label="Estimated delivery" value={formatDate(tracking.estimatedDelivery)} /></dl> : <div className="dtb-order-empty-state"><h3>Shipment details are not available yet</h3><p>{order?.payment_required ? 'Shipping starts after secure payment is completed.' : 'Tracking will appear here once the order is packed and handed to the carrier.'}</p></div>}{tracking.url ? <div className="dtb-order-actions dtb-order-actions--left"><a href={tracking.url} target="_blank" rel="noopener noreferrer" className="dtb-order-button dtb-order-button--secondary">Track package <ExternalLink size={14} /></a></div> : null}</div></section>;
}

function DetailRow({ label, value }) {
  if (value === null || value === undefined || value === '') return null;
  return <div className="dtb-order-detail-row"><dt className="dtb-order-detail-label">{label}</dt><dd className="dtb-order-detail-value">{value}</dd></div>;
}

export default function OrderTracking() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const orderKey = searchParams.get('order_key') || '';
  const { clearCart } = useCart();
  const cartClearHandledRef = useRef(false);
  const { data, loading, error, refresh } = useOrderStatus(id, orderKey);
  const { streaming } = useOrderEventStream(id, orderKey);
  const checkoutComplete = useMemo(() => hasCheckoutCompleteSignal(searchParams), [searchParams]);

  useEffect(() => {
    if (!streaming) return undefined;
    const timer = setInterval(refresh, 60_000);
    return () => clearInterval(timer);
  }, [streaming, refresh]);

  useEffect(() => {
    if (!checkoutComplete || cartClearHandledRef.current || !data || !shouldClearCartForCompletedCheckout(data)) return;
    cartClearHandledRef.current = true;
    Promise.resolve(clearCart()).catch(() => {});
  }, [checkoutComplete, clearCart, data]);

  const viewModel = useMemo(() => { const order = data ? { ...data, id: data.id || id, number: data.number || id } : null; return { order, items: getLineItems(order), tracking: getTracking(order) }; }, [data, id]);
  const itemImageFallbacks = useOrderItemImageFallbacks(viewModel.items);
  if (loading && !data) return <TrackingSkeleton />;

  if (error && !data) {
    const message = error.includes('401') || error.includes('Authentication') ? 'Please log in to view your order, or use the tracking link from your confirmation email.' : error.includes('403') || error.includes('access') ? 'This order tracking link is not authorized. Please use the latest link from your order email.' : 'We are having trouble loading your tracking information. Please try again shortly.';
    return <div className="dtb-order-page page-wrapper"><SEOHead noindex title="Order Tracking" /><div className="dtb-order-tracking-shell"><section className="dtb-order-status-panel dtb-order-status-panel--error"><AlertCircle size={28} strokeWidth={1.8} /><p className="dtb-order-eyebrow">Order tracking</p><h1 className="dtb-order-tracking-title">Unable to load order</h1><p className="dtb-order-tracking-copy">{message}</p><div className="dtb-order-actions"><button onClick={refresh} className="dtb-order-button dtb-order-button--secondary" type="button">Try again</button><Link to="/dashboard?tab=orders" className="dtb-order-button dtb-order-button--primary">My Orders</Link></div></section></div></div>;
  }

  const { order, items, tracking } = viewModel;
  const showCheckoutSuccess = checkoutComplete && order && shouldClearCartForCompletedCheckout(order);
  const trackingHref = `/order-tracking/${encodeURIComponent(order?.id || id)}${orderKey ? `?order_key=${encodeURIComponent(orderKey)}` : ''}`;
  return <div className="dtb-order-page page-wrapper"><SEOHead noindex title={`Order #${order?.number || id} — Tracking`} /><motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }} className="dtb-order-tracking-shell">{showCheckoutSuccess ? <OrderConfirmedHero orderId={order?.number || order?.id || id} titleId="checkout-success-title" trackingHref={trackingHref} /> : null}<section className="dtb-order-sheet dtb-order-sheet--tracking"><div className="dtb-order-sheet__content">{order ? <OrderStatusTracker order={order} streaming={streaming} /> : null}{order ? <PaymentActionCard order={order} /> : null}<ShipmentCard tracking={tracking} order={order} /><div className="dtb-order-tracking-grid"><ItemsCard items={items} currency={order?.currency} imageFallbacks={itemImageFallbacks} /><OrderSummaryCard order={order} /></div>{error && data ? <div className="dtb-order-stale-banner" role="alert">Could not refresh status — showing the latest saved order information.</div> : null}<OrderTrackingHelpFooter /></div></section></motion.div></div>;
}
