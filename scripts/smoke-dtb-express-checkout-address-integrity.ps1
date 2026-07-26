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
Assert-Dtb ($source.Contains("wc_stripe_express_checkout_after_checkout_validation")) 'Express Checkout validation must expose redacted diagnostics.'
Assert-Dtb ($source.Contains("get_states( `$country )")) 'State names must normalize through WooCommerce country/state data.'
Assert-Dtb ($source.Contains("postalCode")) 'Provider postal-code aliases must be supported.'
Assert-Dtb ($source.Contains("addressLine")) 'Provider address-line arrays must be supported.'
Assert-Dtb ($source.Contains("firstName")) 'Provider first-name aliases must be supported.'
Assert-Dtb ($source.Contains("lastName")) 'Provider last-name aliases must be supported.'
Assert-Dtb ($source.Contains("MIN_RECOMMENDED_VERSION")) 'Official Stripe version readiness must remain observable.'

$forbidden = @(
    'stripe.createPaymentMethod',
    'stripe.confirmPayment',
    'PaymentRequest(',
    'paymentRequest(',
    'wp_remote_post(.*stripe',
    'secret_key',
    'client_secret'
)
foreach ($pattern in $forbidden) {
    Assert-Dtb (-not ($source -match $pattern)) "Address compatibility boundary must not own Stripe payment execution or secrets: $pattern"
}

Write-Host 'DTB Stripe Express Checkout address integrity static smoke checks passed.'
