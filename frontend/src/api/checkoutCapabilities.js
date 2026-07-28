import { apiClient } from './client.js';

const CACHE_TTL_MS = 5 * 60 * 1000;

let cachedReadiness = null;
let cacheExpiresAt = 0;
let inFlightRequest = null;

function asBoolean(value) {
  return typeof value === 'boolean' ? value : null;
}

function asNonNegativeInteger(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

function findStripeCardGateway(capabilities) {
  const gateways = Array.isArray(capabilities?.gateways) ? capabilities.gateways : [];
  return gateways.find((gateway) => gateway?.provider === 'payment_plugins_stripe' && gateway?.id === 'stripe_cc')
    || gateways.find((gateway) => gateway?.id === 'stripe_cc')
    || null;
}

function unavailableReasons(checks) {
  const labels = {
    nativeCheckout: 'Native WooCommerce checkout is not ready.',
    paymentPluginsProvider: 'Payment Plugins for Stripe is not authoritative.',
    stripeExtensionActive: 'Payment Plugins for Stripe is not active.',
    stripeGatewayEnabled: 'The Stripe card gateway is disabled.',
    expressCheckoutEnabled: 'Apple Pay and Google Pay Express Checkout are disabled.',
    checkoutBlockReady: 'The WooCommerce Checkout Block is not configured.',
    https: 'HTTPS is required for wallet payments.',
    gatewayEntryEnabled: 'The Payment Plugins Stripe card gateway is disabled.',
    noCompetingOfficialStripe: 'The retired WooCommerce Stripe Gateway is still active.',
    noCompetingWooPayments: 'WooPayments is enabled as a competing payment authority.',
    walletShippingReady: 'WooCommerce shipping is not ready for wallet address resolution.',
  };

  return Object.entries(checks)
    .filter(([, value]) => value === false)
    .map(([key]) => labels[key])
    .filter(Boolean);
}

export function normalizeProductExpressCheckoutReadiness(capabilities) {
  const readiness = capabilities?.readiness && typeof capabilities.readiness === 'object'
    ? capabilities.readiness
    : {};
  const gateway = findStripeCardGateway(capabilities);
  const competingOfficialStripe = asBoolean(readiness.competing_official_stripe);
  const competingWooPayments = asBoolean(readiness.competing_woopayments);
  const shippingEnabled = asBoolean(readiness.shipping_enabled);
  const shippingMethodCount = asNonNegativeInteger(readiness.shipping_method_count);
  const walletShippingReady = asBoolean(readiness.wallet_shipping_ready);

  const checks = {
    nativeCheckout: capabilities?.checkout === 'woo_native_checkout_block',
    paymentPluginsProvider: capabilities?.provider === 'payment_plugins_stripe',
    stripeExtensionActive: asBoolean(readiness.stripe_extension_active),
    stripeGatewayEnabled: asBoolean(readiness.stripe_gateway_enabled),
    expressCheckoutEnabled: asBoolean(readiness.express_checkout_enabled),
    checkoutBlockReady: asBoolean(readiness.checkout_block),
    https: asBoolean(readiness.https),
    gatewayEntryEnabled: gateway ? asBoolean(gateway.enabled) : null,
    noCompetingOfficialStripe: competingOfficialStripe == null ? null : !competingOfficialStripe,
    noCompetingWooPayments: competingWooPayments == null ? null : !competingWooPayments,
    walletShippingReady,
  };

  const requiredChecks = [
    checks.nativeCheckout,
    checks.paymentPluginsProvider,
    checks.stripeExtensionActive,
    checks.stripeGatewayEnabled,
    checks.expressCheckoutEnabled,
    checks.checkoutBlockReady,
    checks.https,
    checks.gatewayEntryEnabled,
    checks.noCompetingOfficialStripe,
    checks.noCompetingWooPayments,
    checks.walletShippingReady,
  ];

  const explicitlyUnavailable = requiredChecks.some((value) => value === false);
  const fullyReady = requiredChecks.every((value) => value === true);

  return {
    state: explicitlyUnavailable ? 'unavailable' : (fullyReady ? 'ready' : 'unknown'),
    provider: 'Payment Plugins for Stripe',
    checks,
    reasons: unavailableReasons(checks),
    shipping: {
      enabled: shippingEnabled,
      methodCount: shippingMethodCount,
      allowedCountryCount: asNonNegativeInteger(readiness.allowed_shipping_countries_count),
    },
    paymentMethods: {
      applePay: asBoolean(readiness.apple_pay_enabled),
      googlePay: asBoolean(readiness.google_pay_enabled),
      link: asBoolean(readiness.link_enabled),
      bnplCount: asNonNegativeInteger(readiness.bnpl_gateway_count),
    },
  };
}

export async function getProductExpressCheckoutReadiness({ force = false } = {}) {
  if (inFlightRequest) {
    return inFlightRequest;
  }

  const now = Date.now();
  if (!force && cachedReadiness && cacheExpiresAt > now) {
    return cachedReadiness;
  }

  inFlightRequest = apiClient('/wp-json/dtb/v1/checkout/capabilities', {
    method: 'GET',
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  })
    .then((capabilities) => normalizeProductExpressCheckoutReadiness(capabilities))
    .catch(() => ({
      state: 'unknown',
      provider: 'Payment Plugins for Stripe',
      checks: {},
      reasons: [],
      shipping: {},
      paymentMethods: {},
    }))
    .then((result) => {
      cachedReadiness = result;
      cacheExpiresAt = Date.now() + CACHE_TTL_MS;
      return result;
    })
    .finally(() => {
      inFlightRequest = null;
    });

  return inFlightRequest;
}
