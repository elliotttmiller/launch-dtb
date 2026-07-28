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

function findOfficialStripeGateway(capabilities) {
  const gateways = Array.isArray(capabilities?.gateways) ? capabilities.gateways : [];
  return gateways.find((gateway) => gateway?.provider === 'woocommerce_stripe')
    || gateways.find((gateway) => gateway?.id === 'stripe')
    || null;
}

function unavailableReasons(checks) {
  const labels = {
    nativeCheckout: 'Native WooCommerce checkout is not ready.',
    officialProvider: 'The official WooCommerce Stripe provider is not authoritative.',
    stripeExtensionActive: 'The official Stripe extension is not active.',
    stripeGatewayEnabled: 'The Stripe gateway is disabled.',
    expressCheckoutEnabled: 'Stripe Express Checkout is disabled.',
    expressCheckoutCheckoutLocation: 'Express Checkout is not enabled at checkout.',
    checkoutBlockReady: 'The WooCommerce Checkout Block is not configured.',
    https: 'HTTPS is required for wallet payments.',
    gatewayEntryEnabled: 'The official Stripe gateway entry is disabled.',
    noCompetingWooPayments: 'A competing WooPayments checkout authority is enabled.',
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
  const gateway = findOfficialStripeGateway(capabilities);
  const competingWooPayments = asBoolean(readiness.competing_woopayments);
  const shippingEnabled = asBoolean(readiness.shipping_enabled);
  const shippingMethodCount = asNonNegativeInteger(readiness.shipping_method_count);
  const walletShippingReady = asBoolean(readiness.wallet_shipping_ready);

  const checks = {
    nativeCheckout: capabilities?.checkout === 'woo_native_checkout_block',
    officialProvider: capabilities?.provider === 'woocommerce_stripe',
    stripeExtensionActive: asBoolean(readiness.stripe_extension_active),
    stripeGatewayEnabled: asBoolean(readiness.stripe_gateway_enabled),
    expressCheckoutEnabled: asBoolean(readiness.express_checkout_enabled),
    expressCheckoutCheckoutLocation: asBoolean(readiness.express_checkout_checkout_location),
    checkoutBlockReady: asBoolean(readiness.checkout_block),
    https: asBoolean(readiness.https),
    gatewayEntryEnabled: gateway ? asBoolean(gateway.enabled) : null,
    noCompetingWooPayments: competingWooPayments == null ? null : !competingWooPayments,
    walletShippingReady,
  };

  const requiredChecks = [
    checks.nativeCheckout,
    checks.officialProvider,
    checks.stripeExtensionActive,
    checks.stripeGatewayEnabled,
    checks.expressCheckoutEnabled,
    checks.expressCheckoutCheckoutLocation,
    checks.checkoutBlockReady,
    checks.https,
    checks.gatewayEntryEnabled,
    checks.noCompetingWooPayments,
    checks.walletShippingReady,
  ];

  const explicitlyUnavailable = requiredChecks.some((value) => value === false);
  const fullyReady = requiredChecks.every((value) => value === true);

  return {
    state: explicitlyUnavailable ? 'unavailable' : (fullyReady ? 'ready' : 'unknown'),
    provider: 'WooCommerce Stripe',
    checks,
    reasons: unavailableReasons(checks),
    shipping: {
      enabled: shippingEnabled,
      methodCount: shippingMethodCount,
      allowedCountryCount: asNonNegativeInteger(readiness.allowed_shipping_countries_count),
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
      provider: 'WooCommerce Stripe',
      checks: {},
      reasons: [],
      shipping: {},
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
