Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$RepositoryRoot = Split-Path -Parent $PSScriptRoot

function Repository-Path {
    param([Parameter(Mandatory = $true)][string]$RelativePath)
    return Join-Path $RepositoryRoot $RelativePath
}

function Read-RepositoryFile {
    param([Parameter(Mandatory = $true)][string]$RelativePath)
    $Path = Repository-Path $RelativePath
    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
        throw "Required repository file is missing: $RelativePath"
    }
    return Get-Content -LiteralPath $Path -Raw
}

function Assert-Contains {
    param(
        [Parameter(Mandatory = $true)][string]$Content,
        [Parameter(Mandatory = $true)][string]$Needle,
        [Parameter(Mandatory = $true)][string]$Description
    )
    if (-not $Content.Contains($Needle)) {
        throw "Contract failure: $Description. Missing: $Needle"
    }
}

function Assert-NotContains {
    param(
        [Parameter(Mandatory = $true)][string]$Content,
        [Parameter(Mandatory = $true)][string]$Needle,
        [Parameter(Mandatory = $true)][string]$Description
    )
    if ($Content.Contains($Needle)) {
        throw "Contract failure: $Description. Forbidden: $Needle"
    }
}

function Assert-PathAbsent {
    param(
        [Parameter(Mandatory = $true)][string]$RelativePath,
        [Parameter(Mandatory = $true)][string]$Description
    )
    if (Test-Path -LiteralPath (Repository-Path $RelativePath)) {
        throw "Contract failure: $Description. Obsolete path remains: $RelativePath"
    }
}

$provider = Read-RepositoryFile 'drywalltoolbox/wp/wp-content/mu-plugins/dtb-commerce/Payment/PaymentPluginsStripeNativeCheckout.php'
$paymentState = Read-RepositoryFile 'drywalltoolbox/wp/wp-content/mu-plugins/dtb-commerce/Domain/PaymentState.php'
$bootstrap = Read-RepositoryFile 'drywalltoolbox/wp/wp-content/mu-plugins/dtb-commerce/bootstrap.php'
$runtimeIntegrity = Read-RepositoryFile 'drywalltoolbox/wp/wp-content/mu-plugins/dtb-commerce/Payment/CheckoutRuntimeIntegrity.php'
$rateLimiter = Read-RepositoryFile 'drywalltoolbox/wp/wp-content/mu-plugins/dtb-platform/Security/StoreApiCheckoutRateLimiter.php'
$capabilities = Read-RepositoryFile 'frontend/src/api/checkoutCapabilities.js'
$template = Read-RepositoryFile 'drywalltoolbox/wp/wp-content/themes/drywall-toolbox/templates/checkout/native-checkout.php'
$architecture = Read-RepositoryFile 'docs/payment-provider-migration.md'
$agents = Read-RepositoryFile 'AGENTS.md'

Assert-Contains $provider "WC_STRIPE_PLUGIN_FILE_PATH" 'Provider verification must use the replacement plugin runtime path'
Assert-Contains $provider "wc_stripe_get_container" 'Provider verification must use the replacement plugin container'
Assert-Contains $provider "WC_Payment_Gateway_Stripe" 'Provider verification must require the replacement plugin base gateway'
Assert-Contains $provider "ReflectionClass" 'Gateway provenance must be verified against the plugin path'
Assert-Contains $provider "'stripe_cc'" 'Card authority must be the replacement provider card gateway'
Assert-Contains $provider "'stripe_applepay'" 'Apple Pay must be provider-owned'
Assert-Contains $provider "'stripe_googlepay'" 'Google Pay must be provider-owned'
Assert-Contains $provider "wc_stripe_get_element_options" 'Appearance must use a supported replacement-provider hook'
Assert-Contains $provider "wc_stripe_express_payment_methods" 'Express method ordering/filtering must use a supported provider hook'
Assert-Contains $provider "woocommerce_available_payment_gateways" 'Primary checkout must enforce one available Stripe authority'
Assert-Contains $provider "unset( `$gateways['stripe'], `$gateways['woocommerce_payments'] )" 'Retired Stripe and WooPayments must be unavailable while the replacement card gateway is active'
Assert-Contains $provider "tag_order_if_provider_order" 'Checkout tagging must avoid claiming known non-provider orders'
Assert-Contains $provider "payment-plugins-stripe-v1" 'New orders must receive the replacement provider contract'
Assert-Contains $provider "payment_plugins_stripe" 'Paid evidence must identify the replacement provider'
Assert-Contains $provider "get_date_paid" 'Captured-payment mirroring must require WooCommerce paid state'
Assert-Contains $provider "get_transaction_id" 'Captured-payment mirroring must require a non-secret provider reference'
Assert-Contains $provider "competing_official_stripe" 'Capabilities must expose the retired-plugin conflict'
Assert-Contains $provider "competing_woopayments" 'Capabilities must expose WooPayments conflict'
Assert-NotContains $provider "sk_live_" 'Provider adapter must contain no live secret key'
Assert-NotContains $provider "sk_test_" 'Provider adapter must contain no test secret key'
Assert-NotContains $provider "whsec_" 'Provider adapter must contain no webhook secret'
Assert-NotContains $provider "x-wcstripe-express-checkout" 'Provider adapter must not guess retired browser headers'

