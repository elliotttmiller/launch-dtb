import { apiClient } from './client.js';

const CACHE_TTL_MS = 5 * 60 * 1000;

let cachedReadiness = null;
let cacheExpiresAt = 0;
let inFlightRequest = null;

function asBoolean(value) {
  return typeof value === 'boolean' ? value : null;
}

function findOfficialStripeGateway(capabilities) {
  const gateways = Array.isArray(capabilities?.gateways) ? capabilities.gateways : [];
  return gateways.find((gateway) => (
    gateway?.provider === 'woocommerce_stripe'
    || gateway?.id === 'stripe'
  )) || null;
}

export function normalizeProductExpressCheckoutReadiness(capabilities) {
  const readiness = capabilities?.readiness && typeof capabilities.readiness === 'object'
    ? capabilities.readiness
    : {};
  const gateway = findOfficialStripeGateway(capabilities);
  const competingWooPayments = asBoolean(readiness.competing_woopayments);

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
  ];

  const explicitlyUnavailable = requiredChecks.some((value) => value === false);
  const fullyReady = requiredChecks.every((value) => value === true);

  return {
    state: explicitlyUnavailable ? 'unavailable' : (fullyReady ? 'ready' : 'unknown'),
    provider: 'WooCommerce Stripe',
    checks,
  };
}

export async function getProductExpressCheckoutReadiness({ force = false } = {}) {
  const now = Date.now();
  if (!force && cachedReadiness && cacheExpiresAt > now) {
    return cachedReadiness;
  }
  if (!force && inFlightRequest) {
    return inFlightRequest;
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
