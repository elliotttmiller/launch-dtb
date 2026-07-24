import TransactionSuccessSheet from '../confirmation/TransactionSuccessSheet.jsx';

export default function AnimatedOrderSuccess({
  orderId,
  title = 'Order confirmed',
  message = 'Your order is confirmed. A receipt is on its way to your inbox.',
  titleId,
  trackingHref,
}) {
  const trackingTarget = trackingHref || (orderId
    ? `/order-tracking/${encodeURIComponent(orderId)}`
    : '/dashboard?tab=orders');

  return (
    <TransactionSuccessSheet
      type="order"
      title={title}
      titleId={titleId}
      message={message}
      reference={orderId ? `#${orderId}` : ''}
      referenceLabel="Order"
      primaryAction={{ label: 'Track My Order', to: trackingTarget }}
      secondaryAction={{ label: 'Keep Shopping', to: '/products' }}
    />
  );
}