Assert-Contains $paymentState "payment-plugins-stripe-v1" 'Captured-payment gate must accept the new contract'
Assert-Contains $paymentState "payment_plugins_stripe" 'Captured-payment gate must accept the new provider'
Assert-Contains $paymentState "woo-stripe-v1" 'Historical order evidence must remain readable'
Assert-Contains $paymentState "woocommerce_stripe" 'Historical provider evidence must remain readable'
Assert-Contains $bootstrap "PaymentPluginsStripeNativeCheckout.php" 'Commerce composition root must load the replacement adapter'
Assert-NotContains $bootstrap "OfficialStripeNativeCheckout.php" 'Commerce composition root must not load the retired adapter'
Assert-NotContains $bootstrap "ExpressCheckoutAddressIntegrity.php" 'Commerce composition root must not load the retired address shim'
Assert-NotContains $bootstrap "ExpressCheckoutShippingReadiness.php" 'Commerce composition root must not load the retired shipping shim'

Assert-PathAbsent 'drywalltoolbox/wp/wp-content/mu-plugins/dtb-commerce/Payment/OfficialStripeNativeCheckout.php' 'Retired official Stripe adapter must be deleted'
Assert-PathAbsent 'drywalltoolbox/wp/wp-content/mu-plugins/dtb-commerce/Payment/ExpressCheckoutAddressIntegrity.php' 'Retired official Stripe address shim must be deleted'
Assert-PathAbsent 'drywalltoolbox/wp/wp-content/mu-plugins/dtb-commerce/Payment/ExpressCheckoutShippingReadiness.php' 'Retired official Stripe shipping shim must be deleted'

Assert-NotContains $rateLimiter "x-wcstripe-express-checkout" 'Rate limiting must not trust retired provider browser headers'
Assert-Contains $runtimeIntegrity "wc-stripe-credit-card" 'Replacement card scripts must be protected from host optimization'
Assert-Contains $runtimeIntegrity "wc-stripe-block-credit-card" 'Replacement Checkout Block card scripts must be protected from host optimization'
Assert-Contains $runtimeIntegrity "wc-stripe-blocks-apple-pay" 'Replacement Checkout Block Apple Pay scripts must be protected from host optimization'
Assert-Contains $runtimeIntegrity "wc-stripe-blocks-googlepay" 'Replacement Checkout Block Google Pay scripts must be protected from host optimization'
Assert-Contains $capabilities "payment_plugins_stripe" 'React readiness must use the replacement provider'
Assert-Contains $capabilities "stripe_cc" 'React readiness must use the replacement card gateway'
Assert-Contains $template "PaymentPluginsStripeNativeCheckout" 'Checkout header badge must use verified replacement-provider readiness'
Assert-Contains $architecture "does not migrate plugin settings" 'Operator documentation must state the provider settings-migration limitation'
Assert-Contains $architecture "PayPal is not" 'Operator documentation must state the PayPal authority boundary'
Assert-Contains $agents "woo-stripe-payment" 'Durable engineering authority must reflect the new provider'
Assert-Contains $agents "Historical" 'Durable engineering authority must preserve pre-migration order evidence'

Write-Host 'PASS: Payment Plugins for Stripe migration authority, backward compatibility, security, documentation, and obsolete-provider removal contracts are intact.'
