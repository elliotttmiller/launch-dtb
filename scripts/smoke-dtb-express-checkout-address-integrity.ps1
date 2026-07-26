$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$module = Join-Path $root 'drywalltoolbox\wp\wp-content\mu-plugins\dtb-commerce\Payment\ExpressCheckoutAddressIntegrity.php'
$bootstrap = Join-Path $root 'drywalltoolbox\wp\wp-content\mu-plugins\dtb-commerce\bootstrap.php'

function Assert-Dtb([bool] $Condition, [string] $Message) {
    if (-not $Condition) { throw $Message }
}

Assert-Dtb (Test-Path $module) "Express Checkout address integrity module is missing: $module"
Assert-Dtb (Test-Path $bootstrap) "DTB commerce bootstrap is missing: $bootstrap"

$source = Get-Content -Raw $module
$boot = Get-Content -Raw $bootstrap

Assert-Dtb ($boot.Contains("/Payment/ExpressCheckoutAddressIntegrity.php")) 'Commerce bootstrap must load the Express Checkout address integrity boundary.'
Assert-Dtb ($source.Contains("wc_stripe_express_checkout_normalize_address")) 'Official Stripe address-normalization filter must be registered.'
Assert-Dtb ($source.Contains("wc_stripe_payment_request_shipping_posted_values")) 'Legacy official Stripe shipping-address compatibility filter must remain registered.'
Assert-Dtb ($source.Contains("rest_pre_dispatch")) 'Verified Store API address requests must be normalized before Woo validation.'
Assert-Dtb ($source.Contains("rest_request_after_callbacks")) 'Verified Store API failures must expose redacted diagnostics.'
Assert-Dtb ($source.Contains("X-WCSTRIPE-EXPRESS-CHECKOUT") -or $source.Contains("x-wcstripe-express-checkout")) 'Store API normalization must require the official Stripe express-context header.'
Assert-Dtb ($source.Contains("wc_store_api_express_checkout")) 'Store API normalization must verify the official Stripe nonce action.'
Assert-Dtb ($source.Contains("/wc/store/v1/cart/update-customer")) 'Store API customer-address updates must be covered.'
Assert-Dtb ($source.Contains("/wc/store/v1/checkout")) 'Store API checkout confirmation addresses must be covered.'
Assert-Dtb ($source.Contains("wc_stripe_express_checkout_after_checkout_validation")) 'Express Checkout validation must expose redacted diagnostics.'
Assert-Dtb ($source.Contains("get_states( `$country )")) 'State names must normalize through WooCommerce country/state data.'
Assert-Dtb ($source.Contains("postalCode")) 'Provider postal-code aliases must be supported.'
Assert-Dtb ($source.Contains("addressLine")) 'Provider address-line arrays must be supported.'
Assert-Dtb ($source.Contains("is_array( `$value ) -and" ) -or $source.Contains("is_array( `$value ) &&")) 'Address-line arrays must survive alias lookup.'
Assert-Dtb ($source.Contains("firstName")) 'Provider first-name aliases must be supported.'
Assert-Dtb ($source.Contains("lastName")) 'Provider last-name aliases must be supported.'
Assert-Dtb ($source.Contains("MIN_RECOMMENDED_VERSION")) 'Official Stripe version readiness must remain observable.'
Assert-Dtb ($source.Contains("dtb_security_log")) 'Express Checkout failures must remain observable through redacted DTB diagnostics.'

$forbidden = @(
    'stripe.createPaymentMethod',
    'stripe.confirmPayment',
    'PaymentRequest(',
    'paymentRequest(',
    'wp_remote_post(.*stripe',
    'secret_key',
    'client_secret',
    'woocommerce_validate_postcode.*__return_true',
    'WC\(\)->cart->empty_cart',
    'WC\(\)->session->destroy_session'
)
foreach ($pattern in $forbidden) {
    Assert-Dtb (-not ($source -match $pattern)) "Address compatibility boundary must not own Stripe execution, secrets, cart/session lifecycle, or validation bypasses: $pattern"
}

Write-Host 'DTB Stripe Express Checkout address integrity static smoke checks passed.'
